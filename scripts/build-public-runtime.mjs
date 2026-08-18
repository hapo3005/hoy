import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const policyPath = path.join(root, 'deploy/public-runtime-policy.json');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const out = path.resolve(root, process.env.HOY_PUBLIC_RUNTIME_DIR || 'dist-public');

const normalize = p => p.split(path.sep).join('/');
const denyName = rel => {
  const lower = rel.toLowerCase();
  if (policy.never_publish_name_fragments.some(x => lower.includes(String(x).toLowerCase()))) return true;
  const ext = path.extname(lower);
  return policy.never_publish_extensions.includes(ext);
};
const assertSafeRel = rel => {
  const parts = normalize(rel).split('/');
  if (parts.some(p => policy.never_publish_directories.includes(p))) throw new Error(`blocked public path: ${rel}`);
  if (denyName(rel)) throw new Error(`blocked public filename: ${rel}`);
};
const copyFile = rel => {
  assertSafeRel(rel);
  const src = path.join(root, rel);
  const dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
};
const walk = dir => {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = normalize(path.relative(root, path.join(abs, entry.name)));
    if (entry.isDirectory()) rows.push(...walk(rel));
    else rows.push(rel);
  }
  return rows;
};

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const rootEntries = fs.readdirSync(root, { withFileTypes: true });
for (const entry of rootEntries) {
  if (!entry.isFile()) continue;
  const rel = entry.name;
  const ext = path.extname(rel.toLowerCase());
  if (policy.public_root_files.includes(rel) || policy.public_root_extensions.includes(ext)) copyFile(rel);
}
for (const dir of policy.public_directories) {
  for (const rel of walk(dir)) copyFile(rel);
}

// Runtime metadata is intentionally generated rather than copying the development
// package.json. The public app only needs the release identity/version for PWA
// integrity checks; scripts, dependencies and internal build metadata stay private.
const sourcePackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(String(sourcePackage.version || ''))) {
  throw new Error('invalid source package version for runtime metadata');
}
fs.writeFileSync(
  path.join(out, 'package.json'),
  JSON.stringify({ name: sourcePackage.name || 'hoy', version: sourcePackage.version }, null, 2) + '\n'
);

for (const required of policy.required_runtime_files) {
  if (!fs.existsSync(path.join(out, required))) throw new Error(`required runtime file missing: ${required}`);
}

const files = walk(path.relative(root, out)).filter(rel => !rel.endsWith('public-release-manifest.json'));
const manifest = [];
for (const relFromRoot of files) {
  const rel = normalize(path.relative(out, path.join(root, relFromRoot)));
  if (rel.startsWith('..')) continue;
  const abs = path.join(out, rel);
  const body = fs.readFileSync(abs);
  const text = body.toString('utf8');
  for (const pattern of policy.secret_patterns) {
    if (text.includes(pattern)) throw new Error(`secret-pattern '${pattern}' found in public runtime: ${rel}`);
  }
  manifest.push({
    path: rel,
    bytes: body.length,
    sha256: crypto.createHash('sha256').update(body).digest('hex')
  });
}
manifest.sort((a,b) => a.path.localeCompare(b.path));
const release = {
  schema_version: '1.0',
  generated_at: new Date().toISOString(),
  mode: policy.mode,
  file_count: manifest.length,
  files: manifest
};
fs.writeFileSync(path.join(out, 'public-release-manifest.json'), JSON.stringify(release, null, 2) + '\n');
console.log(`HOY public runtime built: ${manifest.length} files -> ${path.relative(root, out)}`);

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outA = path.join(root, '.tmp-public-runtime-qa-a');
const outB = path.join(root, '.tmp-public-runtime-qa-b');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'deploy/public-runtime-policy.json'), 'utf8'));
const fail = msg => { console.error(`IR-02E FAIL: ${msg}`); process.exit(1); };

const build = out => {
  fs.rmSync(out, { recursive: true, force: true });
  const built = spawnSync(process.execPath, ['scripts/build-public-runtime.mjs'], {
    cwd: root,
    env: { ...process.env, HOY_PUBLIC_RUNTIME_DIR: out },
    encoding: 'utf8'
  });
  if (built.status !== 0) fail(built.stderr || built.stdout || 'public runtime build failed');
};

const walk = dir => {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(abs)); else result.push(abs);
  }
  return result;
};

build(outA);
const files = walk(outA);
if (!files.length) fail('public runtime is empty');
if (!fs.existsSync(path.join(outA, 'index.html'))) fail('index.html missing from public runtime');
if (!fs.existsSync(path.join(outA, 'package.json'))) fail('sanitized runtime package metadata missing');
if (!fs.existsSync(path.join(outA, 'public-release-manifest.json'))) fail('release manifest missing');

for (const abs of files) {
  const rel = path.relative(outA, abs).split(path.sep).join('/');
  const parts = rel.split('/');
  if (parts.some(p => policy.never_publish_directories.includes(p))) fail(`forbidden directory leaked: ${rel}`);
  if (policy.never_publish_extensions.includes(path.extname(rel).toLowerCase())) fail(`forbidden extension leaked: ${rel}`);
  const lower = rel.toLowerCase();
  if (policy.never_publish_name_fragments.some(x => lower.includes(String(x).toLowerCase()))) fail(`forbidden filename leaked: ${rel}`);
}

const runtimePackage = JSON.parse(fs.readFileSync(path.join(outA, 'package.json'), 'utf8'));
const runtimePackageKeys = Object.keys(runtimePackage).sort();
if (runtimePackageKeys.join(',') !== 'name,version') fail(`runtime package metadata must expose only name/version; got ${runtimePackageKeys.join(',')}`);
if (!/^\d+\.\d+\.\d+$/.test(String(runtimePackage.version || ''))) fail('runtime package version must be semver');
if ('scripts' in runtimePackage || 'dependencies' in runtimePackage || 'devDependencies' in runtimePackage) fail('development package metadata leaked into runtime package');

const html = fs.readFileSync(path.join(outA, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/gi)].map(m => m[1]);
for (const ref of refs) {
  if (/^(?:https?:|data:|mailto:|tel:|\/\/)/i.test(ref)) continue;
  const local = ref.replace(/^\.\//, '').replace(/^\//, '');
  if (!local || local.endsWith('/')) continue;
  if (!fs.existsSync(path.join(outA, local))) fail(`index.html references missing runtime asset: ${local}`);
}

const manifestPathA = path.join(outA, 'public-release-manifest.json');
const manifestTextA = fs.readFileSync(manifestPathA, 'utf8');
const manifest = JSON.parse(manifestTextA);
if (!Array.isArray(manifest.files) || manifest.file_count !== manifest.files.length) fail('release manifest count mismatch');
if (manifest.files.some(x => /^(?:docs|data|scripts|supabase|tests|\.github)\//.test(x.path))) fail('sensitive path recorded in release manifest');
if (!manifest.files.some(x => x.path === 'package.json')) fail('sanitized runtime package metadata missing from release manifest');
if (manifest.source_revision !== null && !/^[0-9a-f]{40}$/.test(String(manifest.source_revision))) fail('invalid source revision in release manifest');

// Rebuild from the exact same tree/environment. The manifest must be byte-identical;
// this turns reproducibility into a gate rather than a documentation claim.
build(outB);
const manifestTextB = fs.readFileSync(path.join(outB, 'public-release-manifest.json'), 'utf8');
if (manifestTextA !== manifestTextB) fail('public runtime manifest is not reproducible across identical builds');

fs.rmSync(outA, { recursive: true, force: true });
fs.rmSync(outB, { recursive: true, force: true });
console.log(`IR-02E proprietary/public runtime boundary gate: PASS (${manifest.file_count} runtime files; reproducible manifest)`);

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const selfRel = 'scripts/check-no-critical-secrets.mjs';
const skipDirs = new Set(['.git','node_modules','playwright-report','test-results','dist-public','.tmp-public-runtime-qa']);
const textExt = new Set(['.js','.mjs','.ts','.json','.yml','.yaml','.md','.sql','.html','.css','.txt','.toml','.env','.webmanifest']);
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['classic GitHub token', /\bghp_[A-Za-z0-9]{20,}\b/],
  ['fine-grained GitHub token', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['credentialed postgres URL', /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/i],
  ['literal Supabase service role key', /SUPABASE_SERVICE_ROLE(?:_KEY)?\s*[:=]\s*["'][A-Za-z0-9._-]{40,}["']/i]
];

const walk = dir => {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...walk(abs));
    else rows.push(abs);
  }
  return rows;
};

const findings = [];
for (const abs of walk(root)) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (rel === selfRel) continue;
  const ext = path.extname(abs).toLowerCase();
  if (!textExt.has(ext) && !path.basename(abs).startsWith('.env')) continue;
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
  for (const [label, regex] of patterns) {
    if (regex.test(text)) findings.push(`${label}: ${rel}`);
  }
}
if (findings.length) {
  console.error('Critical secret leakage gate FAILED');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log('Critical secret leakage gate: PASS');

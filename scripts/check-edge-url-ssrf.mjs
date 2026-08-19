import fs from 'node:fs';

const targets = [
  'supabase/functions/menu-editorial-import/index.ts',
  'supabase/functions/menu-discovery/index.ts',
  'supabase/functions/menu-intake-process/index.ts',
  'supabase/functions/menu-social-handoff/index.ts',
  'supabase/functions/venue-media-approve/index.ts',
];

const failures = [];
const requireToken = (file, source, token, label = token) => {
  if (!source.includes(token)) failures.push(`${file}: missing ${label}`);
};

for (const file of targets) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing source file`);
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  requireToken(file, source, "startsWith('::ffff:')", 'IPv4-mapped IPv6 guard');
  requireToken(file, source, "startsWith('ff')", 'IPv6 multicast guard');
  requireToken(file, source, "startsWith('2001:db8:')", 'IPv6 documentation-range guard');
  requireToken(file, source, 'Deno.resolveDns', 'DNS resolution check');
  requireToken(file, source, "redirect:'manual'", 'manual redirect handling');
  requireToken(file, source, 'private4(', 'private IPv4 classifier');
  requireToken(file, source, 'private6(', 'private IPv6 classifier');
  requireToken(file, source, "protocol!=='https:'", 'HTTPS-only source gate');
  if (!source.includes('private_dns_target')) {
    failures.push(`${file}: missing private DNS rejection marker`);
  }
}

if (failures.length) {
  console.error('HOY Edge URL SSRF gate: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`HOY Edge URL SSRF gate: PASS (${targets.length} fetchers)`);

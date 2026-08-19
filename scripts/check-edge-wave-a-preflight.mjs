import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const failures = [];
const notes = [];
const expect = (ok, message) => { if (!ok) failures.push(message); };
const contains = (src, token) => src.includes(token);

const targets = {
  'admin-ops': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "auth.getUser()",
      "hoy_admin_accounts",
      "admin_identity_mismatch",
    ],
  },
  'menu-discovery': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "auth.getUser()",
      "hoy_admin_accounts",
      "private_target",
      "private_dns_target",
    ],
  },
  'menu-intake-process': {
    required: [
      "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts",
      "npm:@supabase/server@1.4.1",
      "withSupabase({auth:'user'}",
      "rights_confirmation_required",
      "private_or_local_source_rejected",
    ],
  },
  'promotion-insights': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "auth.getUser()",
      "restaurant_memberships",
      "hoy_admin_accounts",
      "forbidden",
    ],
  },
  'operator-hours-confirm': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "admin.auth.getUser(token)",
      "restaurant_memberships",
      "operator_verified",
      "verified_operator_required",
    ],
  },
  'venue-media-approve': {
    required: [
      "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts",
      "npm:@supabase/supabase-js@2.111.0",
      "userClient.auth.getUser()",
      "review_venue_media_candidates",
      "private_target",
      "private_dns_target",
    ],
    extraFiles: ['deno.json'],
  },
  'menu-social-handoff': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "auth.getUser()",
      "hoy_admin_accounts",
      "admin_identity_mismatch",
      "private_target",
    ],
    forbidden: ['const UUIDISH='],
  },
  'operator-accessibility-confirm': {
    required: [
      "npm:@supabase/supabase-js@2.111.0",
      "admin.auth.getUser(token)",
      "restaurant_memberships",
      "operator_verified",
      "verified_operator_required",
    ],
  },
};

for (const [slug, policy] of Object.entries(targets)) {
  const file = `supabase/functions/${slug}/index.ts`;
  expect(exists(file), `${slug}: index.ts missing`);
  if (!exists(file)) continue;
  const src = read(file);
  for (const token of policy.required || []) {
    expect(contains(src, token), `${slug}: required marker missing: ${token}`);
  }
  for (const token of policy.forbidden || []) {
    expect(!contains(src, token), `${slug}: forbidden marker present: ${token}`);
  }
  for (const rel of policy.extraFiles || []) {
    expect(exists(`supabase/functions/${slug}/${rel}`), `${slug}: required file missing: ${rel}`);
  }
}

const functionsRoot = path.join(root, 'supabase', 'functions');
for (const dirent of fs.readdirSync(functionsRoot, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const file = path.join(functionsRoot, dirent.name, 'index.ts');
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, 'utf8');
  expect(!/npm:@supabase\/supabase-js@2(['"])/.test(src), `${dirent.name}: floating supabase-js@2 import remains`);
  expect(!/jsr:@supabase\/functions-js\/edge-runtime\.d\.ts/.test(src), `${dirent.name}: unversioned functions-js runtime import remains`);
}

const editorialPath = 'supabase/functions/menu-editorial-import/index.ts';
expect(exists(editorialPath), 'menu-editorial-import: index.ts missing');
if (exists(editorialPath)) {
  const editorial = read(editorialPath);
  expect(contains(editorial, 'npm:@supabase/supabase-js@2.111.0'), 'menu-editorial-import: exact supabase-js pin missing');
  notes.push('menu-editorial-import is intentionally EXCLUDED from Wave A because repo source is materially ahead of Production.');
}

if (failures.length) {
  console.error('HOY Edge Wave A preflight: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('HOY Edge Wave A preflight: PASS');
console.log(`Wave A candidates checked: ${Object.keys(targets).length}`);
for (const note of notes) console.log(`NOTE: ${note}`);

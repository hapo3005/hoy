import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (ok, msg) => {
  if (!ok) {
    console.error(`IR-02C FAIL: ${msg}`);
    process.exitCode = 1;
  }
};

const dePath = 'docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md';
const esPath = 'docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md';
const specPath = 'docs/legal/HOY_BUSINESS_TERMS_ACCEPTANCE_SPEC_v1.0.md';
const m1Path = 'supabase/migrations/20260818201632_ir02c_business_terms_acceptance_infrastructure.sql';
const m2Path = 'supabase/migrations/20260818201740_ir02c_business_terms_rpc_security_hardening.sql';
const m3Path = 'supabase/migrations/20260818201831_ir02c_business_confirmation_ledger.sql';

for (const p of [dePath, esPath, specPath, m1Path, m2Path, m3Path]) {
  assert(fs.existsSync(path.join(root, p)), `required file missing: ${p}`);
}

if (process.exitCode) process.exit(1);

const de = read(dePath);
const es = read(esPath);
const spec = read(specPath);
const m1 = read(m1Path);
const m2 = read(m2Path);
const m3 = read(m3Path);

// Contract must stay visibly non-active until formal legal activation.
assert(/DRAFT \/ NOT YET ACTIVE/i.test(de), 'German master must remain explicitly DRAFT / NOT YET ACTIVE');
assert(/DO NOT ACTIVATE/i.test(de), 'German master must contain an explicit do-not-activate gate');
assert(/BORRADOR.*NO ACTIVO/is.test(es), 'Spanish localization must remain explicitly draft/not active');
assert(/NO ACTIVAR/i.test(es), 'Spanish localization must contain an explicit no-activate gate');

// Core rights boundary: HOY gets operational rights, not blanket raw-content ownership/resale.
assert(/non-exclusive, royalty-free licence/i.test(de), 'German master must define a non-exclusive royalty-free operational licence');
assert(/change of control/i.test(de), 'German master must retain change-of-control continuity');
assert(/sell the Business's raw photographs, logo or marketing copy as a standalone content library/i.test(de), 'raw-content standalone resale limitation must remain');
assert(/Article 28 GDPR/i.test(de), 'separate Article 28 DPA boundary must remain');
assert(/Personal data is not treated as an owned commodity/i.test(de), 'personal-data ownership disclaimer must remain');

// Activation must fail closed in the DB until legal/entity/localization/hash/counsel fields are populated.
assert(/business_terms_active_requires_clearance/i.test(m1), 'activation clearance constraint missing');
for (const required of [
  'document_sha256',
  'spanish_document_sha256',
  'legal_entity_name',
  'registered_address',
  'legal_contact_email',
  'privacy_notice_version',
  'governing_law',
  'jurisdiction',
  'counsel_reviewed_at',
  'counsel_reference'
]) {
  assert(m1.includes(required), `activation gate must require ${required}`);
}
assert(/'1\.0'.*'draft'/s.test(m1), 'Terms v1.0 seed must remain draft');

// Public API must remain invoker; privileged operations belong to private helpers.
assert(/create or replace function public\.get_business_terms_status[\s\S]*?security invoker/i.test(m2), 'get_business_terms_status must be SECURITY INVOKER');
assert(/create or replace function public\.operator_accept_business_terms[\s\S]*?security invoker/i.test(m2), 'operator_accept_business_terms must be SECURITY INVOKER');
assert(/create or replace function public\.operator_record_business_confirmation[\s\S]*?security invoker/i.test(m3), 'operator_record_business_confirmation must be SECURITY INVOKER');
assert(/private\.operator_accept_business_terms_internal/i.test(m2), 'private acceptance helper missing');
assert(/private\.operator_record_business_confirmation_internal/i.test(m3), 'private confirmation helper missing');

// Exact-version / exact-snapshot evidence must remain part of the chain.
assert(/document_sha256/i.test(m1) && /terms_version/i.test(m1), 'acceptance receipt must bind terms version and document hash');
assert(/payload_sha256/i.test(m3), 'Business Confirmation must bind exact payload SHA-256');
assert(/terms_acceptance_id/i.test(m3), 'Business Confirmation must bind the acceptance receipt');
assert(/business_terms_acceptance_required/i.test(m3), 'Business Confirmation must require active Terms acceptance');

// Spec must preserve the non-equivalence gates that protect DD claims.
assert(spec.includes('Business website observed` ≠ `Business Confirmed'), 'spec must state observation is not Business Confirmed');
assert(spec.includes('Terms accepted` ≠ `all existing research confirmed'), 'spec must state Terms acceptance does not auto-confirm research');
assert(/canonical payload hashing/i.test(spec), 'canonical payload hashing activation blocker missing');

if (process.exitCode) {
  process.exit(1);
}

console.log('IR-02C Business Terms governance gate: PASS');

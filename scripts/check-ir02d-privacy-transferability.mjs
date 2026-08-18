import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (ok, msg) => {
  if (!ok) {
    console.error(`IR-02D FAIL: ${msg}`);
    process.exitCode = 1;
  }
};

const dePrivacyPath = 'docs/legal/HOY_PRIVACY_NOTICE_v1.0_DE_DRAFT.md';
const esPrivacyPath = 'docs/legal/HOY_PRIVACY_NOTICE_v1.0_ES_DRAFT.md';
const dpaPath = 'docs/legal/HOY_DPA_ART28_v1.0_DE_DRAFT.md';
const ddPath = 'docs/IR-02D_PRIVACY_TRANSFERABILITY_DD_STATUS.md';
const migrationPath = 'supabase/migrations/20260818205155_ir02d_privacy_transferability_governance.sql';
const analyticsPath = 'analytics-rpc-1.8.1.js';

for (const p of [dePrivacyPath, esPrivacyPath, dpaPath, ddPath, migrationPath, analyticsPath]) {
  assert(fs.existsSync(path.join(root, p)), `required file missing: ${p}`);
}
if (process.exitCode) process.exit(1);

const de = read(dePrivacyPath);
const es = read(esPrivacyPath);
const dpa = read(dpaPath);
const dd = read(ddPath);
const migration = read(migrationPath);
const analytics = read(analyticsPath);

assert(/DRAFT \/ NOT YET ACTIVE/i.test(de), 'German Privacy Notice must remain explicitly draft/not active');
assert(/DO NOT ACTIVATE/i.test(de), 'German Privacy Notice must retain fail-closed activation marker');
assert(/BORRADOR.*NO ACTIVO/is.test(es), 'Spanish Privacy Notice must remain draft/not active');
assert(/NO ACTIVAR/i.test(es), 'Spanish Privacy Notice must retain no-activate marker');
assert(/DRAFT \/ NOT YET ACTIVE/i.test(dpa), 'DPA must remain explicitly draft/not active');
assert(/PROCESSOR_CONFIRMED/i.test(dpa), 'DPA must retain factual processor-role gate');
assert(/DO NOT ACTIVATE/i.test(dpa), 'DPA must retain activation blocker');

assert(/privacy_notice_active_requires_clearance/i.test(migration), 'Privacy Notice DB activation constraint missing');
assert(/dpa_active_requires_clearance/i.test(migration), 'DPA DB activation constraint missing');
for (const required of [
  'legal_entity_name',
  'registered_address',
  'privacy_contact_email',
  'role_matrix_approved_at',
  'legal_bases_approved_at',
  'retention_approved_at',
  'cookie_analytics_approved_at',
  'vendor_transfer_reviewed_at',
  'counsel_reviewed_at'
]) {
  assert(migration.includes(required), `Privacy activation gate must require ${required}`);
}

for (const activity of ['PA-01','PA-02','PA-03','PA-04','PA-05','PA-06','PA-07','PA-08']) {
  assert(migration.includes(`'${activity}'`), `ROPA seed missing ${activity}`);
}
for (const rule of ['RET-ANALYTICS','RET-PROSPECT','RET-ACCOUNT','RET-CLAIM','RET-CONTRACT','RET-AUDIT','RET-WORKS']) {
  assert(migration.includes(`'${rule}'`), `retention rule missing ${rule}`);
}
for (const vendor of ['TR-GITHUB','TR-SUPABASE-GASTRO','TR-SUPABASE-WORKS','TR-DOMAINS','TR-BRAND','TR-OTHER-VENDORS']) {
  assert(migration.includes(`'${vendor}'`), `transferability register missing ${vendor}`);
}

assert(/LSSI outreach gate remains closed/i.test(migration), 'Spain electronic-marketing gate must remain blocked');
assert(/Cookie\/ePrivacy/i.test(migration), 'analytics cookie/ePrivacy review gate missing');
assert(/HOY Works customer request and matching/i.test(migration) && /'blocked'/i.test(migration), 'Works privacy-heavy flow must remain pre-live blocked');
assert(/revoke all on table private/i.test(migration), 'private governance tables must deny client grants');
assert(/using \(false\) with check \(false\)/i.test(migration), 'private governance tables must retain explicit deny RLS policies');

assert(/Technical transferability:\*\* \*\*YES\*\*/i.test(dd), 'DD report must preserve verified technical transfer routes');
assert(/Buyer readiness:\*\* \*\*AMBER\*\*/i.test(dd), 'DD report must not falsely mark critical platform ownership as GREEN');
assert(/Database region ≠ proof/i.test(dd), 'DB region must not be treated as proof of EEA-only processing');
assert(/Not defensible yet/i.test(dd), 'DD claim boundary section missing');

assert(/Personal data is not/i.test(de) || /personenbezogene Daten nicht/i.test(de), 'Privacy Notice must reject personal-data ownership framing');
assert(/Auftragsverarbeitung/i.test(dpa) && /eigenverantwortliche HOY-Verarbeitung/i.test(dpa), 'DPA must distinguish processor from HOY controller purposes');

// Production analytics must be consent fail-closed. The default path must not
// create persistent IDs, session IDs, pilot attribution or local event history.
assert(analytics.includes("const CONSENT_KEY='hoy-privacy-analytics-consent-v1'"), 'versioned analytics consent key missing');
assert(/function analyticsConsentGranted\(\)[\s\S]*?===['"]granted['"]/i.test(analytics), 'analytics consent must require explicit granted state');
assert(/PRODUCTION_HOSTS\.has\(host\)[\s\S]*?analyticsConsentGranted\(\)/i.test(analytics), 'production transport must require explicit consent');
assert(/trackEvent=function[\s\S]*?if\(!analyticsStorageAllowed\(\)\)return Promise\.resolve\(false\);[\s\S]*?readEvents\(\)/i.test(analytics), 'trackEvent must stop before local analytics storage when consent is absent');
assert(/buildPayload[\s\S]*?storedUuid\(localStorage,ANON_KEY\)/i.test(analytics), 'analytics identifier creation path missing');
assert(/trackEvent=function[\s\S]*?analyticsStorageAllowed\(\)[\s\S]*?buildPayload/i.test(analytics), 'payload/identifier creation must occur only behind consent/QA gate');
assert(/deny:\(\)=>[\s\S]*?clearAnalyticsIdentifiers\(\)/i.test(analytics), 'deny action must clear analytics identifiers/history');
assert(/withdraw:\(\)=>[\s\S]*?clearAnalyticsIdentifiers\(\)/i.test(analytics), 'withdraw action must clear analytics identifiers/history');
assert(/localStorage\.removeItem\(ANON_KEY\)/i.test(analytics) && /sessionStorage\.removeItem\(SESSION_KEY\)/i.test(analytics), 'withdrawal must remove persistent and session analytics identifiers');

if (process.exitCode) process.exit(1);
console.log('IR-02D privacy & transferability governance gate: PASS');

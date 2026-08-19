const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const register = JSON.parse(fs.readFileSync(path.join(root, 'docs/investor-ready/g1-external-decision-register-v1.json'), 'utf8'));
const pack = fs.readFileSync(path.join(root, 'docs/investor-ready/g1-external-decision-pack-v1.md'), 'utf8');
const errors = [];
const assert = (ok, msg) => { if (!ok) errors.push(msg); };

const allowed = new Set(['ADVISER_REQUIRED','INDEPENDENT_TEST_REQUIRED','DECISION_RECEIVED_PRIVATE','EXECUTION_READY','CLOSED_WITH_EVIDENCE']);
assert(register.schemaVersion === '1.0.0', 'schema drift');
assert(register.snapshotDate === '2026-08-19', 'snapshot date drift');
assert(register.baseMainSha === '88bb9e77d50ccb9db96306f5e737e27bad6237ab', 'decision pack must be pinned to current main with merged #128');
assert(register.overallStatus === 'EXTERNAL_DECISIONS_REQUIRED', 'overall status must remain external decisions required');
assert(typeof register.publicRepositoryPrivacyRule === 'string' && register.publicRepositoryPrivacyRule.includes('Do not store private founder'), 'public/private counsel boundary missing');
assert(Array.isArray(register.decisions) && register.decisions.length === 16, 'expected exactly 16 external decisions');

const ids = new Set();
const byId = new Map();
for (const d of register.decisions || []) {
  assert(/^[A-D]\d+$/.test(d.id || ''), `invalid decision id ${d.id}`);
  assert(!ids.has(d.id), `duplicate decision ${d.id}`);
  ids.add(d.id);
  byId.set(d.id, d);
  assert(allowed.has(d.status), `${d.id}: invalid status ${d.status}`);
  assert(typeof d.stream === 'string' && d.stream.length > 2, `${d.id}: stream required`);
  assert(typeof d.title === 'string' && d.title.length > 5, `${d.id}: title required`);
  assert(typeof d.advisor === 'string' && d.advisor.length > 5, `${d.id}: advisor/reviewer role required`);
  assert(Array.isArray(d.publicInputs) && d.publicInputs.length > 0, `${d.id}: publicInputs required`);
  assert(typeof d.privateInputRequired === 'boolean', `${d.id}: privateInputRequired must be explicit`);
  assert(typeof d.expectedOutput === 'string' && d.expectedOutput.length > 30, `${d.id}: expectedOutput too weak`);
  assert(d.executionAuthorized === false, `${d.id}: pack cannot authorize execution`);
  assert(!['CLOSED_WITH_EVIDENCE','EXECUTION_READY','DECISION_RECEIVED_PRIVATE'].includes(d.status), `${d.id}: no external decision/test evidence is recorded on this public snapshot`);
}

for (const id of ['A1','A2','A3','A4']) {
  assert(byId.get(id)?.status === 'ADVISER_REQUIRED', `${id} must remain adviser-required`);
  assert(byId.get(id)?.privateInputRequired === true, `${id} private founder facts must stay outside public repo`);
}
for (const id of ['B1','B2','B3','B4','B5','B6','B7','B8','C1','C2','C3']) {
  assert(byId.get(id)?.status === 'ADVISER_REQUIRED', `${id} must remain adviser-required`);
}
assert(byId.get('D1')?.status === 'INDEPENDENT_TEST_REQUIRED', 'D1 must require an independent non-founder test');

assert(byId.get('B3')?.publicInputs.join(' ').includes('main merged #128'), 'analytics decision must use merged #128 as current runtime baseline');
assert(byId.get('B7')?.publicInputs.join(' ').includes('PR #106'), 'Business Terms rights decision must preserve Buyer-Safe RT-007 boundary');
assert(byId.get('C1')?.expectedOutput.includes('Official-registry-backed'), 'trademark clearance must require official registry evidence');
assert(byId.get('D1')?.expectedOutput.includes('no founder self-certification'), 'handoff cannot be founder self-certified');

assert(typeof register.closureRule === 'string' && register.closureRule.includes('written external decision or independent-test evidence'), 'closure rule must require real evidence');
assert(Array.isArray(register.noAuthorization), 'noAuthorization required');
for (const boundary of ['production DDL/DML','personal tax-residency changes','trademark filing or rights-holder contact','paid infrastructure','business/partner/investor outreach']) {
  assert(register.noAuthorization.includes(boundary), `missing no-authorization boundary: ${boundary}`);
}

for (const phrase of ['not legal, tax or trademark advice','Do **not** commit private founder','Decision Stream A','Decision Stream B','Decision Stream C','Decision Stream D','This pack authorizes no filing','does not authorize Production']) {
  assert(pack.includes(phrase), `decision pack narrative missing: ${phrase}`);
}
assert(pack.includes('The Terms should not silently convert third-party source material into HOY-owned IP.'), 'third-party rights anti-laundering boundary missing');
assert(pack.includes('The current technical default remains OFF'), 'analytics fail-closed boundary missing');

const counts = register.decisions.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});
assert(counts.ADVISER_REQUIRED === 15, `expected 15 adviser-required decisions, got ${counts.ADVISER_REQUIRED || 0}`);
assert(counts.INDEPENDENT_TEST_REQUIRED === 1, `expected 1 independent-test decision, got ${counts.INDEPENDENT_TEST_REQUIRED || 0}`);

console.log(JSON.stringify({ baseMainSha: register.baseMainSha, decisions: register.decisions.length, statusCounts: counts, overallStatus: register.overallStatus, status: errors.length ? 'FAIL' : 'PASS_FAIL_CLOSED' }, null, 2));
if (errors.length) {
  for (const e of errors) console.error(`G1 EXTERNAL DECISION PACK FAIL: ${e}`);
  process.exit(1);
}

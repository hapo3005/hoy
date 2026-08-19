const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'docs/investor-ready/g1-current-main-survivor-map-v1.json'), 'utf8'));
const narrative = fs.readFileSync(path.join(root, 'docs/investor-ready/g1-current-main-survivor-map-v1.md'), 'utf8');
const errors = [];
const assert = (ok, msg) => { if (!ok) errors.push(msg); };

const valid = new Set(['MERGED_AUTHORITY','CURRENT_CANDIDATE','EVIDENCE_ONLY','RECOMPOSE_REQUIRED','EXTERNAL_GATE']);
assert(map.schemaVersion === '1.0.0', 'schema drift');
assert(map.snapshotDate === '2026-08-19', 'snapshot date drift');
assert(map.baseMainSha === '88bb9e77d50ccb9db96306f5e737e27bad6237ab', 'survivor map must remain pinned to current main with merged #128');
assert(Array.isArray(map.authorities) && map.authorities.length === 15, 'expected 15 subject authorities');

const byDomain = new Map();
for (const a of map.authorities || []) {
  assert(typeof a.domain === 'string' && a.domain.length > 0, 'domain required');
  assert(!byDomain.has(a.domain), `duplicate domain ${a.domain}`);
  byDomain.set(a.domain, a);
  assert(valid.has(a.status), `${a.domain}: invalid status ${a.status}`);
  assert(typeof a.authority === 'string' && a.authority.length > 3, `${a.domain}: authority required`);
  if (a.status === 'RECOMPOSE_REQUIRED' || a.status === 'EVIDENCE_ONLY' || a.status === 'EXTERNAL_GATE' || a.status === 'CURRENT_CANDIDATE') {
    assert(typeof a.reason === 'string' && a.reason.length > 20, `${a.domain}: reason required`);
  }
}

const requireStatus = (domain, status) => {
  assert(byDomain.has(domain), `missing domain ${domain}`);
  assert(byDomain.get(domain)?.status === status, `${domain} must be ${status}`);
};
requireStatus('base_supply_chain','MERGED_AUTHORITY');
requireStatus('analytics_privacy_runtime','MERGED_AUTHORITY');
requireStatus('privacy_operating_controls','RECOMPOSE_REQUIRED');
requireStatus('security_current_state','EVIDENCE_ONLY');
requireStatus('security_hardening','RECOMPOSE_REQUIRED');
requireStatus('founder_ip_execution','EXTERNAL_GATE');
requireStatus('digital_asset_control','EXTERNAL_GATE');
requireStatus('data_rights_core','RECOMPOSE_REQUIRED');
requireStatus('data_rights_works','CURRENT_CANDIDATE');
requireStatus('business_terms','RECOMPOSE_REQUIRED');
requireStatus('public_runtime','RECOMPOSE_REQUIRED');
requireStatus('trademark_brand','EXTERNAL_GATE');
requireStatus('platform_core_transferability','RECOMPOSE_REQUIRED');
requireStatus('g1_closing_control_plane','CURRENT_CANDIDATE');

const privacy = byDomain.get('analytics_privacy_runtime');
assert(privacy.authority.startsWith('main@88bb9e77'), 'merged privacy authority must be current main');
assert((privacy.includes || []).some(v => v.includes('#128')), 'merged privacy authority must record #128');
assert((privacy.supersedesAsFinalAuthority || []).some(v => v.includes('#120')), '#120 must be superseded as final runtime authority');

const privacyOps = byDomain.get('privacy_operating_controls');
assert(privacyOps.authority === 'hapo3005/hoy#127', 'privacy operating authority must be #127');
assert((privacyOps.mustPreserve || []).some(v => v.includes('#128')), '#127 recompose must preserve merged #128 semantics');

const publicRuntime = byDomain.get('public_runtime');
assert(publicRuntime.authority === 'hapo3005/hoy#130', 'public runtime authority must be #130');
assert((publicRuntime.supersedesAsFinalAuthority || []).some(v => v.includes('#121')), '#121 must be historical, not final authority');

const security = byDomain.get('security_hardening');
assert(security.authority === 'hapo3005/hoy#125', 'security hardening authority must be #125');
assert((security.mustPreserve || []).some(v => v.includes('#128')), 'security recompose must preserve merged privacy revocation');
assert(security.reason.includes('isolated'), 'security must remain unexecuted until isolated proof');

const rights = byDomain.get('data_rights_core');
assert(rights.authority === 'hapo3005/hoy#106', 'Core data-rights authority must be #106');
assert((rights.mustPreserve || []).some(v => v.includes('AMBER is not transfer-clear')), 'AMBER boundary missing');
assert((rights.mustPreserve || []).some(v => v.includes('whole-profile')), 'whole-profile non-clearance boundary missing');

const platform = byDomain.get('platform_core_transferability');
assert(platform.authority.includes('#115'), 'platform authority must include #115');
assert((platform.mustPreserve || []).some(v => v.includes('NOT_TESTED')), 'non-founder handoff must remain NOT_TESTED');

const noWholesale = new Set(map.explicitDoNotWholesaleMerge || []);
for (const pr of ['hapo3005/hoy#102','hapo3005/hoy#103','hapo3005/hoy#105','hapo3005/hoy#107','hapo3005/hoy#109','hapo3005/hoy#120','hapo3005/hoy#121','hapo3005/hoy#125','hapo3005/hoy#127','hapo3005/hoy#130','hapo3005/hoy#106','hapo3005/hoy#115']) {
  assert(noWholesale.has(pr), `missing do-not-wholesale-merge guardrail for ${pr}`);
}

assert(Array.isArray(map.nextCompositionOrder) && map.nextCompositionOrder.length === 8, 'expected eight composition steps');
assert(map.nextCompositionOrder[0].startsWith('1 current main'), 'composition must start from current main');
assert(map.nextCompositionOrder[1].includes('#127') && map.nextCompositionOrder[1].includes('#128'), 'privacy composition order drift');
assert(map.nextCompositionOrder[2].includes('#130'), 'public-runtime order missing');
assert(map.nextCompositionOrder[3].includes('#125'), 'security order missing');
assert(map.nextCompositionOrder[4].includes('#106'), 'rights order missing');
assert(map.finalIntegrationAuthorized === false, 'map cannot authorize final integration');
assert(map.productionAuthorized === false, 'map cannot authorize Production');
assert(map.outreachAuthorized === false, 'map cannot authorize outreach');

for (const phrase of ['Current-Main Survivor Map','MERGED_AUTHORITY','RECOMPOSE_REQUIRED','EXTERNAL_GATE','#128','no** final integration']) {
  assert(narrative.includes(phrase), `narrative missing ${phrase}`);
}

const counts = {};
for (const a of map.authorities) counts[a.status] = (counts[a.status] || 0) + 1;
console.log(JSON.stringify({ baseMainSha: map.baseMainSha, authorities: map.authorities.length, statusCounts: counts, finalIntegrationAuthorized: map.finalIntegrationAuthorized, status: errors.length ? 'FAIL' : 'PASS_FAIL_CLOSED' }, null, 2));
if (errors.length) {
  for (const e of errors) console.error(`G1 SURVIVOR MAP FAIL: ${e}`);
  process.exit(1);
}

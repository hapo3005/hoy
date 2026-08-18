import fs from 'node:fs';

const path = new URL('../data/ir-02b-source-rights-policy-2026-08-18.json', import.meta.url);
const policy = JSON.parse(fs.readFileSync(path, 'utf8'));

const validStatuses = new Set(['GREEN', 'AMBER', 'RED', 'REVIEW_REQUIRED']);
const validTransfer = new Set(['YES', 'YES_WITH_CONDITIONS', 'NO', 'UNKNOWN']);
const errors = [];

if (policy.default_new_source_status !== 'REVIEW_REQUIRED') {
  errors.push('New source default must remain REVIEW_REQUIRED.');
}

for (const p of policy.policy_classes || []) {
  if (!p.code) errors.push('Policy class without code.');
  if (!validStatuses.has(p.rights_status)) errors.push(`${p.code}: invalid rights_status`);
  if (!validTransfer.has(p.transferability)) errors.push(`${p.code}: invalid transferability`);

  if (p.rights_status === 'RED') {
    for (const key of ['persistent_copy_allowed','public_reuse_allowed','derivative_use_allowed','commercial_use_allowed','automated_collection_allowed']) {
      if (p[key] !== false) errors.push(`${p.code}: RED source must keep ${key}=false`);
    }
    if (p.transferability !== 'NO') errors.push(`${p.code}: RED source must be non-transferable`);
    if (p.replacement_required !== true) errors.push(`${p.code}: RED source must require replacement`);
  }

  if (p.rights_status === 'GREEN' && !p.evidence) {
    errors.push(`${p.code}: GREEN source requires evidence.`);
  }
}

const requiredRestricted = [
  'PLATFORM_RESTRICTED_GOOGLE_MAPS',
  'AGGREGATOR_RESTRICTED_RESTAURANTGURU',
  'AGGREGATOR_RESTRICTED_TRIPADVISOR',
  'SOCIAL_RESTRICTED_META',
  'MAP_PLATFORM_RESTRICTED_WAZE'
];
for (const code of requiredRestricted) {
  const p = policy.policy_classes.find(x => x.code === code);
  if (!p || p.rights_status !== 'RED') errors.push(`${code}: missing fail-closed RED policy.`);
}

if (errors.length) {
  console.error('IR-02B source-rights policy gate FAILED');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`IR-02B source-rights policy gate OK (${policy.policy_classes.length} policy classes).`);

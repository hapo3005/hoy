const fs = require('fs');

const planPath = 'docs/investor-ready/rt007-ordered-apply-plan-v1.json';
const manifestPath = 'docs/investor-ready/rt007-prepared-replacements-v2.json';

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function fail(message) {
  console.error(`RT-007 ordered apply plan FAIL: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(plan.control === 'G1-CB-14', 'control must remain G1-CB-14');
assert(plan.status === 'ORDERED_APPLY_PLAN_PREPARED_NOT_EXECUTED', 'status must remain prepared/not executed');
assert(plan.safety?.productionMutationPerformed === false, 'must not claim a production mutation');
assert(plan.safety?.productionApplyAuthorized === false, 'must not claim production authorization');
assert(plan.safety?.autoApply === false, 'auto-apply must remain disabled');
assert(plan.safety?.ddlAllowed === false, 'DDL must remain disabled');
assert(plan.safety?.dmlAllowedBeforeExplicitApproval === false, 'DML must remain blocked before explicit approval');
assert(plan.safety?.buyerTransferClearanceCreatedByReplacement === false, 'replacement must not imply transfer clearance');
assert(plan.safety?.businessTermsStillRequired === true, 'Business Terms requirement must remain explicit');

assert(manifest.status === 'PREPARED_MANIFEST_NOT_APPLIED', 'source manifest must remain not applied');
assert(manifest.productionMutationPerformed === false, 'source manifest must not claim production mutation');
assert(manifest.productionApplyAuthorized === false, 'source manifest must not claim production authorization');
assert(manifest.targets?.length === 36, 'source manifest must contain exactly 36 targets');
assert(plan.frozenExpectations?.targets === 36, 'plan must expect exactly 36 targets');
assert(plan.frozenExpectations?.published === 34, 'plan must expect 34 published targets');
assert(plan.frozenExpectations?.unpublished === 2, 'plan must expect 2 unpublished targets');
assert(plan.frozenExpectations?.signatureTargets === 12, 'plan must expect 12 signature targets');

const published = manifest.targets.filter((t) => t.published === true).length;
const unpublished = manifest.targets.filter((t) => t.published === false).length;
assert(published === 34, `manifest published split must be 34, got ${published}`);
assert(unpublished === 2, `manifest unpublished split must be 2, got ${unpublished}`);

const waveCounts = manifest.targets.reduce((acc, target) => {
  acc[target.wave] = (acc[target.wave] || 0) + 1;
  return acc;
}, {});

const expectedWaves = [
  ['source_url_wave1', 12],
  ['signature_wave1', 3],
  ['signature_wave2', 9],
  ['location_wave1', 4],
  ['location_wave2', 2],
  ['location_wave3', 4],
  ['location_wave4', 2],
];

assert(plan.orderedWaves?.length === expectedWaves.length, 'plan must contain exactly seven ordered waves');

for (let i = 0; i < expectedWaves.length; i += 1) {
  const [name, count] = expectedWaves[i];
  const wave = plan.orderedWaves[i];
  assert(wave.order === i + 1, `${name} must have order ${i + 1}`);
  assert(wave.wave === name, `wave ${i + 1} must be ${name}`);
  assert(wave.expectedTargets === count, `${name} must expect ${count} targets`);
  assert(waveCounts[name] === count, `manifest ${name} must contain ${count} targets`);
  assert(wave.transactionBoundary === 'ONE_WAVE_ONE_TRANSACTION', `${name} must use one-wave transaction boundary`);
  assert(/affected row count/i.test(wave.abortCondition || ''), `${name} must fail closed on row-count mismatch`);
}

const before = plan.frozenExpectations?.projectedHardRefs?.before;
const after = plan.frozenExpectations?.projectedHardRefs?.after;
assert(before?.all === 329 && before?.published === 324 && before?.unpublished === 5, 'pre-apply hard-ref baseline must be 329/324/5');
assert(after?.all === 293 && after?.published === 290 && after?.unpublished === 3, 'post-apply projection must be 293/290/3');

const requiredPreconditionPhrases = [
  '36 proposed first-party URLs',
  'currentUrl exactly matches',
  '12 signature targets',
  'buyer-safe rights counts',
  'rollback payload',
  'Explicit production approval',
];
const preconditions = (plan.preconditions || []).join('\n');
for (const phrase of requiredPreconditionPhrases) {
  assert(preconditions.includes(phrase), `missing precondition phrase: ${phrase}`);
}

assert(plan.rollbackProtocol?.captureBeforeMutation === true, 'rollback data must be captured before mutation');
assert(plan.rollbackProtocol?.granularity === 'PER_TARGET_AND_PER_WAVE', 'rollback granularity must be per target and per wave');
assert((plan.claimBoundary || '').includes('does not authorize or perform Production DML'), 'claim boundary must deny Production DML authorization/execution');
assert((plan.claimBoundary || '').includes('does not close G1'), 'claim boundary must deny G1 closure');

if (!process.exitCode) {
  console.log('RT-007 ordered apply plan PASS');
  console.log(`targets=${manifest.targets.length} published=${published} unpublished=${unpublished}`);
  console.log(`waves=${expectedWaves.map(([name, count]) => `${name}:${count}`).join(',')}`);
  console.log('productionMutationPerformed=false productionApplyAuthorized=false');
}

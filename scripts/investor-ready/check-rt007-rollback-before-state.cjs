const fs = require('fs');

const rollbackPath = 'docs/investor-ready/rt007-rollback-before-state-2026-08-19.json';
const manifestPath = 'docs/investor-ready/rt007-prepared-replacements-v2.json';
const rollback = JSON.parse(fs.readFileSync(rollbackPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function fail(message) {
  console.error(`RT-007 ROLLBACK EVIDENCE FAIL: ${message}`);
  process.exit(1);
}
function ok(value, message) {
  if (!value) fail(message);
}

ok(rollback.role === 'G1-CB-14_ROLLBACK_BEFORE_STATE', 'wrong role');
ok(rollback.basePreflight?.pr === 148, 'must descend from PR #148 preflight');
ok(rollback.sourceManifest?.gitBlobSha === '44eac03dcb41fc21da58f660952235b397874d97', 'source manifest blob pin changed');
ok(rollback.sourceManifest?.exactProductionMatchAtCapture === 36, '36 exact Production matches required');
ok(rollback.sourceManifest?.driftAtCapture === 0, 'drift must remain zero at capture');

ok(rollback.productionMutationPerformed === false, 'Production mutation must remain false');
ok(rollback.productionApplyAuthorized === false, 'Production apply must remain unauthorized');
ok(rollback.rollbackExecutionAuthorized === false, 'rollback execution must remain unauthorized');

const expectedWaves = new Map([
  ['source_url_wave1',12],
  ['signature_wave1',3],
  ['signature_wave2',9],
  ['location_wave1',4],
  ['location_wave2',2],
  ['location_wave3',4],
  ['location_wave4',2]
]);
ok(Array.isArray(rollback.waves) && rollback.waves.length === 7, 'seven waves required');
for (const wave of rollback.waves) {
  ok(expectedWaves.get(wave.wave) === wave.count, `wrong count for ${wave.wave}`);
  expectedWaves.delete(wave.wave);
}
ok(expectedWaves.size === 0, 'missing wave');

ok(rollback.targetAccounting?.all === 36, '36 total targets required');
ok(rollback.targetAccounting?.published === 34 && rollback.targetAccounting?.unpublished === 2, '34/2 split required');
ok(rollback.targetAccounting?.urlOnlyTargets === 24 && rollback.targetAccounting?.signatureTargets === 12, '24 URL-only + 12 signature targets required');

ok(Array.isArray(manifest.targets) && manifest.targets.length === 36, 'prepared manifest must contain 36 targets');
const manifestWaveCounts = new Map();
for (const target of manifest.targets) manifestWaveCounts.set(target.wave, (manifestWaveCounts.get(target.wave) || 0) + 1);
for (const wave of rollback.waves) ok(manifestWaveCounts.get(wave.wave) === wave.count, `rollback wave disagrees with manifest for ${wave.wave}`);

const sigTargets = manifest.targets.filter(t => t.field === 'signature_source_url');
ok(sigTargets.length === 12, 'manifest must contain 12 signature targets');
ok(Array.isArray(rollback.signatureBeforeState) && rollback.signatureBeforeState.length === 12, '12 signature before states required');
const sigBefore = new Map(rollback.signatureBeforeState.map(s => [s.restaurantId, s]));
for (const target of sigTargets) {
  const before = sigBefore.get(target.restaurantId);
  ok(before, `missing signature before state for ${target.restaurantId}`);
  ok(before.signature_source_url === target.currentUrl, `signature before URL mismatch for ${target.restaurantId}`);
  ok(typeof before.signature_title === 'string' && before.signature_title.length > 0, `missing signature title for ${target.restaurantId}`);
  ok(typeof before.signature_text === 'string' && before.signature_text.length > 0, `missing signature text for ${target.restaurantId}`);
  ok(Array.isArray(before.signature_tags), `missing signature tags for ${target.restaurantId}`);
}

const contract = rollback.rollbackContract || {};
ok(contract.candidateMustMaterializeExactPerTargetRollbackPayload === true, 'candidate must materialize exact per-target rollback');
ok(contract.eachWaveIndependentTransaction === true, 'wave transaction boundary required');
ok(contract.rollbackMustBeExactAfterStateGuarded === true, 'rollback exact-after-state guard required');
ok(contract.rollbackMustAbortOnRowCountMismatch === true, 'rollback row-count abort required');
ok(contract.rollbackMustNotOverwriteLaterLegitimateChange === true, 'stale overwrite protection required');
ok(contract.signatureRollbackRestoresFullCapturedSignatureState === true, 'full signature restore required');
ok(contract.immediatePreApplyRecaptureRequired === true, 'immediate pre-apply recapture required');

const boundary = rollback.claimBoundary || {};
ok(boundary.thisIsExecutableDml === false, 'rollback evidence must not be executable DML');
ok(boundary.productionMutationPerformed === false, 'claim boundary mutation must remain false');
ok(boundary.productionApplyAuthorized === false, 'claim boundary apply must remain false');
ok(boundary.rollbackExecutionAuthorized === false, 'claim boundary rollback execution must remain false');
ok(boundary.transferClearanceClaimed === false, 'transfer-clear claim forbidden');
ok(boundary.wholeProfileClearanceClaimed === false, 'whole-profile clearance claim forbidden');
ok(boundary.businessTermsStillRequired === true, 'Business Terms requirement must remain true');
ok(boundary.contactFreezeChanged === false, 'Contact Freeze must remain unchanged');

console.log('RT-007 ROLLBACK EVIDENCE PASS');

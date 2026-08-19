import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] || '.rt007-generated';
const contract = JSON.parse(fs.readFileSync('docs/investor-ready/rt007-apply-rollback-candidate-v1.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('docs/investor-ready/rt007-prepared-replacements-v2.json', 'utf8'));
const rollback = JSON.parse(fs.readFileSync('docs/investor-ready/rt007-rollback-before-state-2026-08-19.json', 'utf8'));
const apply = fs.readFileSync(path.join(outDir, contract.generatedArtifacts.apply), 'utf8');
const rollbackSql = fs.readFileSync(path.join(outDir, contract.generatedArtifacts.rollback), 'utf8');

function fail(message) {
  console.error(`RT-007 APPLY/ROLLBACK CANDIDATE FAIL: ${message}`);
  process.exit(1);
}
function ok(value, message) {
  if (!value) fail(message);
}
function count(text, token) {
  return text.split(token).length - 1;
}
function executableSqlOnly(sql) {
  return sql.replace(/^\s*--.*$/gm, '');
}

ok(contract.role === 'G1-CB-14_EXACT_GUARDED_APPLY_ROLLBACK_CANDIDATE', 'wrong role');
ok(contract.baseRollbackEvidence?.pr === 150, 'must descend from #150');
ok(contract.sourceManifest?.gitBlobSha === '44eac03dcb41fc21da58f660952235b397874d97', 'manifest pin changed');
ok(contract.targetAccounting?.all === 36, '36 targets required');
ok(contract.targetAccounting?.published === 34 && contract.targetAccounting?.unpublished === 2, '34/2 split required');
ok(contract.targetAccounting?.urlOnly === 24 && contract.targetAccounting?.signature === 12, '24/12 split required');
ok(contract.targetAccounting?.waves === 7, 'seven waves required');

const safety = contract.executionSafety || {};
ok(safety.productionMutationPerformed === false, 'mutation flag must remain false');
ok(safety.productionApplyAuthorized === false, 'apply must remain unauthorized');
ok(safety.rollbackExecutionAuthorized === false, 'rollback must remain unauthorized');
ok(safety.autoExecutionConfigured === false, 'auto execution forbidden');
ok(safety.eachWaveIndependentTransaction === true, 'independent transactions required');
ok(safety.exactBeforeStateGuardRequired === true, 'exact before guard required');
ok(safety.exactAfterStateRollbackGuardRequired === true, 'exact after guard required');
ok(safety.rowCountMustEqualOnePerTarget === true, 'rowcount gate required');
ok(safety.staleStateFailsClosed === true, 'stale-state fail closed required');
ok(safety.freshImmediatePreflightRequired === true, 'fresh preflight required');

ok(Array.isArray(manifest.targets) && manifest.targets.length === 36, 'manifest 36 targets required');
ok(rollback.sourceManifest?.exactProductionMatchAtCapture === 36 && rollback.sourceManifest?.driftAtCapture === 0, 'rollback evidence must retain 36/36 zero drift capture');

for (const [name, sql] of [['apply', apply], ['rollback', rollbackSql]]) {
  const executable = executableSqlOnly(sql);
  ok(count(sql, 'BEGIN;') === 7, `${name}: seven BEGIN transactions required`);
  ok(count(sql, 'COMMIT;') === 7, `${name}: seven COMMIT transactions required`);
  ok(count(sql, 'UPDATE public.restaurants') === 36, `${name}: exactly 36 UPDATE statements required`);
  ok(count(sql, 'GET DIAGNOSTICS v_affected = ROW_COUNT;') === 36, `${name}: rowcount check required per target`);
  ok(count(sql, 'expected=1 got=%') === 36, `${name}: fail-closed rowcount exception required per target`);
  ok(count(sql, "hoy.rt007_preflight_rechecked") === 36, `${name}: fresh-preflight guard required per target`);
  ok(!/\b(?:CREATE|ALTER|DROP|TRUNCATE|DELETE|INSERT)\b/i.test(executable), `${name}: executable DDL/insert/delete forbidden`);
  ok(!/venue_sales_pipeline/i.test(executable), `${name}: sales pipeline must not be touched`);
  ok(!/send_lock|send_authorized/i.test(executable), `${name}: send controls must not be touched`);
}

ok(count(apply, 'hoy.rt007_apply_authorized') === 36, 'apply authorization guard required per target');
ok(!apply.includes('hoy.rt007_rollback_authorized'), 'apply must not use rollback authorization');
ok(count(rollbackSql, 'hoy.rt007_rollback_authorized') === 36, 'rollback authorization guard required per target');
ok(!rollbackSql.includes('hoy.rt007_apply_authorized'), 'rollback must not use apply authorization');

const waveCounts = new Map();
for (const target of manifest.targets) waveCounts.set(target.wave, (waveCounts.get(target.wave) || 0) + 1);
for (const [wave, expected] of Object.entries(manifest.expectedCounts || {})) {
  if (wave === 'all' || wave === 'published' || wave === 'unpublished') continue;
  ok(waveCounts.get(wave) === expected, `manifest wave mismatch ${wave}`);
}

for (const target of manifest.targets) {
  const marker = `restaurant=${target.restaurantId} field=${target.field} wave=${target.wave}`;
  ok(count(apply, marker) >= 2, `apply marker missing for ${target.restaurantId}/${target.field}`);
  ok(count(rollbackSql, marker) >= 2, `rollback marker missing for ${target.restaurantId}/${target.field}`);
  ok(apply.includes(String(target.currentUrl).replaceAll("'", "''")), `apply before URL missing for ${target.restaurantId}`);
  ok(apply.includes(String(target.proposedUrl).replaceAll("'", "''")), `apply proposed URL missing for ${target.restaurantId}`);
  ok(rollbackSql.includes(String(target.currentUrl).replaceAll("'", "''")), `rollback restore URL missing for ${target.restaurantId}`);
  ok(rollbackSql.includes(String(target.proposedUrl).replaceAll("'", "''")), `rollback after guard URL missing for ${target.restaurantId}`);
}

const sigTargets = manifest.targets.filter((target) => target.field === 'signature_source_url');
ok(sigTargets.length === 12, '12 signature targets required');
for (const target of sigTargets) {
  const before = rollback.signatureBeforeState.find((row) => Number(row.restaurantId) === Number(target.restaurantId));
  ok(before, `signature before-state missing ${target.restaurantId}`);
  ok(apply.includes(String(target.proposedCopy.title).replaceAll("'", "''")), `apply signature title missing ${target.restaurantId}`);
  ok(apply.includes(String(target.proposedCopy.text).replaceAll("'", "''")), `apply signature text missing ${target.restaurantId}`);
  ok(rollbackSql.includes(String(before.signature_title).replaceAll("'", "''")), `rollback signature title missing ${target.restaurantId}`);
  ok(rollbackSql.includes(String(before.signature_text).replaceAll("'", "''")), `rollback signature text missing ${target.restaurantId}`);
}

const boundary = contract.rightsBoundary || {};
ok(boundary.transferClearReferencesCreated === 0, 'candidate cannot create transfer-clear claim');
ok(boundary.wholeProfileClearanceClaimed === false, 'whole-profile clearance claim forbidden');
ok(boundary.businessTermsStillRequired === true, 'Business Terms must remain required');
ok(contract.claimBoundary?.candidateWasExecuted === false, 'candidate execution claim must remain false');
ok(contract.claimBoundary?.productionChanged === false, 'production changed claim must remain false');
ok(contract.claimBoundary?.contactFreezeChanged === false, 'Contact Freeze must remain unchanged');

console.log('RT-007 APPLY/ROLLBACK CANDIDATE PASS');

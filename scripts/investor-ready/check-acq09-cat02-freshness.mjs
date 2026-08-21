import fs from 'node:fs';

const contractPath = 'docs/investor-ready/acq09-cat02-freshness-baseline-v1.json';
const sqlPath = 'scripts/investor-ready/acq09-cat02-production-freshness-audit.sql';
const runtimePath = 'merchant-truth-freshness-2.50.js';
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const sql = fs.readFileSync(sqlPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const fail = message => { throw new Error(`ACQ-09 CAT-02 freshness gate: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(contract.schemaVersion === '1.0.0', 'schemaVersion must remain 1.0.0');
assert(contract.status === 'BASELINE_CAPTURED_PROOF_NOT_YET_EARNED', 'CAT-02 must remain evidence-bounded');
assert(contract.verifiedAt === '2026-08-21', 'baseline snapshot must remain dated');
assert(contract.track === 'ACQ-09_CAT-02_FRESHNESS_HOY_NOW', 'wrong track');

const boundary = contract.claimBoundary ?? {};
for (const key of [
  'competitiveFreshnessAdvantageProven',
  'competitorFreshnessMetricsKnown',
  'sourceFreshnessEqualsOperatorConfirmation',
  'freshnessEqualsRightsClearance',
  'freshnessEqualsAccuracy',
  'freshnessEqualsLiveStatus',
  'staleOperatorDataMayReceiveNowPriority',
  'productionMutationAuthorizedByThisArtifact',
  'outreachAuthorizedByThisArtifact'
]) assert(boundary[key] === false, `${key} must remain false`);
assert(boundary.todayConfirmedRequiresSameDayOperatorEvidence === true, 'today-confirmed must require same-day operator evidence');

const runtimeControl = contract.existingRuntimeControl ?? {};
assert(runtimeControl.file === runtimePath, 'canonical runtime path mismatch');
assert(runtimeControl.version === '2.50.0', 'canonical runtime version mismatch');
assert(runtimeControl.operatorStandardStaleAfterDays === 30, 'operator stale threshold must match runtime');
assert(runtime.includes("const STALE_AFTER_DAYS=30"), 'runtime must keep 30-day stale threshold');
assert(runtime.includes("madridDate(stamp)===madridDate(current)"), 'runtime must use same Madrid date for today proof');
assert(runtime.includes('fallbackFromStaleOperator'), 'runtime must retain stale fallback');
assert(runtime.includes('operatorConfirmed:false'), 'recent non-today operator data must not become live-confirmed');

const sla = contract.operatingSla ?? {};
assert(sla.status === 'INTERNAL_OPERATING_POLICY_NOT_MARKET_STANDARD', 'SLA must not be presented as market standard');
const classes = sla.classes ?? [];
assert(classes.length === 6, 'FRESH-01..FRESH-06 required');
assert(classes.map(x => x.id).join(',') === 'FRESH-01,FRESH-02,FRESH-03,FRESH-04,FRESH-05,FRESH-06', 'freshness classes must remain ordered');
assert(classes.find(x => x.id === 'FRESH-02')?.maxAgeDays === 30, 'operator-hours SLA must match runtime');
assert(classes.find(x => x.id === 'FRESH-04')?.maxAgeDays === 90, 'core/location recheck SLA must remain explicit');
assert(classes.find(x => x.id === 'FRESH-05')?.maxAge === 'field stale_after', 'accessibility must preserve field-specific stale_after');

const snap = contract.productionSnapshot ?? {};
assert(snap.publishedRestaurants === 180, 'frozen snapshot published count drifted inside artifact');
assert(snap.coreProfileProvenance?.dated === 180 && snap.coreProfileProvenance?.within90d === 180, 'core profile baseline mismatch');
assert(snap.locationProvenance?.dated === 180 && snap.locationProvenance?.within90d === 180, 'location baseline mismatch');
assert(snap.restaurantHours?.checkedWithin30d === 104, 'hours freshness baseline mismatch');
assert(snap.hoursSources?.restaurantsWithSource === 90 && snap.hoursSources?.restaurantsWithin30d === 90, 'hours-source baseline mismatch');
assert(snap.menuSources?.restaurantsWithDatedSource === 67 && snap.menuSources?.restaurantsWithin30d === 67, 'menu-source baseline mismatch');
assert(snap.operatorLiveHours?.rows === 0 && snap.operatorLiveHours?.confirmed === 0, 'operator-live baseline must not be inflated');
assert(snap.accessibility?.currentFacts === 668 && snap.accessibility?.notStaleCurrentFacts === 668, 'accessibility freshness baseline mismatch');
assert(snap.accessibility?.operatorConfirmedRestaurants === 0, 'fresh public research must not be relabeled operator-confirmed');
assert(snap.services?.operatorConfirmedRows === 0, 'service confirmations must not be invented');

const readout = contract.derivedReadout ?? {};
assert(readout.operatorLiveHoursCoveragePctOfPublished === 0, 'operator live coverage must remain truthful');
assert(/first-party live freshness is currently zero/i.test(readout.interpretation), 'interpretation must expose the real operator-freshness gap');

const proof = contract.proofConditions ?? {};
assert((proof.cp2FreshnessTrustAdvantageMayBePromotedOnlyWhen ?? []).length >= 5, 'CP2 promotion evidence boundary required');
assert((proof.cp2FreshnessTrustAdvantageMayBePromotedOnlyWhen ?? []).some(x => /competitor benchmark/i.test(x)), 'comparative claim must require a competitor benchmark');

const executable = sql.replace(/^\s*--.*$/gm, '').trim();
assert(/^BEGIN TRANSACTION READ ONLY;/i.test(executable), 'audit must start in a read-only transaction');
assert(/ROLLBACK;\s*$/i.test(executable), 'audit must end with rollback');
assert(/SELECT jsonb_build_object/i.test(executable), 'audit must produce one structured SELECT result');
assert(!/\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CALL)\b/i.test(executable), 'audit must contain no mutation/DDL/privilege operation');

console.log('HOY ACQ-09 CAT-02 Freshness Baseline v1.0: PASS');
console.log(`published=${snap.publishedRestaurants}; core90=${snap.coreProfileProvenance.within90d}; menu30=${snap.menuSources.restaurantsWithin30d}; hoursSource30=${snap.hoursSources.restaurantsWithin30d}; operatorLive=${snap.operatorLiveHours.confirmed}`);

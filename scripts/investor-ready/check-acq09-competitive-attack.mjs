import fs from 'node:fs';

const path = 'docs/investor-ready/acq09-competitive-attack-v1.json';
const strategy = JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => { throw new Error(`HOY ACQ-09 competitive attack gate: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(strategy.schemaVersion === '1.0.0', 'schemaVersion must remain 1.0.0 until an intentional migration');
assert(strategy.status === 'ACTIVE_INTERNAL_COMPETITIVE_STRATEGY', 'status must remain ACTIVE_INTERNAL_COMPETITIVE_STRATEGY');
assert(/^2026-08-21$/.test(strategy.verifiedAt), 'initial evidence snapshot must remain dated 2026-08-21');

const boundary = strategy.claimBoundary ?? {};
for (const key of [
  'competitorUserCountsKnown',
  'competitorRevenueKnown',
  'competitorMarketShareKnown',
  'competitorSeoTrafficKnown',
  'hoyCompetitiveAdvantageProven',
  'directoryCloneStrategy',
  'scrapingOrProtectedContentCopyAuthorized',
  'brandConfusionOrTrademarkImitationAllowed',
  'outreachAuthorized',
  'productionMutationAuthorized'
]) {
  assert(boundary[key] === false, `${key} must remain false`);
}
assert(boundary.marketCategoryValidatedNotMarketWon === true, 'market validation must remain explicitly distinct from winning the market');
assert(boundary.namedCompetitorsAreEvidenceAndBenchmarkInputsOnly === true, 'named competitors must remain evidence/benchmark inputs only');

const evidence = strategy.marketEvidence ?? [];
assert(evidence.length >= 2, 'at least two current competitor/adjacency evidence sets required');
assert(evidence.some(x => x.id === 'COMP-01' && x.name === 'Viviendo La Manga'), 'Viviendo La Manga evidence required');
assert(evidence.some(x => x.id === 'COMP-02' && /TuLocalidad/.test(x.name)), 'TuLocalidad evidence required');
for (const competitor of evidence) {
  assert(Array.isArray(competitor.evidence) && competitor.evidence.length >= 1, `${competitor.id} requires public evidence`);
  assert(Array.isArray(competitor.validatedMechanisms) && competitor.validatedMechanisms.length >= 2, `${competitor.id} requires validated mechanisms`);
  assert(Array.isArray(competitor.unsupportedInferences) && competitor.unsupportedInferences.length >= 3, `${competitor.id} must state unsupported inferences`);
  for (const source of competitor.evidence) {
    assert(/^https:\/\//.test(source.url), `${competitor.id} evidence must use an https URL`);
    assert(/^2026-08-21$/.test(source.observedAt), `${competitor.id} initial observations must remain dated`);
    assert(typeof source.fact === 'string' && source.fact.length > 40, `${competitor.id} evidence facts must be concrete`);
  }
}

const validation = strategy.marketValidationConclusion ?? {};
assert(validation.status === 'CATEGORY_DEMAND_MECHANISMS_EXTERNALLY_OBSERVED', 'category evidence status must remain bounded');
assert(validation.valuationShortcutAllowed === false, 'competitor evidence must never become a valuation shortcut');
assert(/does not prove HOY demand/i.test(validation.conclusion), 'must explicitly reject competitor evidence as proof of HOY demand');
assert(/does not prove.*HOY superiority/i.test(validation.conclusion), 'must explicitly reject competitor evidence as proof of HOY superiority');

const positioning = strategy.positioning ?? {};
assert(/What exists here\?/.test(positioning.directoryQuestion), 'directory baseline question required');
assert(/What fits me now/.test(positioning.hoyQuestion), 'HOY now/decision question required');
assert(/must not win by becoming a larger generic directory/i.test(positioning.antiCloneRule), 'anti-directory-clone rule required');
const pillars = new Set(positioning.differentiationPillars ?? []);
for (const pillar of [
  'NOW_CONTEXT_AND_FRESHNESS',
  'TRUST_AND_FIELD_LEVEL_VERIFICATION',
  'NATIVE_STRUCTURED_MULTILINGUAL_MENUS',
  'ACCESSIBILITY_REQUIREMENT_MATCHING',
  'HIGH_INTENT_ACTION_HANDOFFS',
  'MERCHANT_FIRST_PARTY_CONFIRMATION',
  'CROSS_VERTICAL_LOCAL_INTENT_GRAPH',
  'REGION_REPLICATION_WITHOUT_CORE_FORKS'
]) {
  assert(pillars.has(pillar), `missing differentiation pillar ${pillar}`);
}

const tracks = strategy.attackTracks ?? [];
assert(tracks.length === 10, 'CAT-01..CAT-10 required');
assert(tracks.map(x => x.id).join(',') === 'CAT-01,CAT-02,CAT-03,CAT-04,CAT-05,CAT-06,CAT-07,CAT-08,CAT-09,CAT-10', 'attack tracks must remain ordered CAT-01..CAT-10');
for (const track of tracks) {
  assert(['P0','P1'].includes(track.priority), `${track.id} must be P0 or P1`);
  assert(typeof track.purpose === 'string' && track.purpose.length > 30, `${track.id} requires a concrete purpose`);
  assert(Array.isArray(track.requiredWork) && track.requiredWork.length >= 3, `${track.id} requires executable work`);
  assert(Array.isArray(track.successEvidence) && track.successEvidence.length >= 2, `${track.id} requires measurable evidence`);
}

const ladder = strategy.competitiveProofLadder ?? [];
assert(ladder.length === 7, 'CP0..CP6 proof ladder required');
assert(ladder.map(x => x.id).join(',') === 'CP0,CP1,CP2,CP3,CP4,CP5,CP6', 'proof ladder must remain ordered CP0..CP6');
assert(ladder[0].status === 'PASS', 'only CP0 observed-category evidence may initially be PASS');
assert(ladder.slice(1).every(x => x.status === 'NOT_PROVEN'), 'CP1..CP6 must remain NOT_PROVEN until real evidence exists');

const order = strategy.immediateExecutionOrder ?? [];
assert(order.length === 10, 'all ten attack tracks require an explicit execution position');
assert(order[0] === 'CAT-03_MENU_COMPLETENESS_CATCH_UP', 'menu completeness remains first because current guest-ready trilingual coverage is a live quality gap');
assert(order.includes('CAT-09_PAID_FOUNDING_PROOF_AFTER_EXISTING_GATES'), 'paid proof must be connected to existing G2 gates');

const anti = new Set(strategy.antiTheaterRules ?? []);
for (const rule of [
  'NO_FEATURE_COUNT_AS_COMPETITIVE_ADVANTAGE',
  'NO_TRAFFIC_AS_VALUE_WITHOUT_QUALIFIED_BEHAVIOR',
  'NO_DIRECTORY_CLONE_AS_STRATEGY',
  'NO_AI_CONTENT_VOLUME_AS_EDITORIAL_MOAT',
  'NO_HANDOFF_EVENT_AS_CONFIRMED_TRANSACTION',
  'NO_MARKET_VALIDATION_AS_HOY_PRODUCT_MARKET_FIT',
  'NO_COMPETITOR_TRANSACTION_OR_VISIBILITY_AS_HOY_VALUATION_COMPARABLE'
]) {
  assert(anti.has(rule), `missing anti-theater rule ${rule}`);
}

const serialized = JSON.stringify(strategy);
assert(!/HOY (has|holds|owns) [0-9,.]+% market share/i.test(serialized), 'must not invent HOY market share');
assert(!/Viviendo La Manga has [0-9,.]+ (users|visitors|customers)/i.test(serialized), 'must not invent competitor users');
assert(!/TuLocalidad has [0-9,.]+ (users|visitors|customers)/i.test(serialized), 'must not invent competitor users');
assert(!/competitive advantage proven/i.test(serialized), 'must not claim competitive advantage is proven');

console.log('HOY ACQ-09 Competitive Attack v1.0: PASS');
console.log(`competitor evidence sets=${evidence.length}; attack tracks=${tracks.length}; proof=${ladder.map(x => `${x.id}:${x.status}`).join(',')}`);

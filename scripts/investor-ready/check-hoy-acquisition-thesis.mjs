import fs from 'node:fs';

const path = 'docs/investor-ready/hoy-acquisition-thesis-v1.json';
const thesis = JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => { throw new Error(`HOY Acquisition Thesis gate: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(thesis.schemaVersion === '1.0.0', 'schemaVersion must remain 1.0.0 until an intentional migration');
assert(thesis.status === 'ACTIVE_INTERNAL_STRATEGY', 'status must be ACTIVE_INTERNAL_STRATEGY');

const boundary = thesis.claimBoundary ?? {};
assert(boundary.buyerInterestClaimed === false, 'must never claim buyer interest without evidence');
assert(boundary.valuationComparableClaimed === false, 'must not convert adjacency transactions into a HOY valuation comparable');
assert(boundary.saleGuaranteedByThresholds === false, 'internal thresholds must never be presented as sale guarantees');
assert(boundary.outreachAuthorized === false, 'this artifact must not authorize outreach');
assert(boundary.contactFreezeActive === true, 'contact freeze must remain active until separately released');
assert(boundary.namedCompaniesAreAdjacencyExamplesOnly === true, 'named companies must remain adjacency examples only');
assert(boundary.theForkTransactionIsHoyValuationComparable === false, 'TheFork transaction must not be treated as a HOY comparable');

assert(Array.isArray(thesis.exitPriorityMechanisms) && thesis.exitPriorityMechanisms.length >= 7, 'exit-priority mechanisms must stay explicit');
assert(Array.isArray(thesis.buyerClasses) && thesis.buyerClasses.length >= 7, 'at least seven buyer classes required');

for (const buyer of thesis.buyerClasses) {
  assert(typeof buyer.id === 'string' && buyer.id.startsWith('BUYER-'), `invalid buyer id ${buyer.id}`);
  assert([1,2,3].includes(buyer.priority), `${buyer.id} must have priority 1..3`);
  assert(buyer.interestEvidence === 'NONE', `${buyer.id} must not imply current buyer interest`);
  assert(typeof buyer.purchaseMotive === 'string' && buyer.purchaseMotive.length > 30, `${buyer.id} requires a concrete purchase motive`);
  assert(Array.isArray(buyer.buyerSpecificProof) && buyer.buyerSpecificProof.length >= 3, `${buyer.id} requires buyer-specific proof`);
}

const ladder = thesis.evidenceLadder ?? [];
assert(ladder.length === 9, 'BP0..BP8 evidence ladder required');
assert(ladder.map(x => x.id).join(',') === 'BP0,BP1,BP2,BP3,BP4,BP5,BP6,BP7,BP8', 'evidence ladder must remain ordered BP0..BP8');

const lanes = thesis.executionLanes ?? {};
assert(lanes.FAST_STRATEGIC_OPTION, 'Fast Strategic Option lane required');
assert(lanes.COMPETITIVE_VALUE_BUILD, 'Competitive Value Build lane required');
assert(lanes.FAST_STRATEGIC_OPTION.marketGuarantee === false, 'fast lane cannot guarantee a sale');
assert(lanes.COMPETITIVE_VALUE_BUILD.marketGuarantee === false, 'value-build lane cannot guarantee a sale');
assert(lanes.FAST_STRATEGIC_OPTION.workingTriggers.g1DealBlockingP0 === 0, 'fast lane cannot start with a deal-blocking G1 P0');
assert(lanes.COMPETITIVE_VALUE_BUILD.workingTriggers.g1DealBlockingP0 === 0, 'competitive lane cannot start with a deal-blocking G1 P0');

const scorecard = thesis.buyerPullScorecard ?? {};
assert(scorecard.status === 'NOT_SCORED_UNTIL_G2_EVIDENCE', 'Buyer-Pull score must stay unscored before G2 evidence');
assert(scorecard.unknownHandling === 'UNKNOWN_NOT_ZERO_NOT_INFERRED', 'unknown scores must not be invented');
const weight = (scorecard.dimensions ?? []).reduce((sum, d) => sum + Number(d.weight || 0), 0);
assert(Math.abs(weight - 1) < 1e-9, `scorecard weights must sum to 1, got ${weight}`);

const backlog = thesis.immediateBacklog ?? [];
assert(backlog.length >= 8, 'pre-outreach acquisition backlog required');
assert(backlog.every(item => item.outreach === false), 'no immediate backlog item may authorize outreach');

const evidence = thesis.marketEvidence ?? [];
assert(evidence.length >= 6, 'market adjacency evidence required');
assert(evidence.some(e => e.id === 'ME-01' && /not a HOY valuation comparable/i.test(e.use)), 'TheFork evidence must carry explicit no-comparable boundary');
assert(evidence.every(e => !/interested in HOY|buyer interest confirmed|will acquire HOY/i.test(JSON.stringify(e))), 'market evidence must not imply buyer interest');

const deprioritize = thesis.deprioritizeRules ?? [];
assert(deprioritize.includes('BUYER_STORY_IMPROVEMENT_WITHOUT_ECONOMIC_OR_EVIDENCE_IMPROVEMENT'), 'anti-exit-theater rule required');
assert(deprioritize.includes('NEW_GOVERNANCE_LAYER_INSTEAD_OF_CLOSING_PROOF_OR_CONTROL'), 'anti-governance-bloat rule required');

console.log('HOY Acquisition Thesis v1.0: PASS');
console.log(`buyer classes=${thesis.buyerClasses.length}; evidence ladder=${ladder.length}; market evidence=${evidence.length}; outreachAuthorized=${boundary.outreachAuthorized}`);

const fs = require('fs');

const path = 'docs/investor-ready/rt007-readonly-preflight-2026-08-19.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

function fail(message) {
  console.error(`RT-007 READ-ONLY PREFLIGHT FAIL: ${message}`);
  process.exit(1);
}
function requireTrue(value, message) {
  if (!value) fail(message);
}

requireTrue(data.role === 'G1-CB-14_READ_ONLY_PREFLIGHT', 'wrong role');
requireTrue(data.productionMutationPerformed === false, 'Production mutation must remain false');
requireTrue(data.productionApplyAuthorized === false, 'Production apply must remain unauthorized');
requireTrue(data.applyDecision === 'BLOCKED_PENDING_SOURCE_REVIEW_AND_SEPARATE_PRODUCTION_APPROVAL', 'apply decision must stay blocked');

const row = data.rowRecheck;
requireTrue(row.targets === 36, 'expected 36 targets');
requireTrue(row.exactMatches === 36, 'all 36 targets must exact-match');
requireTrue(row.drifted === 0, 'row drift must be zero');
requireTrue(row.published === 34 && row.unpublished === 2, 'expected 34/2 published split');
requireTrue(row.status === 'PASS_NO_ROW_DRIFT', 'row status mismatch');

const sig = data.signatureBaseline;
requireTrue(sig.targets === 12 && sig.captured === 12, '12/12 signature baselines must be captured');
requireTrue(sig.status === 'CURRENT_BASELINE_CAPTURED_READ_ONLY', 'signature baseline status mismatch');

const rights = data.destinationRightsRegistry;
requireTrue(rights.uniqueHosts === 27, 'expected 27 unique destination hosts');
requireTrue(rights.registered === 27, 'all destination hosts must be registered');
requireTrue(rights.amberFirstPartyBusinessReference === 27, 'all 27 destinations must remain AMBER first-party refs');
requireTrue(rights.businessTermsRequired === 27, 'Business Terms must remain required for all 27 hosts');
requireTrue(rights.transferClearNow === 0, 'no destination may be claimed transfer-clear now');

const buyer = data.buyerSafeSnapshot;
requireTrue(buyer.hardRefsAll === 329, 'hard refs all drifted');
requireTrue(buyer.hardRefsPublished === 324, 'published hard refs drifted');
requireTrue(buyer.hardRefsUnpublished === 5, 'unpublished hard refs drifted');
requireTrue(buyer.publishedHardRestaurants === 146, 'published hard restaurants drifted');
requireTrue(buyer.publishedConditionalRestaurants === 18, 'published conditional restaurants drifted');
requireTrue(buyer.publishedSourceRefClearRestaurants === 2, 'source-ref-clear restaurant count drifted');
requireTrue(buyer.archivedRestaurants === 3, 'archived restaurant count drifted');

const source = data.sourceRecheck;
requireTrue(source.targets === 36, 'source recheck must cover 36 targets');
requireTrue(source.pass === 32, 'expected 32 source-recheck passes');
requireTrue(source.reviewRequired === 4, 'expected four review-required targets');
requireTrue(source.pass + source.reviewRequired === source.targets, 'source-recheck accounting incomplete');
requireTrue(Array.isArray(source.reviewTargets) && source.reviewTargets.length === 4, 'four review target records required');
requireTrue(source.reviewTargets.every(t => t.applyEligible === false), 'review-required targets must not be apply eligible');

const expectedReviewKeys = new Set([
  '7:signature_source_url',
  '110:source_url',
  '144:source_url',
  '202:location_source_url'
]);
for (const target of source.reviewTargets) {
  const key = `${target.restaurantId}:${target.field}`;
  requireTrue(expectedReviewKeys.has(key), `unexpected review target ${key}`);
  expectedReviewKeys.delete(key);
}
requireTrue(expectedReviewKeys.size === 0, 'missing expected review target');

const boundary = data.claimBoundary;
requireTrue(boundary.wholeProfileClearanceClaimed === false, 'whole-profile clearance must remain false');
requireTrue(boundary.transferClearanceClaimed === false, 'transfer clearance must remain false');
requireTrue(boundary.businessTermsStillRequired === true, 'Business Terms requirement must remain true');
requireTrue(boundary.productionMutationPerformed === false, 'claim boundary mutation must remain false');
requireTrue(boundary.productionApplyAuthorized === false, 'claim boundary apply authorization must remain false');
requireTrue(boundary.contactFreezeChanged === false, 'Contact Freeze must remain unchanged');

console.log('RT-007 READ-ONLY PREFLIGHT PASS');

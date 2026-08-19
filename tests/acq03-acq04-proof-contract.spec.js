const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const offer=json('docs/investor-ready/acq03-founding-paid-offer-v1.json');
const measure=json('docs/investor-ready/acq04-buyer-value-measurement-v1.json');

test('ACQ-03 counts only settled external money as first paid proof',()=>{
  const by=Object.fromEntries(offer.paidProofLadder.map(x=>[x.level,x]));
  assert.equal(by.P0_INTEREST.countsAsBp1PaidBusiness,false);
  assert.equal(by.P1_SIGNED_OR_ACCEPTED.countsAsBp1PaidBusiness,false);
  assert.equal(by.P2_INVOICED.countsAsBp1PaidBusiness,false);
  assert.equal(by.P3_SETTLED_PAYMENT.countsAsBp1PaidBusiness,true);
  assert.equal(offer.proofAccounting.freePilotCountsAsPayingBusiness,false);
  assert.equal(offer.proofAccounting.founderFundedOrRelatedPartyPaymentCounts,false);
});

test('ACQ-03 price test is one-arm, non-live and not market validated',()=>{
  assert.equal(offer.status,'INTERNAL_TEST_CANDIDATE_NOT_LIVE');
  assert.deepEqual(offer.pricingExperiment.arms,[29,39,59]);
  assert.equal(offer.pricingExperiment.assignmentRule,'ONE_VISIBLE_ARM_PER_ELIGIBLE_BUSINESS');
  assert.equal(offer.pricingExperiment.status,'WORKING_HYPOTHESIS_NOT_MARKET_VALIDATED');
  assert.equal(offer.productionOfferPublished,false);
  assert.equal(offer.billingActivated,false);
});

test('existing EUR29 Highlight is separate from recurring MRR proof',()=>{
  assert.equal(offer.offer.sponsoredHighlightSeparate.existingInternalLaunchCandidateEurPerEvent,29);
  assert.equal(offer.offer.sponsoredHighlightSeparate.includedInMonthlyOffer,false);
  assert.match(offer.proofAccounting.mrrDefinition,/one-off sponsored events excluded/i);
});

test('ACQ-04 never upgrades intent actions into merchant outcomes',()=>{
  for(const row of measure.eventSemantics){
    assert.equal(row.merchantOutcomeClaimAllowed,false,`${row.event} must not be a merchant outcome claim`);
  }
  const reservation=measure.eventSemantics.find(x=>x.event==='reservation_submit');
  assert.equal(reservation.tier,'HIGH_INTENT_ACTION');
  assert.match(reservation.meaning,/not a confirmed reservation/i);
});

test('merchant-confirmed outcomes require an explicit verified layer',()=>{
  const by=Object.fromEntries(measure.merchantOutcomeLadder.map(x=>[x.level,x]));
  assert.equal(by.M1_HOY_INTENT_SIGNAL.verified,false);
  assert.equal(by.M2_MERCHANT_ACKNOWLEDGED_LEAD.verified,true);
  assert.equal(by.M3_MERCHANT_CONFIRMED_TRANSACTION.verified,true);
  assert.equal(by.M4_MERCHANT_CONFIRMED_VALUE.verified,true);
  assert.equal(measure.attributionRules.merchantConfirmed.requiresVerifiedOperator,true);
  assert.equal(measure.attributionRules.merchantConfirmed.noAutomaticRevenueInference,true);
});

test('measurement remains blocked behind RT-008 and Contact Freeze',()=>{
  assert.equal(measure.status,'DESIGN_READY_NOT_LIVE');
  assert.equal(measure.productionAnalyticsActivated,false);
  assert.equal(measure.rt008ReleaseRequiredBeforeProductionCapture,true);
  assert.equal(measure.contactFreezeActive,true);
  assert.equal(measure.outreachAuthorized,false);
  assert.equal(measure.privacyAndSecurity.noPreConsentProductionPersistence,true);
  assert.equal(measure.privacyAndSecurity.productionActivationBlockedUntilRt008Release,true);
});

test('buyer-value set measures economics, outcomes, repeat, data and replication',()=>{
  const ids=new Set(measure.coreBuyerValueMetrics.map(x=>x.id));
  for(let i=1;i<=10;i++)assert.ok(ids.has(`BVM-${String(i).padStart(2,'0')}`));
  for(const required of [
    'one_off_highlight_revenue_is_not_mrr',
    'free_businesses_are_not_paying_businesses',
    'qa_or_preview_traffic_is_excluded_from_business_metrics',
    'consented_repeat_cohort_is_not_extrapolated_to_nonconsenting_users'
  ]) assert.ok(measure.antiVanityRules.includes(required));
});

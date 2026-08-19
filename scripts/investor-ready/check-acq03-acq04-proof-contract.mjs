import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const offer=readJson('docs/investor-ready/acq03-founding-paid-offer-v1.json');
const measure=readJson('docs/investor-ready/acq04-buyer-value-measurement-v1.json');
const fail=msg=>{throw new Error(`ACQ-03/04 gate: ${msg}`)};
const eq=(a,b,msg)=>{if(a!==b)fail(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)};
const has=(arr,value,msg)=>{if(!Array.isArray(arr)||!arr.includes(value))fail(`${msg}: missing ${value}`)};

// ACQ-03 must remain an internal experiment until G1/contact/legal/payment gates release it.
eq(offer.status,'INTERNAL_TEST_CANDIDATE_NOT_LIVE','offer status');
eq(offer.contactFreezeActive,true,'Contact Freeze');
eq(offer.outreachAuthorized,false,'outreach authorization');
eq(offer.termsActivated,false,'Terms activation');
eq(offer.billingActivated,false,'billing activation');
eq(offer.productionOfferPublished,false,'Production offer publication');
eq(offer.offer?.commercialModel,'MONTHLY_RECURRING_VALIDATION','commercial model');

for(const free of ['business_claim_and_verification_entry','prepared_core_data_confirmation'])has(offer.offer?.freeBaselineMustRemainFree,free,'free baseline');
for(const forbidden of ['organic_ranking_improvement','minimum_impressions','minimum_clicks','minimum_reservations','minimum_revenue','exclusivity'])has(offer.offer?.explicitlyNotPromised,forbidden,'offer no-promise boundary');

eq(offer.offer?.sponsoredHighlightSeparate?.existingInternalLaunchCandidateEurPerEvent,29,'existing Highlight internal launch candidate');
eq(offer.offer?.sponsoredHighlightSeparate?.includedInMonthlyOffer,false,'Highlight separation');
eq(offer.offer?.sponsoredHighlightSeparate?.automaticBilling,false,'Highlight automatic billing');

const arms=offer.pricingExperiment?.arms;
if(JSON.stringify(arms)!==JSON.stringify([29,39,59]))fail('pricing test arms must remain [29,39,59] until protocol is deliberately versioned');
eq(offer.pricingExperiment?.status,'WORKING_HYPOTHESIS_NOT_MARKET_VALIDATED','pricing validation status');
eq(offer.pricingExperiment?.assignmentRule,'ONE_VISIBLE_ARM_PER_ELIGIBLE_BUSINESS','price assignment rule');
eq(offer.pricingExperiment?.discountClaimAllowed,false,'discount claim boundary');

const ladder=offer.paidProofLadder||[];
const byLevel=Object.fromEntries(ladder.map(x=>[x.level,x]));
for(const l of ['P0_INTEREST','P1_SIGNED_OR_ACCEPTED','P2_INVOICED'])eq(byLevel[l]?.countsAsBp1PaidBusiness,false,`${l} paid-proof boundary`);
for(const l of ['P3_SETTLED_PAYMENT','P4_RENEWED','P5_RETAINED_90D'])eq(byLevel[l]?.countsAsBp1PaidBusiness,true,`${l} paid-proof boundary`);
eq(offer.proofAccounting?.settledPaymentRequired,true,'settled payment requirement');
eq(offer.proofAccounting?.loiCountsAsRevenue,false,'LOI revenue boundary');
eq(offer.proofAccounting?.invoiceCountsAsRevenue,false,'invoice revenue boundary');
eq(offer.proofAccounting?.freePilotCountsAsPayingBusiness,false,'free pilot boundary');
eq(offer.proofAccounting?.founderFundedOrRelatedPartyPaymentCounts,false,'related-party boundary');
if(!String(offer.proofAccounting?.mrrDefinition||'').includes('one-off sponsored events excluded'))fail('MRR definition must exclude one-off sponsored events');

const eligibility=offer.eligibilityBeforeAnyExternalTest||{};
for(const key of ['g1ContactFreezeReleased','businessTermsCounselReadyAndActivationAuthorized','invoiceAndPaymentMechanismLegallyOperational','offerScopeMatchesActuallyAvailableProductAndService','privacyMeasurementGateReadyForAnyAnalyticsClaims'])eq(eligibility[key],true,`external-test prerequisite ${key}`);

// ACQ-04 must describe a measurement protocol, not activate analytics or inflate intent into outcomes.
eq(measure.status,'DESIGN_READY_NOT_LIVE','measurement status');
eq(measure.productionAnalyticsActivated,false,'Production analytics activation');
eq(measure.rt008ReleaseRequiredBeforeProductionCapture,true,'RT-008 release dependency');
eq(measure.contactFreezeActive,true,'measurement Contact Freeze');
eq(measure.outreachAuthorized,false,'measurement outreach authorization');
eq(measure.existingRuntimeAlignment?.canonicalConsentKey,'hoy-privacy-analytics-consent-v1','canonical consent key');
eq(measure.existingRuntimeAlignment?.existingSponsoredAttributionModel,'sponsored_open_30m_same_venue','sponsored attribution model');
eq(measure.existingRuntimeAlignment?.existingSponsoredWindowMinutes,30,'sponsored attribution window');
eq(measure.existingRuntimeAlignment?.existingSponsoredSameVenueRequired,true,'same-venue sponsored rule');

const existingEvents=['profile_view','route_start','service_open','website_open','reservation_start','reservation_submit','call_click','menu_open'];
for(const e of existingEvents)has(measure.existingRuntimeAlignment?.existingQualifiedActionVocabulary,e,'existing event vocabulary');
const eventMap=Object.fromEntries((measure.eventSemantics||[]).map(x=>[x.event,x]));
for(const e of existingEvents){
  if(!eventMap[e])fail(`missing event semantics for ${e}`);
  eq(eventMap[e].merchantOutcomeClaimAllowed,false,`${e} merchant outcome boundary`);
}
eq(eventMap.reservation_submit?.tier,'HIGH_INTENT_ACTION','reservation_submit tier');
if(!String(eventMap.reservation_submit?.meaning||'').toLowerCase().includes('not a confirmed reservation'))fail('reservation_submit must explicitly reject confirmed-booking interpretation');

const outcomes=Object.fromEntries((measure.merchantOutcomeLadder||[]).map(x=>[x.level,x]));
eq(outcomes.M0_NONE?.verified,false,'M0 verified boundary');
eq(outcomes.M1_HOY_INTENT_SIGNAL?.verified,false,'M1 verified boundary');
for(const l of ['M2_MERCHANT_ACKNOWLEDGED_LEAD','M3_MERCHANT_CONFIRMED_TRANSACTION','M4_MERCHANT_CONFIRMED_VALUE'])eq(outcomes[l]?.verified,true,`${l} verification`);

eq(measure.attributionRules?.sponsored?.windowMinutes,30,'sponsored metric window');
eq(measure.attributionRules?.sponsored?.sameRestaurantRequired,true,'sponsored same restaurant');
eq(measure.attributionRules?.sponsored?.aggregatedReportingOnly,true,'sponsored aggregation');
eq(measure.attributionRules?.merchantConfirmed?.requiresVerifiedOperator,true,'verified operator outcome');
eq(measure.attributionRules?.merchantConfirmed?.noAutomaticRevenueInference,true,'automatic revenue inference');

const metrics=measure.coreBuyerValueMetrics||[];
if(metrics.length<10)fail('expected at least 10 buyer-value metrics');
const metricIds=new Set(metrics.map(x=>x.id));
for(let i=1;i<=10;i++)if(!metricIds.has(`BVM-${String(i).padStart(2,'0')}`))fail(`missing BVM-${String(i).padStart(2,'0')}`);

for(const rule of [
  'profile_views_do_not_count_as_leads',
  'clicks_do_not_count_as_bookings',
  'reservation_submit_does_not_count_as_confirmed_reservation',
  'one_off_highlight_revenue_is_not_mrr',
  'free_businesses_are_not_paying_businesses',
  'qa_or_preview_traffic_is_excluded_from_business_metrics',
  'consented_repeat_cohort_is_not_extrapolated_to_nonconsenting_users'
])has(measure.antiVanityRules,rule,'anti-vanity rule');

const privacy=measure.privacyAndSecurity||{};
for(const key of ['noPreConsentProductionPersistence','noNewRawLocalStorageAnalytics','noPreciseLocationInAnalytics','metadataPiiBlocked','consumerIdentityNotRequiredForMerchantReporting','merchantReportsAggregated','productionActivationBlockedUntilRt008Release','productionRpcCurrentlyAssumedDisabledUntilExplicitSecurityPrivacyRelease'])eq(privacy[key],true,`privacy/security ${key}`);

const sequence=measure.activationSequence||[];
for(const step of ['rt008_release_ready_and_analytics_authorized','qa_and_preview_exclusion_verified','merchant_outcome_confirmation_method_implemented_and_tested','clean_cutover_timestamp_recorded','only_then_begin_g2_measurement'])has(sequence,step,'activation sequence');

console.log('ACQ-03/04 proof contract PASS');
console.log(`Price arms: ${arms.join('/')} EUR monthly — hypothesis only`);
console.log(`Buyer-value metrics: ${metrics.length}; Production analytics active: ${measure.productionAnalyticsActivated}`);

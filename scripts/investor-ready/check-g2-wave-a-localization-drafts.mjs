import fs from 'node:fs';

const path='docs/investor-ready/g2-wave-a-en-localization-drafts-v1.json';
const d=JSON.parse(fs.readFileSync(path,'utf8'));
const fail=(ok,msg)=>{ if(!ok){ console.error(`G2 LOCALIZATION FAIL: ${msg}`); process.exit(1); } };

fail(d.status==='PRICE_NEUTRAL_LOCALIZATION_DRAFT_READY_NOT_COHORT_FROZEN','wrong status');
fail(d.candidateSelection?.count===3,'exactly three readiness candidates required');
fail(JSON.stringify(d.candidateSelection?.restaurantIds)===JSON.stringify([155,168,235]),'candidate IDs changed');
fail(d.candidateSelection?.selectionNature==='READINESS_CANDIDATES_NOT_FROZEN_COHORT','must not claim frozen cohort');
fail(d.candidateSelection?.allWereMasterReviewedAtReadOnlyCheck===true,'master-reviewed evidence required');
fail(d.candidateSelection?.allWereMasterReadyForLocalizationAtReadOnlyCheck===true,'localization-ready evidence required');
fail(d.candidateSelection?.preferredLanguage==='EN','EN localization required');
for(const key of ['productionRowsChanged','sendLocksChanged','outreachPerformed']) fail(d.candidateSelection?.[key]===false,`${key} must remain false`);

fail(d.pricingBoundary?.legacy299AnnualOfferCarriedForward===false,'legacy 299 annual offer forbidden');
fail(d.pricingBoundary?.legacyFirst20FoundingPartnerClaimCarriedForward===false,'legacy first-20 claim forbidden');
fail(d.pricingBoundary?.concreteMonthlyPriceAssigned===false,'no concrete price before cohort freeze');
fail(d.pricingBoundary?.priceArmAssignmentBeforeCohortFreezeAllowed===false,'pre-freeze price assignment forbidden');
fail(d.analyticsBoundary?.productionAnalyticsEnabled===false,'Production analytics must remain disabled');
fail(d.analyticsBoundary?.outcomeClaimsAllowed===false,'outcome claims forbidden');

fail(Array.isArray(d.drafts) && d.drafts.length===3,'three drafts required');
const legacy=/\b299\b|12\s+months|first\s+20|erste[nr]?\s+20/i;
const prematurePrice=/(?:\b29\b|\b39\b|\b59\b)\s*(?:€|EUR)|(?:€|EUR)\s*(?:29|39|59)\b/i;
for(const draft of d.drafts){
  fail(draft.language==='EN',`draft ${draft.restaurantId} must be EN`);
  fail(typeof draft.subject==='string' && draft.subject.length>5,`subject missing ${draft.restaurantId}`);
  fail(typeof draft.emailBody==='string' && draft.emailBody.length>200,`email body too short ${draft.restaurantId}`);
  fail(typeof draft.dmBody==='string' && draft.dmBody.length>80,`DM body too short ${draft.restaurantId}`);
  const all=`${draft.subject}\n${draft.emailBody}\n${draft.dmBody}`;
  fail(!legacy.test(all),`legacy annual offer leaked into ${draft.restaurantId}`);
  fail(!prematurePrice.test(all),`concrete 29/39/59 price leaked before assignment for ${draft.restaurantId}`);
  fail(/specific monthly offer/i.test(draft.emailBody),`price-neutral monthly-offer boundary missing ${draft.restaurantId}`);
  fail(/assigned and frozen before outreach/i.test(draft.emailBody),`assignment/freeze wording missing ${draft.restaurantId}`);
  fail(/privacy-safe measurement is separately approved/i.test(draft.emailBody),`conditional analytics wording missing ${draft.restaurantId}`);
  fail(!/guarantee|guaranteed revenue|guaranteed reservation/i.test(all),`guarantee wording forbidden ${draft.restaurantId}`);
}

const raw=fs.readFileSync(path,'utf8');
for(const forbidden of ['contactEmail','contactPhone','contactInstagram','contactWebsite','contactPerson']) fail(!raw.includes(`\"${forbidden}\"`),`${forbidden} must not be stored`);
fail(d.claimBoundary?.theseDraftsAreSendAuthorized===false,'drafts cannot authorize sending');
fail(d.claimBoundary?.theseDraftsFreezeTheCohort===false,'drafts cannot freeze cohort');
fail(d.claimBoundary?.theseDraftsAssignPriceArms===false,'drafts cannot assign price arms');
fail(d.claimBoundary?.theseDraftsProveDemand===false,'drafts cannot prove demand');
fail(d.claimBoundary?.theseDraftsProvePayment===false,'drafts cannot prove payment');
fail(d.claimBoundary?.contactValuesIncluded===false,'contact values must remain excluded');
fail(d.claimBoundary?.personalContactNamesIncluded===false,'personal contact names must remain excluded');

console.log('G2 Wave A EN localization drafts: PASS');

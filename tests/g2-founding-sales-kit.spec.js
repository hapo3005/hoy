const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const c=JSON.parse(fs.readFileSync('docs/investor-ready/g2-founding-sales-kit-v1.json','utf8'));

test('G2 stays readiness-only while Contact Freeze is active',()=>{
  assert.equal(c.status,'READY_NOT_AUTHORIZED');
  assert.equal(c.authority.contactFreeze,'ACTIVE');
  assert.equal(c.authority.outreachPerformed,false);
  assert.equal(c.authority.outreachAuthorized,false);
  assert.equal(c.authority.sendAuthorized,false);
  assert.equal(c.authority.termsActivationAuthorized,false);
  assert.equal(c.authority.billingLive,false);
  assert.equal(c.authority.productionAnalyticsEnabled,false);
});

test('Region 1 is the complete defined Mar Menor scope',()=>{
  assert.equal(c.region1.areas.length,9);
  assert.equal(c.region1.scopeRule,'FULL_DEFINED_MAR_MENOR_REGION_NOT_LA_MANGA_CABO_ONLY');
  assert.ok(c.region1.areas.includes('Los Alcázares / Los Narejos'));
  assert.ok(c.region1.areas.includes('San Pedro del Pinatar / Lo Pagán'));
  assert.ok(c.region1.areas.includes('Santiago de la Ribera / San Javier'));
});

test('Wave A cannot be frozen from insufficient strict readiness',()=>{
  assert.equal(c.waveA.targetBusinesses,18);
  assert.equal(c.waveA.targetPerArm,6);
  assert.equal(c.waveA.strictReadyNow,15);
  assert.equal(c.waveA.minimumAdditionalStrictReadyNeeded,3);
  assert.equal(c.waveA.cohortStatus,'COHORT_NOT_FROZEN');
});

test('price test is auditable and not a three-choice menu',()=>{
  assert.deepEqual(c.priceExperiment.arms,[29,39,59]);
  assert.equal(c.priceExperiment.status,'WORKING_HYPOTHESIS_NOT_MARKET_VALIDATED');
  assert.equal(c.priceExperiment.exactlyOneVisiblePricePerBusiness,true);
  assert.equal(c.priceExperiment.showThreePriceChoice,false);
  assert.equal(c.priceExperiment.assignment.freezeBeforeFirstOutreach,true);
  assert.equal(c.priceExperiment.oneOffHighlight.countAsMRR,false);
});

test('only settled external money creates paying-business proof',()=>{
  assert.equal(c.paidProof.interestCountsAsPaid,false);
  assert.equal(c.paidProof.loiCountsAsPaid,false);
  assert.equal(c.paidProof.signatureCountsAsPaid,false);
  assert.equal(c.paidProof.invoiceCountsAsPaid,false);
  assert.equal(c.paidProof.settledExternalPaymentCountsAsPaid,true);
  assert.equal(c.paidProof.secondSeparateSettledPaymentCountsAsRenewal,true);
});

test('all launch prerequisites remain unmet until separate release',()=>{
  assert.equal(c.launchPrerequisites.length,8);
  assert.ok(c.launchPrerequisites.every(x=>x.required && !x.met));
});

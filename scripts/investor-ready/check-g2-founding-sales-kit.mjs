import fs from 'node:fs';

const contractPath='docs/investor-ready/g2-founding-sales-kit-v1.json';
const mdPath='docs/investor-ready/g2-founding-sales-kit-v1.md';
const sqlPath='scripts/investor-ready/g2-founding-cohort-readiness.sql';

const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
const md=fs.readFileSync(mdPath,'utf8');
const sql=fs.readFileSync(sqlPath,'utf8');
const fail=(ok,msg)=>{ if(!ok){ console.error(`G2 SALES KIT FAIL: ${msg}`); process.exit(1); } };

const expectedAreas=[
  'Cabo de Palos',
  'La Manga Club / Atamaría',
  'La Manga del Mar Menor',
  'Los Alcázares / Los Narejos',
  'Los Belones',
  'Los Urrutias / Estrella de Mar / Los Nietos',
  'Mar de Cristal / Islas Menores',
  'San Pedro del Pinatar / Lo Pagán',
  'Santiago de la Ribera / San Javier'
];

fail(contract.status==='READY_NOT_AUTHORIZED','status must remain READY_NOT_AUTHORIZED');
fail(contract.authority.contactFreeze==='ACTIVE','Contact Freeze must remain ACTIVE');
for(const key of ['outreachPerformed','outreachAuthorized','sendAuthorized','termsActivationAuthorized','billingLive','productionAnalyticsEnabled','productionMutationPerformed']){
  fail(contract.authority[key]===false,`${key} must remain false`);
}

fail(contract.region1.scopeRule==='FULL_DEFINED_MAR_MENOR_REGION_NOT_LA_MANGA_CABO_ONLY','Region 1 may not narrow to La Manga/Cabo');
fail(JSON.stringify(contract.region1.areas)===JSON.stringify(expectedAreas),'exact 9-area Mar Menor scope required');
fail(contract.readOnlyReadinessSnapshot.publishedRegion1===166,'read-only Region 1 published baseline must remain 166 until a dated recheck explicitly updates evidence');
fail(contract.readOnlyReadinessSnapshot.sendLocked===166,'all 166 must remain send-locked in current evidence');
fail(contract.readOnlyReadinessSnapshot.sendAuthorized===0,'no send authorization may be claimed');

fail(contract.waveA.targetBusinesses===18 && contract.waveA.targetPerArm===6,'Wave A must be 18 / 6 per arm internal target');
fail(contract.waveA.thresholdNature==='INTERNAL_EXPERIMENT_SIZE_NOT_MARKET_STANDARD','Wave A threshold disclaimer missing');
fail(contract.waveA.cohortStatus==='COHORT_NOT_FROZEN','cohort must not be frozen yet');
fail(contract.waveA.strictReadyNow===15,'current strict-ready aggregate must remain 15 until explicit read-only recheck');
fail(contract.waveA.minimumAdditionalStrictReadyNeeded===3,'readiness gap must be 3');
fail(contract.waveA.eligibility.includes('master_reviewed') && contract.waveA.eligibility.includes('master_ready'),'master review/readiness required');

fail(JSON.stringify(contract.priceExperiment.arms)===JSON.stringify([29,39,59]),'price arms must be 29/39/59');
fail(contract.priceExperiment.status==='WORKING_HYPOTHESIS_NOT_MARKET_VALIDATED','prices must remain hypotheses');
fail(contract.priceExperiment.exactlyOneVisiblePricePerBusiness===true,'exactly one price visible per business');
fail(contract.priceExperiment.showThreePriceChoice===false,'three-price choice must remain disabled');
fail(contract.priceExperiment.assignment.status==='NOT_ASSIGNED_UNTIL_COHORT_FREEZE','no price assignment before cohort freeze');
fail(contract.priceExperiment.assignment.freezeBeforeFirstOutreach===true,'price assignment must freeze before outreach');
fail(contract.priceExperiment.oneOffHighlight.countAsMRR===false,'one-off Highlight must never count as MRR');

fail(contract.launchPrerequisites.length===8,'eight launch prerequisites required');
fail(contract.launchPrerequisites.every(x=>x.required===true && x.met===false),'all launch prerequisites must remain required and currently unmet');

fail(contract.paidProof.settledExternalPaymentCountsAsPaid===true,'settled external payment is the paid-proof boundary');
for(const key of ['interestCountsAsPaid','loiCountsAsPaid','signatureCountsAsPaid','invoiceCountsAsPaid']) fail(contract.paidProof[key]===false,`${key} must be false`);
fail(contract.paidProof.secondSeparateSettledPaymentCountsAsRenewal===true,'renewal requires second settled payment');

const expectedFunnel=['eligible','authorized_contacted','offer_delivered','accepted','invoice_issued_not_paid','settled_payment','renewal','paid_retained_90d'];
fail(JSON.stringify(contract.funnel)===JSON.stringify(expectedFunnel),'funnel ordering/semantics changed');
const expectedReject=['NO_NEED','PRICE_TOO_HIGH','TIMING','NO_TRUST','PREFERS_FREE','NO_AUTHORITY','PRODUCT_GAP','OTHER_STRUCTURED'];
fail(JSON.stringify(contract.rejectionCodes)===JSON.stringify(expectedReject),'structured rejection taxonomy changed');

for(const phrase of ['READY_NOT_AUTHORIZED','COHORT_NOT_FROZEN','29 EUR / Monat','39 EUR / Monat','59 EUR / Monat','niemals als MRR','keine bestätigte Transaktion']) fail(md.includes(phrase),`documentation missing: ${phrase}`);

const sqlNoComments=sql.replace(/--.*$/gm,'');
fail(/^\s*with\b/i.test(sqlNoComments),'readiness audit must be SELECT/CTE only');
fail(!/\b(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke)\b/i.test(sqlNoComments),'readiness audit contains mutation/DDL');
fail(expectedAreas.every(area=>sql.includes(`'${area.replaceAll("'","''")}'`)),'SQL must cover all 9 Region-1 areas');
fail(!/contact_person/i.test(sql),'readiness SQL must not touch contact-person identity');

console.log('G2 Founding Sales Kit v1.0: PASS');

import fs from 'node:fs';

const contractPath='docs/investor-ready/acq09-cat05-first-party-proof-v1.json';
const sqlPath='scripts/investor-ready/acq09-cat05-first-party-proof-audit.sql';
const runtimePath='operator-data-confirmation-2.29.js';
const freshnessPath='merchant-truth-freshness-2.50.js';

const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
const sql=fs.readFileSync(sqlPath,'utf8');
const runtime=fs.readFileSync(runtimePath,'utf8');
const freshness=fs.readFileSync(freshnessPath,'utf8');
const fail=m=>{throw new Error(`HOY ACQ-09 CAT-05 gate: ${m}`)};
const assert=(x,m)=>{if(!x)fail(m)};

assert(contract.schemaVersion==='1.0.0','schemaVersion must remain 1.0.0');
assert(contract.status==='TECHNICALLY_READY_OPERATIONAL_PROOF_NOT_STARTED','status must remain bounded');
assert(contract.verifiedAt==='2026-08-21','baseline date must remain explicit');

const b=contract.claimBoundary||{};
for(const key of [
  'outreachAuthorized','productionMutationAuthorizedByThisArtifact','fakeOperatorConfirmationAllowed',
  'researchFreshnessEqualsOperatorConfirmation','factualConfirmationEqualsRightsClearance',
  'factualConfirmationEqualsPaidProof','singleConfirmationEqualsRecurringProof','singleBusinessEqualsMarketProof'
]) assert(b[key]===false,`${key} must remain false`);
assert(b.contactFreezeActive===true,'contact freeze must remain active');
assert(b.rightsReceiptRequiredForFreeFactualConfirmation===false,'free F1 must not require rights receipt');
assert(b.rightsReceiptCandidateIsSeparateFromCat05FreshnessProof===true,'R1 candidate must remain separate from CAT-05 freshness proof');

const baseline=contract.productionBaseline||{};
assert(baseline.publishedGastroBusinesses===180,'published baseline drift requires dated refresh');
assert(baseline.preparedWeeklyHoursBusinesses===25,'prepared-hours baseline drift requires dated refresh');
assert(baseline.restaurantMemberships===0 && baseline.verifiedMemberships===0 && baseline.verifiedBusinesses===0,'must not invent merchant membership proof');
assert(baseline.liveHoursConfirmed===0 && baseline.servicesConfirmed===0 && baseline.accessibilityOperatorConfirmed===0,'must not invent first-party confirmation proof');
assert(baseline.activeBusinessTermsVersions===0 && baseline.businessTermsAcceptances===0 && baseline.rightsBackedBusinessConfirmations===0,'must not invent rights-backed proof');

const paths=contract.existingFactualConfirmationPaths||[];
assert(paths.some(x=>x.fieldFamily==='weekly_hours'&&x.status==='IMPLEMENTED_MAIN'&&x.proofTimestamp==='confirmed_at'),'weekly-hours F1 path required');
assert(paths.every(x=>x.rightsClaim==='NONE_FROM_F1_ALONE'),'F1 paths may not imply rights');

const ladder=contract.proofLadder||[];
assert(ladder.map(x=>x.id).join(',')==='FPC0,FPC1,FPC2,FPC3,FPC4','FPC0..FPC4 ladder required');
assert(ladder[0].status==='PASS','only technical FPC0 may initially pass');
assert(ladder.slice(1).every(x=>x.status==='NOT_PROVEN'),'FPC1..FPC4 must remain NOT_PROVEN until real external behavior exists');
assert(/five independent external businesses/i.test(ladder.find(x=>x.id==='FPC2')?.workingGate||''),'FPC2 multi-merchant threshold required');
assert(/second genuine confirmation cycle/i.test(ladder.find(x=>x.id==='FPC3')?.workingGate||''),'FPC3 reconfirmation definition required');
assert(/30 consecutive days/i.test(ladder.find(x=>x.id==='FPC4')?.workingGate||'') && /80%/.test(ladder.find(x=>x.id==='FPC4')?.workingGate||''),'FPC4 operating threshold required');

const metrics=new Set((contract.metricDefinitions||[]).map(x=>x.id));
for(const id of ['merchant_factual_confirmation_coverage','confirmation_freshness_within_sla','merchant_reconfirmation_rate'])assert(metrics.has(id),`missing metric ${id}`);

assert(/begin transaction read only;/i.test(sql),'audit must start read-only');
assert(/rollback;/i.test(sql),'audit must end rollback');
assert(!/\b(insert|update|delete|merge|truncate|alter|drop|create\s+table|create\s+function)\b/i.test(sql),'audit must not contain mutation/DDL');
assert(/BLOCKED_NO_VERIFIED_MEMBERSHIP/.test(sql),'queue must expose membership blocker');
assert(/READY_FOR_GENUINE_FIRST_CONFIRMATION/.test(sql),'queue must distinguish genuine first confirmation readiness');
assert(/RECONFIRMATION_DUE/.test(sql),'queue must expose reconfirmation state');

assert(/operator-hours-confirm/.test(runtime),'existing verified hours-confirm function invocation required');
assert(/action,restaurant_id/.test(runtime),'existing operator confirmation payload required');
assert(/STALE_AFTER_DAYS=30/.test(freshness),'CAT-02 30-day operator-hours freshness owner required');
assert(/fresh\.isToday/.test(freshness),'same-day freshness semantics required');
assert(/fallbackFromStaleOperator/.test(freshness),'stale operator fallback required');

const serialized=JSON.stringify(contract);
assert(!/competitive advantage (is )?proven/i.test(serialized),'must not claim competitive advantage');
assert(!/product.market fit (is )?proven/i.test(serialized),'must not claim PMF');

console.log('HOY ACQ-09 CAT-05 First-Party Proof v1: PASS');
console.log(`proof=${ladder.map(x=>`${x.id}:${x.status}`).join(',')}; verifiedBusinesses=${baseline.verifiedBusinesses}; liveHoursConfirmed=${baseline.liveHoursConfirmed}`);

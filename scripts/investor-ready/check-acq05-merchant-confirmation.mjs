import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const contract=JSON.parse(read('docs/investor-ready/acq05-merchant-first-party-confirmation-v1.json'));
const md=read('docs/investor-ready/acq05-merchant-first-party-confirmation-v1.md');
const runtime=read('merchant-confirmation-receipt-2.48.js');
const operator=read('operator-data-confirmation-2.29.js');
const index=read('index.html');
const sw=read('service-worker.js');
const audit=read('scripts/investor-ready/acq05-business-confirmation-readiness-audit.sql');

const fail=msg=>{throw new Error(`ACQ-05 gate: ${msg}`)};
const need=(ok,msg)=>{if(!ok)fail(msg)};

need(contract.schemaVersion==='1.0.0','schema version drift');
need(contract.status==='IMPLEMENTED_CANDIDATE_NOT_LIVE','status must remain candidate/not live');
need(contract.claimBoundary?.contactFreezeActive===true,'Contact Freeze must stay active');
need(contract.claimBoundary?.outreachAuthorized===false,'outreach must remain unauthorized');
need(contract.claimBoundary?.productionDmlDdlAuthorized===false,'Production DML/DDL must remain unauthorized');
need(contract.claimBoundary?.businessTermsActivationAuthorized===false,'Business Terms activation must remain unauthorized');
need(contract.claimBoundary?.factualConfirmationImpliesRightsClearance===false,'factual confirmation must not imply rights clearance');
need(contract.claimBoundary?.rightsBackedConfirmationImpliesWholeProfileTransferClearance===false,'R1 must not imply whole-profile clearance');
need(contract.claimBoundary?.rightsReceiptRequiresActiveAcceptedBusinessTerms===true,'R1 must require active accepted Business Terms');

const baseline=contract.liveReadOnlyBaseline||{};
for(const [key,value] of Object.entries({activeTermsVersions:0,activeTermsAcceptances:0,businessDataConfirmations:0,activeBusinessDataConfirmations:0,liveHoursConfirmed:0,servicesConfirmed:0,profileChangeRequests:0,profileChangeApproved:0})){
  need(baseline[key]===value,`baseline ${key} must remain read-only zero snapshot`);
}
need(baseline.mutationPerformedByAcq05===false,'ACQ-05 must not claim a Production mutation');

const levels=new Map((contract.twoLayerConfirmationModel||[]).map(x=>[x.level,x]));
need(levels.has('F1_FACTUAL_OPERATOR_CONFIRMATION'),'missing F1');
need(levels.has('R1_RIGHTS_BACKED_CONFIRMATION_RECEIPT'),'missing R1');
need(levels.get('F1_FACTUAL_OPERATOR_CONFIRMATION')?.requiresActiveBusinessTerms===false,'F1 must stay independent of commercial terms');
need(levels.get('F1_FACTUAL_OPERATOR_CONFIRMATION')?.createsRightsReceipt===false,'F1 must not create a rights claim by itself');
need(levels.get('R1_RIGHTS_BACKED_CONFIRMATION_RECEIPT')?.requiresAcceptedTermsReceipt===true,'R1 must require a terms receipt');
need(levels.get('R1_RIGHTS_BACKED_CONFIRMATION_RECEIPT')?.createsRightsReceipt===true,'R1 must be the explicit rights receipt layer');

const ref=contract.referenceImplementation||{};
need(ref.scope==='WEEKLY_HOURS_ONLY','v1 reference scope must stay weekly-hours only');
need(ref.hash==='SHA-256','payload hash must be SHA-256');
need(ref.sourceChannel==='operator_dashboard','source channel must be fixed operator_dashboard');
need(ref.recordAttemptOnlyAfterSuccessfulFactualConfirmation===true,'receipt may only follow factual success');
need(ref.recordAttemptOnlyWhenTermsGateConfiguredAndAccepted===true,'receipt may only run after terms acceptance');
need(ref.receiptFailureBlocksFreeFactualConfirmation===false,'rights receipt failure must not block free factual correction');
need(ref.rawPiiAllowedInEvidence===false,'raw PII must not be allowed in evidence');

const kpis=new Map((contract.coverageMetrics||[]).map(x=>[x.name,x]));
for(const name of ['merchant_factual_confirmation_coverage','rights_backed_confirmation_coverage','confirmation_freshness_within_sla'])need(kpis.has(name),`missing coverage KPI ${name}`);
need(kpis.get('merchant_factual_confirmation_coverage')?.rightsMeaning==='none beyond factual confirmation','factual KPI rights meaning drift');
need(/terms-linked exact-subject receipt only/i.test(kpis.get('rights_backed_confirmation_coverage')?.rightsMeaning||''),'R1 KPI must stay exact-subject only');

for(const rule of ['FACTUAL_CONFIRMATION_IS_NOT_RIGHTS_CLEARANCE','RIGHTS_RECEIPT_IS_NOT_WHOLE_PROFILE_TRANSFER_CLEARANCE','TERMS_ACCEPTANCE_IS_NOT_PAYMENT_PROOF','STALE_CONFIRMATION_IS_NOT_CURRENT_DATA','NO_TERMS_GATE_MEANS_NO_RIGHTS_RECEIPT']){
  need((contract.antiOverclaimRules||[]).includes(rule),`missing anti-overclaim rule ${rule}`);
}

need(runtime.includes("rpc('get_business_terms_status'"),'runtime must read current Terms status');
need(runtime.includes("rpc('operator_record_business_confirmation'"),'runtime must use canonical confirmation RPC');
need(runtime.includes("crypto.subtle.digest('SHA-256'"),'runtime must SHA-256 canonical payload');
need(runtime.includes("p_source_channel:'operator_dashboard'"),'runtime source channel must be fixed');
need(runtime.includes("terms?.gate_configured!==true"),'runtime must fail closed when Terms gate inactive');
need(runtime.includes("terms?.status!=='accepted'"),'runtime must fail closed when Terms unaccepted');
need(runtime.includes('PII_KEY'),'runtime must contain client evidence minimization');
need(runtime.includes("return {recorded:false,reason:'receipt_write_failed'}"),'receipt failure must return fail-closed non-recorded state');

need(operator.includes('hoyRecordRightsBackedBusinessConfirmation248'),'factual operator flow must hook the R1 helper');
need(operator.includes("confirmationType:'hours'"),'operator hook must stay hours-specific');
need(operator.includes("subjectType:'restaurant_live_hours'"),'operator hook subject type drift');
need(operator.includes('result?.live_hours'),'operator hook must use successful server response payload');

need(index.includes('<script src="merchant-confirmation-receipt-2.48.js?v=2.48.0"></script>'),'runtime helper must be loaded by app shell');
need(sw.includes("'./merchant-confirmation-receipt-2.48.js'"),'runtime helper must be in PWA core');

const stripped=audit.replace(/--.*$/gm,'').toLowerCase();
for(const forbidden of [' insert ',' update ',' delete ',' create ',' alter ',' drop ',' truncate ',' grant ',' revoke ',' call ',' do ']){
  need(!` ${stripped} `.includes(forbidden),`readiness audit contains forbidden mutation token ${forbidden.trim()}`);
}
need((stripped.match(/\bselect\b/g)||[]).length>=4,'readiness audit must contain the expected read-only checks');

need(/F1.*factual operator confirmation/i.test(md),'documentation must explain F1');
need(/R1.*rights-backed confirmation receipt/i.test(md),'documentation must explain R1');
need(/does not mean.*transferable rights/i.test(md),'documentation must reject factual→rights inference');
need(/No Business Terms activation, Production DML\/DDL/i.test(md),'documentation must retain release boundary');

console.log('ACQ-05 merchant confirmation gate: GREEN');

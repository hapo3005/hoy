const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
const rel={
  runbook:'docs/investor-ready/platform-transfer-runbook.md',
  onboarding:'docs/investor-ready/vertical-onboarding-contract.json',
  independence:'docs/investor-ready/founder-independence-acceptance.json',
  core:'platform-core/consumer-contract.json'
};
const fail=msg=>{throw new Error(msg)};
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

for(const p of Object.values(rel)){
  const full=path.join(ROOT,p);
  if(!fs.existsSync(full)||fs.statSync(full).size<200)fail(`Transfer artifact missing or unexpectedly small: ${p}`);
}

let onboarding,acceptance,core;
try{onboarding=JSON.parse(read(rel.onboarding))}catch(err){fail(`Vertical onboarding contract invalid JSON: ${err.message}`)}
try{acceptance=JSON.parse(read(rel.independence))}catch(err){fail(`Founder-independence acceptance invalid JSON: ${err.message}`)}
try{core=JSON.parse(read(rel.core))}catch(err){fail(`Platform consumer contract invalid JSON: ${err.message}`)}

if(onboarding.contract!=='HOY-VERTICAL-ONBOARD-1.0')fail('Unexpected vertical onboarding contract version');
if(onboarding.platformCore?.version!==core.coreVersion||onboarding.platformCore?.contract!==core.contractVersion){
  fail('Vertical onboarding contract is not pinned to the current Platform Core contract');
}

const stageIds=new Set((onboarding.requiredStages||[]).map(s=>s.id));
for(const id of ['VO-01','VO-02','VO-03','VO-04','VO-05','VO-06','VO-07'])if(!stageIds.has(id))fail(`Missing required onboarding stage ${id}`);
const invariants=new Set(onboarding.hardInvariants||[]);
for(const invariant of [
  'truth_and_verification_are_separate',
  'unknown_missing_stale_disputed_external_evidence_is_not_confirmed_truth',
  'confirmed_failed_must_cannot_be_rescued_by_prefer',
  'safety_is_a_hard_gate',
  'commercial_placement_cannot_change_organic_score_or_rank',
  'vertical_adapter_may_be_stricter_but_may_not_weaken_platform_core'
])if(!invariants.has(invariant))fail(`Onboarding contract lost hard invariant: ${invariant}`);

const allowed=new Set(acceptance.allowedStatuses||[]);
for(const s of ['NOT_TESTED','IN_PROGRESS','PASS','FAIL'])if(!allowed.has(s))fail(`Founder-independence status enum missing ${s}`);
if(!allowed.has(acceptance.overallStatus))fail(`Invalid founder-independence overall status: ${acceptance.overallStatus}`);
const criteria=acceptance.criteria||[];
if(criteria.length<9)fail('Founder-independence acceptance has fewer than 9 criteria');
const ids=new Set();
for(const c of criteria){
  if(!c.id||!c.name||!c.expectedOutcome)fail('Founder-independence criterion missing id/name/outcome');
  if(ids.has(c.id))fail(`Duplicate founder-independence criterion ${c.id}`);
  ids.add(c.id);
  if(!allowed.has(c.status))fail(`Invalid criterion status ${c.id}: ${c.status}`);
  if(!Array.isArray(c.evidence))fail(`Criterion evidence must be an array: ${c.id}`);
  if(c.status==='PASS'&&c.evidence.length===0)fail(`PASS criterion has no evidence: ${c.id}`);
}
for(const id of ['FI-01','FI-02','FI-03','FI-04','FI-05','FI-06','FI-07','FI-08','FI-09'])if(!ids.has(id))fail(`Missing founder-independence criterion ${id}`);

if(acceptance.overallStatus==='PASS'){
  if(acceptance.executor?.isFounder!==false)fail('Founder-independence PASS requires a non-founder executor');
  if(!String(acceptance.executor?.role||'').trim()||!String(acceptance.executor?.executedAt||'').trim())fail('Founder-independence PASS requires executor role and execution date');
  for(const c of criteria.filter(c=>c.required!==false))if(c.status!=='PASS')fail(`Overall PASS but required criterion is not PASS: ${c.id}`);
}

const runbook=read(rel.runbook);
for(const phrase of [
  'It does **not** claim that HOY is already fully founder-independent.',
  'Platform Core release procedure',
  'Rollback procedure',
  'New vertical onboarding procedure',
  'Founder-independence acceptance drill',
  'production database migrations',
  'source-rights',
  'market gates'
])if(!runbook.includes(phrase))fail(`Transfer runbook lost required boundary/process: ${phrase}`);

console.log(JSON.stringify({
  ok:true,
  onboardingContract:onboarding.contract,
  onboardingStages:onboarding.requiredStages.length,
  founderIndependenceTest:acceptance.testId,
  founderIndependenceStatus:acceptance.overallStatus,
  criteria:criteria.length
},null,2));

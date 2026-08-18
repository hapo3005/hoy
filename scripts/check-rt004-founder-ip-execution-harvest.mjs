import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const fail=message=>{throw new Error(`RT-004 founder IP harvest failed: ${message}`)};
const gitBlobSha=buffer=>{
  const header=Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(Buffer.concat([header,buffer])).digest('hex');
};
const expected={
  'data/ir-02a-founder-ip-schedule-2026-08-18.json':'f68275a6565ce5172de13e4365fe8e782695cfcc',
  'docs/IR-02A_FOUNDER_IP_ASSIGNMENT_DRAFT.md':'e5bf95407781f85e6dab41229c20c1d2c7ae9d87',
  'docs/IR-02A_FOUNDER_IP_OWNERSHIP_DECLARATION_DRAFT.md':'480443a96c0454af59ef8e4ea9463ef9472e848a',
  'docs/IR-02A_CHAIN_OF_TITLE_EVIDENCE.md':'4ddbb12c37bbc865af632a4a41c959c1eecfe127'
};
for(const [rel,sha] of Object.entries(expected)){
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs))fail(`missing preserved historical asset: ${rel}`);
  const actual=gitBlobSha(fs.readFileSync(abs));
  if(actual!==sha)fail(`historical asset drift: ${rel}; expected ${sha}, got ${actual}`);
}

const historical=JSON.parse(fs.readFileSync(path.join(root,'data/ir-02a-founder-ip-schedule-2026-08-18.json'),'utf8'));
if(historical.status!=='assignment_schedule_prepared_execution_pending')fail('historical schedule must remain execution-pending');
if(!historical.repositories.every(repo=>repo.assignment_status==='ASSIGNMENT_REQUIRED'))fail('historical repository assets must remain assignment-required');
if(!historical.repositories.every(repo=>repo.census_status==='PARTIAL_SAMPLE_NOT_FULL_HISTORY'))fail('historical partial-census field changed; preserve it as historical evidence rather than rewriting');

const current=JSON.parse(fs.readFileSync(path.join(root,'data/rt004-founder-ip-execution-register-2026-08-19.json'),'utf8'));
if(current.status!=='EXECUTION_PENDING')fail('current founder IP execution state must remain pending');
if(current.currentContributorEvidence.canonicalPr!==104||current.currentContributorEvidence.status!=='TECHNICAL_CENSUS_GREEN')fail('current contributor evidence must point to RT-004 PR #104');
if(current.currentContributorEvidence.externalHumanContributorIdentified!==false||current.currentContributorEvidence.reviewRequiredIdentityCount!==0)fail('contributor evidence summary drifted');

for(const [key,value] of Object.entries(current.executionState)){
  if(key==='finalCompanyEntity'){
    if(value!==null)fail('final company entity must remain unresolved in this technical harvest candidate');
  }else if(value!==false){
    fail(`execution state ${key} must remain false until separately evidenced`);
  }
}
if(current.boundaries.ipTransferAuthorized!==false||current.boundaries.companyFormationAuthorized!==false||current.boundaries.outreachAuthorized!==false)fail('harvest candidate must not authorize execution/outreach');
if(!String(current.claimBoundary.forbidden||'').includes('already owned by a HOY company'))fail('company-ownership overclaim guard missing');

console.log(JSON.stringify({
  ok:true,
  preservedExactBlobs:Object.keys(expected).length,
  contributorCensus:'GREEN_REFERENCE_PR_104',
  founderCompanyExecution:'PENDING',
  ipTransferAuthorized:false
},null,2));

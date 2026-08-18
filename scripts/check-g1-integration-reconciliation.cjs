const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
const registerPath=path.join(ROOT,'docs/investor-ready/g1-integration-reconciliation.json');
const narrativePath=path.join(ROOT,'docs/investor-ready/g1-integration-reconciliation.md');
const fail=msg=>{throw new Error(msg)};

if(!fs.existsSync(registerPath))fail('G1 integration reconciliation register missing');
if(!fs.existsSync(narrativePath))fail('G1 integration reconciliation narrative missing');

const register=JSON.parse(fs.readFileSync(registerPath,'utf8'));
const narrative=fs.readFileSync(narrativePath,'utf8');

if(register.schemaVersion!=='1.0.0')fail('Unexpected G1 reconciliation schema version');
if(!['IN_PROGRESS','DONE'].includes(register.overallStatus))fail(`Unsupported overallStatus: ${register.overallStatus}`);

const dispositions=new Map((register.dispositions||[]).map(item=>[Number(item.pr),item]));
for(const pr of [102,103,104,105,106,107,108,109,115,116,117]){
  if(!dispositions.has(pr))fail(`Missing disposition for PR #${pr}`);
}

const forbiddenWholesale=new Map([
  [102,'REFERENCE_HARVEST_ONLY'],
  [105,'SPLIT_RT005_ONLY'],
  [107,'COMPOSE_PRIVACY_SURVIVOR'],
  [109,'HARVEST_PRIVACY_API_TESTS']
]);
for(const [pr,expected] of forbiddenWholesale){
  const item=dispositions.get(pr);
  if(item.disposition!==expected)fail(`PR #${pr} disposition drifted: expected ${expected}`);
  if(item.mergeWhole!==false)fail(`PR #${pr} must never be wholesale-merge authorized`);
}

if(Number(register.canonical?.rt006TechnicalDdPr)!==116)fail('RT-006 canonical survivor must remain PR #116 until explicitly superseded by a later clean current-main candidate');
if(register.canonical?.privacyFinalPr!==null)fail('Privacy final PR must remain null until a composed #107/#109 successor actually exists');
if(register.canonical?.rt005FinalPr!==null)fail('RT-005 final PR must remain null until a clean RT-005-only successor actually exists');

const overlaps=new Map((register.materialOverlaps||[]).map(item=>[item.id,item]));
for(const id of ['OV-105-116','OV-107-109','OV-102-FOCUSED']){
  const item=overlaps.get(id);
  if(!item)fail(`Missing material overlap ${id}`);
  if(!Array.isArray(item.paths)||item.paths.length===0)fail(`Overlap ${id} has no paths/surface evidence`);
  if(!String(item.resolution||'').trim())fail(`Overlap ${id} has no resolution`);
}

const rt006Overlap=overlaps.get('OV-105-116');
for(const requiredPath of ['package-lock.json','.github/workflows/pr-browser-qa.yml','.github/workflows/pr-critical-qa.yml','.github/workflows/pr-final-release-qa.yml']){
  if(!rt006Overlap.paths.includes(requiredPath))fail(`RT-006 overlap lost critical path ${requiredPath}`);
}

const privacyOverlap=overlaps.get('OV-107-109');
if(!privacyOverlap.paths.includes('analytics-rpc-1.8.1.js'))fail('Privacy overlap must track analytics-rpc-1.8.1.js');

const successors=register.requiredSuccessors||[];
if(successors.length<5)fail('Required successor set unexpectedly small');
for(const item of successors){
  if(!item.id||!item.status||!item.purpose)fail('Malformed required successor');
  if(!['MISSING','IN_PROGRESS','COMPLETE'].includes(item.status))fail(`Unsupported successor status for ${item.id}: ${item.status}`);
}

const incomplete=successors.filter(item=>item.status!=='COMPLETE');
if(register.overallStatus==='DONE'&&incomplete.length){
  fail(`G1 integration reconciliation cannot be DONE while successors remain incomplete: ${incomplete.map(x=>x.id).join(', ')}`);
}

for(const phrase of [
  'No broad Investor-Ready branch is merged merely because it is green.',
  'DO NOT MERGE WHOLE',
  'COMPOSE REQUIRED',
  'REFERENCE / HARVEST ONLY / NEVER MERGE WHOLE',
  'one control → one survivor → one exact state → one evidence package → one visible closing status.'
]){
  if(!narrative.includes(phrase))fail(`Reconciliation narrative lost mandatory guardrail: ${phrase}`);
}

console.log(JSON.stringify({
  ok:true,
  overallStatus:register.overallStatus,
  dispositions:dispositions.size,
  overlaps:overlaps.size,
  requiredSuccessors:successors.length,
  incompleteSuccessors:incomplete.map(x=>x.id)
},null,2));

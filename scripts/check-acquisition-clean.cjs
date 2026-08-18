const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
const registerPath=path.join(ROOT,'docs/investor-ready/g1-acquisition-clean-register.json');
const masterPath=path.join(ROOT,'docs/investor-ready/g1-acquisition-clean-master.md');
const fail=msg=>{throw new Error(msg)};

for(const file of [registerPath,masterPath]){
  if(!fs.existsSync(file)||fs.statSync(file).size<300)fail(`G1 artifact missing or unexpectedly small: ${path.relative(ROOT,file)}`);
}

let reg;
try{reg=JSON.parse(fs.readFileSync(registerPath,'utf8'))}catch(err){fail(`G1 register invalid JSON: ${err.message}`)}

if(reg.gate!=='G1_ACQUISITION_CLEAN')fail('Unexpected G1 gate identifier');
if(reg.schemaVersion!=='1.1.0')fail(`Unexpected G1 schema version: ${reg.schemaVersion}`);
const allowed=new Set(reg.statusEnum||[]);
for(const s of ['DONE','GREEN_CANDIDATE','IN_PROGRESS','BLOCKED','REFERENCE_ONLY'])if(!allowed.has(s))fail(`G1 status enum missing ${s}`);
if(!allowed.has(reg.overallStatus))fail(`Unsupported overall G1 status: ${reg.overallStatus}`);
if(!Array.isArray(reg.items)||!reg.items.length)fail('G1 register contains no items');

const ids=new Set();
for(const item of reg.items){
  if(!item.id||!item.topic||!item.status)fail('G1 item missing id/topic/status');
  if(ids.has(item.id))fail(`Duplicate G1 id: ${item.id}`);
  ids.add(item.id);
  if(!allowed.has(item.status))fail(`Unsupported G1 item status ${item.id}: ${item.status}`);
  if(!Array.isArray(item.canonical)||item.canonical.length===0)fail(`G1 item has no canonical path: ${item.id}`);
  if(!Array.isArray(item.closeCriteria)||item.closeCriteria.length===0)fail(`G1 item has no close criteria: ${item.id}`);
  if(!Array.isArray(item.evidence))fail(`G1 item evidence must be an array: ${item.id}`);
}

const requiredIds=[
  'G1-INTEGRATION','G1-SEC-MIG','G1-CORP-IP','G1-DIGITAL-CONTROL','G1-OSS-SBOM',
  'G1-DATA-RIGHTS','G1-BUSINESS-TERMS','G1-PRIVACY','G1-PUBLIC-RUNTIME','G1-BRAND',
  'G1-PLATFORM-TRANSFER','G1-UMBRELLA'
];
for(const id of requiredIds)if(!ids.has(id))fail(`Required G1 item missing: ${id}`);

const byId=new Map(reg.items.map(x=>[x.id,x]));
const umbrella=byId.get('G1-UMBRELLA');
if(umbrella?.status!=='REFERENCE_ONLY')fail('Historical umbrella must remain REFERENCE_ONLY unless governance is deliberately revised');
if(!umbrella.canonical.includes('hapo3005/hoy#102'))fail('Historical umbrella must retain PR #102 as reference evidence');

const exactCanonical={
  'G1-INTEGRATION':['hapo3005/hoy#118'],
  'G1-DIGITAL-CONTROL':['hapo3005/hoy#119'],
  'G1-OSS-SBOM':['hapo3005/hoy#116'],
  'G1-BUSINESS-TERMS':['hapo3005/hoy#122'],
  'G1-PRIVACY':['hapo3005/hoy#120'],
  'G1-PUBLIC-RUNTIME':['hapo3005/hoy#121'],
  'G1-BRAND':['hapo3005/hoy#108']
};
for(const [id,expected] of Object.entries(exactCanonical)){
  const actual=byId.get(id)?.canonical||[];
  if(JSON.stringify(actual)!==JSON.stringify(expected))fail(`${id} canonical path drifted: ${JSON.stringify(actual)}`);
}

const corp=byId.get('G1-CORP-IP')?.canonical||[];
for(const ref of ['hapo3005/hoy#104','hapo3005/hoy#123'])if(!corp.includes(ref))fail(`G1-CORP-IP missing canonical evidence ${ref}`);

const platform=byId.get('G1-PLATFORM-TRANSFER')?.canonical||[];
for(const ref of ['hapo3005/hoy#115','hapo3005/hoy-lifestyle#1','hapo3005/hoy-works#3'])if(!platform.includes(ref))fail(`G1-PLATFORM-TRANSFER missing ${ref}`);

// Superseded combined/runtime branches may remain in narrative/evidence history, but
// they must not return as the active canonical merge path after reconciliation.
const activeRefs=reg.items.filter(x=>x.status!=='REFERENCE_ONLY').flatMap(x=>x.canonical);
for(const forbidden of ['hapo3005/hoy#105','hapo3005/hoy#107','hapo3005/hoy#109']){
  if(activeRefs.includes(forbidden))fail(`Superseded historical PR returned as active canonical path: ${forbidden}`);
}

if(reg.overallStatus==='DONE'){
  const open=reg.items.filter(x=>x.status!=='REFERENCE_ONLY'&&x.status!=='DONE');
  if(open.length)fail(`G1 cannot be DONE while items remain open: ${open.map(x=>x.id).join(', ')}`);
}

const master=fs.readFileSync(masterPath,'utf8');
for(const phrase of [
  'evidence fragmentation',
  'One canonical merge/evidence source per gate.',
  'Archive acquired-state evidence.',
  'No hidden exceptions.',
  'does not itself authorize',
  'Platform Architecture & Transferability',
  'Core PR #119',
  'Core PR #120',
  'Core PR #121',
  'Core PR #122',
  'Core PR #123'
])if(!master.includes(phrase))fail(`G1 master lost required governance rule/path: ${phrase}`);

for(const item of reg.items){
  for(const ref of item.canonical){
    const display=ref.replace('hapo3005/hoy#','Core PR #').replace('hapo3005/hoy-lifestyle#','Lifestyle #').replace('hapo3005/hoy-works#','Works #');
    if(!master.includes(display)&&!master.includes(ref)){
      if(item.id!=='G1-DATA-RIGHTS'&&item.id!=='G1-PLATFORM-TRANSFER')fail(`G1 master does not surface canonical path ${ref}`);
    }
  }
}

console.log(JSON.stringify({
  ok:true,
  gate:reg.gate,
  schemaVersion:reg.schemaVersion,
  overallStatus:reg.overallStatus,
  items:reg.items.length,
  done:reg.items.filter(x=>x.status==='DONE').length,
  greenCandidate:reg.items.filter(x=>x.status==='GREEN_CANDIDATE').length,
  inProgress:reg.items.filter(x=>x.status==='IN_PROGRESS').length,
  blocked:reg.items.filter(x=>x.status==='BLOCKED').length,
  referenceOnly:reg.items.filter(x=>x.status==='REFERENCE_ONLY').length,
  supersededCanonicalPathsBlocked:true
},null,2));

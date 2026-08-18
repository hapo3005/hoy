const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'..');
const claimsPath=path.join(ROOT,'docs/investor-ready/platform-claims-register.json');
const evidencePath=path.join(ROOT,'docs/investor-ready/platform-evidence-index.md');
const narrativePath=path.join(ROOT,'docs/investor-ready/platform-architecture-defensibility.md');
const fail=msg=>{throw new Error(msg)};

for(const file of [claimsPath,evidencePath,narrativePath]){
  if(!fs.existsSync(file)||fs.statSync(file).size<200)fail(`Buyer-DD artifact missing or unexpectedly small: ${path.relative(ROOT,file)}`);
}

let register;
try{register=JSON.parse(fs.readFileSync(claimsPath,'utf8'))}catch(err){fail(`Claims register is not valid JSON: ${err.message}`)}

const allowed=new Set(register.statusEnum||[]);
for(const expected of ['PROVEN','PARTIAL','OPEN','PROVEN_FALSE'])if(!allowed.has(expected))fail(`Claims status enum missing ${expected}`);
if(!Array.isArray(register.claims)||!register.claims.length)fail('Claims register contains no claims');

const ids=new Set();
for(const claim of register.claims){
  if(!claim.id||!claim.claim||!claim.status)fail('Claim missing id, text or status');
  if(ids.has(claim.id))fail(`Duplicate claim id: ${claim.id}`);
  ids.add(claim.id);
  if(!allowed.has(claim.status))fail(`Unsupported status for ${claim.id}: ${claim.status}`);
  if(!Array.isArray(claim.evidence))fail(`Evidence must be an array for ${claim.id}`);
  if(claim.status==='PROVEN'&&claim.evidence.length===0)fail(`PROVEN claim has no evidence: ${claim.id}`);
  if((claim.status==='PARTIAL'||claim.status==='OPEN'||claim.status==='PROVEN_FALSE')&&!String(claim.qualification||'').trim()){
    fail(`${claim.status} claim must carry an explicit qualification: ${claim.id}`);
  }
}

const localEvidence=[];
for(const claim of register.claims){
  for(const ref of claim.evidence){
    if(/^(?:github-actions:|git-blob:|hapo3005\/)/.test(ref))continue;
    localEvidence.push([claim.id,ref]);
  }
}
for(const [id,ref] of localEvidence){
  const full=path.join(ROOT,ref);
  if(!fs.existsSync(full))fail(`Local evidence path for ${id} does not exist: ${ref}`);
}

const narrative=fs.readFileSync(narrativePath,'utf8');
for(const phrase of [
  'Platform architecture is an execution advantage and risk reducer. It is not, by itself, a durable market moat.',
  'HOY should not present a fixed euro uplift attributable only to Platform Core.',
  'Production, legal, privacy, source-rights, owner-live and market-proof gates remain independent'
]){
  if(!narrative.includes(phrase))fail(`Buyer narrative lost mandatory qualification: ${phrase}`);
}

const evidenceIndex=fs.readFileSync(evidencePath,'utf8');
for(const id of ids){
  if(!evidenceIndex.includes(id))fail(`Evidence index does not reference registered claim ${id}`);
}

const forbiddenUnqualified=[
  'HOY has a proven network effect.',
  'HOY is fully founder-independent.',
  'Platform Core alone increases the company value by €'
];
for(const phrase of forbiddenUnqualified){
  if(narrative.includes(phrase)&&!evidenceIndex.includes(phrase))fail(`Potentially unqualified buyer claim detected: ${phrase}`);
}

console.log(JSON.stringify({
  ok:true,
  claims:register.claims.length,
  proven:register.claims.filter(c=>c.status==='PROVEN').length,
  partial:register.claims.filter(c=>c.status==='PARTIAL').length,
  open:register.claims.filter(c=>c.status==='OPEN').length,
  provenFalse:register.claims.filter(c=>c.status==='PROVEN_FALSE').length,
  localEvidencePathsChecked:localEvidence.length
},null,2));

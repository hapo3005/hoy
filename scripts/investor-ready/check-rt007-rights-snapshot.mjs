import fs from 'node:fs';

const path='docs/investor-ready/rt007-live-rights-snapshot-2026-08-18.json';
const x=JSON.parse(fs.readFileSync(path,'utf8'));
const fail=[];
const assert=(ok,msg)=>{if(!ok)fail.push(msg)};

const states=['GREEN','AMBER','RED','REVIEW_REQUIRED'];
const b=x.source_usage?.by_rights_status||{};
for(const s of states) assert(b[s],`missing rights bucket ${s}`);
const hosts=states.reduce((n,s)=>n+(b[s]?.hosts||0),0);
const refs=states.reduce((n,s)=>n+(b[s]?.references||0),0);
assert(hosts===x.source_usage.total_hosts,`host reconciliation mismatch ${hosts} != ${x.source_usage.total_hosts}`);
assert(refs===x.source_usage.total_references,`reference reconciliation mismatch ${refs} != ${x.source_usage.total_references}`);
assert(b.RED.replacement_required_references===b.RED.references,'every RED reference must remain replacement_required');
assert(x.policy_controls.red_policy_failures===0,'RED policy integrity must have zero failures');

const noRegistry=x.direct_restaurant_provenance?.NO_REGISTRY?.field_references||0;
const activeTerms=x.policy_controls.business_terms_status==='active';
const acceptances=x.policy_controls.business_terms_acceptances||0;
const confirmations=x.policy_controls.business_data_confirmations||0;
const blockers=[];
if(noRegistry>0) blockers.push('REGISTRY_COVERAGE');
if(!activeTerms) blockers.push('BUSINESS_TERMS_NOT_ACTIVE');
if(acceptances===0) blockers.push('NO_TERMS_ACCEPTANCES');
if(confirmations===0) blockers.push('NO_BUSINESS_DATA_CONFIRMATIONS');

if(blockers.length){
  assert(x.gate.rt007_overall!=='GREEN','RT-007 must not be GREEN while live blockers remain');
  assert(x.gate.f0_m==='BLOCKED','F0-M must remain BLOCKED while RT-007 blockers remain');
  assert(x.gate.f1_i==='BLOCKED','F1-I must remain BLOCKED while RT-007 blockers remain');
}
assert(Array.isArray(x.no_registry_direct_provenance),'no-registry queue missing');
assert(x.no_registry_direct_provenance.length===noRegistry,'no-registry queue count must equal direct provenance gap count');
for(const r of x.no_registry_direct_provenance){
  assert(r.host && r.field && r.proposed_treatment,'incomplete no-registry remediation row');
}

const summary={
  schema_version:x.schema_version,
  observed_at:x.observed_at,
  hosts,refs,
  red_policy_failures:x.policy_controls.red_policy_failures,
  no_registry_direct_refs:noRegistry,
  active_business_terms:activeTerms,
  business_terms_acceptances:acceptances,
  business_data_confirmations:confirmations,
  blockers,
  status:fail.length?'FAIL':'PASS_FAIL_CLOSED'
};
console.log(JSON.stringify(summary,null,2));
if(fail.length){
  for(const m of fail) console.error(`RT-007 SNAPSHOT FAIL: ${m}`);
  process.exit(1);
}

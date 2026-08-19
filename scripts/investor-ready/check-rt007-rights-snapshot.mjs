import fs from 'node:fs';

const path='docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json';
const historicalPath='docs/investor-ready/rt007-live-rights-snapshot-2026-08-18.json';
const x=JSON.parse(fs.readFileSync(path,'utf8'));
const historical=JSON.parse(fs.readFileSync(historicalPath,'utf8'));
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

const direct=x.direct_restaurant_provenance||{};
const noRegistry=direct.NO_REGISTRY?.field_references||0;
const hard=(direct.RED?.field_references||0)+(direct.REVIEW_REQUIRED?.field_references||0)+noRegistry;
assert(hard===direct.hard_queue?.field_references,`hard direct queue mismatch ${hard} != ${direct.hard_queue?.field_references}`);
assert(direct.hard_queue?.field_references===329,'current direct hard queue must remain pinned to the 2026-08-19 read-only snapshot');
assert(direct.NO_REGISTRY?.field_references===3,'current direct no-registry queue must remain 3 until an approved replacement/classification is actually applied');

const historicalHard=(historical.direct_restaurant_provenance?.RED?.field_references||0)
  +(historical.direct_restaurant_provenance?.REVIEW_REQUIRED?.field_references||0)
  +(historical.direct_restaurant_provenance?.NO_REGISTRY?.field_references||0);
assert(historicalHard===343,'historical 2026-08-18 hard queue must remain 343');
assert(x.delta_vs_2026_08_18_snapshot?.hard_direct_field_references===hard-historicalHard,'historical delta mismatch');
assert(x.historical_predecessor===historicalPath,'historical predecessor link drifted');

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
  assert(r.host && r.field && r.current_treatment && r.recommended_registry_treatment,'incomplete no-registry remediation row');
  assert(r.current_treatment==='FAIL_CLOSED_NO_REGISTRY','unregistered source must remain fail-closed until an approved apply');
}

const firstParty=x.first_party_replacement_rights_boundary||{};
assert(firstParty.current_rights_status==='AMBER','first-party replacement boundary must remain AMBER');
assert(firstParty.factual_verification_allowed===true,'first-party factual verification must remain explicit');
assert(firstParty.transferability==='UNKNOWN','first-party references must not be promoted to transfer-clear without business terms');
assert(firstParty.legal_review_status==='BUSINESS_TERMS_REQUIRED','business terms gate must remain visible');

const summary={
  schema_version:x.schema_version,
  observed_at:x.observed_at,
  hosts,refs,
  hard_direct_refs:hard,
  hard_direct_restaurants:direct.hard_queue?.restaurants,
  hard_delta_vs_previous:hard-historicalHard,
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

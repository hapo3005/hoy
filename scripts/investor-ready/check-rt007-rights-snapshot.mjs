import fs from 'node:fs';

const path='docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json';
const historicalPath='docs/investor-ready/rt007-live-rights-snapshot-2026-08-18.json';
const buyerPath='docs/investor-ready/rt007-buyer-safe-export-snapshot-2026-08-19.json';
const buyerSqlPath='scripts/investor-ready/rt007-buyer-safe-export.sql';
const x=JSON.parse(fs.readFileSync(path,'utf8'));
const historical=JSON.parse(fs.readFileSync(historicalPath,'utf8'));
const buyer=JSON.parse(fs.readFileSync(buyerPath,'utf8'));
const buyerSql=fs.readFileSync(buyerSqlPath,'utf8');
const buyerExecutableSql=buyerSql.replace(/--[^\n]*/g,' ');
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
assert(direct.hard_queue?.field_references===329,'current direct hard queue must remain pinned to the latest 2026-08-19 read-only snapshot');
assert(noRegistry===0,'current direct registry coverage must have zero unregistered references');
assert((direct.REVIEW_REQUIRED?.field_references||0)===16,'current REVIEW_REQUIRED direct queue must remain 16 on this snapshot');

const historicalHard=(historical.direct_restaurant_provenance?.RED?.field_references||0)
  +(historical.direct_restaurant_provenance?.REVIEW_REQUIRED?.field_references||0)
  +(historical.direct_restaurant_provenance?.NO_REGISTRY?.field_references||0);
assert(historicalHard===343,'historical 2026-08-18 hard queue must remain 343');
assert(x.delta_vs_2026_08_18_snapshot?.hard_direct_field_references===hard-historicalHard,'historical delta mismatch');
assert(x.historical_predecessor===historicalPath,'historical predecessor link drifted');

const formerly=x.formerly_no_registry_direct_provenance||[];
assert(formerly.length===3,'the three formerly unregistered direct references must remain explicitly tracked');
for(const r of formerly){
  assert(r.host && r.field && r.current_registry_status && r.legal_review_status,'incomplete formerly-no-registry row');
  assert(r.current_registry_status==='REVIEW_REQUIRED','formerly unregistered reference must remain fail-closed REVIEW_REQUIRED');
  assert(r.replacement_required===true,'formerly unregistered reference must remain replacement-required');
  assert(r.factual_verification_allowed===false,'restricted publisher/platform reference must not be used for factual verification');
  assert(r.transferability==='UNKNOWN','restricted publisher/platform reference must not be promoted to transfer-clear');
}
assert(x.delta_vs_earlier_2026_08_19_observation?.direct_no_registry_field_references===-3,'registry-coverage delta must record all three former gaps');
assert(x.delta_vs_earlier_2026_08_19_observation?.hard_direct_field_references===0,'registry classification alone must not reduce the hard queue');

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
assert(x.gate.registry_coverage_for_direct_provenance==='GREEN_TECHNICAL','registry coverage may only be GREEN_TECHNICAL while rights/transfer blockers remain');

const firstParty=x.first_party_replacement_rights_boundary||{};
assert(firstParty.current_rights_status==='AMBER','first-party replacement boundary must remain AMBER');
assert(firstParty.factual_verification_allowed===true,'first-party factual verification must remain explicit');
assert(firstParty.transferability==='UNKNOWN','first-party references must not be promoted to transfer-clear without business terms');
assert(firstParty.legal_review_status==='BUSINESS_TERMS_REQUIRED','business terms gate must remain visible');

// Buyer-safe export contract: fail closed against whole-profile overclaims or archive omission.
assert(buyer.schemaVersion==='1.1.0','buyer-safe snapshot schema drift');
assert(buyer.status==='READ_ONLY_BUYER_DD_SNAPSHOT','buyer-safe snapshot must remain read-only DD evidence');
assert(buyer.productionMutationPerformed===false,'buyer-safe snapshot must not claim a production mutation');
assert(buyer.restaurantPopulation?.published===166,'buyer-safe published restaurant count drifted');
assert(buyer.restaurantPopulation?.unpublished===3,'buyer-safe unpublished restaurant count drifted');
assert(buyer.restaurantPopulation?.total===169,'buyer-safe restaurant total drifted');
assert(buyer.hardDirectReferences?.all===hard,'buyer-safe hard-ref total must reconcile to canonical RT-007 hard queue');
assert(buyer.hardDirectReferences?.published===324,'buyer-safe published hard refs must remain 324 on this snapshot');
assert(buyer.hardDirectReferences?.unpublished===5,'buyer-safe unpublished hard refs must remain 5 on this snapshot');
assert((buyer.hardDirectReferences?.published||0)+(buyer.hardDirectReferences?.unpublished||0)===buyer.hardDirectReferences?.all,'buyer-safe published + archived hard refs must reconcile');

const buyerBuckets=Object.fromEntries((buyer.restaurantBuyerBuckets||[]).map(v=>[v.bucket,v]));
assert(buyerBuckets.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY?.restaurants===146,'buyer-safe hard-dependent restaurant count drifted');
assert(buyerBuckets.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY?.hardRestrictedReferences===324,'buyer-safe active hard-ref count drifted');
assert(buyerBuckets.PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR?.restaurants===18,'buyer-safe conditional restaurant count drifted');
assert(buyerBuckets.PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW?.restaurants===2,'buyer-safe provenance-ref-clear restaurant count drifted');
assert(buyerBuckets.ARCHIVED_UNPUBLISHED_CARVEOUT?.restaurants===3,'buyer-safe archived restaurant count drifted');
assert(buyerBuckets.ARCHIVED_UNPUBLISHED_CARVEOUT?.hardRestrictedReferences===5,'buyer-safe archived hard refs must remain visible');

const publishedBuyerRestaurants=(buyerBuckets.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY?.restaurants||0)
  +(buyerBuckets.PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR?.restaurants||0)
  +(buyerBuckets.PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW?.restaurants||0);
assert(publishedBuyerRestaurants===buyer.restaurantPopulation.published,'buyer-safe published bucket reconciliation failed');

const clearExamples=buyer.publishedProvenanceReferenceExamples||[];
assert(clearExamples.length===2,'buyer-safe source-ref-clear examples must remain exactly two on this snapshot');
assert(clearExamples.every(v=>v.qualification?.includes('not a whole-profile')),'source-ref-clear examples must carry whole-profile non-clearance qualification');
assert(buyer.buyerExportRules?.greenSourceMeansWholeProfileClean===false,'GREEN source must never imply whole-profile clearance');
assert(buyer.buyerExportRules?.provenanceRefsTransferableMeansWholeProfileClean===false,'source-ref transferability must never imply whole-profile clearance');
assert(buyer.buyerExportRules?.amberMeansTransferClear===false,'AMBER must never become transfer-clear by default');
assert(buyer.buyerExportRules?.personalOrUserEventDataIncluded===false,'buyer-safe RT-007 export must exclude personal/user-event data');
assert(buyer.buyerExportRules?.privacyGate==='RT-008','personal/user-event data must remain under RT-008');

const archived=buyer.unpublishedHardReferenceCarveout||[];
assert(archived.length===5,'buyer-safe archive carve-out must retain all five current unpublished hard refs');
assert(archived.every(v=>v.replacementRequired===true),'every archived hard ref must remain replacement-required');
assert(archived.filter(v=>v.restaurantId===19).length===3,'El Pez Rojo must retain three archived hard refs');
assert(archived.filter(v=>v.restaurantId===202).length===1,'Pescados Cabo de Palos I must retain one unpublished location hard ref');
assert(archived.filter(v=>v.restaurantId===240).length===1,'Alt Frankfurt must retain one unpublished hard ref');

// Prepared replacement impact must separate active buyer-dataset improvements from archive cleanup.
const impact=buyer.preparedReplacementImpact||{};
assert(impact.status==='PROJECTED_AFTER_REQUIRED_REBASE_REVIEW_AND_APPLY','prepared replacement impact must remain projected, not applied');
assert(impact.currentHardReferences?.all===329 && impact.currentHardReferences?.published===324 && impact.currentHardReferences?.unpublished===5,'prepared-impact current hard baseline drifted');
assert(impact.preparedReferences?.all===34 && impact.preparedReferences?.published===32 && impact.preparedReferences?.unpublished===2,'prepared-impact active/archive split drifted');
assert(impact.projectedHardReferences?.all===295 && impact.projectedHardReferences?.published===292 && impact.projectedHardReferences?.unpublished===3,'prepared-impact projected hard split drifted');
assert(impact.currentHardReferences.all-impact.preparedReferences.all===impact.projectedHardReferences.all,'prepared-impact aggregate arithmetic failed');
assert(impact.currentHardReferences.published-impact.preparedReferences.published===impact.projectedHardReferences.published,'prepared-impact active arithmetic failed');
assert(impact.currentHardReferences.unpublished-impact.preparedReferences.unpublished===impact.projectedHardReferences.unpublished,'prepared-impact archive arithmetic failed');
const waveImpact=(impact.byWave||[]).reduce((a,v)=>({all:a.all+v.all,published:a.published+v.published,unpublished:a.unpublished+v.unpublished}),{all:0,published:0,unpublished:0});
assert(waveImpact.all===34 && waveImpact.published===32 && waveImpact.unpublished===2,'prepared-impact wave totals drifted');
assert((impact.unpublishedPreparedTargets||[]).length===2,'prepared-impact must identify exactly two archived replacement targets');
assert((impact.unpublishedPreparedTargets||[]).some(v=>v.restaurantId===19 && v.field==='source_url'),'prepared-impact must identify El Pez Rojo source_url as archive cleanup');
assert((impact.unpublishedPreparedTargets||[]).some(v=>v.restaurantId===202 && v.field==='location_source_url'),'prepared-impact must identify Pescados Cabo de Palos I location ref as archive cleanup');
assert(impact.rebaseRequired===true && impact.reviewRequired===true,'prepared-impact must remain subject to rebase and review');
assert(impact.productionApplyAuthorized===false,'prepared-impact must not authorize Production apply');

assert(buyer.gate?.buyerSafeExportContract==='PREPARED_NOT_EXECUTED','buyer-safe export must not claim execution');
assert(buyer.gate?.rt007Overall==='IN_PROGRESS','buyer-safe export must not close RT-007');
assert(buyer.gate?.productionExportAuthorized===false,'buyer-safe export must not authorize production export');
assert(buyer.gate?.dataCommercializationAuthorized===false,'buyer-safe export must not authorize commercialization');

assert(buyerSql.includes('ARCHIVED_UNPUBLISHED_CARVEOUT'),'buyer-safe SQL must segregate archived/unpublished rows');
assert(buyerSql.includes('PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW'),'buyer-safe SQL must expose source-ref-only transfer bucket');
assert(buyerSql.includes('SOURCE_REFERENCES_ONLY_NOT_WHOLE_PROFILE_CLEARANCE'),'buyer-safe SQL must make whole-profile non-clearance explicit');
assert(buyerSql.includes('false as whole_profile_clearance_claimed'),'buyer-safe SQL must explicitly deny whole-profile clearance');
assert(buyerSql.includes('false as personal_or_user_event_data_included'),'buyer-safe SQL must explicitly exclude personal/user-event data');
assert(buyerSql.includes('PASS_2026_08_19_BUYER_SAFE_SNAPSHOT'),'buyer-safe SQL must expose drift-aware snapshot reconciliation');
assert(!/\b(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke|commit|rollback)\b/i.test(buyerExecutableSql),'buyer-safe SQL must remain SELECT-only');

const summary={
  schema_version:x.schema_version,
  observed_at:x.observed_at,
  hosts,refs,
  hard_direct_refs:hard,
  hard_direct_restaurants:direct.hard_queue?.restaurants,
  hard_delta_vs_previous:hard-historicalHard,
  red_policy_failures:x.policy_controls.red_policy_failures,
  no_registry_direct_refs:noRegistry,
  formerly_no_registry_now_review_required:formerly.length,
  active_business_terms:activeTerms,
  business_terms_acceptances:acceptances,
  business_data_confirmations:confirmations,
  buyer_safe_export:{
    published_restaurants:buyer.restaurantPopulation?.published,
    published_with_hard_dependency:buyerBuckets.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY?.restaurants,
    published_conditional:buyerBuckets.PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR?.restaurants,
    source_ref_clear_only:buyerBuckets.PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW?.restaurants,
    archived_restaurants:buyerBuckets.ARCHIVED_UNPUBLISHED_CARVEOUT?.restaurants,
    published_hard_refs:buyer.hardDirectReferences?.published,
    archived_hard_refs:buyer.hardDirectReferences?.unpublished,
    prepared_active_refs:impact.preparedReferences?.published,
    prepared_archive_refs:impact.preparedReferences?.unpublished,
    projected_active_hard_refs:impact.projectedHardReferences?.published,
    projected_archive_hard_refs:impact.projectedHardReferences?.unpublished
  },
  blockers,
  status:fail.length?'FAIL':'PASS_FAIL_CLOSED'
};
console.log(JSON.stringify(summary,null,2));
if(fail.length){
  for(const m of fail) console.error(`RT-007 SNAPSHOT FAIL: ${m}`);
  process.exit(1);
}

const {test,expect}=require('@playwright/test');

const MANIFEST='./data/hoy-intelligence-production-policy-2026-08-18.json';

function hasPending(value){
  if(value===null||value===undefined)return true;
  if(typeof value==='string')return /pending|not_started|policy_contract_only/i.test(value);
  if(Array.isArray(value))return value.some(hasPending);
  if(typeof value==='object')return Object.values(value).some(hasPending);
  return false;
}

function isProductionReady(policy){
  return policy.status==='production_ready' &&
    policy.production_collection_allowed===true &&
    policy.commercialization_allowed===false &&
    policy.unlisted_fields==='reject' &&
    policy.client_allowed_fields.length>0 &&
    policy.server_allowed_fields.length>0 &&
    policy.client_allowed_fields.every(x=>policy.server_allowed_fields.includes(x)) &&
    !hasPending({
      lawful_basis:policy.lawful_basis,
      consent_decision:policy.consent_decision,
      retention:policy.retention,
      deletion_or_aggregation_path:policy.deletion_or_aggregation_path,
      security_review:policy.security_review,
      legal_privacy_review:policy.legal_privacy_review,
      qa_status:policy.qa_status,
      commercial_reuse_review:policy.commercial_reuse_review
    });
}

test('2.46 manifest remains fail closed',async({request})=>{
  const m=await (await request.get(MANIFEST)).json();
  expect(m.status).toBe('fail_closed');
  expect(m.runtime_tracking_expansion_allowed).toBe(false);
  expect(m.production_collection_default).toBe('blocked');
  expect(m.commercialization_default).toBe('blocked');
  expect(m.allowed_statuses).toEqual(['blocked','internal_only','production_ready']);
  expect(m.mandatory_policy_gates.length).toBeGreaterThanOrEqual(15);
  expect(m.globally_prohibited_fields.length).toBeGreaterThanOrEqual(8);
  expect(m.event_policy_files).toHaveLength(5);
});

test('every event policy has lineage, owners and matching allowlists',async({request})=>{
  const m=await (await request.get(MANIFEST)).json();
  for(const path of m.event_policy_files){
    const p=await (await request.get('./'+path)).json();
    expect(p.data_lineage_id).toMatch(/^hoy\.intelligence\./);
    expect(p.product_owner).toBeTruthy();
    expect(p.privacy_owner).toBeTruthy();
    expect(p.unlisted_fields).toBe('reject');
    expect(new Set(p.client_allowed_fields).size).toBe(p.client_allowed_fields.length);
    expect(new Set(p.server_allowed_fields).size).toBe(p.server_allowed_fields.length);
    expect(p.client_allowed_fields.every(x=>p.server_allowed_fields.includes(x))).toBe(true);
  }
});

test('current policies cannot become production ready while gates are pending',async({request})=>{
  const m=await (await request.get(MANIFEST)).json();
  for(const path of m.event_policy_files){
    const p=await (await request.get('./'+path)).json();
    expect(p.status).toBe('blocked');
    expect(p.production_collection_allowed).toBe(false);
    expect(p.commercialization_allowed).toBe(false);
    expect(hasPending(p)).toBe(true);
    expect(isProductionReady(p)).toBe(false);
  }
});

test('readiness evaluator fails closed on any incomplete mandatory decision',async()=>{
  const base={
    status:'production_ready',production_collection_allowed:true,commercialization_allowed:false,
    unlisted_fields:'reject',client_allowed_fields:['event_type'],server_allowed_fields:['event_type'],
    lawful_basis:'approved_basis',consent_decision:'not_required_approved',
    retention:{status:'approved',event_level_period:'approved_period',aggregate_period:'approved_period'},
    deletion_or_aggregation_path:'approved',security_review:'approved',legal_privacy_review:'approved',
    qa_status:'approved',commercial_reuse_review:'separately_reviewed'
  };
  expect(isProductionReady(base)).toBe(true);
  for(const [key,value] of [['lawful_basis','pending_legal_review'],['consent_decision','pending_legal_review'],['security_review','pending'],['legal_privacy_review','pending'],['qa_status','policy_contract_only']]){
    expect(isProductionReady({...base,[key]:value})).toBe(false);
  }
  expect(isProductionReady({...base,retention:{status:'pending_policy_approval'}})).toBe(false);
  expect(isProductionReady({...base,deletion_or_aggregation_path:'pending_policy_approval'})).toBe(false);
});

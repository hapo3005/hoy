const {test,expect}=require('@playwright/test');
const G='./data/hoy-intelligence-data-governance-2026-08-18.json';

test('2.45.1 data governance fails closed before runtime expansion',async({request})=>{
  const g=await (await request.get(G)).json();
  expect(g.runtime_collection_expansion_allowed).toBe(false);
  expect(g.production_intelligence_export_allowed).toBe(false);
  expect(g.production_data_sale_allowed).toBe(false);
  expect(g.legal_review_required_before_activation).toBe(true);
  expect(g.governance_principles.fail_closed_on_legal_uncertainty).toBe(true);
  expect(g.governance_principles.pseudonymous_data_treated_as_personal_until_validated_anonymous).toBe(true);
});

test('every intelligence family has complete governance inventory',async({request})=>{
  const g=await (await request.get(G)).json();
  const required=g.required_event_inventory_fields;
  expect(g.inventory.length).toBeGreaterThanOrEqual(5);
  for(const row of g.inventory){
    for(const key of required) expect(Object.prototype.hasOwnProperty.call(row,key),`${row.event_name} missing ${key}`).toBe(true);
    expect(row.production_collection_allowed).toBe(false);
    expect(row.commercialization_allowed).toBe(false);
    expect(row.legal_review_status).toContain('required');
    expect(row.security_review_status).toContain('required');
    expect(row.minimum_aggregation_threshold).toContain('not_yet_approved');
    expect(row.sparse_slice_suppression).toBe(true);
  }
});

test('lawful basis is explicit and never inferred from commercial value',async({request})=>{
  const g=await (await request.get(G)).json();
  expect(g.lawful_basis_policy.default_for_new_or_changed_personal_data_processing).toBe('pending_legal_review');
  expect(g.lawful_basis_policy.allowed_statuses).toContain('consent');
  expect(g.lawful_basis_policy.allowed_statuses).toContain('legitimate_interests');
  expect(g.lawful_basis_policy.allowed_statuses).toContain('anonymous_not_personal');
  expect(g.governance_principles.no_legal_basis_inferred_from_business_value).toBe(true);
  expect(g.lawful_basis_policy.legitimate_interests_requires).toContain('balancing assessment');
  expect(g.lawful_basis_policy.consent_requires).toContain('withdrawal_path');
  expect(g.lawful_basis_policy.special_category_data).toContain('prohibited');
});

test('retention and commercialization remain blocked until implementation is approved',async({request})=>{
  const g=await (await request.get(G)).json();
  expect(g.retention_policy_gate.approved).toBe(false);
  expect(g.commercialization_gate.enabled).toBe(false);
  expect(g.commercialization_gate.fail_closed_rule).toContain('commercialization_allowed=false');
  expect(g.commercialization_gate.all_required).toContain('data lineage documented from source event to customer metric');
  expect(g.commercialization_gate.all_required).toContain('aggregation threshold numerically defined and tested');
  expect(g.commercialization_gate.all_required).toContain('legal review approved');
});

test('customer-facing intelligence cannot expose user-level or sensitive outputs',async({request})=>{
  const g=await (await request.get(G)).json();
  for(const item of ['raw_event_rows','anonymous_id','session_id','precise_location_history','individual_user_journey','free_text','personal_contact_details','special_category_personal_data']){
    expect(g.prohibited_external_outputs).toContain(item);
  }
});

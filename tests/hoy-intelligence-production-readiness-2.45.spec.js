const {test,expect}=require('@playwright/test');

const R='./data/hoy-intelligence-production-readiness-2026-08-18.json';
const G='./data/hoy-intelligence-data-governance-2026-08-18.json';

const REQUIRED=[
  'business_purpose_approved',
  'product_purpose_approved',
  'data_minimization_review_passed',
  'personal_data_classification_approved',
  'lawful_basis_approved',
  'consent_requirement_decided',
  'consent_or_preference_control_implemented_if_required',
  'transparency_surface_implemented',
  'retention_period_approved',
  'automatic_deletion_or_irreversible_aggregation_implemented',
  'data_subject_request_path_defined_where_applicable',
  'client_payload_allowlist_defined',
  'server_payload_allowlist_defined',
  'prohibited_field_rejection_tested',
  'security_review_passed',
  'legal_privacy_review_passed',
  'data_lineage_registered',
  'qa_tests_passed'
];

test('production readiness is fail-closed per event family',async({request})=>{
  const r=await (await request.get(R)).json();
  expect(r.global_production_collection_allowed).toBe(false);
  expect(r.activation_policy.default_state).toBe('blocked');
  expect(r.activation_policy.production_flag_requires_all_controls_passed).toBe(true);
  expect(r.required_controls).toEqual(REQUIRED);
  for(const event of r.event_readiness){
    expect(event.production_collection_allowed).toBe(false);
    expect(event.readiness_status).toContain('blocked');
    expect(Object.keys(event.controls).sort()).toEqual([...REQUIRED].sort());
    expect(Object.values(event.controls).some(v=>v===false)).toBe(true);
  }
});

test('readiness gate covers the governance inventory exactly',async({request})=>{
  const r=await (await request.get(R)).json();
  const g=await (await request.get(G)).json();
  expect(r.event_readiness.map(x=>x.event_family).sort()).toEqual(g.inventory.map(x=>x.event_family).sort());
  for(const inv of g.inventory){
    const gate=r.event_readiness.find(x=>x.event_family===inv.event_family);
    expect(gate).toBeTruthy();
    if(inv.lawful_basis_status.includes('pending')) expect(gate.controls.lawful_basis_approved).toBe(false);
    if(inv.consent_required_status.includes('pending')) expect(gate.controls.consent_requirement_decided).toBe(false);
    if(inv.retention_class.includes('pending')) expect(gate.controls.retention_period_approved).toBe(false);
    if(inv.security_review_status.includes('required')) expect(gate.controls.security_review_passed).toBe(false);
    if(inv.legal_review_status.includes('required')) expect(gate.controls.legal_privacy_review_passed).toBe(false);
  }
});

test('material changes force re-review and this release cannot activate collection',async({request})=>{
  const r=await (await request.get(R)).json();
  expect(r.activation_policy.material_change_requires_re_review).toBe(true);
  expect(r.activation_policy.no_implicit_grandfathering).toBe(true);
  expect(r.demotion_rule).toContain('immediately returns the event family to blocked');
  expect(r.release_boundary.runtime_change_allowed_in_this_release).toBe(false);
  expect(r.release_boundary.supabase_change_allowed_in_this_release).toBe(false);
  expect(r.release_boundary.production_write_change_allowed_in_this_release).toBe(false);
  expect(r.release_boundary.commercialization_change_allowed_in_this_release).toBe(false);
});

const {test,expect}=require('@playwright/test');
const fs=require('fs');

const AUDIT='./data/hoy-intelligence-coverage-audit-2026-08-18.json';
const POLICY='./data/hoy-intelligence-production-policy-2026-08-18.json';

function load(path){return JSON.parse(fs.readFileSync(path,'utf8'))}

test('HOY Intelligence coverage audit remains fail-closed',()=>{
  const audit=load(AUDIT);
  expect(audit.runtime_tracking_change_allowed).toBe(false);
  expect(audit.supabase_write_allowed).toBe(false);
  expect(audit.commercialization_allowed).toBe(false);
  expect(audit.analytics_quality.historical_before_cutover).toContain('not_reliable');
  expect(audit.analytics_quality.clean_cutover_candidate_utc).toBe('2026-08-18T12:31:24Z');
});

test('all canonical Intelligence families have explicit coverage and stable lineage',()=>{
  const audit=load(AUDIT);
  const expected=['discovery_intent','consideration','decision_action','family_demand','supply_freshness'];
  expect(audit.canonical_family_coverage.map(x=>x.family).sort()).toEqual([...expected].sort());
  for(const family of audit.canonical_family_coverage){
    expect(family.lineage_id).toMatch(/^hoy\.intelligence\.[a-z_]+\.v1$/);
    expect(family.readiness).toBeTruthy();
    expect(family.derivable_dimensions).toBeTruthy();
    expect(Array.isArray(family.gaps)).toBe(true);
  }
});

test('commercially important gaps cannot silently become production tracking',()=>{
  const audit=load(AUDIT);
  expect(audit.highest_value_architecture_gaps.length).toBeGreaterThanOrEqual(5);
  for(const gap of audit.highest_value_architecture_gaps){
    expect(gap.activation_blocked_by_policy).toBe(true);
    expect(gap.safe_next_action).toBeTruthy();
  }
});

test('coverage audit preserves external privacy invariants',()=>{
  const audit=load(AUDIT);
  const invariants=new Set(audit.external_output_invariants);
  for(const required of [
    'never_export_anonymous_id',
    'never_export_session_id',
    'never_export_row_level_user_journeys',
    'never_export_free_text_or_personal_contact_data',
    'suppress_sparse_slices_below_future_approved_threshold',
    'retain_source_lineage_for_every_metric'
  ]) expect(invariants.has(required)).toBe(true);
});

test('coverage audit cannot override the production policy pack',()=>{
  const audit=load(AUDIT);
  const policy=load(POLICY);
  expect(policy.status).toBe('fail_closed');
  expect(policy.runtime_tracking_expansion_allowed).toBe(false);
  expect(policy.production_collection_default).toBe('blocked');
  expect(policy.commercialization_default).toBe('blocked');
  expect(audit.runtime_tracking_change_allowed).toBe(false);
  expect(audit.commercialization_allowed).toBe(false);
});

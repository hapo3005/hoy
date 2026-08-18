const {test,expect}=require('@playwright/test');
const CONTRACT='./data/hoy-intelligence-event-contract-2026-08-18.json';

async function load(request){
  return (await request.get(CONTRACT)).json();
}

test('2.45 remains foundation-only with no production collection or sale enablement',async({request})=>{
  const c=await load(request);
  expect(c.contract_version).toBe('2.45');
  expect(c.status).toBe('foundation_only');
  expect(c.runtime_collection_change_allowed).toBe(false);
  expect(c.supabase_write_allowed).toBe(false);
  expect(c.production_data_sale_allowed).toBe(false);
  expect(c.external_intelligence_gate.enabled).toBe(false);
  expect(c.release_gate.this_release_must_not).toContain('add new tracking calls');
  expect(c.release_gate.this_release_must_not).toContain('add database migrations');
  expect(c.release_gate.this_release_must_not).toContain('write production analytics data');
  expect(c.release_gate.this_release_must_not).toContain('sell or export user-level data');
});

test('HOY Intelligence treats pseudonymous analytics as non-anonymous',async({request})=>{
  const c=await load(request);
  expect(c.principles.pseudonymous_is_not_anonymous).toBe(true);
  expect(c.principles.aggregation_required_before_external_intelligence_use).toBe(true);
  expect(c.principles.no_individual_targeting_from_intelligence_exports).toBe(true);
  expect(c.external_intelligence_gate.requirements).toContain('no raw anonymous_id or session_id in customer-facing outputs');
  expect(c.external_intelligence_gate.requirements).toContain('no row-level user journey export');
});

test('sensitive and re-identifying fields are prohibited from Intelligence',async({request})=>{
  const c=await load(request);
  for(const field of [
    'email','phone','street_address_of_user','exact_user_location','precise_gps_history',
    'personal_name','raw_message','free_text_note','payment_details','health_data',
    'special_category_personal_data','device_fingerprint','advertising_identifier'
  ]){
    expect(c.prohibited_fields).toContain(field);
  }
});

test('taxonomy captures commercially useful intent without requiring identity',async({request})=>{
  const c=await load(request);
  const families=new Map(c.event_families.map(x=>[x.name,x]));
  expect([...families.keys()]).toEqual(expect.arrayContaining([
    'discovery_intent','consideration','decision_action','family_demand','supply_freshness'
  ]));
  expect(families.get('discovery_intent').allowed_dimensions).toEqual(expect.arrayContaining([
    'local_time_bucket','area_bucket','cuisine','price_band','family_need','terrace_need','open_now_need'
  ]));
  expect(families.get('family_demand').allowed_dimensions).toEqual(expect.arrayContaining([
    'play_context_type','customer_access','distance_band'
  ]));
});

test('external commercialization fails closed until privacy and cohort gates are satisfied',async({request})=>{
  const c=await load(request);
  expect(c.external_intelligence_gate.requirements).toEqual(expect.arrayContaining([
    'documented lawful basis and privacy review',
    'validated anonymization or sufficiently coarse aggregation',
    'minimum cohort threshold defined and tested',
    'suppression of sparse or re-identifiable slices',
    'clear customer contract restricting re-identification',
    'retention policy approved and implemented',
    'security review approved'
  ]));
});

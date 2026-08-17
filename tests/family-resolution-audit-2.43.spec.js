const {test,expect}=require('@playwright/test');

const AUDIT_PATH='./data/family-resolution-audit-2026-08-17.json';
const COMPLETION_PATH='./data/family-profile-completion-2026-08-17.json';

const EXPECTED_ORDER=[
  'restaurante-bamboo-la-manga',
  'chiringuito-calisto',
  'aquarium-la-manga-club-resort',
  'la-tap-pizzella',
  'la-vaca-gallega',
  'venta-el-sabinar'
];

const EXPECTED_GATE={visible_family_profiles:19,release_ready:13,conditional:5,blocked:1};

test('2.43 resolution audit is fail-closed, complete and non-production',async({request})=>{
  const audit=await (await request.get(AUDIT_PATH)).json();

  expect(audit.schema_version).toBe(1);
  expect(audit.based_on).toBe('family-data-completion-2.42');
  expect(audit.production_import_allowed).toBe(false);
  expect(audit.quality_gate_before).toEqual(EXPECTED_GATE);
  expect(audit.quality_gate_after).toEqual(EXPECTED_GATE);
  expect(audit.outcomes).toHaveLength(6);
  expect(audit.next_action.order).toEqual(EXPECTED_ORDER);

  const slugs=audit.outcomes.map(row=>row.slug);
  expect(slugs).toEqual(EXPECTED_ORDER);
  expect(new Set(slugs).size).toBe(6);
  expect(audit.outcomes.every(row=>row.status_changed===false)).toBe(true);
  expect(audit.outcomes.every(row=>row.status_before===row.status_after)).toBe(true);
  expect(audit.outcomes.every(row=>row.resolution==='direct_confirmation_required')).toBe(true);
});

test('2.43 preserves Bamboo blocked and the remaining five conditional until direct confirmation',async({request})=>{
  const audit=await (await request.get(AUDIT_PATH)).json();
  const bySlug=new Map(audit.outcomes.map(row=>[row.slug,row]));

  expect(bySlug.get('restaurante-bamboo-la-manga').status_after).toBe('blocked');
  for(const slug of EXPECTED_ORDER.slice(1))expect(bySlug.get(slug).status_after).toBe('conditional');

  for(const row of audit.outcomes){
    expect(row.reason.trim().length).toBeGreaterThan(30);
    expect(row.safe_conclusions.length).toBeGreaterThan(0);
    expect(row.open_items.length).toBeGreaterThan(0);
    expect(row.contact_candidates.length).toBeGreaterThan(0);
    expect(row.evidence.length).toBeGreaterThan(0);
    expect(row.questions_es.length).toBeGreaterThan(0);
    expect(row.evidence.every(source=>/^https:\/\//.test(source.url))).toBe(true);
    expect(row.evidence.every(source=>source.authority&&source.supports.length>0)).toBe(true);
  }
});

test('2.43 audit cannot silently rewrite the 2.42 runtime truth gate',async({request})=>{
  const audit=await (await request.get(AUDIT_PATH)).json();
  const completion=await (await request.get(COMPLETION_PATH)).json();
  const all=[...completion.live_profiles,...completion.profile_patches];
  const count=status=>all.filter(row=>row.data_quality?.profile_status===status).length;

  expect(completion.production_import_allowed).toBe(false);
  expect(completion.quality_gate).toMatchObject(EXPECTED_GATE);
  expect(count('release_ready')).toBe(13);
  expect(count('conditional')).toBe(5);
  expect(count('blocked')).toBe(1);
  expect(all.find(row=>row.slug==='restaurante-bamboo-la-manga').data_quality.profile_status).toBe('blocked');

  expect(completion.quality_gate).toMatchObject(audit.quality_gate_after);
});

test('2.43 keeps media rights and Family geometry fail-closed',async({request})=>{
  const audit=await (await request.get(AUDIT_PATH)).json();
  const raw=JSON.stringify(audit);

  expect(raw).not.toMatch(/"(?:image|photo|media_url)"\s*:\s*"https?:\/\//i);
  expect(raw).toContain('Do not infer Family geometry');
  expect(raw).toContain('Do not copy or hotlink third-party media');
  expect(raw).toContain('no Supabase, migration or seed writes');

  for(const row of audit.outcomes){
    expect(row.open_items.some(item=>/hour|horario|opening/i.test(item))).toBe(true);
  }
});

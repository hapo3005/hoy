const {test,expect}=require('@playwright/test');
const fs=require('fs');
const path=require('path');

const read=p=>fs.readFileSync(path.join(process.cwd(),p),'utf8');

test('Family master is comprehensive, unique and non-production by default',async()=>{
  const master=JSON.parse(read('data/family-gastro-master-2026-08-16.json'));
  expect(master.production_import_allowed).toBe(false);
  expect(master.database_snapshot.restaurants).toBe(169);
  expect(master.database_snapshot.max_restaurant_id).toBe(241);
  expect(master.database_snapshot.restaurants_id_seq_last_value).toBe(240);
  expect(master.entries.length).toBeGreaterThanOrEqual(30);

  const slugs=master.entries.map(x=>x.slug);
  expect(new Set(slugs).size).toBe(slugs.length);

  const ready=master.entries.filter(x=>x.status==='seed_ready');
  expect(ready).toHaveLength(17);
  expect(ready.every(x=>['operator_confirmed','source_verified','community_verified'].includes(x.verification))).toBeTruthy();
  expect(ready.every(x=>x.verification!=='hoy_verified')).toBeTruthy();

  expect(master.entries.some(x=>x.status==='status_conflict')).toBeTruthy();
  expect(master.entries.some(x=>x.status==='historical_only')).toBeTruthy();
  expect(master.entries.some(x=>x.status==='outside_scope')).toBeTruthy();
  expect(master.entries.some(x=>x.status==='excluded_closed')).toBeTruthy();
  expect(master.cluster_backlog.length).toBeGreaterThanOrEqual(8);
});

test('missing restaurant profiles are staged unpublished and without guessed IDs',async()=>{
  const sql=read('supabase/seeds/family_restaurant_profiles_240_staging.sql');
  expect(sql).toContain("select setval(");
  expect(sql).toContain("max(id)");
  expect(sql).toContain("restaurants_id_seq");
  expect(sql).toContain("nextval(pg_get_serial_sequence('public.restaurants','id'))");
  expect(sql).toContain("false,'draft'");
  expect(sql).toContain("location_status,hours_status,menu_expectation,menu_expectation_source");
  expect(sql).toContain("where r.slug=s.slug or lower(btrim(r.name))=lower(btrim(s.name))");
  expect(sql).not.toContain("'el-botanico-de-ramon-y-marisol'");
  expect(sql).not.toContain("'venta-san-jose'");
  expect(sql).not.toContain("'marlom-cafe'");
});

test('verified Family seed resolves IDs by slug and refuses partial or HOY-self-verified import',async()=>{
  const master=JSON.parse(read('data/family-gastro-master-2026-08-16.json'));
  const sql=read('supabase/seeds/family_features_240_stage2_verified.sql');
  const ready=master.entries.filter(x=>x.status==='seed_ready');

  for(const row of ready)expect(sql).toContain(`'${row.slug}'`);
  expect(sql).toContain("raise exception 'HOY Family seed aborted: missing restaurant slugs: %'");
  expect(sql).toContain("join public.restaurants r on r.slug=v.slug");
  expect(sql).toContain("research data cannot be hoy_verified");
  expect(sql).not.toContain("'el-botanico-de-ramon-y-marisol'");
  expect(sql).not.toContain("'hogar-del-pescador-el-parras'");
  expect(sql).not.toContain("'restaurante-imperial-la-manga',array[");
  expect(sql).not.toContain("'pizzeria-da-sebastian',array[");
});

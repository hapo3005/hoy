const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

const migration=()=>fs.readFileSync('supabase/migrations/20260812062453_menu_source_completeness_integrity.sql','utf8');
const seed=()=>fs.readFileSync('supabase/seed/menu-integrity-2.32.sql','utf8');

test('menu completeness is a separate first-class data contract',()=>{
  const sql=migration();
  for(const col of ['coverage_scope','completeness_status','completeness_checked_at','completeness_note','coverage_meta'])expect(sql).toContain(col);
  for(const state of ['complete','partial','image_complete','source_only','insufficient','superseded','invalid','unknown'])expect(sql).toContain(`'${state}'`);
  for(const scope of ['full_menu','food','drinks','wine','dessert','breakfast','lunch','dinner','day_menu','tasting','highlights','secondary'])expect(sql).toContain(`'${scope}'`);
});

test('Playa Chica seed records measured 1-of-12 coverage instead of guessing completeness',()=>{
  const sql=seed();
  expect(sql).toContain("'expected_sections',12");
  expect(sql).toContain("'imported_sections',1");
  expect(sql).toContain("where restaurant_id=11");
  expect(sql).toContain("'Entrantes'");
  expect(sql).toContain("'Arroces'");
  expect(sql).toContain("'Postres caseros'");
});

test('supplementary cards cannot automatically become the main menu',()=>{
  const sql=seed();
  expect(sql).toMatch(/weinkarte[^\n]*then 'wine'/i);
  expect(sql).toContain("coverage_scope='drinks'");
  expect(sql).toContain("coverage_scope='secondary'");
  expect(sql).toContain("coverage_scope='day_menu'");
});

test('content completeness is allowed to differ from cautious technical import state',()=>{
  const sql=seed();
  expect(sql).toContain("restaurant_id in (16,13,20,216,227)");
  expect(sql).toContain("completeness_status='complete'");
  expect(sql).toContain("import_status='partial'");
});

test('unusable official menu pages are explicitly classified',()=>{
  const sql=seed();
  expect(sql).toContain("restaurant_id=111");
  expect(sql).toContain("restaurant_id=7");
  expect(sql).toContain("restaurant_id in (10,142)");
  expect(sql).toContain("completeness_status='invalid'");
  expect(sql).toContain("completeness_status='insufficient'");
});

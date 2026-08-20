const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const benchmarkPath=path.join(__dirname,'..','docs','competitive','region1-menu-competitive-coverage-benchmark-2026-08-20.json');

test('competitive menu benchmark cannot declare Tu Localidad surpassed while measurable La Manga gaps remain',async()=>{
  const b=JSON.parse(fs.readFileSync(benchmarkPath,'utf8'));
  expect(b.snapshot_date).toBe('2026-08-20');
  expect(b.scope.direct_comparison_area).toBe('La Manga del Mar Menor');
  expect(b.scope.region1_is_reported_separately).toBe(true);
  expect(b.competitor_external_evidence.complete_online_menus_claim).toBe(65);
  expect(b.competitor_external_evidence.languages_claim).toBe(4);
  expect(b.competitor_external_evidence.first_month_search_queries_claim_min).toBe(1100);
  expect(b.hoy_production_snapshot.la_manga.published_restaurants).toBe(44);
  expect(b.hoy_production_snapshot.la_manga.restaurants_with_active_structured_menu).toBe(10);
  expect(b.hoy_production_snapshot.la_manga.active_structured_menu_items).toBe(762);
  expect(b.hoy_production_snapshot.la_manga.restaurants_with_all_active_items_priced).toBe(10);
  expect(b.hoy_production_snapshot.region1.active_structured_menu_items).toBe(2078);
  expect(b.hoy_production_snapshot.region1.priced_active_menu_items).toBe(2078);
  expect(b.hoy_production_snapshot.translation_readiness_region1.restaurants_complete_de_en_es_curated_or_operator_confirmed).toBe(0);
  expect(b.hoy_production_snapshot.merchant_freshness_region1.operator_hours_confirmed_within_30_days).toBe(0);
  expect(b.non_production_candidates_not_counted.soul_kitchen.items).toBe(162);
  expect(b.non_production_candidates_not_counted.isla_grosa.items).toBe(38);
  expect(b.derived_gap.venue_gap_to_parity).toBe(55);
  expect(b.derived_gap.current_status).toBe('BEHIND_ON_LA_MANGA_MENU_VENUE_COVERAGE');
  expect(b.superiority_gate.internal_status).toBe('NOT_PASSED');
  expect(b.superiority_gate.public_superiority_claim_allowed).toBe(false);
  expect(b.superiority_gate.conditions.la_manga_active_structured_menu_venues_min).toBeGreaterThan(b.competitor_external_evidence.complete_online_menus_claim);
  expect(b.superiority_gate.conditions.active_menu_item_price_completeness_pct_min).toBe(100);
  expect(b.superiority_gate.conditions.production_ready_required_locales).toEqual(['es','de','en']);
  expect(b.superiority_gate.conditions.operator_hours_confirmed_within_30_days_venues_min).toBeGreaterThan(0);
  expect(b.superiority_gate.conditions.consumer_menu_or_dish_search_queries_30d_min_exclusive).toBe(1100);
  expect(b.hard_boundaries.count_candidates_as_production).toBe(false);
  expect(b.hard_boundaries.count_machine_translation_as_human_ready).toBe(false);
  expect(b.hard_boundaries.use_region1_total_to_claim_la_manga_parity).toBe(false);
  expect(b.hard_boundaries.copy_competitor_menu_content).toBe(false);
  expect(b.hard_boundaries.automatic_production_write).toBe(false);
});

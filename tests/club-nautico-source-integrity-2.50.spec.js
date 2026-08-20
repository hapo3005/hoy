const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const candidatePath=path.join(__dirname,'..','docs','competitive','menu-candidates','club-nautico-dos-mares-10-source-candidate-2026-08-20.json');

test('Club Náutico Dos Mares stays fail-closed until a complete priced first-party menu exists',async()=>{
  const candidate=JSON.parse(fs.readFileSync(candidatePath,'utf8'));
  expect(candidate.restaurant_id).toBe(10);
  expect(candidate.candidate_status).toBe('FIRST_PARTY_RESTAURANT_CONFIRMED_FULL_MENU_SOURCE_NOT_FOUND');
  expect(candidate.production_import_allowed).toBe(false);
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.guest_publish_allowed).toBe(false);
  expect(candidate.source.source_authority).toBe('first_party');
  expect(candidate.source.restaurant_identity_confirmed).toBe(true);
  expect(candidate.source.page_explicitly_mentions_carta).toBe(true);
  expect(candidate.source.full_itemized_menu_found).toBe(false);
  expect(candidate.source.prices_found).toBe(false);
  expect(candidate.source.canonical_downloadable_menu_asset_found).toBe(false);
  expect(candidate.source.named_editorial_examples.length).toBeGreaterThanOrEqual(4);
  expect(candidate.source_integrity_decision.structured_menu_candidate_allowed).toBe(false);
  expect(candidate.source_integrity_decision.example_dishes_may_be_treated_as_complete_menu).toBe(false);
  expect(candidate.reservation_evidence.official_page_links_to_provider).toBe(true);
  expect(candidate.reservation_evidence.provider_restaurant_identity_matches).toBe(true);
  expect(candidate.reservation_evidence.displayed_meal_windows).toEqual(['Comida 13:30-15:30','Cena 20:30-22:00']);
  expect(candidate.reservation_evidence.treat_as_opening_hours_truth).toBe(false);
  expect(candidate.hard_boundaries.invent_missing_items_or_prices).toBe(false);
  expect(candidate.hard_boundaries.promote_editorial_examples_to_full_menu).toBe(false);
  expect(candidate.hard_boundaries.infer_allergens).toBe(false);
  expect(candidate.hard_boundaries.auto_publish).toBe(false);
  expect(candidate.hard_boundaries.production_insert).toBe(false);
});

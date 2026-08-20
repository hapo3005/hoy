const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const candidatePath=path.join(__dirname,'..','docs','competitive','menu-candidates','white-diamond-152-source-candidate-2026-08-20.json');

test('White Diamond stays fail-closed until its advertised menu becomes a captured complete source',async()=>{
  const candidate=JSON.parse(fs.readFileSync(candidatePath,'utf8'));
  expect(candidate.restaurant_id).toBe(152);
  expect(candidate.candidate_status).toBe('FIRST_PARTY_RESTAURANT_CONFIRMED_FULL_MENU_SOURCE_NOT_FOUND');
  expect(candidate.production_import_allowed).toBe(false);
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.guest_publish_allowed).toBe(false);
  expect(candidate.source.source_authority).toBe('first_party');
  expect(candidate.source.restaurant_identity_confirmed).toBe(true);
  expect(candidate.source.bilingual_site_visible).toBe(true);
  expect(candidate.source.page_explicitly_mentions_extensive_menu).toBe(true);
  expect(candidate.source.full_itemized_menu_found).toBe(false);
  expect(candidate.source.prices_found).toBe(false);
  expect(candidate.source.canonical_downloadable_menu_asset_found).toBe(false);
  expect(candidate.source.official_social_links_present).toBe(true);
  expect(candidate.source.social_menu_evidence_verified_in_public_crawl).toBe(false);
  expect(candidate.source_integrity_decision.structured_menu_candidate_allowed).toBe(false);
  expect(candidate.contact_evidence.displayed_time_text).toBe('08:00 - 15:00');
  expect(candidate.contact_evidence.treat_displayed_time_as_verified_weekly_restaurant_hours).toBe(false);
  expect(candidate.hard_boundaries.invent_missing_items_or_prices).toBe(false);
  expect(candidate.hard_boundaries.promote_generic_menu_claim_to_full_menu).toBe(false);
  expect(candidate.hard_boundaries.infer_allergens).toBe(false);
  expect(candidate.hard_boundaries.auto_publish).toBe(false);
  expect(candidate.hard_boundaries.production_insert).toBe(false);
  expect(candidate.hard_boundaries.treat_contact_time_as_opening_hours).toBe(false);
  expect(candidate.hard_boundaries.treat_uncaptured_social_content_as_menu_truth).toBe(false);
});

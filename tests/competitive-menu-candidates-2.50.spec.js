const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const competitiveRoot=path.join(__dirname,'..','docs','competitive');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(competitiveRoot,'menu-candidates',name),'utf8'));
const readRootJson=name=>JSON.parse(fs.readFileSync(path.join(competitiveRoot,name),'utf8'));

test('Isla Grosa structuring candidate is complete, multilingual and non-publishing',async()=>{
  const candidate=readJson('isla-grosa-144-structured-menu-candidate-2026-08-20.json');
  expect(candidate.restaurant_id).toBe(144);
  expect(candidate.candidate_status).toBe('STRUCTURED_EDITORIAL_CANDIDATE_NOT_PRODUCTION_APPLIED');
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.counts).toEqual({items:38,categories:7});
  expect(candidate.hard_boundaries.auto_publish).toBe(false);
  expect(candidate.hard_boundaries.production_insert).toBe(false);
  expect(candidate.allergen_policy.guest_claims_allowed).toBe(false);
  expect(Object.keys(candidate.source_image_sha256)).toHaveLength(6);

  const seen=new Set();
  const categories=new Set();
  for(const row of candidate.items){
    const [category,name,price,description,allergenCodes,nameEn,descriptionEn,nameDe,descriptionDe]=row;
    expect(category.trim()).not.toBe('');
    expect(name.trim()).not.toBe('');
    expect(Number(price)).toBeGreaterThan(0);
    expect(nameEn.trim()).not.toBe('');
    expect(nameDe.trim()).not.toBe('');
    if(description) {
      expect(descriptionEn.trim()).not.toBe('');
      expect(descriptionDe.trim()).not.toBe('');
    }
    expect(Array.isArray(allergenCodes)).toBe(true);
    for(const code of allergenCodes)expect(Number(code)).toBeGreaterThanOrEqual(1);
    const key=`${category}\u0000${name}`;
    expect(seen.has(key),`duplicate menu candidate row ${category} / ${name}`).toBe(false);
    seen.add(key);categories.add(category);
  }
  expect(seen.size).toBe(38);
  expect(categories.size).toBe(7);
});

test('Trastevere remains fail-closed while its primary first-party menu asset is broken',async()=>{
  const candidate=readJson('trastevere-116-source-candidate-2026-08-20.json');
  expect(candidate.restaurant_id).toBe(116);
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.candidate_status).toContain('BLOCKED');
  expect(candidate.source_evidence.primary_menu_asset.http_status).toBe(404);
  expect(candidate.source_evidence.primary_menu_asset.renderable).toBe(false);
  expect(candidate.source_evidence['2019_asset'].menu_role).toBe(false);
  expect(candidate.hard_boundaries.use_header_logo_as_menu).toBe(false);
  expect(candidate.hard_boundaries.treat_404_asset_as_complete).toBe(false);
});

test('Soul Kitchen is a first-party 12-asset structuring candidate but never a finished guest menu',async()=>{
  const candidate=readJson('soul-kitchen-234-source-candidate-2026-08-20.json');
  expect(candidate.restaurant_id).toBe(234);
  expect(candidate.candidate_status).toBe('FIRST_PARTY_HOSTED_IMAGE_SOURCE_CAPTURED_EDITORIAL_STRUCTURING_REQUIRED');
  expect(candidate.production_import_allowed).toBe(false);
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.guest_publish_allowed).toBe(false);
  expect(candidate.source.source_authority).toBe('first_party');
  expect(candidate.source.coverage_scope).toBe('full_menu');
  expect(candidate.source.completeness_status).toBe('image_complete');
  expect(candidate.assets.expected_count).toBe(12);
  expect(candidate.assets.urls).toHaveLength(12);
  expect(new Set(candidate.assets.urls).size).toBe(12);
  expect(candidate.assets.urls.every(url=>url.startsWith('https://menurestauranteqr.es/'))).toBe(true);
  expect(candidate.hard_boundaries.image_source_is_finished_guest_menu).toBe(false);
  expect(candidate.hard_boundaries.auto_publish).toBe(false);
  expect(candidate.hard_boundaries.production_insert).toBe(false);
});

test('five new kids-menu facts stay granular and cannot fabricate Eat & Play geometry',async()=>{
  const candidate=readRootJson('region1-family-gap-candidates-2026-08-20.json');
  expect(candidate.production_import_allowed).toBe(false);
  expect(candidate.production_mutation_performed).toBe(false);
  expect(candidate.candidates).toHaveLength(5);
  expect(new Set(candidate.candidates.map(row=>row.restaurant_id)).size).toBe(5);
  for(const row of candidate.candidates){
    expect(row.kids_menu).toBe(true);
    expect(row.source_authority).toBe('first_party');
    expect(row.source_url).toMatch(/^https:\/\//);
    expect(row.play_types).toEqual([]);
    expect(row.relationship).toBe('unknown');
    expect(row.access_type).toBe('unknown');
    expect(row.playground_distance_m).toBeNull();
    expect(row.visible_from_seating).toBeNull();
    expect(row.road_crossing).toBe('unknown');
    expect(row.fenced).toBeNull();
    expect(row.traffic_separated).toBeNull();
    expect(row.shade_available).toBeNull();
    expect(row.highchairs).toBeNull();
    expect(row.changing_facility).toBeNull();
    expect(row.stroller_friendly).toBeNull();
  }
  expect(candidate.release_gate.guest_playground_claim_allowed).toBe(false);
});

test('competitive watch tracks decision/data and distribution moats instead of only direct apps',async()=>{
  const registry=readRootJson('region1-competitor-registry-v1.0.json');
  const watch=readRootJson('region1-competitive-watch-config-v1.0.json');
  const ids=new Set(registry.competitors.map(row=>row.id));
  for(const id of ['viviendo-la-manga','tu-localidad-la-manga','restaurantes-la-manga','activa-neuromobile-region1'])expect(ids.has(id)).toBe(true);
  expect(registry.moat_model.decision_data_moat.length).toBeGreaterThanOrEqual(5);
  expect(registry.moat_model.distribution_moat.length).toBeGreaterThanOrEqual(5);
  expect(registry.distribution_ecosystems.some(row=>row.id==='el-paladar-tu-localidad-seo')).toBe(true);
  expect(watch.cadence.light_scan).toBe('weekly');
  expect(watch.cadence.full_benchmark).toBe('monthly');
  expect(watch.moat_dimensions.decision_data.length).toBeGreaterThanOrEqual(10);
  expect(watch.moat_dimensions.distribution.length).toBeGreaterThanOrEqual(8);
  expect(watch.hard_boundaries.copy_competitor_content).toBe(false);
  expect(watch.hard_boundaries.automatic_production_write).toBe(false);
});

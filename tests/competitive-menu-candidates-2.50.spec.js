const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const competitiveRoot=path.join(__dirname,'..','docs','competitive');
const candidateRoot=path.join(competitiveRoot,'menu-candidates');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(candidateRoot,name),'utf8'));
const readRootJson=name=>JSON.parse(fs.readFileSync(path.join(competitiveRoot,name),'utf8'));
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');

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
    if(description){expect(descriptionEn.trim()).not.toBe('');expect(descriptionDe.trim()).not.toBe('')}
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

test('Soul Kitchen full 12-page candidate is complete, hash-pinned, trilingual and non-publishing',async()=>{
  const source=readJson('soul-kitchen-234-source-candidate-2026-08-20.json');
  const manifest=readJson('soul-kitchen-234-structured-menu-candidate-2026-08-20.json');
  expect(source.restaurant_id).toBe(234);
  expect(source.candidate_status).toBe('STRUCTURED_TRILINGUAL_EDITORIAL_CANDIDATE_READY_FOR_HUMAN_REVIEW');
  expect(source.production_import_allowed).toBe(false);
  expect(source.production_mutation_performed).toBe(false);
  expect(source.guest_publish_allowed).toBe(false);
  expect(source.source.source_authority).toBe('first_party');
  expect(source.source.completeness_status).toBe('image_complete');
  expect(source.assets.expected_count).toBe(12);
  expect(source.assets.urls).toHaveLength(12);
  expect(source.structured_candidate.items).toBe(162);
  expect(source.structured_candidate.assistant_draft_translation_rows).toBe(30);

  expect(manifest.restaurant_id).toBe(234);
  expect(manifest.candidate_status).toBe('STRUCTURED_TRILINGUAL_EDITORIAL_CANDIDATE_NOT_PRODUCTION_APPLIED');
  expect(manifest.production_mutation_performed).toBe(false);
  expect(manifest.guest_publish_allowed).toBe(false);
  expect(manifest.counts).toEqual({items:162,food_and_dessert_items:61,beverage_items:101,sections:23,source_printed_or_proper_name_rows:132,rows_with_assistant_draft_translation:30});
  expect(manifest.parts).toHaveLength(6);
  expect(manifest.integrity.total_items_across_parts).toBe(162);
  expect(Object.keys(manifest.source_image_sha256)).toHaveLength(12);
  expect(manifest.allergen_policy.guest_claims_allowed).toBe(false);
  expect(manifest.hard_boundaries.auto_publish).toBe(false);
  expect(manifest.hard_boundaries.production_insert).toBe(false);
  expect(manifest.hard_boundaries.assistant_translation_auto_curated).toBe(false);

  const rows=[];
  for(const meta of manifest.parts){
    const raw=fs.readFileSync(path.join(candidateRoot,meta.file));
    expect(sha256(raw),`${meta.file} content hash must stay pinned`).toBe(meta.sha256);
    const part=JSON.parse(raw.toString('utf8'));
    expect(part.restaurant_id).toBe(234);
    expect(part.source_pages).toEqual(meta.source_pages);
    expect(part.items).toHaveLength(meta.items);
    rows.push(...part.items);
  }
  expect(rows).toHaveLength(162);

  const seen=new Set(),sections=new Set();let drafts=0,sourceOrProper=0,food=0,drinks=0;
  const allowedOrigins=new Set(['source_printed_trilingual','proper_name_source','assistant_draft_translation_requires_review']);
  for(const row of rows){
    expect(row).toHaveLength(13);
    const [sectionEs,sectionDe,sectionEn,nameEs,nameDe,nameEn,detailsEs,detailsDe,detailsEn,price,serving,page,origin]=row;
    for(const value of [sectionEs,sectionDe,sectionEn,nameEs,nameDe,nameEn])expect(String(value).trim()).not.toBe('');
    expect(Number(price)).toBeGreaterThan(0);
    expect(Number(page)).toBeGreaterThanOrEqual(1);expect(Number(page)).toBeLessThanOrEqual(12);
    expect(allowedOrigins.has(origin)).toBe(true);
    if(detailsEs){expect(String(detailsDe).trim()).not.toBe('');expect(String(detailsEn).trim()).not.toBe('')}
    if(origin==='assistant_draft_translation_requires_review')drafts++;
    else sourceOrProper++;
    if(Number(page)<=6)food++;else drinks++;
    sections.add(sectionEs);
    const key=`${sectionEs}\u0000${nameEs}\u0000${price}\u0000${serving??''}`;
    expect(seen.has(key),`duplicate Soul Kitchen candidate row ${key}`).toBe(false);
    seen.add(key);
  }
  expect(seen.size).toBe(162);
  expect(sections.size).toBe(23);
  expect(drafts).toBe(30);
  expect(sourceOrProper).toBe(132);
  expect(food).toBe(61);
  expect(drinks).toBe(101);
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

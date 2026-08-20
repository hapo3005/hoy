const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const readJson=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'..','docs','competitive','menu-candidates',name),'utf8'));

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

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function liveReady(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true&&window.hoyFamilyDataCompletion242?.state?.status==='ready',{timeout:30000});
}

async function researchBundle(request){
  const [enrichment,batch,completion]=await Promise.all([
    request.get('./data/family-profile-enrichment-2026-08-17.json').then(r=>r.json()),
    request.get('./data/family-profile-batch2-2026-08-17.json').then(r=>r.json()),
    request.get('./data/family-profile-completion-2026-08-17.json').then(r=>r.json())
  ]);
  const merged=new Map();
  for(const row of [
    ...(enrichment.profiles||[]),
    ...(batch.profiles||[]),
    ...(completion.live_profiles||[]),
    ...(completion.profile_patches||[])
  ]){
    const current=merged.get(row.slug)||{};
    merged.set(row.slug,{...current,...row,data_quality:{...(current.data_quality||{}),...(row.data_quality||{})},services:{...(current.services||{}),...(row.services||{})}});
  }
  return {enrichment,batch,completion,merged};
}

test('live Family authority keeps research preview profiles inert instead of duplicating current Production',async({page})=>{
  await liveReady(page);
  const before=await page.evaluate(()=>({
    mode:window.hoyFamilyAuditedPreview240.state.mode,
    researchReady:window.hoyFamilyAuditedPreview240.state.readyCount,
    virtual:window.hoyFamilyAuditedPreview240.state.virtualCount,
    virtualInData:DATA.filter(x=>x.__family240_preview_profile===true).length,
    auditedInjected:DATA.filter(x=>x.family_features?.__family240_audited===true).length
  }));
  expect(before.mode).toBe('live');
  expect(before.researchReady).toBeGreaterThanOrEqual(17);
  expect(before.virtual).toBe(0);
  expect(before.virtualInData).toBe(0);
  expect(before.auditedInjected).toBe(0);

  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);
  await expect(page.locator('[data-journey-results] .list-card[data-open]').first()).toBeVisible();
});

test('Family research inventory remains fully sourced and explicitly non-production after live promotion',async({request})=>{
  const {enrichment,batch,completion}=await researchBundle(request);

  expect(enrichment.production_import_allowed).toBe(false);
  expect(enrichment.profiles).toHaveLength(13);
  expect(new Set(enrichment.profiles.map(x=>x.slug)).size).toBe(13);
  for(const p of enrichment.profiles){
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.address.length).toBeGreaterThan(10);
    expect(p.sources.length).toBeGreaterThan(0);
    expect(p.profile_checked_at).toBe('2026-08-17');
  }

  expect(batch.production_import_allowed).toBe(false);
  expect(batch.profiles).toHaveLength(5);
  expect(batch.profiles.filter(x=>x.family_publication_allowed===true)).toHaveLength(2);
  expect(batch.profiles.filter(x=>x.family_publication_allowed===false)).toHaveLength(3);
  expect(batch.profiles.every(x=>x.profile_publication_allowed===false)).toBe(true);

  expect(completion.production_import_allowed).toBe(false);
  expect(completion.quality_gate).toMatchObject({visible_family_profiles:19,release_ready:13,conditional:5,blocked:1});
  expect(completion.live_profiles).toHaveLength(4);
  expect(completion.profile_patches).toHaveLength(15);
});

test('high-value Family research keeps operator routes and current contact truth without claiming an imported HOY menu',async({request})=>{
  const {merged}=await researchBundle(request);

  const rusticana=merged.get('la-rusticana');
  expect(rusticana).toBeTruthy();
  expect(rusticana.data_quality.menu_status).toBe('official_source');
  expect(rusticana.services.reservation).toBe('available');

  const marea=merged.get('marea-narejos');
  expect(marea).toBeTruthy();
  expect(marea.data_quality.menu_status).toBe('official_complete_source');
  expect(marea.reservation_url).toBeTruthy();
  expect(marea.features.join(' ')).toMatch(/Mini Golf|Splash/);

  const sebastian=merged.get('pizzeria-da-sebastian');
  expect(sebastian).toBeTruthy();
  expect(sebastian.data_quality.menu_status).toBe('official_complete_source');
  expect(sebastian.services).toMatchObject({pickup:'not_published',delivery:'not_published'});

  const mediterraneo=merged.get('restaurante-mediterraneo-el-mojon');
  expect(mediterraneo).toBeTruthy();
  expect(mediterraneo.municipality).toBe('Pilar de la Horadada');
  expect(mediterraneo.services).toMatchObject({pickup:'available',delivery:'unavailable'});

  const jose=merged.get('confiteria-cafe-jose-antonio');
  expect(jose).toBeTruthy();
  expect(jose.phone).toBe('+34 636 756 940');
  expect(jose.phone).not.toContain('638 958 995');
  expect(jose.hours).toContain('Lo-Pagán-Filiale');
  expect(jose.data_quality.hours_status).toBe('not_published');
});

test('blocked Family profiles stay blocked even though their base research remains useful',async({request})=>{
  const {batch}=await researchBundle(request);
  const locked=batch.profiles.filter(x=>x.family_publication_allowed===false);
  expect(locked.map(x=>x.slug).sort()).toEqual(['kinita-restaurant-beach-club','pizzeria-nicos-bar','restaurante-imperial-la-manga']);
  for(const p of locked){
    expect(p.profile_publication_allowed).toBe(false);
    expect(p.family_status).toBe('verification_required');
    expect(p.family_block_reason.length).toBeGreaterThan(40);
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.sources.length).toBeGreaterThan(0);
  }
});

test('Family research and completion modules remain read-only with no database write path',async({request})=>{
  for(const path of ['./family-profile-enrichment-2.40.js','./family-research-standard-2.41.js','./family-data-completion-2.42.js']){
    const js=await (await request.get(path)).text();
    expect(js).not.toMatch(/\.insert\s*\(/);
    expect(js).not.toMatch(/\.upsert\s*\(/);
    expect(js).not.toMatch(/\.update\s*\(/);
    expect(js).not.toMatch(/\.delete\s*\(/);
    expect(js).not.toMatch(/sb\.from\s*\(/);
  }
});

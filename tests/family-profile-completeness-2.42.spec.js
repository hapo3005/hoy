const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openFamily(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true&&window.hoyFamilyDataCompletion242?.state?.status==='ready',{timeout:30000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText('19');
}

async function openFamilyCard(page,name){
  const card=page.locator('[data-journey-results] .list-card[data-open]',{hasText:name}).first();
  await expect(card).toBeVisible();
  await card.click();
  const detail=page.locator('#detail [data-family240-enriched-profile]');
  await expect(detail).toBeVisible();
  return detail;
}

test('2.42 completion assets are wired after the Family research standard and remain non-production',async({request})=>{
  const html=await (await request.get('./index.html')).text();
  expect(html).toContain('family-data-completion-2.42.js?v=2.42.0');
  expect(html.indexOf('family-data-completion-2.42.js?v=2.42.0')).toBeGreaterThan(html.indexOf('family-research-standard-2.41.js?v=2.41.0'));

  const data=await (await request.get('./data/family-profile-completion-2026-08-17.json')).json();
  const provenance=await (await request.get('./data/family-profile-completion-sources-2026-08-17.json')).json();
  expect(data.production_import_allowed).toBe(false);
  expect(provenance.production_import_allowed).toBe(false);
  expect(data.live_profiles).toHaveLength(4);
  expect(data.profile_patches).toHaveLength(15);
  expect(provenance.sources).toHaveLength(15);
  expect(new Set([...data.live_profiles,...data.profile_patches].map(x=>x.slug)).size).toBe(19);
  expect(new Set(provenance.sources.map(x=>x.slug)).size).toBe(15);
  expect(provenance.sources.every(x=>x.completion_sources.length>0&&x.completion_sources.every(s=>/^https:\/\//.test(s.url)))).toBe(true);

  const js=await (await request.get('./family-data-completion-2.42.js')).text();
  for(const pattern of [/\.insert\s*\(/,/\.upsert\s*\(/,/\.update\s*\(/,/\.delete\s*\(/,/sb\.from\s*\(/])expect(js).not.toMatch(pattern);
});

test('the 19-profile completion gate distinguishes completed facts from conflicts instead of padding unknowns',async({request})=>{
  const data=await (await request.get('./data/family-profile-completion-2026-08-17.json')).json();
  expect(data.quality_gate).toMatchObject({visible_family_profiles:19,release_ready:13,conditional:5,blocked:1});

  const all=[...data.live_profiles,...data.profile_patches];
  const status=x=>x.data_quality?.profile_status;
  expect(all.filter(x=>status(x)==='release_ready')).toHaveLength(13);
  expect(all.filter(x=>status(x)==='conditional')).toHaveLength(5);
  expect(all.filter(x=>status(x)==='blocked').map(x=>x.slug)).toEqual(['restaurante-bamboo-la-manga']);
  for(const row of all.filter(x=>status(x)==='release_ready'))expect(Object.values(row.services||{})).not.toContain('unknown');

  const bamboo=all.find(x=>x.slug==='restaurante-bamboo-la-manga');
  expect(bamboo.data_quality.hours_status).toBe('conflict');
  expect(bamboo.data_quality.contact_status).toBe('conflict');
  expect(bamboo.hours).toContain('widersprechen');

  const aquarium=all.find(x=>x.slug==='aquarium-la-manga-club-resort');
  expect(aquarium.data_quality.profile_status).toBe('conditional');
  expect(aquarium.data_quality.hours_status).toBe('conflict');
});

test('high-value profile gaps are closed with precise concluded states',async({request})=>{
  const data=await (await request.get('./data/family-profile-completion-2026-08-17.json')).json();
  const rows=new Map(data.profile_patches.map(x=>[x.slug,x]));

  expect(rows.get('la-tap-pizzella').services.delivery).toBe('available');
  expect(rows.get('la-tap-pizzella').data_quality.hours_status).toBe('conflict');
  expect(rows.get('restaurante-la-encarnacion').hours).toBe('Täglich 08:00–23:00');
  expect(rows.get('casa-lucrecia').hours).toBe('Mo geschlossen · Di–So 12:00–17:30');
  expect(rows.get('casa-lucrecia').services).toMatchObject({pickup:'available',delivery:'unavailable'});
  expect(rows.get('mardesal').reservation_url).toBe('https://www.mardesal.com/reservas/');
  expect(rows.get('chiringuito-calisto').services).toMatchObject({pickup:'available',delivery:'unavailable'});
  expect(rows.get('chiringuito-calisto').data_quality.hours_status).toBe('conflict');
  expect(rows.get('porto-chico').hours).toContain('So 09:00–18:30');

  const jose=rows.get('confiteria-cafe-jose-antonio');
  expect(jose.data_quality.hours_status).toBe('not_published');
  expect(jose.hours).toContain('Lo-Pagán-Filiale');
  expect(jose.hours).not.toMatch(/06:00|14:00/);
  expect(jose.services.reservation).toBe('not_applicable');

  expect(rows.get('pizzeria-da-sebastian').data_quality.menu_status).toBe('official_complete_source');
  expect(rows.get('pizzeria-da-sebastian').services).toMatchObject({pickup:'not_published',delivery:'not_published'});
  expect(rows.get('restaurante-mediterraneo-el-mojon').services).toMatchObject({pickup:'available',delivery:'unavailable'});
});

test('completed research data encodes not-published and unavailable services as truth while live Family remains authoritative',async({request})=>{
  const data=await (await request.get('./data/family-profile-completion-2026-08-17.json')).json();
  const rows=new Map(data.profile_patches.map(x=>[x.slug,x]));

  const rusticana=rows.get('la-rusticana');
  expect(rusticana.data_quality.profile_status).toBe('release_ready');
  expect(rusticana.services).toMatchObject({reservation:'available',pickup:'not_published',delivery:'not_published'});
  expect(Object.values(rusticana.services)).not.toContain('unknown');

  const casa=rows.get('casa-lucrecia');
  expect(casa.data_quality.profile_status).toBe('release_ready');
  expect(casa.services).toMatchObject({reservation:'available',pickup:'available',delivery:'unavailable'});
  expect(casa.hours).toBe('Mo geschlossen · Di–So 12:00–17:30');
});

test('the four existing Family venues use the same premium completion depth inside Family only',async({page})=>{
  await openFamily(page);
  let detail=await openFamilyCard(page,'Restaurante La Plaza');
  await expect(detail.locator('.family240-enriched-preview')).toHaveText('LIVE');
  await expect(detail.locator('.family240-enriched-hero-brand small')).toHaveText('HOY PROFIL');
  await expect(detail).toHaveAttribute('data-family242-quality','release_ready');
  await expect(detail).toContainText('722 808 081');
  await expect(detail).toContainText('So–Do 13:00–23:00');
  await expect(detail).toContainText('Live veröffentlicht');
  await expect(detail).not.toContainText('Noch nicht live veröffentlicht');
  await page.locator('#detail [data-close]').click();

  detail=await openFamilyCard(page,'Aquarium La Manga Club Resort');
  await expect(detail).toHaveAttribute('data-family242-quality','conditional');
  await expect(detail).toContainText('Quellen widersprechen sich');
  await page.locator('#detail [data-close]').click();

  await page.locator('[data-decision="all"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  const restored=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===96);
    return {quality:p?.profile_quality,completion:p?.__family242_completion||false};
  });
  expect(restored.completion).toBe(false);
  expect(restored.quality).toBe('basic');
  await page.evaluate(()=>openDetail(96));
  await expect(page.locator('#detail [data-family240-enriched-profile]')).toHaveCount(0);
});

test('normal HOY never loads virtual completion profiles without explicit Family preview activation',async({page})=>{
  await page.goto('./?familyPreview=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online',{timeout:30000});
  expect(await page.evaluate(()=>DATA.filter(x=>x.__family240_preview_profile===true).length)).toBe(0);
  expect(await page.evaluate(()=>window.hoyFamilyDataCompletion242?.state?.status||'idle')).toBe('idle');
});

test('completion keeps media rights and Family geometry fail-closed',async({request})=>{
  const data=await (await request.get('./data/family-profile-completion-2026-08-17.json')).json();
  const raw=JSON.stringify(data);
  expect(raw).toContain('rights_not_cleared');
  expect(raw).not.toMatch(/"image"\s*:\s*"https?:\/\//i);
  expect(raw).not.toMatch(/"photo"\s*:\s*"https?:\/\//i);

  const master=await (await request.get('./data/family-gastro-master-2026-08-16.json')).json();
  const rusticana=master.entries.find(x=>x.slug==='la-rusticana');
  expect(rusticana.family.visible_from_seating).toBe(null);
  const delta=await (await request.get('./data/family-research-delta-2026-08-17.json')).json();
  const sebastian=delta.promotions.find(x=>x.slug==='pizzeria-da-sebastian');
  expect(sebastian.family.visible_from_seating).toBe(null);
});

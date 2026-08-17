const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openFamily(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText('19');
}

async function openDraft(page,name){
  const card=page.locator('.family240-research-card',{hasText:name}).first();
  await expect(card).toBeVisible();
  await card.click();
  const detail=page.locator('#detail [data-family240-enriched-profile]');
  await expect(detail).toBeVisible();
  return detail;
}

test('La Rusticana opens with normal premium profile depth while staying a truthful preview',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'La Rusticana');

  await expect(detail.locator('.family240-enriched-preview')).toHaveText('VORSCHAU');
  await expect(detail.locator('.family240-enriched-identity h2')).toHaveText('La Rusticana');
  await expect(detail).toContainText('Carretera de Atamaría 76B');
  await expect(detail).toContainText('+34 626 919 020');
  await expect(detail).toContainText('Mo–Di geschlossen');
  await expect(detail.locator('.family240-enriched-actions a')).toHaveCount(4);
  await expect(detail.locator('.family240-enriched-status')).toContainText('Premium-Profil vorbereitet');
  await expect(detail.locator('.family240-enriched-status')).toContainText('Noch nicht live veröffentlicht');

  await expect(detail.locator('#family240-enriched-overview')).toBeVisible();
  await expect(detail.locator('#family240-enriched-menu')).toBeVisible();
  await expect(detail.locator('#family240-enriched-family')).toBeVisible();
  await expect(detail.locator('#family240-enriched-info')).toBeVisible();
  await expect(detail.locator('#family240-enriched-menu')).toContainText('Offizielle Kartenquelle');
  await expect(detail.locator('#family240-enriched-menu')).not.toContainText('HOY SPEISEKARTE');

  const family=detail.locator('#family240-enriched-family');
  await expect(family).toContainText('Essen & Spielen');
  await expect(family).toContainText('Spielplatz');
  await expect(family).toContainText('Keine Straßenquerung');
  await expect(family).not.toContainText('Vom Tisch sichtbar');
  await family.locator('summary').click();
  await expect(family).toContainText('Vom Betrieb bestätigt');

  await expect(detail.locator('.family240-enriched-source')).toHaveCount(2);
  await expect(detail.locator('.family240-enriched-source').first()).toHaveAttribute('href',/^https:\/\//);

  const layout=await page.locator('#detail').evaluate(dialog=>({
    overflow:dialog.scrollWidth>dialog.clientWidth+1,
    pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    heroHeight:dialog.querySelector('.family240-enriched-hero').getBoundingClientRect().height
  }));
  expect(layout.overflow).toBe(false);
  expect(layout.pageOverflow).toBe(false);
  expect(layout.heroHeight).toBeLessThanOrEqual(230);
});

test('all 15 unpublished Family venues have sourced premium profile research',async({page,request})=>{
  const baselineResponse=await request.get('./data/family-profile-enrichment-2026-08-17.json');
  expect(baselineResponse.ok()).toBe(true);
  const baseline=await baselineResponse.json();
  expect(baseline.production_import_allowed).toBe(false);
  expect(baseline.profiles).toHaveLength(13);
  expect(new Set(baseline.profiles.map(x=>x.slug)).size).toBe(13);
  for(const p of baseline.profiles){
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.address.length).toBeGreaterThan(10);
    expect(p.sources.length).toBeGreaterThan(0);
    expect(p.profile_checked_at).toBe('2026-08-17');
  }

  const batchResponse=await request.get('./data/family-profile-batch2-2026-08-17.json');
  expect(batchResponse.ok()).toBe(true);
  const batch=await batchResponse.json();
  expect(batch.production_import_allowed).toBe(false);
  expect(batch.profiles).toHaveLength(5);
  expect(batch.profiles.filter(x=>x.family_publication_allowed===true)).toHaveLength(2);
  expect(batch.profiles.filter(x=>x.family_publication_allowed===false)).toHaveLength(3);
  expect(batch.profiles.every(x=>x.profile_publication_allowed===false)).toBe(true);

  await openFamily(page);
  const coverage=await page.evaluate(()=>({
    baselineEnrichments:window.hoyFamilyProfileEnrichment240.state.profiles.length,
    batch2:window.hoyFamilyResearchStandard241.state.profiles.length,
    drafts:DATA.filter(x=>x.__family240_preview_profile===true).length,
    missing:DATA.filter(x=>x.__family240_preview_profile===true).filter(x=>!window.hoyFamilyProfileEnrichment240.profileFor(x)&&!window.hoyFamilyResearchStandard241.profileFor(x)).map(x=>x.slug)
  }));
  expect(coverage.baselineEnrichments).toBe(13);
  expect(coverage.batch2).toBe(5);
  expect(coverage.drafts).toBe(15);
  expect(coverage.missing).toEqual([]);
});

test('operator-backed profiles expose official menu and reservation paths without claiming an imported HOY menu',async({page})=>{
  await openFamily(page);

  let detail=await openDraft(page,'Marea Narejos');
  await expect(detail).toContainText('Calle Bergantín 6');
  await expect(detail).toContainText('täglich 09:00–00:00');
  await expect(detail.locator('#family240-enriched-menu a')).toHaveAttribute('href','https://www.mareanarejos.com/carta/');
  await expect(detail.locator('.family240-enriched-actions a[href="https://www.mareanarejos.com/reservas/"]')).toHaveCount(1);
  await expect(detail).toContainText('Mini Golf');
  await expect(detail).toContainText('Splash');
  await expect(detail).not.toContainText('HOY SPEISEKARTE');
  await page.locator('#detail [data-close]').click();

  detail=await openDraft(page,'Si! Bar & Restaurant');
  await expect(detail).toContainText('Küche 12:00–22:50');
  await expect(detail.locator('#family240-enriched-menu a')).toHaveAttribute('href','https://www.si-bar.eu/sibarmenu');
  await expect(detail.locator('.family240-enriched-actions a[href="https://www.si-bar.eu/reserve"]')).toHaveCount(1);
  await expect(detail).toContainText('Sportübertragungen');
  await expect(detail).not.toContainText('HOY SPEISEKARTE');
});

test('newly verified Da Sebastián receives a full premium profile and truthful Family facts',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'Pizzería Da Sebastián');
  await expect(detail).toContainText('km 8.5');
  await expect(detail).toContainText('+34 968 337 063');
  await expect(detail).toContainText('Täglich 13:30–16:00');
  await expect(detail.locator('#family240-enriched-menu a')).toHaveAttribute('href','https://pizzeriadasebastian.com/');
  const family=detail.locator('#family240-enriched-family');
  await expect(family).toContainText('Spielplatz');
  await family.locator('summary').click();
  await expect(family).toContainText('Kindergerichte');
  await expect(family).toContainText('Quelle geprüft');
  await expect(family).not.toContainText('Vom Tisch sichtbar');
  await expect(detail).not.toContainText('HOY SPEISEKARTE');
});

test('newly verified Mediterráneo keeps its real municipality and only supported Family facts',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'Restaurante Mediterráneo El Mojón');
  await expect(detail).toContainText('Pilar de la Horadada');
  await expect(detail).toContainText('Calle Madrid 1');
  await expect(detail).toContainText('+34 965 355 319');
  await expect(detail).not.toContainText('San Pedro del Pinatar');
  const family=detail.locator('#family240-enriched-family');
  await expect(family).toContainText(/Indoor-Spiel|Spielraum/);
  await family.locator('summary').click();
  await expect(family).toContainText('Hochstühle');
  await expect(family).toContainText('Quelle geprüft');
  await expect(family).not.toContainText('Vom Tisch sichtbar');
});

test('premium base profiles can exist while Family publication remains blocked',async({page,request})=>{
  const response=await request.get('./data/family-profile-batch2-2026-08-17.json');
  const batch=await response.json();
  const locked=batch.profiles.filter(x=>x.family_publication_allowed===false);
  expect(locked.map(x=>x.slug).sort()).toEqual(['kinita-restaurant-beach-club','pizzeria-nicos-bar','restaurante-imperial-la-manga']);
  for(const p of locked){
    expect(p.profile_publication_allowed).toBe(false);
    expect(p.family_status).toBe('verification_required');
    expect(p.family_block_reason.length).toBeGreaterThan(40);
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.sources.length).toBeGreaterThan(0);
  }

  await openFamily(page);
  const visible=await page.evaluate(()=>({
    locked:window.hoyFamilyResearchStandard241.state.lockedCount,
    slugs:DATA.filter(x=>x.__family240_preview_profile===true).map(x=>x.slug)
  }));
  expect(visible.locked).toBe(3);
  expect(visible.slugs).not.toContain('restaurante-imperial-la-manga');
  expect(visible.slugs).not.toContain('kinita-restaurant-beach-club');
  expect(visible.slugs).not.toContain('pizzeria-nicos-bar');
  await expect(page.locator('.family240-research-card',{hasText:'Imperial La Manga'})).toHaveCount(0);
  await expect(page.locator('.family240-research-card',{hasText:'Kinita Restaurant & Beach Club'})).toHaveCount(0);
  await expect(page.locator('.family240-research-card',{hasText:"Pizzeria Nico's Bar"})).toHaveCount(0);
});

test('José Antonio uses the current official Lo Pagán contact and never revives stale public details',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'Confitería Café José Antonio');
  await expect(detail).toContainText('Avenida Romería Virgen del Carmen 99');
  await expect(detail).toContainText('+34 636 756 940');
  await expect(detail).not.toContainText('638 958 995');
  await expect(detail).not.toContainText('07:00–03:00');
  await expect(detail).toContainText('separaten Obrador');
  await expect(detail.locator('#family240-enriched-menu')).toContainText('Offizieller Produktkatalog');
});

test('source-verified Family facts stay source-verified and normal HOY profiles are untouched',async({page})=>{
  await openFamily(page);
  let detail=await openDraft(page,'Restaurante Bamboo');
  await detail.locator('#family240-enriched-family summary').click();
  await expect(detail.locator('#family240-enriched-family')).toContainText('Quelle geprüft');
  await expect(detail.locator('#family240-enriched-family')).not.toContainText('Vom Betrieb bestätigt');
  await page.locator('#detail [data-close]').click();

  await page.locator('[data-decision="all"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  const normalId=await page.evaluate(()=>DATA.find(x=>!x.__family240_preview_profile)?.id);
  await page.evaluate(id=>openDetail(id),normalId);
  await expect(page.locator('#detail [data-family240-enriched-profile]')).toHaveCount(0);
});

test('premium enrichment and research standard are read-only and contain no database write path',async({request})=>{
  for(const path of ['./family-profile-enrichment-2.40.js','./family-research-standard-2.41.js']){
    const js=await (await request.get(path)).text();
    expect(js).not.toMatch(/\.insert\s*\(/);
    expect(js).not.toMatch(/\.upsert\s*\(/);
    expect(js).not.toMatch(/\.update\s*\(/);
    expect(js).not.toMatch(/\.delete\s*\(/);
    expect(js).not.toMatch(/sb\.from\s*\(/);
  }
});

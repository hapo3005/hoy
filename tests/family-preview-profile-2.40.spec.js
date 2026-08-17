const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openFamily(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready',{timeout:30000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText('17');
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

test('all 13 unpublished Family venues have sourced premium profile research',async({page,request})=>{
  const r=await request.get('./data/family-profile-enrichment-2026-08-17.json');
  expect(r.ok()).toBe(true);
  const master=await r.json();
  expect(master.production_import_allowed).toBe(false);
  expect(master.profiles).toHaveLength(13);
  expect(new Set(master.profiles.map(x=>x.slug)).size).toBe(13);
  for(const p of master.profiles){
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.address.length).toBeGreaterThan(10);
    expect(p.sources.length).toBeGreaterThan(0);
    expect(p.profile_checked_at).toBe('2026-08-17');
  }

  await openFamily(page);
  const coverage=await page.evaluate(()=>({
    enrichments:window.hoyFamilyProfileEnrichment240.state.profiles.length,
    drafts:DATA.filter(x=>x.__family240_preview_profile===true).length,
    missing:DATA.filter(x=>x.__family240_preview_profile===true).filter(x=>!window.hoyFamilyProfileEnrichment240.profileFor(x)).map(x=>x.slug)
  }));
  expect(coverage.enrichments).toBe(13);
  expect(coverage.drafts).toBe(13);
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

test('premium enrichment is read-only and contains no database write path',async({request})=>{
  const js=await (await request.get('./family-profile-enrichment-2.40.js')).text();
  expect(js).not.toMatch(/\.insert\s*\(/);
  expect(js).not.toMatch(/\.upsert\s*\(/);
  expect(js).not.toMatch(/\.update\s*\(/);
  expect(js).not.toMatch(/\.delete\s*\(/);
  expect(js).not.toMatch(/sb\.from\s*\(/);
});

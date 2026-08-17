const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openFamily(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.__hoyFamilyPreviewProfile240===true,{timeout:30000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText('17');
}

async function openDraft(page,name){
  const card=page.locator('.family240-research-card',{hasText:name}).first();
  await expect(card).toBeVisible();
  await card.click();
  const detail=page.locator('#detail [data-family240-preview-detail]');
  await expect(detail).toBeVisible();
  return detail;
}

test('La Rusticana opens as a premium truthful HOY Family preview instead of a research/debug screen',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'La Rusticana');

  await expect(detail.locator('.family240-preview-hero')).toContainText('HOY FAMILY');
  await expect(detail.locator('.family240-preview-chip')).toHaveText('VORSCHAU');
  await expect(detail.locator('.family240-preview-title h2')).toHaveText('La Rusticana');
  await expect(detail.locator('[data-family240-preview-status] h3')).toHaveText('Auditiert für HOY Family');
  await expect(detail.locator('[data-family240-preview-status]')).toContainText('Das vollständige HOY-Profil ist noch nicht live');
  await expect(detail).not.toContainText('RESEARCH-DRAFT');
  await expect(detail).not.toContainText('RESEARCH\nNICHT LIVE');

  const family=detail.locator('[data-family240-preview-family]');
  await expect(family).toContainText('Essen & Spielen');
  await expect(family).toContainText('Spielplatz');
  await expect(family).toContainText('Keine Straßenquerung');
  await expect(family).not.toContainText('Vom Tisch sichtbar');
  await expect(family.locator('.family240-preview-family-head em')).toContainText('Vom Betrieb bestätigt');

  const source=detail.locator('.family240-preview-source');
  await expect(source).toHaveAttribute('href','https://la-rusticana-restaurante-y-bar1.webnode.es/');
  await expect(source).toHaveText('Quelle ansehen ↗');

  await detail.locator('[data-family240-preview-details] summary').click();
  await expect(detail.locator('.family240-preview-fact-group')).toHaveCount(2);
  await expect(detail).toContainText('Spiel & Lage');
  await expect(detail).toContainText('Prüfstatus');
  await expect(detail).not.toContainText('Komfort für Familien');

  const layout=await page.locator('#detail').evaluate(dialog=>({
    overflow:dialog.scrollWidth>dialog.clientWidth+1,
    pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    heroHeight:dialog.querySelector('.family240-preview-hero').getBoundingClientRect().height
  }));
  expect(layout.overflow).toBe(false);
  expect(layout.pageOverflow).toBe(false);
  expect(layout.heroHeight).toBeLessThanOrEqual(190);
});

test('source-verified preview profiles never inherit an operator-confirmed claim',async({page})=>{
  await openFamily(page);
  const detail=await openDraft(page,'Restaurante Bamboo');
  const proof=detail.locator('.family240-preview-family-head em');
  await expect(proof).toContainText('Quelle geprüft');
  await expect(proof).not.toContainText('Vom Betrieb bestätigt');
  await expect(detail).not.toContainText('Vom Tisch sichtbar');
});

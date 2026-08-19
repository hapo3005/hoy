const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

const EXPECTED_LIVE_FAMILY_IDS=[96,101,132,218,243,244,245,246,247,248,249,250,251,252,253,254];

async function ready(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true&&window.hoyFamilyDataCompletion242?.state?.status==='ready',{timeout:30000});
}

test('live verified Family data takes precedence over the audited research preview without losing the research inventory',async({page})=>{
  await ready(page);

  const initial=await page.evaluate(()=>({
    ready:window.hoyFamilyAuditedPreview240.state.readyCount,
    existing:window.hoyFamilyAuditedPreview240.state.existingCount,
    virtual:window.hoyFamilyAuditedPreview240.state.virtualCount,
    mode:window.hoyFamilyAuditedPreview240.state.mode,
    virtualInData:DATA.filter(x=>x.__family240_preview_profile===true).length,
    badStatus:window.hoyFamilyAuditedPreview240.state.entries.some(x=>x.verification==='hoy_verified'),
    liveIds:DATA.filter(p=>window.hoyFamilyPlaygrounds240.hasPlay(window.hoyFamilyPlaygrounds240.familyFor(p))).map(p=>Number(p.id)),
    locked:window.hoyFamilyResearchStandard241.state.lockedCount
  }));
  expect(initial.ready).toBe(19);
  expect(initial.existing).toBe(0);
  expect(initial.virtual).toBe(0);
  expect(initial.mode).toBe('live');
  expect(initial.virtualInData).toBe(0);
  expect(initial.badStatus).toBe(false);
  expect(initial.liveIds).toEqual(expect.arrayContaining(EXPECTED_LIVE_FAMILY_IDS));
  expect(initial.liveIds.length).toBeGreaterThanOrEqual(EXPECTED_LIVE_FAMILY_IDS.length);
  expect(initial.locked).toBe(3);

  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect.poll(()=>page.evaluate(()=>DATA.filter(x=>x.__family240_preview_profile===true).length)).toBe(0);
  await expect.poll(async()=>Number(await page.locator('[data-result-count]').textContent())).toBeGreaterThanOrEqual(EXPECTED_LIVE_FAMILY_IDS.length);
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
  await expect(page.locator('.list')).toContainText('Restaurante La Plaza');
  await expect(page.locator('.list')).toContainText('Si! Bar & Restaurant');

  await page.locator('[data-decision="all"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
});

test('audited research inventory keeps unknown Family geometry unknown while remaining inert beside live data',async({page})=>{
  await ready(page);
  const facts=await page.evaluate(()=>{
    const rows=window.hoyFamilyAuditedPreview240.state.entries||[];
    return {
      total:rows.length,
      unknownDistance:rows.filter(x=>x.family?.playground_distance_m==null).length,
      visibleTrue:rows.filter(x=>x.family?.visible_from_seating===true).length,
      visibleUnknown:rows.filter(x=>x.family?.visible_from_seating==null).length,
      inventedHoy:rows.some(x=>x.verification==='hoy_verified'),
      injected:DATA.some(x=>x.family_features?.__family240_audited===true||x.__family240_preview_profile===true)
    };
  });
  expect(facts.total).toBe(19);
  expect(facts.unknownDistance).toBe(19);
  expect(facts.visibleTrue).toBeGreaterThanOrEqual(1);
  expect(facts.visibleUnknown).toBeGreaterThan(0);
  expect(facts.inventedHoy).toBe(false);
  expect(facts.injected).toBe(false);
});

test('Family preview session remains reversible while live Production Family data stays authoritative',async({page})=>{
  await ready(page);
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('hoy_family_preview_session_240'))).toBe('1');
  expect(new URL(page.url()).searchParams.get('familyPreview')).toBe('1');
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);

  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyFamilyPreviewSession240?.enabled===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyAuditedPreview240?.state?.mode==='live'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
  expect(new URL(page.url()).searchParams.get('familyPreview')).toBe('1');
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);

  await page.goto('./?familyPreview=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyFamilyPreviewSession240?.enabled===false,{timeout:30000});
  expect(new URL(page.url()).searchParams.has('familyPreview')).toBe(false);
  expect(await page.evaluate(()=>sessionStorage.getItem('hoy_family_preview_session_240'))).toBeNull();
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
});

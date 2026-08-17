const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
}

test('audited Family preview exposes 19 research entries without leaking draft profiles into normal HOY',async({page})=>{
  await ready(page);

  const initial=await page.evaluate(()=>({
    ready:window.hoyFamilyAuditedPreview240.state.readyCount,
    existing:window.hoyFamilyAuditedPreview240.state.existingCount,
    virtual:window.hoyFamilyAuditedPreview240.state.virtualCount,
    mode:window.hoyFamilyAuditedPreview240.state.mode,
    virtualInData:DATA.filter(x=>x.__family240_preview_profile===true).length,
    badStatus:window.hoyFamilyAuditedPreview240.state.entries.some(x=>x.verification==='hoy_verified'),
    locked:window.hoyFamilyResearchStandard241.state.lockedCount
  }));
  expect(initial.ready).toBe(19);
  expect(initial.existing).toBe(4);
  expect(initial.virtual).toBe(15);
  expect(initial.mode).toBe('research');
  expect(initial.virtualInData).toBe(0);
  expect(initial.badStatus).toBe(false);
  expect(initial.locked).toBe(3);

  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect.poll(()=>page.evaluate(()=>DATA.filter(x=>x.__family240_preview_profile===true).length)).toBe(15);
  await expect(page.locator('[data-result-count]')).toHaveText('19');
  await expect(page.locator('[data-result-label]')).toContainText(/19|auditierte Family-Einträge|Research-Vorschau/);
  await expect(page.locator('[data-result-label]')).toContainText('auditierte Family-Einträge');
  await expect(page.locator('.family240-research-card')).toHaveCount(15);
  await expect(page.locator('.family240-research-card [data-fav]')).toHaveCount(0);
  await expect(page.locator('.family240-context-head small')).toContainText('keine Live-Veröffentlichung');

  const draft=page.locator('.family240-research-card').first();
  await expect(draft).toContainText('RESEARCH-DRAFT');
  await draft.click();

  const detail=page.locator('[data-family240-enriched-profile]');
  const status=detail.locator('.family240-enriched-status');
  const family=detail.locator('#family240-enriched-family');
  await expect(detail).toBeVisible();
  await expect(status).toBeVisible();
  await expect(status).toContainText('Premium-Profil vorbereitet');
  await expect(status).toContainText('Noch nicht live veröffentlicht');
  await expect(detail.locator('.family240-enriched-preview')).toHaveText('VORSCHAU');
  await expect(detail.locator('#family240-enriched-overview')).toBeVisible();
  await expect(detail.locator('#family240-enriched-menu')).toBeVisible();
  await expect(family).toBeVisible();
  await family.locator('summary').click();
  await expect(family).toContainText(/Vom Betrieb bestätigt|Quelle geprüft|Community bestätigt/);
  await expect(detail.locator('.family240-enriched-source').first()).toHaveAttribute('href',/^https:\/\//);
  await page.locator('#detail [data-close]').click();

  await page.locator('[data-decision="all"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect.poll(()=>page.evaluate(()=>DATA.filter(x=>x.__family240_preview_profile===true).length)).toBe(0);
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
});

test('audited preview keeps unknown Family facts unknown instead of inventing geometry',async({page})=>{
  await ready(page);
  await page.locator('[data-family240-home-context]').click();
  const facts=await page.evaluate(()=>{
    const rows=(DATA||[]).filter(x=>x.family_features?.__family240_audited===true);
    return {
      total:rows.length,
      unknownDistance:rows.filter(x=>x.family_features.playground_distance_m==null).length,
      visibleTrue:rows.filter(x=>x.family_features.visible_from_seating===true).length,
      visibleUnknown:rows.filter(x=>x.family_features.visible_from_seating==null).length,
      inventedHoy:rows.some(x=>x.family_features.verification_status==='hoy_verified')
    };
  });
  expect(facts.total).toBe(19);
  expect(facts.unknownDistance).toBe(19);
  expect(facts.visibleTrue).toBeGreaterThanOrEqual(1);
  expect(facts.visibleUnknown).toBeGreaterThan(0);
  expect(facts.inventedHoy).toBe(false);
});

test('Family preview stays active for the current browser session and can be explicitly switched off',async({page})=>{
  await ready(page);
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('hoy_family_preview_session_240'))).toBe('1');
  expect(new URL(page.url()).searchParams.get('familyPreview')).toBe('1');

  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyFamilyPreviewSession240?.enabled===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
  expect(new URL(page.url()).searchParams.get('familyPreview')).toBe('1');
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-badge]')).toBeVisible();

  await page.goto('./?familyPreview=0',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyFamilyPreviewSession240?.enabled===false,{timeout:30000});
  expect(new URL(page.url()).searchParams.has('familyPreview')).toBe(false);
  expect(await page.evaluate(()=>sessionStorage.getItem('hoy_family_preview_session_240'))).toBeNull();
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);
});

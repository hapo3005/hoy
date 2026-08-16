const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240&&window.hoyFamilyAuditedPreview240?.state?.status==='ready',{timeout:30000});
}

test('audited Family preview exposes 17 research entries without leaking draft profiles into normal HOY',async({page})=>{
  await ready(page);

  const initial=await page.evaluate(()=>({
    ready:window.hoyFamilyAuditedPreview240.state.readyCount,
    existing:window.hoyFamilyAuditedPreview240.state.existingCount,
    virtual:window.hoyFamilyAuditedPreview240.state.virtualCount,
    mode:window.hoyFamilyAuditedPreview240.state.mode,
    virtualInData:DATA.filter(x=>x.__family240_preview_profile===true).length,
    badStatus:window.hoyFamilyAuditedPreview240.state.entries.some(x=>x.verification==='hoy_verified')
  }));
  expect(initial.ready).toBe(17);
  expect(initial.existing).toBe(4);
  expect(initial.virtual).toBe(13);
  expect(initial.mode).toBe('research');
  expect(initial.virtualInData).toBe(0);
  expect(initial.badStatus).toBe(false);

  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect.poll(()=>page.evaluate(()=>DATA.filter(x=>x.__family240_preview_profile===true).length)).toBe(13);
  await expect(page.locator('[data-result-count]')).toHaveText('17');
  await expect(page.locator('[data-result-label]')).toContainText(/17|auditierte Family-Einträge|Research-Vorschau/);
  await expect(page.locator('[data-result-label]')).toContainText('auditierte Family-Einträge');
  await expect(page.locator('.family240-research-card')).toHaveCount(13);
  await expect(page.locator('.family240-research-card [data-fav]')).toHaveCount(0);
  await expect(page.locator('.family240-context-head small')).toContainText('keine Live-Veröffentlichung');

  const draft=page.locator('.family240-research-card').first();
  await expect(draft).toContainText('RESEARCH-DRAFT');
  await draft.click();
  await expect(page.locator('.family240-research-warning')).toBeVisible();
  await expect(page.locator('.family240-research-warning')).toContainText('Noch nicht als HOY-Profil veröffentlicht');
  const profile=page.locator('[data-family240-final-profile]');
  await expect(profile).toBeVisible();
  await expect(profile).toHaveAttribute('data-family240-audited-preview','');
  await expect(profile).toContainText(/VORSCHAU/);
  await profile.locator('[data-family240-details] summary').click();
  await expect(profile).toContainText(/Auditierte Research-Daten/);
  await expect(profile.locator('.family240-proof a')).toHaveAttribute('href',/^https:\/\//);
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
  expect(facts.total).toBe(17);
  expect(facts.unknownDistance).toBe(17);
  expect(facts.visibleTrue).toBeGreaterThanOrEqual(1);
  expect(facts.visibleUnknown).toBeGreaterThan(0);
  expect(facts.inventedHoy).toBe(false);
});

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page,url='./'){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240,{timeout:30000});
}

test('family entry points stay hidden until verified play data is actually available',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    for(const p of DATA||[])p.family_features=null;
    state.family='playground';state.view='home';render();
  });
  await expect(page.locator('[data-family240-home]')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasVerifiedPlayData())).toBe(false);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasPreviewPlayData())).toBe(false);

  await page.evaluate(()=>{state.view='discover';render()});
  await expect(page.locator('.family240-filter')).toHaveCount(0);
  await expect(page.locator('.list')).toBeVisible();
});

test('family preview query shows the complete UI with clearly marked client-only sample data',async({page})=>{
  await ready(page,'./?familyPreview=1');
  await page.evaluate(()=>{
    for(const p of DATA||[])p.family_features=null;
    state.family='all';state.view='home';render();
  });

  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.isPreviewEnabled())).toBe(true);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasVerifiedPlayData())).toBe(false);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasPreviewPlayData())).toBe(true);
  await expect(page.locator('[data-family240-home]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-notice]').first()).toContainText(/Beispieldaten|sample data|datos de ejemplo/i);
  await expect(page.locator('.family240-preview i').first()).toHaveText(/VORSCHAU|PREVIEW|VISTA PREVIA/);

  await page.locator('[data-family240-situation]').click();
  await expect(page.locator('.family240-filter')).toBeVisible();
  await expect(page.locator('[data-family240-preview-notice]').first()).toBeVisible();

  const previewId=await page.evaluate(()=>Number((DATA||[]).find(p=>p.family_features?.__family240_preview)?.id));
  await page.evaluate(id=>openDetail(id),previewId);
  await expect(page.locator('[data-family240-preview-profile]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-profile]')).toContainText(/VORSCHAU|PREVIEW|VISTA PREVIA/);
  await expect(page.locator('[data-family240-preview-profile]')).toContainText(/keine Live-Angabe|not a live claim|no es información real/i);
});

test('normal home intent discovery clears a previous family-only filter',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{state.family='visible';state.view='home';render()});
  await page.locator('[data-home-intent]').first().click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
});

test('normal home search clears a previous family-only filter',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{state.family='playground';state.view='home';render()});
  await page.locator('[data-home-search]').fill('La Manga');
  await page.locator('[data-home-search-go]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
});

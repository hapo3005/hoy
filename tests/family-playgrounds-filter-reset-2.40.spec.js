const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
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

  await page.evaluate(()=>{state.view='discover';render()});
  await expect(page.locator('.family240-filter')).toHaveCount(0);
  await expect(page.locator('.list')).toBeVisible();
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

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240,{timeout:30000});
}

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

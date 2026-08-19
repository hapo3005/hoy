const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function waitForLiveFamily(page){
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>=3&&
    cloud?.status==='online'&&
    window.hoyFamilyPlaygrounds240?.state?.loaded===true&&
    window.hoyFamilyPlaygroundsHardening240,
    null,{timeout:40_000}
  );
}

test('Production Family data keeps Mit Kindern live without preview mode',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await waitForLiveFamily(page);

  expect(new URL(page.url()).searchParams.get('familyPreview')).not.toBe('1');

  const live=await page.evaluate(()=>{
    const api=window.hoyFamilyPlaygrounds240;
    const rows=(DATA||[]).filter(p=>api.hasPlay(api.familyFor(p)));
    return {ids:rows.map(p=>Number(p.id)),names:rows.map(p=>p.name)};
  });

  expect(live.ids).toEqual(expect.arrayContaining([96,101,132,218]));
  expect(live.ids.length).toBeGreaterThanOrEqual(4);

  const entry=page.locator('[data-family240-home-context]');
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('Mit Kindern');
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);

  await entry.click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-family240-context-bar]')).toBeVisible();
  await expect(page.locator('.list')).toContainText('Restaurante La Plaza');
});

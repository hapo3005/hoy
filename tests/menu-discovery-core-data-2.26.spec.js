const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuSourceTruthVersion==='2.34.1'&&window.hoyNativeMenuStandardVersion==='2.48.0'&&window.hoyNativeMenuState248?.state==='ready'&&cloud.status==='online',null,{timeout:30000});
}

test('newly verified operator image sources never become finished guest menus by themselves',async({page})=>{
  await ready(page);
  const rows=await page.evaluate(()=>[21,110,116,144].map(id=>{
    const p=DATA.find(x=>Number(x.id)===id),m=p?menuFor(p):null;
    return {id,name:p?.name,integrity:m?.integrity,nativeSourceIntegrity:m?.nativeSourceIntegrity,nativeMenu:m?.nativeMenu,guestAvailability:m?.guestAvailability,mode:m?.displayMode,pages:m?.pages?.length||0,locale:m?.locale,coverage:m?.languageCoverage};
  }));
  for(const row of rows){
    expect(row.nativeMenu,row.name).toBeTruthy();
    expect(row.nativeSourceIntegrity,row.name).toBe('image_complete');
    expect(row.mode,row.name).toBeFalsy();
    expect(row.pages,row.name).toBe(0);
    expect(['in_app_native','blocked_until_locale_complete','blocked_until_structured'],row.name).toContain(row.guestAvailability);
    if(row.guestAvailability==='in_app_native'){
      expect(row.locale,row.name).toBe('de');
      expect(row.coverage?.complete,row.name).toBeTruthy();
    }
  }
});

test('Rincón de la Hormiga keeps its source as provenance but guest UI is native or fail-closed',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{const p=DATA.find(x=>Number(x.id)===110),m=menuFor(p);return {guestAvailability:m?.guestAvailability,locale:m?.locale,coverage:m?.languageCoverage};});
  await page.evaluate(()=>openDetail(110));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile.locator('.menu231-page,.menu234-frame,iframe')).toHaveCount(0);
  await expect(profile.locator('a[target="_blank"]')).toHaveCount(0);
  if(state.guestAvailability==='in_app_native'){
    expect(state.locale).toBe('de');
    expect(state.coverage?.complete).toBeTruthy();
    await expect(profile.locator('[data-menu-item]')).not.toHaveCount(0);
  }else{
    await expect(profile).toContainText(/Speisekarte wird in HOY aufbereitet|Deutsche Speisekarte wird aufbereitet/);
    await expect(profile.locator('[data-menu-item]')).toHaveCount(0);
  }
});

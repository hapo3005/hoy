const {test,expect}=require('@playwright/test');

test('Chibichanga delivers all 199 verified operator positions in German',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>0&&
    window.hoyMenuCoreScopeVersion==='2.36.0'&&
    window.hoyMenuLanguageIntegrityState==='ready'&&
    window.hoyMenuCatalog233?.integrity==='ready'&&
    Number(window.hoyMenuCatalog233?.items)>2000&&
    cloud.status==='online',
    {timeout:40000}
  );

  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===97),m=menuFor(p);
    return {
      name:p?.name,
      itemCount:m?.itemCount,
      integrity:m?.integrity,
      localized:m?.localized,
      locale:m?.locale,
      coverage:m?.languageCoverage,
      categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0]),prices:items.map(x=>x[1])}))
    };
  });

  expect(state.name).toContain('Chibichanga');
  expect(state).toMatchObject({itemCount:199,integrity:'complete',localized:true,locale:'de'});
  expect(state.coverage).toMatchObject({total:199,ready:199,missing:0,complete:true});
  expect(state.categories).toHaveLength(20);
  const expected={Frühstück:4,'Toast & Croissants':9,'Kaffee & Tee':11,'Waffeln & Crêpes':6,'Frische Säfte':6,Shakes:6,Tapas:19,Sommerdrinks:9,Softdrinks:13,Biere:20,Rotweine:3,'Weißweine':2,'Rosé & Cava':2,'Liköre & Spirituosen':13,Gin:15,Rum:15,Whisky:25,Vodka:4,'Premium-Cocktails':4,Cocktails:13};
  for(const [cat,count] of Object.entries(expected))expect(state.categories.find(x=>x.cat===cat)?.count,cat).toBe(count);
  const names=state.categories.flatMap(x=>x.names),prices=state.categories.flatMap(x=>x.prices);
  expect(names).toContain('Marinera mit Oktopus');
  expect(names).toContain('Erdbeer-Daiquiri');
  expect(names).toContain('Ananas & Minze');
  expect(prices.filter(x=>x==='10 €+')).toHaveLength(5);
  expect(prices).not.toContain('über 10 €');

  await page.evaluate(()=>openDetail(97));
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');await expect(profile).toBeVisible();
  await expect(profile.locator('[data-menu-item]')).toHaveCount(199);
  await expect(profile).toContainText('199 Positionen');
  await expect(profile).toContainText('Erdbeer-Daiquiri');
  await expect(profile).not.toContainText('Teilkarte');
  await expect(profile.locator('.menu233-language-gap')).toHaveCount(0);
});

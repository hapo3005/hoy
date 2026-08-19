const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>0&&
    window.hoyMenuIntegrityVersion==='2.37.0'&&
    window.hoyMenuCoreScopeVersion==='2.36.0'&&
    window.hoyMenuBootstrap232?.integrity==='ready'&&
    Number(window.hoyMenuBootstrap232?.itemCount)>2000&&
    window.hoyMenuLanguageIntegrityVersion==='2.37.0'&&
    window.hoyMenuLanguageIntegrityState==='ready'&&
    window.hoyMenuCatalog233?.integrity==='ready'&&
    window.hoyMenuCatalog233?.reusedBootstrap===true&&
    Number(window.hoyMenuCatalog233?.items)>2000&&
    window.hoyNativeMenuStandardVersion==='2.48.0'&&
    window.hoyNativeMenuState248?.state==='ready'&&
    cloud.status==='online',
    null,
    {timeout:40000}
  );
}

async function menuState(page,id){
  return page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);
    return {name:p?.name,itemCount:m?.itemCount,integrity:m?.integrity,localized:m?.localized,locale:m?.locale,coverage:m?.languageCoverage,categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])})),coreScopeIsolated:m?.coreScopeIsolated,coreSourceIds:m?.coreSourceIds||[],supplementalSourceIds:m?.supplementalSourceIds||[],nativeMenu:m?.nativeMenu,nativeSourceIntegrity:m?.nativeSourceIntegrity,guestAvailability:m?.guestAvailability,displayMode:m?.displayMode,pages:m?.pages?.length||0};
  },id);
}

async function assertNativeSourceBoundary(page,id){
  await ready(page);
  const state=await menuState(page,id);
  expect(state.nativeMenu,state.name).toBeTruthy();
  expect(state.nativeSourceIntegrity,state.name).toBe('image_complete');
  expect(state.displayMode,state.name).toBeFalsy();
  expect(state.pages,state.name).toBe(0);
  expect(['in_app_native','blocked_until_locale_complete','blocked_until_structured'],state.name).toContain(state.guestAvailability);
  if(state.guestAvailability==='in_app_native'){
    expect(state.localized,state.name).toBeTruthy();
    expect(state.locale,state.name).toBe('de');
    expect(state.coverage?.complete,state.name).toBeTruthy();
  }
  await page.evaluate(id=>openDetail(id),id);
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');await expect(profile).toBeVisible();
  await expect(profile.locator('.menu231-page img,.menu234-frame,iframe')).toHaveCount(0);
  await expect(profile.locator('a[href*=".pdf"],a[target="_blank"]')).toHaveCount(0);
  await expect(profile).not.toContainText(/horizontal wischen|\.pdf/i);
}

test('full-catalog bootstrap keeps structured menus beyond the first API window complete',async({page})=>{
  await ready(page);
  const bootstrap=await page.evaluate(()=>({bootstrap:window.hoyMenuBootstrap232,catalog:window.hoyMenuCatalog233}));
  expect(bootstrap.bootstrap).toMatchObject({integrity:'ready',reusedByLanguageLayer:true});
  expect(bootstrap.bootstrap.itemCount).toBeGreaterThan(2000);
  expect(bootstrap.catalog).toMatchObject({integrity:'ready',reusedBootstrap:true});
  expect(bootstrap.catalog.items).toBe(bootstrap.bootstrap.itemCount);

  const finca=await menuState(page,216),playa=await menuState(page,11);
  expect(finca).toMatchObject({itemCount:19,integrity:'complete',localized:true,locale:'de'});
  expect(finca.coverage).toMatchObject({total:19,ready:19,missing:0,complete:true});
  expect(finca.categories.find(x=>x.cat==='Hauptgerichte')?.count).toBe(10);
  expect(finca.categories.find(x=>x.cat==='Vorspeisen')?.count).toBe(9);
  expect(playa).toMatchObject({itemCount:126,integrity:'complete',localized:true,locale:'de'});
  expect(playa.coverage).toMatchObject({total:126,ready:126,missing:0,complete:true});
  expect(playa.categories.find(x=>x.cat==='Vorspeisen')?.count).toBe(25);
  expect(playa.categories.find(x=>x.cat==='Reisgerichte')?.count).toBe(8);
  expect(playa.categories.flatMap(x=>x.names)).toContain('Meeresfrüchte-Paella');
});

test('EL NIDO exposes exactly the 117-item main card and keeps El Cuco/highlights out',async({page})=>{
  await ready(page);
  const nido=await menuState(page,217);
  expect(nido.name).toContain('EL NIDO');
  expect(nido).toMatchObject({itemCount:117,integrity:'complete',localized:true,locale:'de',coreScopeIsolated:true});
  expect(nido.coverage).toMatchObject({total:117,ready:117,missing:0,complete:true});
  expect(nido.coreSourceIds).toHaveLength(1);
  expect(nido.supplementalSourceIds.length).toBeGreaterThanOrEqual(2);
  const expected={Salate:5,Vorspeisen:16,Reisgerichte:11,'Muscheln Natur':8,'Fisch vom Markt':12,'Meeresfrüchte des Tages':7,Fleischgerichte:3,'Für Kinder':2,Desserts:9,'Kaffee & Tee':3,Getränke:19,'Softdrinks & Wasser':20,Extras:2};
  for(const [cat,count] of Object.entries(expected))expect(nido.categories.find(x=>x.cat===cat)?.count,cat).toBe(count);
  expect(nido.categories.flatMap(x=>x.names)).toContain('Reis „El Nido“');
  expect(nido.categories.flatMap(x=>x.names)).toContain('Brotservice');
  expect(nido.categories.flatMap(x=>x.names)).not.toContain('Dry Martini «El Cuco»');

  await page.evaluate(()=>openDetail(217));
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');await expect(profile).toBeVisible();
  await expect(profile.locator('[data-menu-item]')).toHaveCount(117);
  await expect(profile).toContainText('117 Positionen');
  await expect(profile).toContainText('Reis „El Nido“');
  await expect(profile).toContainText('Brotservice');
  await expect(profile).not.toContainText('Dry Martini «El Cuco»');
  await expect(profile.locator('.menu233-language-gap')).toHaveCount(0);
});

test('reviewed image sources stay first-party provenance and never become the finished guest menu',async({page})=>{
  await assertNativeSourceBoundary(page,9);
  await assertNativeSourceBoundary(page,111);
  await assertNativeSourceBoundary(page,4);
});

test('2.38 source authority remains wired beneath the final native menu authority',async({request})=>{
  const [integrity,language,authority,authorityCss,native,index,worker,pkg]=await Promise.all([
    request.get('./menu-integrity-2.32.js?v=2.37.0'),
    request.get('./menu-language-integrity-2.33.js?v=2.37.0'),
    request.get('./menu-authority-2.38.js?v=2.38.0'),
    request.get('./menu-authority-2.38.css?v=2.38.0'),
    request.get('./menu-native-standard-2.48.js?v=2.48.0'),
    request.get('./index.html'),
    request.get('./service-worker.js'),
    request.get('./package.json')
  ]);
  for(const r of [integrity,language,authority,authorityCss,native,index,worker,pkg])expect(r.ok()).toBeTruthy();
  const integrityCode=await integrity.text(),languageCode=await language.text(),authorityCode=await authority.text(),nativeCode=await native.text(),html=await index.text(),sw=await worker.text();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-integrity-2.32.js?v=2.37.0');
  expect(html).toContain('menu-language-integrity-2.33.js?v=2.37.0');
  expect(html).toContain('menu-authority-2.38.js?v=2.38.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-authority-2.38.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain("'./menu-authority-2.38.js'");
  expect(sw).toContain("'./menu-authority-2.38.css'");
  expect(sw).toContain("'./menu-native-standard-2.48.js'");
  expect(integrityCode).toContain('PAGE_SIZE232=500');
  expect(integrityCode).toContain(".range(from,from+PAGE_SIZE232-1)");
  expect(integrityCode).toContain('hoyMenuBootstrap232');
  expect(languageCode).toContain('reusedBootstrap:Boolean(cached)');
  expect(languageCode).toContain("integrity:'quality_blocked'");
  expect(authorityCode).toContain("verified_public_snapshot");
  expect(authorityCode).toContain("authorized_transactional");
  expect(nativeCode).toContain("guestAvailability:'blocked_until_structured'");
});

const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>0&&
    window.hoyMenuCoreScopeVersion==='2.36.0'&&
    window.hoyMenuCoreScope236&&
    window.hoyMenuLanguageIntegrityVersion==='2.37.0'&&
    window.hoyMenuLanguageIntegrityState==='ready'&&
    window.hoyMenuCatalog233?.integrity==='ready'&&
    window.hoyNativeMenuStandardVersion==='2.48.0'&&
    window.hoyNativeMenuState248?.state==='ready'&&
    Number(window.hoyMenuCatalog233?.items)>1850&&
    cloud.status==='online',
    null,
    {timeout:40000}
  );
}

async function menuState(page,id){
  return page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);
    return {name:p?.name,itemCount:m?.itemCount,integrity:m?.integrity,localized:m?.localized,locale:m?.locale,coverage:m?.languageCoverage,categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])})),coreScopeIsolated:m?.coreScopeIsolated,coreSourceIds:m?.coreSourceIds||[],supplementalSourceIds:m?.supplementalSourceIds||[],nativeSourceIntegrity:m?.nativeSourceIntegrity,nativeMenu:m?.nativeMenu,guestAvailability:m?.guestAvailability,displayMode:m?.displayMode,pages:m?.pages?.length||0};
  },id);
}

async function assertNativeSourceBoundary(page,id){
  await ready(page);
  const state=await menuState(page,id);
  expect(state.nativeMenu).toBeTruthy();
  expect(state.nativeSourceIntegrity).toBe('image_complete');
  expect(state.displayMode).toBeFalsy();
  expect(state.pages).toBe(0);
  expect(['in_app_native','blocked_until_locale_complete','blocked_until_structured']).toContain(state.guestAvailability);
  await page.evaluate(id=>openDetail(id),id);
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');await expect(profile).toBeVisible();
  await expect(profile.locator('.menu231-page img,.menu234-frame,iframe')).toHaveCount(0);
  await expect(profile.locator('a[href*=".pdf"],a[target="_blank"]')).toHaveCount(0);
  await expect(profile).not.toContainText(/horizontal wischen|\.pdf/i);
}

test('deployed structured menus are complete, localized and not truncated',async({page})=>{
  await ready(page);
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

test('reviewed image sources stay provenance-only until a native locale is ready',async({page})=>{
  await assertNativeSourceBoundary(page,9);
  await assertNativeSourceBoundary(page,111);
  await assertNativeSourceBoundary(page,4);
});

test('2.36 feature shell remains cache-busted and fail-closed in the current release',async({request})=>{
  const [core,language,native,index,worker,pkg]=await Promise.all([request.get('./menu-core-scope-2.36.js?v=2.36.0'),request.get('./menu-language-integrity-2.33.js'),request.get('./menu-native-standard-2.48.js?v=2.48.0'),request.get('./index.html'),request.get('./service-worker.js'),request.get('./package.json')]);
  for(const r of [core,language,native,index,worker,pkg])expect(r.ok()).toBeTruthy();
  const coreCode=await core.text(),languageCode=await language.text(),nativeCode=await native.text(),html=await index.text(),sw=await worker.text();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-core-scope-2.36.js?v=2.36.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-core-scope-2.36.js')).toBeGreaterThan(html.indexOf('menu-integrity-2.32.js'));
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-authority-2.38.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./menu-core-scope-2.36.js');
  expect(sw).toContain('./menu-native-standard-2.48.js');
  expect(coreCode).toContain('supplementalSourceIds');
  expect(coreCode).toContain('contentSourceIds:coreIds');
  expect(languageCode).toContain("integrity:'quality_blocked'");
  expect(nativeCode).toContain("guestAvailability:'blocked_until_structured'");
});

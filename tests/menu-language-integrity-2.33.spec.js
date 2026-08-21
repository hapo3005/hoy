const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuIntegrityVersion==='2.37.0'&&window.hoyMenuLanguageIntegrityVersion==='2.37.0'&&window.hoyMenuLanguageIntegrityState==='ready'&&window.hoyNativeMenuStandardVersion==='2.48.0'&&window.hoyNativeMenuState248?.state==='ready'&&window.hoyMenuCatalog233?.items>1000&&cloud.status==='online',{timeout:30000});
}

test('full-catalog language assets and final locale authority remain wired and paginated',async({request})=>{
  const [js,css,native,index,worker]=await Promise.all([
    request.get('./menu-language-integrity-2.33.js?v=2.37.0'),request.get('./menu-language-integrity-2.33.css?v=2.35.0'),request.get('./menu-native-standard-2.48.js?v=2.48.0'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,native,index,worker])expect(r.ok()).toBeTruthy();
  const html=await index.text(),sw=await worker.text(),code=await native.text();
  expect(html).toContain('menu-language-integrity-2.33.css?v=2.35.0');
  expect(html).toContain('menu-language-integrity-2.33.js?v=2.37.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-authority-2.38.js'));
  expect(sw).toContain('./menu-language-integrity-2.33.js');
  expect(code).toContain('PAGE_SIZE=500');
  expect(code).toContain('.range(from,from+PAGE_SIZE-1)');
  expect(code).toContain("SUPPORTED_MENU_LOCALES=new Set(['de','es','en'])");
  expect(code).toContain("q=>q.eq('locale',locale)");
});

test('full menu catalog is paginated beyond the Supabase 1000-row window',async({page})=>{
  await ready(page);
  const catalog=await page.evaluate(()=>window.hoyMenuCatalog233);
  expect(catalog.items).toBeGreaterThan(1600);
  expect(catalog.integrity).toBe('ready');
});

test('La Finca renders all 19 current items in German on the German page version',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===216),m=menuFor(p);
    return {pageLang:state.lang,itemCount:m.itemCount,localized:m.localized,locale:m.locale,coverage:m.languageCoverage,categories:(m.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])}))};
  });
  expect(menu.pageLang).toBe('de');
  expect(menu.itemCount).toBe(19);
  expect(menu.localized).toBeTruthy();
  expect(menu.locale).toBe('de');
  expect(menu.coverage).toMatchObject({locale:'de',total:19,ready:19,missing:0,complete:true});
  expect(menu.categories.find(x=>x.cat==='Hauptgerichte')?.count).toBe(10);
  expect(menu.categories.find(x=>x.cat==='Vorspeisen')?.count).toBe(9);
  expect(menu.categories.flatMap(x=>x.names)).toContain('Hähnchenbrust');

  await page.evaluate(()=>openDetail(216));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile.locator('[data-menu-item]')).toHaveCount(19);
  await expect(profile).toContainText('19 Positionen');
  await expect(profile).toContainText('Vorspeisen');
  await expect(profile).toContainText('Hähnchenbrust');
  await expect(profile).not.toContainText('Main Course');
  await expect(profile).not.toContainText('Breast of chicken');
});

test('page language and menu locale are coupled DE -> EN -> ES with complete curated La Finca coverage',async({page})=>{
  await ready(page);
  const german=await page.evaluate(()=>{const m=menuFor(DATA.find(x=>Number(x.id)===216));return {page:state.lang,locale:m.locale,integrity:m.integrity,coverage:m.languageCoverage}});
  expect(german).toMatchObject({page:'de',locale:'de',integrity:'complete'});
  expect(german.coverage).toMatchObject({locale:'de',total:19,ready:19,missing:0,complete:true});

  const english=await page.evaluate(async()=>{state.lang='en';await window.hoyRefreshNativeMenus248();const m=menuFor(DATA.find(x=>Number(x.id)===216));return {page:state.lang,locale:m.locale,integrity:m.integrity,coverage:m.languageCoverage,state:window.hoyNativeMenuState248}});
  expect(english).toMatchObject({page:'en',locale:'en',integrity:'complete'});
  expect(english.coverage).toMatchObject({locale:'en',total:19,ready:19,missing:0,complete:true});
  expect(english.state.locale).toBe('en');

  const spanish=await page.evaluate(async()=>{state.lang='es';await window.hoyRefreshNativeMenus248();const m=menuFor(DATA.find(x=>Number(x.id)===216));return {page:state.lang,locale:m.locale,integrity:m.integrity,coverage:m.languageCoverage,state:window.hoyNativeMenuState248}});
  expect(spanish).toMatchObject({page:'es',locale:'es',integrity:'complete'});
  expect(spanish.coverage).toMatchObject({locale:'es',total:19,ready:19,missing:0,complete:true});
  expect(spanish.state.locale).toBe('es');
});

test('incomplete German coverage never masquerades as a German menu',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===215),m=menuFor(p);
    return {localized:m.localized,locale:m.locale,integrity:m.integrity,coverage:m.languageCoverage,itemCount:m.itemCount};
  });
  expect(result.itemCount).toBeGreaterThan(0);
  expect(result.coverage.locale).toBe('de');
  expect(result.coverage.total).toBe(result.itemCount);
  expect(result.coverage.complete).toBeFalsy();
  expect(result.localized).toBeFalsy();
  expect(result.locale).toBeNull();
  expect(result.integrity).toBe('native_language_blocked');
  await page.evaluate(()=>openDetail(215));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile.locator('.menu248-blocked')).toContainText('Deutsche Speisekarte wird aufbereitet');
  await expect(profile.locator('[data-menu-item]')).toHaveCount(0);
  await expect(profile.locator('.menu-signature-promise')).toHaveCount(0);
});

test('language completeness requires translated descriptions and failures are fail-closed',()=>{
  const oldCode=fs.readFileSync('menu-language-integrity-2.33.js','utf8');
  const nativeCode=fs.readFileSync('menu-native-standard-2.48.js','utf8');
  expect(oldCode).toContain("if(clean233(item.description)&&!clean233(t.description))return false");
  expect(nativeCode).toContain("if(clean(item.description)&&!clean(t.description))return false");
  expect(nativeCode).toContain("PRODUCTION_TRANSLATIONS=new Set(['curated','operator_confirmed'])");
  expect(nativeCode).toContain("integrity:'native_language_blocked'");
  expect(nativeCode).toContain("guestAvailability:'blocked_until_locale_complete'");
});

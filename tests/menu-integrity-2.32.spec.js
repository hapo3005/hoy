const fs=require('node:fs');
const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE, waitForData}=require('./helpers/current-release');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await waitForData(page,1,30_000);
  await page.waitForFunction(()=>window.hoyMenuIntegrityVersion==='2.37.0'&&window.hoyMenuBootstrap232?.integrity==='ready'&&window.hoyNativeMenuStandardVersion==='2.48.0'&&window.hoyNativeMenuState248?.state==='ready'&&cloud.status==='online',null,{timeout:40_000});
}

async function assertNativeOutcome(page,id,expectedItems=null){
  const menu=await page.evaluate(id=>menuFor(DATA.find(x=>Number(x.id)===Number(id))),id);
  expect(menu.nativeMenu).toBeTruthy();
  expect(menu.displayMode).toBeFalsy();
  expect(menu.pages).toBeFalsy();
  if(expectedItems!==null)expect(menu.itemCount).toBe(expectedItems);
  if(menu.languageCoverage?.complete){
    expect(menu.integrity).toBe('complete');
    expect(menu.status).toBe('structured');
    expect(menu.localized).toBeTruthy();
    expect(menu.locale).toBe('de');
    expect(menu.guestAvailability).toBe('in_app_native');
  }else if((menu.itemCount||0)>0){
    expect(menu.integrity).toBe('native_language_blocked');
    expect(menu.status).toBe('unavailable');
    expect(menu.localized).toBeFalsy();
    expect(menu.locale).toBeNull();
    expect(menu.guestAvailability).toBe('blocked_until_locale_complete');
  }else{
    expect(menu.integrity).toBe('native_source_only');
    expect(menu.status).toBe('source_only');
    expect(menu.guestAvailability).toBe('blocked_until_structured');
  }
  return menu;
}

test('historical menu-integrity module remains wired beneath the final native authority',async({request})=>{
  const [js,css,native,pkg,index,worker]=await Promise.all([
    request.get('./menu-integrity-2.32.js'),request.get('./menu-integrity-2.32.css'),request.get('./menu-native-standard-2.48.js?v=2.48.0'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,native,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-integrity-2.32.css?v=2.32.0');
  expect(html).toContain('menu-integrity-2.32.js?v=2.37.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-integrity-2.32.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./menu-integrity-2.32.js');
  expect(sw).toContain('./menu-integrity-2.32.css');
  expect(sw).toContain('./menu-native-standard-2.48.js');
});

test('Playa Chica is complete and localized after the final menu authority',async({page})=>{
  await ready(page);
  const menu=await assertNativeOutcome(page,11,126);
  expect(menu.languageCoverage).toMatchObject({locale:'de',total:126,ready:126,missing:0,complete:true});
});

test('Soul Kitchen image source remains provenance-only until structured native content exists',async({page})=>{
  await ready(page);
  const menu=await assertNativeOutcome(page,234);
  expect(menu.nativeSourceIntegrity).toBe('image_complete');
  await page.evaluate(()=>openDetail(234));
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profileMenu=page.locator('#detail #profile-menu');
  await expect(profileMenu.locator('.menu231-page img,.menu234-frame,iframe')).toHaveCount(0);
  await expect(profileMenu.locator('a[target="_blank"]')).toHaveCount(0);
});

test('Bonobo full-menu image source stays provenance-only despite structured wine and dessert sources',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===4)));
  expect(menu.nativeMenu).toBeTruthy();
  expect(menu.nativeSourceIntegrity).toBe('image_complete');
  expect(menu.integrity).toBe('native_source_only');
  expect(menu.status).toBe('source_only');
  expect(menu.guestAvailability).toBe('blocked_until_structured');
  expect(menu.displayMode).toBeFalsy();
  expect(menu.pages).toBeFalsy();
});

test('El Rancho content count is preserved but German guest delivery remains fail-closed until language coverage is complete',async({page})=>{
  await ready(page);
  const menu=await assertNativeOutcome(page,13,81);
  expect(menu.languageCoverage?.locale).toBe('de');
  if(!menu.languageCoverage?.complete){
    expect(menu.integrity).toBe('native_language_blocked');
    expect(menu.categories).toHaveLength(0);
  }
});

test('synthetic partial menu gets no HOY NOW menu bonus or availability reason',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA[0];
    const old=MENUS[p.id];
    const oldNow=window.hoyNowStatus219For,oldCurrent=window.hoyBestCurrentFor;
    window.hoyNowStatus219For=()=>({state:'open',tone:'open',label:'Jetzt geöffnet · bis 23:00'});
    window.hoyBestCurrentFor=()=>null;
    MENUS[p.id]={status:'integrity_partial',integrity:'partial',categories:[['Test',[['A','1 €']]]]};
    const partial=window.hoyDecision280For(p,new Date('2026-08-12T18:00:00Z'));
    MENUS[p.id]={status:'structured',integrity:'complete',categories:[['Test',[['A','1 €']]]]};
    const complete=window.hoyDecision280For(p,new Date('2026-08-12T18:00:00Z'));
    if(old)MENUS[p.id]=old;else delete MENUS[p.id];window.hoyNowStatus219For=oldNow;window.hoyBestCurrentFor=oldCurrent;
    return {partial,complete};
  });
  expect(result.complete.score-result.partial.score).toBe(14);
  expect(result.partial.reasons.some(x=>x.label==='Speisekarte verfügbar')).toBeFalsy();
  expect(result.complete.reasons.some(x=>x.label==='Speisekarte verfügbar')).toBeTruthy();
});

test('integrity layers never expose an external menu navigation CTA',()=>{
  const js=fs.readFileSync('menu-integrity-2.32.js','utf8');
  const native=fs.readFileSync('menu-native-standard-2.48.js','utf8');
  expect(js).toContain('completeness_status');
  expect(js).toContain("status:'integrity_partial'");
  expect(js).not.toMatch(/window\.open|target=["']_blank|Originalquelle öffnen|Offizielle Speisekarte öffnen/i);
  expect(native).not.toMatch(/<img\b|<iframe\b|target=["']_blank/i);
  expect(native).toContain("guestAvailability:'blocked_until_locale_complete'");
});

const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuSourceTruthVersion==='2.34.1'&&window.hoyMenuSourceTruth234&&window.hoyMenuLanguageIntegrityState==='ready'&&window.hoyNativeMenuStandardVersion==='2.48.0'&&window.hoyNativeMenuState248?.state==='ready'&&cloud.status==='online',null,{timeout:40000});
}

async function finalState(page,id){
  return page.evaluate(id=>{const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);return {name:p?.name,status:m?.status,integrity:m?.integrity,nativeSourceIntegrity:m?.nativeSourceIntegrity,nativeMenu:m?.nativeMenu,guestAvailability:m?.guestAvailability,displayMode:m?.displayMode,pages:m?.pages?.length||0,embedUrl:m?.embedUrl,fallbackUrl:m?.fallbackUrl,locale:m?.locale,coverage:m?.languageCoverage,label:menuStatusLabel(m)}},id);
}

async function expectNoExternalGuestMenu(page,id){
  await page.evaluate(id=>openDetail(id),id);
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile.locator('.menu231-page img,.menu234-frame,iframe,.menu234-fallback,a[target="_blank"]')).toHaveCount(0);
}

test('HOY source truth stays wired beneath the final native guest-menu authority',async({request})=>{
  const [source,native,pkg,index,worker]=await Promise.all([request.get('./menu-source-truth-2.34.js'),request.get('./menu-native-standard-2.48.js?v=2.48.0'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')]);
  for(const r of [source,native,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-source-truth-2.34.js?v=2.35.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-source-truth-2.34.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./menu-source-truth-2.34.js');
  expect(sw).toContain('./menu-native-standard-2.48.js');
});

test('CP8 keeps SmartMenu as provenance but never exposes the embed as the finished guest menu',async({page})=>{
  await ready(page);
  const state=await finalState(page,18);
  expect(state.name).toContain('CP8');
  expect(state).toMatchObject({status:'source_only',integrity:'native_source_only',nativeSourceIntegrity:'embed_complete',nativeMenu:true,guestAvailability:'blocked_until_structured'});
  expect(state.displayMode).toBeFalsy();
  expect(state.embedUrl).toBeFalsy();
  expect(state.fallbackUrl).toBeFalsy();
  expect(state.label).toBe('Speisekarte wird in HOY aufbereitet');
  await expectNoExternalGuestMenu(page,18);
});

test('Taberna keeps the newer first-party source as provenance without rendering image pages',async({page})=>{
  await ready(page);
  const state=await finalState(page,111);
  expect(state.name).toContain('Taberna del Puerto');
  expect(state.nativeSourceIntegrity).toBe('image_complete');
  expect(state.nativeMenu).toBeTruthy();
  expect(['blocked_until_structured','blocked_until_locale_complete','in_app_native']).toContain(state.guestAvailability);
  expect(state.displayMode).toBeFalsy();
  expect(state.pages).toBe(0);
  await expectNoExternalGuestMenu(page,111);
});

test('Area Sunset keeps its reviewed 2026 source as provenance while the German guest menu is native or fail-closed',async({page})=>{
  await ready(page);
  const state=await finalState(page,9);
  expect(state.nativeSourceIntegrity).toBe('image_complete');
  expect(state.nativeMenu).toBeTruthy();
  expect(state.displayMode).toBeFalsy();
  expect(state.pages).toBe(0);
  expect(['blocked_until_structured','blocked_until_locale_complete','in_app_native']).toContain(state.guestAvailability);
  if(state.guestAvailability==='in_app_native'){
    expect(state.locale).toBe('de');
    expect(state.coverage?.complete).toBeTruthy();
  }
  await expectNoExternalGuestMenu(page,9);
});

test('even a late source-only state is fail-closed by the final guest renderer',async({page})=>{
  await ready(page);
  const candidate=await page.evaluate(()=>{
    const p=DATA[0],old=MENUS[p.id];
    MENUS[p.id]={status:'source_only',integrity:'source_only',officialMenuUrl:'https://example.invalid/menu',label:'Offizielle Betreiberquelle',source:null};
    try{const m=menuFor(p);return {label:menuStatusLabel(m),html:menuPanel(p)}}finally{if(old)MENUS[p.id]=old;else delete MENUS[p.id]}
  });
  expect(candidate.label).toBe('Speisekarte wird in HOY aufbereitet');
  expect(candidate.html).toContain('Speisekarte wird in HOY aufbereitet');
  expect(candidate.html).not.toMatch(/href=|<img|<iframe|example\.invalid/i);
});

test('embedded official sources do not create a guest menu-available signal until a native locale is ready',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===18),m=menuFor(p),decision=window.hoyDecision280For?.(p);
    return {status:m?.status,integrity:m?.integrity,guestAvailability:m?.guestAvailability,reasons:decision?.reasons?.map(x=>x.label)||[]};
  });
  expect(result.status).toBe('source_only');
  expect(result.integrity).toBe('native_source_only');
  expect(result.guestAvailability).toBe('blocked_until_structured');
  expect(result.reasons).not.toContain('Speisekarte verfügbar');
});

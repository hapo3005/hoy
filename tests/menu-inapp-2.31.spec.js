const fs=require('node:fs');
const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuInAppVersion==='2.31.0'&&window.hoyMenuIntegrityVersion==='2.37.0'&&window.hoyNativeMenuStandardVersion==='2.48.0'&&window.hoyNativeMenuState248?.state==='ready'&&cloud.status==='online',null,{timeout:30000});
}

test('HOY menu assets and final native authority remain wired in the current release',async({request})=>{
  const [js,css,native,pkg,index,worker]=await Promise.all([request.get('./menu-inapp-2.31.js'),request.get('./menu-inapp-2.31.css'),request.get('./menu-native-standard-2.48.js?v=2.48.0'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')]);
  for(const r of [js,css,native,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-inapp-2.31.css?v=2.31.0');
  expect(html).toContain('menu-inapp-2.31.js?v=2.31.0');
  expect(html).toContain('menu-native-standard-2.48.js?v=2.48.0');
  expect(html.indexOf('menu-native-standard-2.48.js')).toBeGreaterThan(html.indexOf('menu-authority-2.38.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
});

test('Soul Kitchen image source is provenance only and never a finished guest menu',async({page})=>{
  await ready(page);
  await page.waitForFunction(()=>MENUS[234]?.integrity==='native_source_only',null,{timeout:30000});
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===234)));
  expect(menu.integrity).toBe('native_source_only');
  expect(menu.nativeSourceIntegrity).toBe('image_complete');
  expect(menu.displayMode).toBeFalsy();
  expect(menu.pages).toBeFalsy();
  expect(menu.localized).toBeFalsy();
  await page.evaluate(()=>openDetail(234));
  const panel=page.locator('#detail #profile-menu .menu248-blocked');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Speisekarte wird in HOY aufbereitet');
  await expect(page.locator('#detail #profile-menu .menu231-page img')).toHaveCount(0);
  await expect(page.locator('#detail #profile-menu iframe')).toHaveCount(0);
  await expect(page.locator('#detail #profile-menu a[target="_blank"]')).toHaveCount(0);
});

test('source-only menu is not presented as a finished external menu',async({page})=>{
  await ready(page);
  const html=await page.evaluate(()=>{const p=DATA[0],old=MENUS[p.id];MENUS[p.id]={status:'source_only',integrity:'native_source_only',nativeMenu:true,label:'Offizielle Quelle'};try{return menuPanel(p)}finally{if(old)MENUS[p.id]=old;else delete MENUS[p.id]}});
  expect(html).toContain('Speisekarte wird in HOY aufbereitet');
  expect(html).not.toMatch(/href=/i);
  expect(html).not.toMatch(/<img|<iframe/i);
});

test('final native menu authority contains no image or iframe consumer renderer',()=>{
  const code=fs.readFileSync('menu-native-standard-2.48.js','utf8');
  expect(code).toContain("SUPPORTED_MENU_LOCALES=new Set(['de','es','en'])");
  expect(code).toContain("integrity:'native_source_only'");
  expect(code).not.toMatch(/<img\b|<iframe\b/i);
  expect(code).toContain("guestAvailability:'blocked_until_structured'");
});

const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuInAppVersion==='2.31.0'&&window.hoyMenuIntegrityVersion==='2.32.0');
}

test('HOY 2.31 in-app menu assets remain wired in the 2.32 release',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([request.get('./menu-inapp-2.31.js'),request.get('./menu-inapp-2.31.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.32.0');
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain('App 2.32.0');
  expect(html).toContain('menu-inapp-2.31.css?v=2.31.0');
  expect(html).toContain('menu-inapp-2.31.js?v=2.31.0');
  expect(sw).toContain("const CACHE='hoy-v2.32.0'");
  expect(sw).toContain('./menu-inapp-2.31.css');
  expect(sw).toContain('./menu-inapp-2.31.js');
});

test('Soul Kitchen still renders all official menu pages inside HOY after integrity classification',async({page})=>{
  await ready(page);
  await page.waitForFunction(()=>MENUS[234]?.displayMode==='image_pages'&&MENUS[234]?.pages?.length===12,{timeout:10000});
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===234)));
  expect(menu.displayMode).toBe('image_pages');
  expect(menu.pages).toHaveLength(12);
  expect(menu.source).toBeFalsy();
  expect(menu.provenanceUrls.some(x=>x.includes('menurestauranteqr.es/soulkitchen'))).toBeTruthy();
  await page.evaluate(()=>openDetail(234));
  await page.locator('#detail [data-tab="menu"]').click();
  const panel=page.locator('#detail .menu231-panel');
  await expect(panel).toContainText('Speisekarte in HOY');
  await expect(panel).toContainText('Direkt in HOY');
  await expect(panel.locator('.menu231-page img')).toHaveCount(12);
  await expect(panel.locator('a[href*="menurestauranteqr"]')).toHaveCount(0);
});

test('source-only menu is not presented as a finished external menu',async({page})=>{
  await ready(page);
  const html=await page.evaluate(()=>{const p=DATA[0],old=MENUS[p.id];MENUS[p.id]={status:'source_only',integrity:'source_only',source:null,provenanceUrls:['https://example.com/menu'],label:'Offizielle Quelle'};try{return menuPanel(p)}finally{if(old)MENUS[p.id]=old;else delete MENUS[p.id]}});
  expect(html).toContain('Speisekarte wird in HOY aufbereitet');
  expect(html).not.toContain('example.com/menu');
  expect(html).not.toMatch(/href=/i);
});

test('2.31 menu module embeds only official sources and contains no external navigation CTA',()=>{
  const js=fs.readFileSync('menu-inapp-2.31.js','utf8');
  expect(js).toContain(".eq('is_official',true)");
  expect(js).not.toMatch(/window\.open|target=["']_blank|Originalquelle öffnen/i);
  expect(js).toContain("status:'source_only'");
  expect(js).toContain("displayMode:'image_pages'");
});

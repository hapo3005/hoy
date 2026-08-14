const fs=require('node:fs');
const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE, waitForData}=require('./helpers/current-release');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await waitForData(page,1,30_000);
  await page.waitForFunction(()=>window.hoyMenuIntegrityVersion==='2.37.0'&&window.hoyMenuBootstrap232?.integrity==='ready'&&cloud.status==='online',null,{timeout:40_000});
}

test('historical menu-integrity module remains wired to the current 2.37 runtime',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./menu-integrity-2.32.js'),request.get('./menu-integrity-2.32.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-integrity-2.32.css?v=2.32.0');
  expect(html).toContain('menu-integrity-2.32.js?v=2.37.0');
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./menu-integrity-2.32.js');
  expect(sw).toContain('./menu-integrity-2.32.css');
});

test('Playa Chica is now complete and localized after the later menu-truth upgrades',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===11)));
  expect(menu.integrity).toBe('complete');
  expect(menu.status).toBe('structured');
  expect(menu.itemCount).toBe(126);
  expect(menu.localized).toBeTruthy();
  expect(menu.languageCoverage).toMatchObject({total:126,ready:126,missing:0,complete:true});
});

test('Soul Kitchen remains a complete 12-page in-app image menu',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===234)));
  expect(menu.integrity).toBe('image_complete');
  expect(menu.status).toBe('structured');
  expect(menu.displayMode).toBe('image_pages');
  expect(menu.pages).toHaveLength(12);
  expect(menu.source).toBeFalsy();
  await page.evaluate(()=>openDetail(234));
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profileMenu=page.locator('#detail #profile-menu');
  await expect(profileMenu.locator('.menu231-page img')).toHaveCount(12);
  await expect(profileMenu.locator('a[href*="menurestauranteqr"]')).toHaveCount(0);
});

test('Bonobo current official main card is delivered as a complete in-app image menu',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===4)));
  expect(menu.integrity).toBe('image_complete');
  expect(menu.status).toBe('structured');
  expect(menu.displayMode).toBe('image_pages');
  expect(menu.pages).toHaveLength(3);
  expect(menu.source).toBeFalsy();
});

test('El Rancho can be content-complete while its source import status remains cautious',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>({menu:menuFor(DATA.find(x=>Number(x.id)===13)),sourceStatus:null}));
  expect(result.menu.integrity).toBe('complete');
  expect(result.menu.status).toBe('structured');
  expect(result.menu.itemCount).toBe(81);
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

test('integrity module never exposes an external menu navigation CTA',()=>{
  const js=fs.readFileSync('menu-integrity-2.32.js','utf8');
  expect(js).toContain('completeness_status');
  expect(js).toContain("status:'integrity_partial'");
  expect(js).not.toMatch(/window\.open|target=["']_blank|Originalquelle öffnen|Offizielle Speisekarte öffnen/i);
});

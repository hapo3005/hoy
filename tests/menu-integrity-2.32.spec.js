const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuIntegrityVersion==='2.32.0'&&cloud.status==='online',{timeout:15000});
}

test('HOY 2.32 menu-integrity assets are wired and cached',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./menu-integrity-2.32.js'),request.get('./menu-integrity-2.32.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.32.0');
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain('App 2.32.0');
  expect(html).toContain('menu-integrity-2.32.css?v=2.32.0');
  expect(html).toContain('menu-integrity-2.32.js?v=2.32.0');
  expect(sw).toContain("const CACHE='hoy-v2.32.0'");
  expect(sw).toContain('./menu-integrity-2.32.js');
  expect(sw).toContain('./menu-integrity-2.32.css');
});

test('Playa Chica is usable but explicitly partial at 1 of 12 sections',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===11)));
  expect(menu.integrity).toBe('partial');
  expect(menu.status).toBe('integrity_partial');
  expect(menu.itemCount).toBe(18);
  expect(menu.coverage.expected).toBe(12);
  expect(menu.coverage.imported).toBe(1);
  expect(menu.coverage.text).toContain('1 von 12');
  await page.evaluate(()=>openDetail(11));
  await page.locator('#detail [data-tab="menu"]').click();
  const panel=page.locator('#detail .menu232-panel');
  await expect(panel).toContainText('Teilkarte');
  await expect(panel).toContainText('1 von 12');
  await expect(panel.locator('[data-menu-item]')).toHaveCount(18);
  await expect(panel.locator('a[href*="playachicalamanga"]')).toHaveCount(0);
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
  await page.locator('#detail [data-tab="menu"]').click();
  await expect(page.locator('#detail .menu231-page img')).toHaveCount(12);
  await expect(page.locator('#detail a[href*="menurestauranteqr"]')).toHaveCount(0);
});

test('Bonobo supplements cannot masquerade as a complete main menu',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===4)));
  expect(menu.integrity).toBe('partial');
  expect(menu.status).toBe('integrity_partial');
  expect(menu.itemCount).toBe(35);
  expect(menu.note).toMatch(/Hauptkarte.*fehlt/i);
});

test('El Rancho can be content-complete while its source import status remains cautious',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>({menu:menuFor(DATA.find(x=>Number(x.id)===13)),sourceStatus:null}));
  expect(result.menu.integrity).toBe('complete');
  expect(result.menu.status).toBe('structured');
  expect(result.menu.itemCount).toBe(81);
});

test('partial menu gets no HOY NOW menu bonus or availability reason',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===11)||DATA[0];
    const old=MENUS[p.id];
    const oldNow=window.hoyNowStatus219For,oldCurrent=window.hoyBestCurrentFor;
    window.hoyNowStatus219For=()=>({state:'open',tone:'open',label:'Jetzt geöffnet · bis 23:00'});
    window.hoyBestCurrentFor=()=>null;
    MENUS[p.id]={status:'integrity_partial',integrity:'partial',categories:[['Test',[['A','1 €']]]]};
    const partial=window.hoyDecision280For(p,new Date('2026-08-12T18:00:00Z'));
    MENUS[p.id]={status:'structured',integrity:'complete',categories:[['Test',[['A','1 €']]]]};
    const complete=window.hoyDecision280For(p,new Date('2026-08-12T18:00:00Z'));
    MENUS[p.id]=old;window.hoyNowStatus219For=oldNow;window.hoyBestCurrentFor=oldCurrent;
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

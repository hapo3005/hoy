const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuIntegrityVersion==='2.32.0'&&window.hoyMenuLanguageIntegrityVersion==='2.35.0'&&window.hoyMenuLanguageIntegrityState==='ready'&&window.hoyMenuCatalog233?.items>1000&&cloud.status==='online',{timeout:30000});
}

test('HOY 2.35 full-catalog language assets are wired and cache-busted',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./menu-language-integrity-2.33.js?v=2.35.0'),request.get('./menu-language-integrity-2.33.css?v=2.35.0'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.35.0');
  const html=await index.text(),sw=await worker.text(),code=await js.text();
  expect(html).toContain('App 2.35.0');
  expect(html).toContain('menu-language-integrity-2.33.css?v=2.35.0');
  expect(html).toContain('menu-language-integrity-2.33.js?v=2.35.0');
  expect(html.indexOf('menu-language-integrity-2.33.js')).toBeGreaterThan(html.indexOf('menu-integrity-2.32.js'));
  expect(sw).toContain("const CACHE='hoy-v2.35.0'");
  expect(sw).toContain('./menu-language-integrity-2.33.js');
  expect(code).toContain('PAGE_SIZE=500');
  expect(code).toContain('.range(from,from+PAGE_SIZE-1)');
  expect(code).toContain("integrity:'quality_blocked'");
});

test('full menu catalog is paginated beyond the Supabase 1000-row window',async({page})=>{
  await ready(page);
  const catalog=await page.evaluate(()=>window.hoyMenuCatalog233);
  expect(catalog.items).toBeGreaterThan(1600);
  expect(catalog.integrity).toBe('ready');
});

test('La Finca renders all 19 current items in German, not only the 10 main courses',async({page})=>{
  await ready(page);
  const menu=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===216),m=menuFor(p);
    return {itemCount:m.itemCount,localized:m.localized,locale:m.locale,coverage:m.languageCoverage,categories:(m.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])}))};
  });
  expect(menu.itemCount).toBe(19);
  expect(menu.localized).toBeTruthy();
  expect(menu.locale).toBe('de');
  expect(menu.coverage).toMatchObject({total:19,ready:19,missing:0,complete:true});
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

test('incomplete German coverage never masquerades as a German menu',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===215),m=menuFor(p);
    return {localized:m.localized,locale:m.locale,coverage:m.languageCoverage,itemCount:m.itemCount};
  });
  expect(result.itemCount).toBeGreaterThan(0);
  expect(result.coverage.total).toBe(result.itemCount);
  expect(result.coverage.complete).toBeFalsy();
  expect(result.localized).toBeFalsy();
  expect(result.locale).toBeNull();
  await page.evaluate(()=>openDetail(215));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile.locator('.menu233-language-gap')).toContainText('Originalsprache');
  await expect(profile.locator('.menu-signature-promise')).toHaveCount(0);
});

test('language completeness requires translated descriptions and failures are fail-closed',()=>{
  const code=fs.readFileSync('menu-language-integrity-2.33.js','utf8');
  expect(code).toContain("if(clean233(item.description)&&!clean233(t.description))return false");
  expect(code).toContain("PRODUCTION_TRANSLATIONS=new Set(['curated','operator_confirmed'])");
  expect(code).toContain("window.hoyMenuLanguageIntegrityState='blocked'");
  expect(code).toContain("integrity:'quality_blocked'");
});

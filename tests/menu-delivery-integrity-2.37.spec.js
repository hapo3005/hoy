const {test,expect}=require('@playwright/test');

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
    cloud.status==='online',
    {timeout:40000}
  );
}

async function menuState(page,id){
  return page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);
    return {name:p?.name,itemCount:m?.itemCount,integrity:m?.integrity,localized:m?.localized,locale:m?.locale,coverage:m?.languageCoverage,categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])})),coreScopeIsolated:m?.coreScopeIsolated,coreSourceIds:m?.coreSourceIds||[],supplementalSourceIds:m?.supplementalSourceIds||[]};
  },id);
}

async function assertImageMenu(page,request,id,expectedPages,pathPart){
  await ready(page);
  const state=await page.evaluate(id=>{const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);return {name:p?.name,integrity:m?.integrity,displayMode:m?.displayMode,pages:(m?.pages||[]).map(x=>x.url),source:m?.source};},id);
  expect(state.integrity).toBe('image_complete');
  expect(state.displayMode).toBe('image_pages');
  expect(state.pages).toHaveLength(expectedPages);
  expect(state.source).toBeFalsy();
  expect(state.pages.every(x=>x.includes(pathPart))).toBeTruthy();
  for(const url of state.pages){const response=await request.get(url);expect(response.ok(),`${state.name}: ${url}`).toBeTruthy()}
  await page.evaluate(id=>openDetail(id),id);
  const menuTab=page.locator('#detail [data-tab="menu"]');if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');await expect(profile).toBeVisible();
  const images=profile.locator('.menu231-page img');await expect(images).toHaveCount(expectedPages);
  await expect(profile.locator('.menu234-frame')).toHaveCount(0);
  await expect(profile.locator('iframe[src*=".pdf"],a[href*=".pdf"]')).toHaveCount(0);
  await expect(profile.getByRole('link',{name:/öffnen/i})).toHaveCount(0);
  const first=images.first();await first.scrollIntoViewIfNeeded();await expect.poll(async()=>first.evaluate(img=>img.complete&&img.naturalWidth>200),{timeout:15000}).toBeTruthy();
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

test('reviewed image menus stay first-party in HOY and never regress to raw PDF or fragile hotlinks',async({page,request})=>{
  await assertImageMenu(page,request,9,4,'/hoy/menu-pages/9/f63bfbbb509f/');
  await assertImageMenu(page,request,111,1,'/hoy/menu-pages/111/2d419a28324c/');
  await assertImageMenu(page,request,4,3,'/hoy/menu-pages/4/f9653f87c69d/');
});

test('2.38 release shell ships the authority layer and cache-busted menu truth',async({request})=>{
  const [integrity,language,authority,authorityCss,index,worker,pkg]=await Promise.all([
    request.get('./menu-integrity-2.32.js?v=2.37.0'),
    request.get('./menu-language-integrity-2.33.js?v=2.37.0'),
    request.get('./menu-authority-2.38.js?v=2.38.0'),
    request.get('./menu-authority-2.38.css?v=2.38.0'),
    request.get('./index.html'),
    request.get('./service-worker.js'),
    request.get('./package.json')
  ]);
  for(const r of [integrity,language,authority,authorityCss,index,worker,pkg])expect(r.ok()).toBeTruthy();
  const integrityCode=await integrity.text(),languageCode=await language.text(),authorityCode=await authority.text(),html=await index.text(),sw=await worker.text();
  expect((await pkg.json()).version).toBe('2.38.0');
  expect(html).toContain('App 2.38.0');
  expect(html).toContain('menu-integrity-2.32.js?v=2.37.0');
  expect(html).toContain('menu-language-integrity-2.33.js?v=2.37.0');
  expect(html).toContain('menu-authority-2.38.js?v=2.38.0');
  expect(sw).toContain("const CACHE='hoy-v2.38.0'");
  expect(sw).toContain("'./menu-authority-2.38.js'");
  expect(sw).toContain("'./menu-authority-2.38.css'");
  expect(integrityCode).toContain('PAGE_SIZE232=500');
  expect(integrityCode).toContain(".range(from,from+PAGE_SIZE232-1)");
  expect(integrityCode).toContain('hoyMenuBootstrap232');
  expect(languageCode).toContain('reusedBootstrap:Boolean(cached)');
  expect(languageCode).toContain("integrity:'quality_blocked'");
  expect(authorityCode).toContain("verified_public_snapshot");
  expect(authorityCode).toContain("authorized_transactional");
});

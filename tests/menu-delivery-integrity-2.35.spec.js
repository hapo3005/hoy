const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>0&&
    window.hoyMenuLanguageIntegrityVersion==='2.37.0'&&
    window.hoyMenuLanguageIntegrityState==='ready'&&
    window.hoyMenuCatalog233?.integrity==='ready'&&
    Number(window.hoyMenuCatalog233?.items)>1600&&
    cloud.status==='online',
    null,
    {timeout:40000}
  );
}

async function assertImageMenu(page,request,id,expectedPages,pathPart){
  await ready(page);
  const state=await page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id)),m=menuFor(p);
    return {name:p?.name,integrity:m?.integrity,displayMode:m?.displayMode,pages:(m?.pages||[]).map(x=>x.url),source:m?.source,officialMenuUrl:m?.officialMenuUrl};
  },id);
  expect(state.integrity).toBe('image_complete');
  expect(state.displayMode).toBe('image_pages');
  expect(state.pages).toHaveLength(expectedPages);
  expect(state.source).toBeFalsy();
  expect(state.pages.every(x=>x.includes(pathPart))).toBeTruthy();
  for(const url of state.pages){const response=await request.get(url);expect(response.ok(),`${state.name}: ${url}`).toBeTruthy()}

  await page.evaluate(id=>openDetail(id),id);
  const menuTab=page.locator('#detail [data-tab="menu"]');
  if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  const images=profile.locator('.menu231-page img');
  await expect(images).toHaveCount(expectedPages);
  await expect(profile.locator('.menu234-frame')).toHaveCount(0);
  await expect(profile.locator('iframe[src*=".pdf"]')).toHaveCount(0);
  await expect(profile.locator('a[href*=".pdf"]')).toHaveCount(0);
  await expect(profile).not.toContainText(/\.pdf/i);
  await expect(profile.getByRole('link',{name:/öffnen/i})).toHaveCount(0);
  const first=images.first();
  await first.scrollIntoViewIfNeeded();
  await expect.poll(async()=>first.evaluate(img=>img.complete&&img.naturalWidth>200),{timeout:15000}).toBeTruthy();
}

test('deployed HOY never exposes the truncated La Finca fallback',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===216),m=menuFor(p);
    return {
      name:p?.name,
      itemCount:m?.itemCount,
      integrity:m?.integrity,
      localized:m?.localized,
      locale:m?.locale,
      coverage:m?.languageCoverage,
      categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])})),
      catalog:window.hoyMenuCatalog233,
      languageState:window.hoyMenuLanguageIntegrityState,
      failure:window.hoyMenuLanguageIntegrityFailure
    };
  });

  expect(state.name).toBe('La Finca Restaurant');
  expect(state.languageState).toBe('ready');
  expect(state.failure).toBeNull();
  expect(state.catalog.items).toBeGreaterThan(1600);
  expect(state.itemCount).toBe(19);
  expect(state.integrity).toBe('complete');
  expect(state.localized).toBeTruthy();
  expect(state.locale).toBe('de');
  expect(state.coverage).toMatchObject({total:19,ready:19,missing:0,complete:true});
  expect(state.categories.find(x=>x.cat==='Hauptgerichte')?.count).toBe(10);
  expect(state.categories.find(x=>x.cat==='Vorspeisen')?.count).toBe(9);
  expect(state.categories.flatMap(x=>x.names)).toContain('Hähnchenbrust');

  await page.evaluate(()=>openDetail(216));
  const menuTab=page.locator('#detail [data-tab="menu"]');
  if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile.locator('[data-menu-item]')).toHaveCount(19);
  await expect(profile).toContainText('19 Positionen');
  await expect(profile.getByRole('heading',{name:/^Hauptgerichte\s+10 Positionen$/})).toBeVisible();
  await expect(profile.getByRole('heading',{name:/^Vorspeisen\s+9 Positionen$/})).toBeVisible();
  await expect(profile).toContainText('Hähnchenbrust');
  await expect(profile).not.toContainText('Main Course');
  await expect(profile).not.toContainText('Breast of chicken');
});

test('Playa Chica is 12/12 complete and fully German in the deployed guest app',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===11),m=menuFor(p);
    return {name:p?.name,itemCount:m?.itemCount,integrity:m?.integrity,localized:m?.localized,locale:m?.locale,coverage:m?.languageCoverage,categories:(m?.categories||[]).map(([cat,items])=>({cat,count:items.length,names:items.map(x=>x[0])}))};
  });
  expect(state.name).toContain('Playa Chica');
  expect(state.itemCount).toBe(126);
  expect(state.integrity).toBe('complete');
  expect(state.localized).toBeTruthy();
  expect(state.locale).toBe('de');
  expect(state.coverage).toMatchObject({total:126,ready:126,missing:0,complete:true});
  expect(state.categories.find(x=>x.cat==='Vorspeisen')?.count).toBe(25);
  expect(state.categories.find(x=>x.cat==='Reisgerichte')?.count).toBe(8);
  expect(state.categories.find(x=>x.cat==='Für Kinder')?.count).toBe(3);
  expect(state.categories.find(x=>x.cat==='Hausgemachte Desserts')?.count).toBe(7);
  expect(state.categories.flatMap(x=>x.names)).toContain('Meeresfrüchte-Paella');

  await page.evaluate(()=>openDetail(11));
  const menuTab=page.locator('#detail [data-tab="menu"]');
  if(await menuTab.count())await menuTab.click();
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile.locator('[data-menu-item]')).toHaveCount(126);
  await expect(profile).toContainText('126 Positionen');
  await expect(profile).toContainText('Meeresfrüchte-Paella');
  await expect(profile).toContainText('Kleine Jakobsmuschel mit Foie gras & Teriyaki-Sauce');
  await expect(profile).not.toContainText('Teilkarte');
  await expect(profile.locator('.menu233-language-gap')).toHaveCount(0);
});

test('Area Sunset renders all four reviewed operator pages inside HOY, never a raw PDF',async({page,request})=>{
  await assertImageMenu(page,request,9,4,'/hoy/menu-pages/9/f63bfbbb509f/');
});

test('La Taberna del Puerto renders its reviewed A3 menu inside HOY, never a raw PDF',async({page,request})=>{
  await assertImageMenu(page,request,111,1,'/hoy/menu-pages/111/2d419a28324c/');
});

test('Bonobo Playa renders all three reviewed official pages from the HOY mirror',async({page,request})=>{
  await assertImageMenu(page,request,4,3,'hapo3005.github.io/hoy/menu-pages/4/f9653f87c69d/');
});

test('menu integrity failure is fail-closed in the shipped client',async({request})=>{
  const [js,index,worker,pkg]=await Promise.all([
    request.get('./menu-language-integrity-2.33.js'),
    request.get('./index.html'),
    request.get('./service-worker.js'),
    request.get('./package.json')
  ]);
  for(const r of [js,index,worker,pkg])expect(r.ok()).toBeTruthy();
  const code=await js.text(),html=await index.text(),sw=await worker.text(),version=(await pkg.json()).version;
  expect(version).toBe(CURRENT_RELEASE);
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toMatch(/menu-language-integrity-2\.33\.js\?v=2\.\d+\.\d+/);
  expect(html).toMatch(/menu-source-truth-2\.34\.js\?v=2\.\d+\.\d+/);
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(code).toContain("integrity:'quality_blocked'");
  expect(code).toContain("window.hoyMenuLanguageIntegrityState='blocked'");
  expect(code).toContain('kein unvollständiger oder falschsprachiger Zwischenstand');
  expect(code).toContain('Kein unsicherer Zwischenstand.');
});

const {test,expect}=require('@playwright/test');

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    Array.isArray(DATA)&&DATA.length>0&&
    window.hoyMenuLanguageIntegrityVersion==='2.35.0'&&
    window.hoyMenuLanguageIntegrityState==='ready'&&
    window.hoyMenuCatalog233?.integrity==='ready'&&
    Number(window.hoyMenuCatalog233?.items)>1600&&
    cloud.status==='online',
    {timeout:40000}
  );
}

test('deployed HOY 2.35 never exposes the truncated La Finca fallback',async({page})=>{
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

test('menu integrity failure is fail-closed in the shipped client',async({request})=>{
  const [js,index,worker,pkg]=await Promise.all([
    request.get('./menu-language-integrity-2.33.js?v=2.35.0'),
    request.get('./index.html'),
    request.get('./service-worker.js'),
    request.get('./package.json')
  ]);
  for(const r of [js,index,worker,pkg])expect(r.ok()).toBeTruthy();
  const code=await js.text(),html=await index.text(),sw=await worker.text(),version=(await pkg.json()).version;
  expect(version).toBe('2.35.0');
  expect(html).toContain('App 2.35.0');
  expect(html).toContain('menu-language-integrity-2.33.js?v=2.35.0');
  expect(html).toContain('menu-source-truth-2.34.js?v=2.35.0');
  expect(sw).toContain("const CACHE='hoy-v2.35.0'");
  expect(code).toContain("integrity:'quality_blocked'");
  expect(code).toContain("window.hoyMenuLanguageIntegrityState='blocked'");
  expect(code).toContain('kein unvollständiger oder falschsprachiger Zwischenstand');
  expect(code).toContain('Kein unsicherer Zwischenstand.');
});

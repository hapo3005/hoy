const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuSourceTruthVersion==='2.34.1'&&window.hoyMenuSourceTruth234&&cloud.status==='online',{timeout:30000});
}

test('HOY menu-source truth hotfix stays wired through the 2.34 release shell',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./menu-source-truth-2.34.js'),request.get('./menu-source-truth-2.34.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.34.0');
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain('App 2.34.0');
  expect(html).toContain('menu-source-truth-2.34.css?v=2.34.0');
  expect(html).toContain('menu-source-truth-2.34.js?v=2.34.0');
  expect(html.indexOf('menu-source-truth-2.34.js')).toBeGreaterThan(html.indexOf('menu-language-integrity-2.33.js'));
  expect(sw).toContain("const CACHE='hoy-v2.34.0'");
  expect(sw).toContain('./menu-source-truth-2.34.js');
});

test('CP8 uses the complete official SmartMenu inside HOY',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===18),m=menuFor(p);
    return {name:p?.name,status:m?.status,integrity:m?.integrity,displayMode:m?.displayMode,embedUrl:m?.embedUrl,fallbackUrl:m?.fallbackUrl,label:menuStatusLabel(m)};
  });
  expect(state.name).toContain('CP8');
  expect(state).toMatchObject({status:'structured',integrity:'embed_complete',displayMode:'official_embed'});
  expect(state.embedUrl).toContain('smartmenu.agorapos.com');
  expect(state.fallbackUrl).toContain('cp8restaurante.com/carta');
  expect(state.label).toBe('Offizielle Speisekarte in HOY');

  await page.evaluate(()=>openDetail(18));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile).toContainText('Offizielle Speisekarte in HOY');
  await expect(profile).toContainText('Direkt eingebunden, nicht nachgebaut.');
  const iframe=profile.locator('iframe.menu234-frame');
  await expect(iframe).toHaveAttribute('src',/smartmenu\.agorapos\.com/);
  await expect(profile.locator('.menu234-fallback')).toHaveAttribute('href',/cp8restaurante\.com\/carta/);

  await expect.poll(async()=>{
    const frame=page.frames().find(f=>/smartmenu\.agorapos\.com/.test(f.url()));
    if(!frame)return 0;
    return (await frame.locator('body').innerText().catch(()=>'' )).trim().length;
  },{timeout:25000,message:'CP8 SmartMenu iframe should render real remote menu content'}).toBeGreaterThan(40);
});

test('superseded menu pages cannot outrank a newer active official menu',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===111),m=menuFor(p);
    return {name:p?.name,integrity:m?.integrity,displayMode:m?.displayMode,embedUrl:m?.embedUrl,label:menuStatusLabel(m)};
  });
  expect(state.name).toContain('Taberna del Puerto');
  expect(state.integrity).toBe('embed_complete');
  expect(state.displayMode).toBe('official_embed');
  expect(state.embedUrl).toMatch(/carta-Taberna-del-Puerto-mantel-A3\.pdf/i);
  expect(state.label).toBe('Offizielle Speisekarte in HOY');
});

test('Area Sunset uses its complete official 2026 document inside HOY',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===9),m=menuFor(p);
    return {integrity:m?.integrity,displayMode:m?.displayMode,embedUrl:m?.embedUrl};
  });
  expect(state).toMatchObject({integrity:'embed_complete',displayMode:'official_embed'});
  expect(state.embedUrl).toMatch(/Carta-Area-Sunset-web\.pdf/i);
});

test('a known official source can never be presented as no menu',async({page})=>{
  await ready(page);
  const candidate=await page.evaluate(()=>{
    const p=DATA.find(x=>{const m=menuFor(x);return m?.integrity==='source_only'&&/^https:\/\//.test(m?.officialMenuUrl||'')});
    if(!p)return null;
    const m=menuFor(p);return {id:p.id,name:p.name,label:menuStatusLabel(m),url:m.officialMenuUrl,html:menuPanel(p)};
  });
  expect(candidate).not.toBeNull();
  expect(candidate.label).toBe('Offizielle Speisekarte verfügbar');
  expect(candidate.url).toMatch(/^https:\/\//);
  expect(candidate.html).toContain('Die Karte existiert');
  expect(candidate.html).toContain('Offizielle Speisekarte öffnen');
  expect(candidate.html.toLowerCase()).not.toContain('keine karte verfügbar');
  expect(candidate.html.toLowerCase()).not.toContain('keine speisekarte verfügbar');
});

test('embedded official menus count as a real guest menu signal',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===18),m=menuFor(p),decision=window.hoyDecision280For?.(p);
    return {status:m?.status,reasons:decision?.reasons?.map(x=>x.label)||[]};
  });
  expect(result.status).toBe('structured');
  expect(result.reasons).toContain('Speisekarte verfügbar');
});

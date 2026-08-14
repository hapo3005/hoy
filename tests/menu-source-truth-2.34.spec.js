const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuSourceTruthVersion==='2.34.1'&&window.hoyMenuSourceTruth234&&window.hoyMenuLanguageIntegrityState==='ready'&&cloud.status==='online',null,{timeout:40000});
}

test('HOY menu-source truth hotfix stays wired through the current release shell',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./menu-source-truth-2.34.js'),request.get('./menu-source-truth-2.34.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('menu-source-truth-2.34.css?v=2.35.0');
  expect(html).toContain('menu-source-truth-2.34.js?v=2.35.0');
  expect(html.indexOf('menu-source-truth-2.34.js')).toBeGreaterThan(html.indexOf('menu-language-integrity-2.33.js'));
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./menu-source-truth-2.34.js');
});

test('CP8 keeps the complete official SmartMenu inside HOY with a visible official fallback',async({page})=>{
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
  await expect(profile.locator('iframe.menu234-frame')).toHaveAttribute('src',/smartmenu\.agorapos\.com/);
  const fallback=profile.locator('.menu234-fallback');
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('href',/cp8restaurante\.com\/carta/);
  await expect(fallback).toHaveAttribute('rel',/noopener/);
});

test('superseded Taberna source cannot outrank its newer first-party image menu',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===111),m=menuFor(p);
    return {name:p?.name,integrity:m?.integrity,displayMode:m?.displayMode,pages:(m?.pages||[]).map(x=>x.url),label:menuStatusLabel(m)};
  });
  expect(state.name).toContain('Taberna del Puerto');
  expect(state.integrity).toBe('image_complete');
  expect(state.displayMode).toBe('image_pages');
  expect(state.pages).toHaveLength(1);
  expect(state.pages[0]).toContain('/hoy/menu-pages/111/2d419a28324c/');
});

test('Area Sunset uses its reviewed first-party 2026 menu pages inside HOY',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===9),m=menuFor(p);
    return {integrity:m?.integrity,displayMode:m?.displayMode,pages:(m?.pages||[]).map(x=>x.url)};
  });
  expect(state).toMatchObject({integrity:'image_complete',displayMode:'image_pages'});
  expect(state.pages).toHaveLength(4);
  expect(state.pages.every(x=>x.includes('/hoy/menu-pages/9/f63bfbbb509f/'))).toBeTruthy();
});

test('a synthetic known official source can never be presented as no menu',async({page})=>{
  await ready(page);
  const candidate=await page.evaluate(()=>{
    const p=DATA[0],old=MENUS[p.id];
    MENUS[p.id]={status:'source_only',integrity:'source_only',officialMenuUrl:'https://example.com/official-menu',label:'Offizielle Betreiberquelle',source:null};
    try{const m=menuFor(p);return {label:menuStatusLabel(m),url:m.officialMenuUrl,html:menuPanel(p)}}finally{if(old)MENUS[p.id]=old;else delete MENUS[p.id]}
  });
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

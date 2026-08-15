const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online'&&window.hoyMenuLanguageIntegrityState==='ready',{timeout:30000});
}

test('2.39 release metadata and pinned Supabase runtime stay aligned',async({request})=>{
  const [pkg,index,worker]=await Promise.all([
    request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.39.0');
  const html=await index.text(),sw=await worker.text();
  const supabaseUrl='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js';
  expect(html).toContain('App 2.39.0');
  expect(html).toContain(supabaseUrl);
  expect(html).not.toContain('@supabase/supabase-js@2/dist/umd/supabase.js');
  expect(html).toContain('release-hardening-2.39.css?v=2.39.0');
  expect(html).toContain('release-hardening-2.39.js?v=2.39.0');
  expect(sw).toContain("const CACHE='hoy-v2.39.0'");
  expect(sw).toContain(supabaseUrl);
  expect(sw).toContain("'./release-hardening-2.39.css'");
  expect(sw).toContain("'./release-hardening-2.39.js'");
});

test('2.39 reset hardening clears moment even on a control inserted after initial wiring',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    state.moment='now';state.query='test';state.service='reservation';state.decision='restaurant';
    const button=document.createElement('button');button.type='button';button.setAttribute('data-consumer-reset','');button.textContent='Reset fixture';document.body.appendChild(button);
  });
  await page.locator('body > [data-consumer-reset]').click();
  expect(await page.evaluate(()=>({moment:state.moment,query:state.query,service:state.service,decision:state.decision}))).toEqual({moment:'all',query:'',service:'all',decision:'all'});
});

test('service trust never turns an unconfirmed research state into guest availability',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  const values=await page.evaluate(()=>[
    window.hoyServiceTrust239.trustedServiceValue('available',null),
    window.hoyServiceTrust239.trustedServiceValue('unavailable',null),
    window.hoyServiceTrust239.trustedServiceValue('available','2026-08-15T05:00:00Z'),
    window.hoyServiceTrust239.trustedServiceValue('unavailable','2026-08-15T05:00:00Z')
  ]);
  expect(values).toEqual(['Prüfen','Prüfen','Ja','Nein']);
});

test('cloud restaurant data fails closed for every unconfirmed service row',async({page})=>{
  await ready(page);
  const leaks=await page.evaluate(()=>DATA.filter(p=>p.service_trust==='unconfirmed'&&[
    effectiveServiceState(p,'reservation'),
    effectiveServiceState(p,'pickup'),
    effectiveServiceState(p,'delivery')
  ].includes('available')).map(p=>({id:p.id,name:p.name})));
  expect(leaks).toEqual([]);
});

test('research-only reservation candidates remain discoverable without a false confirmed label',async({page})=>{
  await ready(page);
  const counts=await page.evaluate(()=>({
    confirmed:DATA.filter(p=>effectiveServiceState(p,'reservation')==='available').length,
    research:DATA.filter(p=>window.hoyServiceTrust239.researchServiceState(p,'reservation')==='available').length
  }));

  await page.evaluate(()=>{state.view='discover';state.service='reservation';state.query='';render()});
  const filter=page.locator('[data-filter="reservation"]');
  await expect(filter).toBeVisible();
  if(counts.confirmed===0)await expect(filter).toContainText('Reservierung prüfen');
  if(counts.research>0)await expect(page.locator('.list-card').first()).toBeVisible();
  await expect(page.locator('.list-card .service').filter({hasText:'Reservierung'})).toHaveCount(counts.confirmed);
});

test('full menu and language catalog still crosses the 1000-row boundary safely',async({page})=>{
  await ready(page);
  const state=await page.evaluate(()=>({
    catalog:window.hoyMenuCatalog233,
    cloudCount:cloud.menuItemCount,
    languageState:window.hoyMenuLanguageIntegrityState
  }));
  expect(state.languageState).toBe('ready');
  expect(state.catalog.integrity).toBe('ready');
  expect(state.catalog.items).toBeGreaterThan(1000);
  expect(state.cloudCount).toBe(state.catalog.items);
});

test('Agua Sala has a fully approved German menu, including translated descriptions',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA.find(x=>Number(x.id)===16),m=p?menuFor(p):null;
    return m?{
      localized:m.localized,
      locale:m.locale,
      itemCount:m.itemCount,
      coverage:m.languageCoverage,
      visibleCount:(m.categories||[]).reduce((n,[,items])=>n+(items?.length||0),0)
    }:null;
  });
  expect(result).not.toBeNull();
  expect(result.localized).toBeTruthy();
  expect(result.locale).toBe('de');
  expect(result.itemCount).toBe(130);
  expect(result.visibleCount).toBe(130);
  expect(result.coverage).toMatchObject({total:130,ready:130,missing:0,complete:true});
});

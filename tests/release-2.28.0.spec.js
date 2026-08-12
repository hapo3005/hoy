const fs=require('node:fs');
const path=require('node:path');
const {test,expect}=require('@playwright/test');

const SCREEN_DIR=path.join(process.cwd(),'qa-screenshots');
fs.mkdirSync(SCREEN_DIR,{recursive:true});
test.use({serviceWorkers:'block'});

async function waitForData(page){await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=2)}

async function mockDecisionSignals(page){
  await page.evaluate(()=>{
    const ids=DATA.slice(0,4).map(x=>Number(x.id));
    window.hoyNowStatus219For=p=>{
      const id=Number(p?.id);
      if(id===ids[0])return {state:'open',tone:'open',label:'Jetzt geöffnet',source:'operator',operatorConfirmed:true};
      if(id===ids[1])return {state:'later',tone:'later',label:'Öffnet heute 21:00',source:'operator',operatorConfirmed:true};
      return {state:'closed',tone:'closed',label:'Heute geschlossen',source:'operator',operatorConfirmed:true};
    };
    window.hoyBestCurrentFor=p=>Number(p?.id)===ids[0]?{id:'test-current',restaurant_id:ids[0],title:'Sunset Special',starts_at:new Date(Date.now()-30*60000).toISOString(),ends_at:new Date(Date.now()+90*60000).toISOString()}:null;
    state.query='';state.service='all';state.decision='all';state.moment='all';state.view='home';render();
  });
}

test('HOY 2.28.2 decision assets remain wired in the 2.30 release',async({page,request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./guest-decision-core-2.28.js'),request.get('./guest-decision-core-2.28.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const res of [js,css,pkg,index,worker])expect(res.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.30.0');
  const indexText=await index.text(),workerText=await worker.text();
  expect(indexText).toContain('App 2.30.0');
  expect(indexText).toContain('guest-decision-core-2.28.css?v=2.28.2');
  expect(indexText).toContain('guest-decision-core-2.28.js?v=2.28.2');
  expect(workerText).toContain("const CACHE='hoy-v2.30.0'");
  expect(workerText).toContain('./guest-decision-core-2.28.css');
  expect(workerText).toContain('./guest-decision-core-2.28.js');
  await page.goto('./',{waitUntil:'domcontentloaded'});
  expect(await page.evaluate(()=>window.hoyGuestDecisionCoreVersion)).toBe('2.28.2');
});

test('decision score prefers genuinely open and current places',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockDecisionSignals(page);
  const result=await page.evaluate(()=>{
    const rows=window.hoyDecision280Rank(DATA.slice(0,2));
    return {first:Number(rows[0].id),expected:Number(DATA[0].id),a:window.hoyDecision280For(DATA[0]),b:window.hoyDecision280For(DATA[1])};
  });
  expect(result.first).toBe(result.expected);
  expect(result.a.title).toBe('Passt gerade besonders gut');
  expect(result.a.reasons.some(x=>x.label.includes('Jetzt geöffnet'))).toBeTruthy();
  expect(result.a.reasons.some(x=>x.label.includes('Sunset Special'))).toBeTruthy();
  expect(result.a.score).toBeGreaterThan(result.b.score);
});

test('home immediately exposes explainable HOY NOW choices',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockDecisionSignals(page);
  const block=page.locator('[data-decision280-home]');
  await expect(block).toBeVisible();
  await expect(block.locator('h2')).toHaveText('Was jetzt wirklich passt.');
  await expect(block.locator('.decision280-card')).toHaveCount(2);
  await expect(block.locator('.decision280-card').first()).toContainText('Jetzt geöffnet');
  await expect(block.locator('.decision280-card').first()).toContainText('Sunset Special');
  const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  await page.screenshot({path:path.join(SCREEN_DIR,`${testInfo.project.name}-guest-decision-2.28-home.png`),fullPage:false});
});

test('guest can go from HOY NOW choice directly to an explained profile',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockDecisionSignals(page);
  await page.locator('[data-decision280-open]').first().click();
  await expect(page.locator('#detail')).toHaveAttribute('open','');
  const verdict=page.locator('#detail .decision280-profile');
  await expect(verdict).toBeVisible();
  await expect(verdict).toContainText(/warum jetzt/i);
  await expect(verdict).toContainText('Passt gerade besonders gut');
  await expect(verdict).toContainText('Jetzt geöffnet');
});

test('Jetzt geöffnet moment removes closed venues from discover',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockDecisionSignals(page);
  await page.locator('[data-decision280-moment="now"]').first().click();
  await expect(page.locator('.guest-decision-discover-280')).toBeVisible();
  expect(await page.evaluate(()=>state.moment)).toBe('now');
  const ids=await page.locator('[data-journey-results] .list-card[data-open]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.open)));
  expect(ids).toEqual([await page.evaluate(()=>Number(DATA[0].id))]);
  await expect(page.locator('[data-journey-results] .decision280-card-verdict')).toContainText('Passt');
});

test('live search keeps decision verdicts and reset clears moment',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockDecisionSignals(page);
  await page.locator('[data-decision280-moment="now"]').first().click();
  const q=page.locator('#q');
  await q.fill(String(await page.evaluate(()=>DATA[0].name)).slice(0,4));
  await expect(page.locator('[data-journey-results] .decision280-card-verdict')).toHaveCount(1);
  const reset=page.locator('[data-consumer-reset]').first();
  if(await reset.count())await reset.click();
  else await page.evaluate(()=>{state.moment='all';state.query='';state.service='all';state.decision='all';render()});
  expect(await page.evaluate(()=>state.moment)).toBe('all');
});

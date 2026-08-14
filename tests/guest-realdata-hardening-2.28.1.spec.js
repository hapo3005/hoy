const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE, gotoReady}=require('./helpers/current-release');
test.use({serviceWorkers:'block'});

async function ready(page){
  await gotoReady(page,'./',2);
}

function runningRow(id){
  return {id:'live-test',restaurant_id:id,title:'Live-Musik',starts_at:new Date(Date.now()-30*60000).toISOString(),ends_at:new Date(Date.now()+90*60000).toISOString()};
}

test('HOY guest-decision 2.28.2 assets and runtime remain wired in the current release',async({page,request})=>{
  const [pkg,index,worker]=await Promise.all([request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')]);
  for(const res of [pkg,index,worker])expect(res.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain(`App ${CURRENT_RELEASE}`);
  expect(html).toContain('guest-decision-core-2.28.js?v=2.28.2');
  expect(sw).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(sw).toContain('./guest-decision-core-2.28.js');
  await ready(page);
  expect(await page.evaluate(()=>window.hoyGuestDecisionCoreVersion)).toBe('2.28.2');
});

test('empty today-content never offers a dead Today moment',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    const first=Number(DATA[0].id);
    window.hoyNowStatus219For=p=>Number(p?.id)===first?{state:'open',label:'Jetzt geöffnet · bis 23:00',source:'operator'}:null;
    window.hoyBestCurrentFor=()=>null;
    state.view='home';state.moment='all';state.query='';state.service='all';state.decision='all';render();
  });
  await expect(page.locator('[data-decision280-home]')).toBeVisible();
  await expect(page.locator('[data-decision280-moment="now"]')).toBeVisible();
  await expect(page.locator('[data-decision280-moment="today"]')).toHaveCount(0);
  expect(await page.evaluate(()=>window.hoyDecision280MomentAvailable('today'))).toBe(false);
});

test('Today moment returns automatically when real current content exists',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    const first=Number(DATA[0].id);
    window.hoyNowStatus219For=p=>Number(p?.id)===first?{state:'open',label:'Jetzt geöffnet · bis 23:00',source:'operator'}:null;
    window.hoyBestCurrentFor=p=>Number(p?.id)===first?{id:'live-test',restaurant_id:first,title:'Live-Musik',starts_at:new Date(Date.now()-30*60000).toISOString(),ends_at:new Date(Date.now()+90*60000).toISOString()}:null;
    state.view='home';state.moment='all';render();
  });
  await expect(page.locator('[data-decision280-moment="today"]')).toBeVisible();
  expect(await page.evaluate(()=>window.hoyDecision280MomentAvailable('today'))).toBe(true);
});

test('stale unavailable Today state fails back to Best selection',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    window.hoyBestCurrentFor=()=>null;
    state.moment='today';state.view='discover';state.query='';state.service='all';state.decision='all';render();
  });
  expect(await page.evaluate(()=>state.moment)).toBe('all');
  await expect(page.locator('.decision280-momentbar [data-decision280-moment="today"]')).toHaveCount(0);
  await expect(page.locator('.decision280-momentbar [data-decision280-moment="all"]')).toHaveClass(/active/);
});

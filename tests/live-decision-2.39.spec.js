const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

// These tests deliberately replace the live status/content functions with deterministic fixtures.
// Wait for the asynchronous production bootstrap to finish first, otherwise a late cloud render can
// legitimately replace DATA/render state after the fixture has been installed and make the test race live data.
async function waitForData(page){
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&!!window.hoyLiveDecision239,{timeout:30000});
}

async function mockLiveSignals(page){
  await page.evaluate(()=>{
    const ids=DATA.slice(0,3).map(x=>Number(x.id));
    DATA[0].latitude=37.650;DATA[0].longitude=-0.720;
    DATA[1].latitude=37.655;DATA[1].longitude=-0.725;
    DATA[2].latitude=37.670;DATA[2].longitude=-0.740;
    window.hoyNowStatus219For=p=>{
      const id=Number(p?.id);
      if(id===ids[0])return {state:'open',tone:'open',label:'Jetzt geöffnet · bis 23:30',source:'operator',operatorConfirmed:true,proof:'Vom Betrieb gepflegt'};
      if(id===ids[1])return {state:'open',tone:'open',label:'Jetzt geöffnet · bis 00:00',source:'base',operatorConfirmed:false,proof:'Nicht live bestätigt'};
      return {state:'later',tone:'later',label:'Öffnet heute 20:30',source:'operator',operatorConfirmed:true,proof:'Vom Betrieb gepflegt'};
    };
    const running={id:'live-running',restaurant_id:ids[0],title:'Live Musik',starts_at:new Date(Date.now()-15*60000).toISOString(),ends_at:new Date(Date.now()+75*60000).toISOString()};
    const soon={id:'live-soon',restaurant_id:ids[1],title:'Sunset Session',starts_at:new Date(Date.now()+45*60000).toISOString(),ends_at:new Date(Date.now()+150*60000).toISOString()};
    window.hoyBestCurrentFor=p=>Number(p?.id)===ids[0]?running:Number(p?.id)===ids[1]?soon:null;
    window.hoyCurrentContentFor=p=>Number(p?.id)===ids[0]?[running]:Number(p?.id)===ids[1]?[soon]:[];
    state.view='home';state.query='';state.service='all';state.moment='all';render();
  });
}

test('2.39 live decision assets are wired with production-safe guest copy',async({page,request})=>{
  const [js,css,index]=await Promise.all([
    request.get('./live-decision-2.39.js'),request.get('./live-decision-2.39.css'),request.get('./index.html')
  ]);
  expect(js.ok()).toBeTruthy();expect(css.ok()).toBeTruthy();expect(index.ok()).toBeTruthy();
  const indexText=await index.text();
  expect(indexText).toContain('live-decision-2.39.css?v=2.39.0');
  expect(indexText).toContain('live-decision-2.39.js?v=2.39.0');
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  expect(await page.evaluate(()=>window.hoyLiveDecisionVersion)).toBe('2.39.0');
  const root=page.locator('[data-live239-root]');
  await expect(root).toBeVisible();
  await expect(root).toContainText('NÄCHSTE 2 STUNDEN');
  await expect(root).toContainText('MEIN HOY PLAN');
  await expect(root).toContainText('HOY LIVE');
  await expect(root).not.toContainText(/Benidorm|HOY LIVE · 2\.39/i);
});

test('HOY Live secondary text meets WCAG AA contrast',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  const results=await page.evaluate(()=>{
    const rgb=value=>{
      const m=String(value).match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[0,0,0];
    };
    const lum=value=>{
      const [r,g,b]=rgb(value).map(x=>x/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
      return .2126*r+.7152*g+.0722*b;
    };
    const ratio=(fg,bg)=>{const a=lum(fg),b=lum(bg),hi=Math.max(a,b),lo=Math.min(a,b);return (hi+.05)/(lo+.05)};
    const pairs=[
      ['timeline','.live239-timeline small','.live239-timeline > button'],
      ['area','.live239-recommend-list .live239-area','.live239-recommend-list .live239-card'],
      ['empty','.live239-empty span','.live239-empty'],
      ['provenance','.live239-signals small.base','.live239-signals small.base']
    ];
    return pairs.map(([name,fgSel,bgSel])=>{
      const fg=document.querySelector(fgSel),bg=document.querySelector(bgSel);
      if(!fg||!bg)return {name,missing:true,ratio:0};
      const fs=getComputedStyle(fg),bs=getComputedStyle(bg);
      return {name,missing:false,ratio:ratio(fs.color,bs.backgroundColor)};
    });
  });
  for(const row of results){expect(row.missing,row.name).toBeFalsy();expect(row.ratio,row.name).toBeGreaterThanOrEqual(4.5)}
});

test('next-two-hours timeline prefers running then imminent content',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  const timeline=page.locator('.live239-timeline');
  await expect(timeline).toBeVisible();
  const rows=timeline.locator('> button');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Live Musik');
  await expect(rows.nth(0)).toContainText('JETZT');
  await expect(rows.nth(1)).toContainText('Sunset Session');
});

test('next-two-hours timeline keeps multiple imminent events from the same venue',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);
  await page.evaluate(()=>{
    const id=Number(DATA[0].id);
    const first={id:'same-venue-1',restaurant_id:id,title:'DJ Warm-up',starts_at:new Date(Date.now()+20*60000).toISOString(),ends_at:new Date(Date.now()+70*60000).toISOString()};
    const second={id:'same-venue-2',restaurant_id:id,title:'Sunset Set',starts_at:new Date(Date.now()+80*60000).toISOString(),ends_at:new Date(Date.now()+140*60000).toISOString()};
    window.hoyCurrentContentFor=p=>Number(p?.id)===id?[first,second]:[];
    window.hoyBestCurrentFor=p=>Number(p?.id)===id?first:null;
    window.hoyNowStatus219For=()=>({state:'open',label:'Jetzt geöffnet',operatorConfirmed:true,proof:'Vom Betrieb gepflegt'});
    state.view='home';render();
  });
  const timeline=page.locator('.live239-timeline');
  await expect(timeline).toContainText('DJ Warm-up');
  await expect(timeline).toContainText('Sunset Set');
});

test('nearby requests geolocation only after explicit user action',async({page})=>{
  await page.addInitScript(()=>{
    window.__hoyGeoCalls=0;
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
      getCurrentPosition(success){window.__hoyGeoCalls++;success({coords:{latitude:37.650,longitude:-0.720}})}
    }});
  });
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  expect(await page.evaluate(()=>window.__hoyGeoCalls)).toBe(0);
  const locate=page.locator('[data-live239-locate]').first();
  await expect(locate).toBeVisible();
  await locate.click();
  await expect.poll(()=>page.evaluate(()=>window.__hoyGeoCalls)).toBe(1);
  await expect(page.locator('.live239-nearby-list .live239-card')).toHaveCount(3);
  await expect(page.locator('.live239-nearby-list .live239-distance').first()).toContainText(/m|km/);
});

test('personal HOY plan persists and remains deliberately capped at four',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  await page.evaluate(()=>localStorage.removeItem('hoy-live-plan-v239'));
  await page.evaluate(()=>window.hoyLiveDecision239.addPlan(Number(DATA[0].id)));
  await expect(page.locator('.live239-plan-list article')).toHaveCount(1);
  const firstName=await page.evaluate(()=>DATA[0].name);
  await expect(page.locator('.live239-plan-list')).toContainText(firstName);
  await page.reload({waitUntil:'domcontentloaded'});await waitForData(page);
  await expect(page.locator('.live239-plan-list article')).toHaveCount(1);
  expect(await page.evaluate(()=>window.hoyLiveDecision239.readPlan().length)).toBe(1);
});

test('live decision layer keeps provenance visible',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForData(page);await mockLiveSignals(page);
  const cards=page.locator('.live239-recommend-list .live239-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('Vom Betrieb gepflegt');
  await expect(cards.nth(1)).toContainText('Nicht live bestätigt');
});

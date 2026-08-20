const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.hoyMerchantTruthFreshness250For==='function'&&typeof window.hoyNowStatus219For==='function');
}

const allDaySchedule=()=>({mon:[['08:00','23:00']],tue:[['08:00','23:00']],wed:[['08:00','23:00']],thu:[['08:00','23:00']],fri:[['08:00','23:00']],sat:[['08:00','23:00']],sun:[['08:00','23:00']]});

test('same-day operator confirmation earns explicit live proof with confirmation time',async({page})=>{
  await ready(page);
  const status=await page.evaluate(schedule=>window.hoyNowStatus219For({operator_hours:{weekly_hours:schedule,confirmed_at:'2026-08-20T08:10:00Z',updated_at:'2026-08-20T08:10:00Z'}},new Date('2026-08-20T10:30:00Z')),allDaySchedule());
  expect(status).toMatchObject({state:'open',source:'operator',operatorConfirmed:true,operatorManaged:true});
  expect(status.proof).toContain('Vom Betrieb bestätigt · heute');
  expect(status.operatorFreshness).toMatchObject({key:'today',isToday:true,stale:false});
});

test('recent operator plan remains usable but is not mislabelled as a today-live confirmation',async({page})=>{
  await ready(page);
  const status=await page.evaluate(schedule=>window.hoyNowStatus219For({operator_hours:{weekly_hours:schedule,confirmed_at:'2026-08-15T08:00:00Z',updated_at:'2026-08-15T08:00:00Z'}},new Date('2026-08-20T10:30:00Z')),allDaySchedule());
  expect(status).toMatchObject({state:'open',source:'operator',operatorConfirmed:false,operatorManaged:true});
  expect(status.label).toBe('Laut Betreiberzeiten · offen bis 23:00');
  expect(status.proof).toContain('vor 5 Tagen');
  expect(status.operatorFreshness).toMatchObject({key:'recent',days:5,stale:false});
});

test('operator plan older than 30 days cannot outrank verified base truth for NOW',async({page})=>{
  await ready(page);
  const values=await page.evaluate(schedule=>{
    const now=new Date('2026-08-20T10:30:00Z');
    const stale={weekly_hours:schedule,confirmed_at:'2026-07-01T08:00:00Z',updated_at:'2026-07-01T08:00:00Z'};
    return {
      fallback:window.hoyNowStatus219For({operator_hours:stale,hours_status:'verified',hours_text:'Mo–So 08:00–23:00'},now),
      noBase:window.hoyNowStatus219For({operator_hours:stale,hours_status:'missing',hours_text:''},now)
    };
  },allDaySchedule());
  expect(values.fallback).toMatchObject({state:'open',source:'base',operatorConfirmed:false,staleOperatorIgnored:true});
  expect(values.fallback.operatorFreshness).toMatchObject({key:'stale',stale:true});
  expect(values.noBase).toBeNull();
});

test('missing or future confirmation timestamps fail closed instead of creating fake freshness',async({page})=>{
  await ready(page);
  const values=await page.evaluate(schedule=>{
    const now=new Date('2026-08-20T10:30:00Z');
    return {
      missing:window.hoyNowStatus219For({operator_hours:{weekly_hours:schedule},hours_status:'missing'},now),
      future:window.hoyNowStatus219For({operator_hours:{weekly_hours:schedule,confirmed_at:'2026-08-21T10:30:00Z'},hours_status:'missing'},now)
    };
  },allDaySchedule());
  expect(values.missing).toBeNull();
  expect(values.future).toBeNull();
});

test('date-specific operator special remains authoritative for its service date and carries dated proof',async({page})=>{
  await ready(page);
  const status=await page.evaluate(()=>window.hoyNowStatus219For({operator_special_hours:{service_date:'2026-08-20',intervals:[['08:00','23:00']],is_closed:false,updated_at:'2026-08-01T08:00:00Z'}},new Date('2026-08-20T10:30:00Z')));
  expect(status).toMatchObject({state:'open',source:'operator-special',operatorConfirmed:true,operatorManaged:true});
  expect(status.proof).toContain('Sonderzeit vom Betrieb');
  expect(status.operatorFreshness.valid).toBe(true);
});

test('freshness layer is shipped and PWA-cached without changing the canonical app release number',async({page,request})=>{
  await ready(page);
  expect(await page.evaluate(()=>window.hoyMerchantTruthFreshnessVersion)).toBe('2.50.0');
  const [index,worker,pkg]=await Promise.all([request.get('./index.html'),request.get('./service-worker.js'),request.get('./package.json')]);
  const indexText=await index.text(),workerText=await worker.text(),meta=await pkg.json();
  expect(meta.version).toBe('2.39.0');
  expect(indexText).toContain('merchant-truth-freshness-2.50.js?v=2.50.0');
  expect(indexText).toContain('merchant-truth-freshness-2.50.css?v=2.50.0');
  expect(workerText).toContain("'./merchant-truth-freshness-2.50.js'");
  expect(workerText).toContain("'./merchant-truth-freshness-2.50.css'");
});

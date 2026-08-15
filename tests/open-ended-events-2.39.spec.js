const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyOpenEndEvent239&&Array.isArray(DATA)&&DATA.length>0,{timeout:30000});
}

test('an event with no published end time is never presented as running now',async({page})=>{
  await ready(page);
  const states=await page.evaluate(()=>{
    const row={offer_type:'event',starts_at:'2026-08-18T22:00:00Z',ends_at:null}; // 00:00 Madrid, 19 Aug
    return {
      before:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-18T21:00:00Z')),
      afterStart:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-19T01:00:00Z')),
      nextDay:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-19T22:00:00Z'))
    };
  });

  expect(states.before.key).toBe('soon');
  expect(states.before.label).toContain('Ende offen');
  expect(states.afterStart.key).toBe('uncertain');
  expect(states.afterStart.label).toContain('Ende nicht gemeldet');
  expect(states.nextDay.key).toBe('expired');
  expect([states.before.key,states.afterStart.key,states.nextDay.key]).not.toContain('running');
});

test('open-ended event support is wired into the app and provenance migration',async({request})=>{
  const [index,module,migration]=await Promise.all([
    request.get('./index.html'),
    request.get('./open-ended-events-2.39.js'),
    request.get('./supabase/migrations/20260815073500_verified_open_ended_events.sql')
  ]);
  for(const response of [index,module,migration])expect(response.ok()).toBeTruthy();

  const html=await index.text();
  const js=await module.text();
  const sql=await migration.text();
  expect(html).toContain('open-ended-events-2.39.js?v=2.39.0');
  expect(js).toContain('Ende nicht gemeldet');
  expect(js).toContain('Ende offen');
  expect(sql).toContain('alter column created_by drop not null');
  expect(sql).toContain('source_url');
  expect(sql).toContain('source_checked_at');
  expect(sql).toContain("publisher_kind <> 'hoy'");
  expect(sql).toContain("at time zone 'Europe/Madrid'");
});

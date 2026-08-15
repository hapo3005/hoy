const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.hoyOpenEndEvent239&&window.hoyEventProvenance239&&Array.isArray(DATA)&&DATA.length>0,{timeout:30000});
}

test('an event with no published end time is never presented as running now',async({page})=>{
  await ready(page);
  const states=await page.evaluate(()=>{
    const row={offer_type:'event',starts_at:'2026-08-18T22:00:00Z',ends_at:null}; // 00:00 Madrid, 19 Aug
    const blank={...row,ends_at:''};
    return {
      before:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-18T21:00:00Z')),
      afterStart:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-19T01:00:00Z')),
      nextDay:window.hoyOpenEndEvent239.openEndPhase(row,new Date('2026-08-19T22:00:00Z')),
      blankEnd:window.hoyOpenEndEvent239.openEndPhase(blank,new Date('2026-08-18T21:00:00Z'))
    };
  });

  expect(states.before.key).toBe('soon');
  expect(states.before.label).toContain('Ende offen');
  expect(states.afterStart.key).toBe('uncertain');
  expect(states.afterStart.label).toContain('Ende nicht gemeldet');
  expect(states.nextDay.key).toBe('expired');
  expect(states.blankEnd.key).toBe('soon');
  expect([states.before.key,states.afterStart.key,states.nextDay.key]).not.toContain('running');
});

test('open-ended event support is wired into app, PWA, visible provenance and migration',async({request})=>{
  const [index,module,provenance,migration,worker]=await Promise.all([
    request.get('./index.html'),
    request.get('./open-ended-events-2.39.js'),
    request.get('./event-provenance-2.39.js'),
    request.get('./supabase/migrations/20260815073500_verified_open_ended_events.sql'),
    request.get('./service-worker.js')
  ]);
  for(const response of [index,module,provenance,migration,worker])expect(response.ok()).toBeTruthy();

  const html=await index.text();
  const js=await module.text();
  const proof=await provenance.text();
  const sql=await migration.text();
  const sw=await worker.text();
  expect(html).toContain('open-ended-events-2.39.js?v=2.39.0');
  expect(html).toContain('event-provenance-2.39.js?v=2.39.0');
  expect(sw).toContain("'./open-ended-events-2.39.js'");
  expect(sw).toContain("'./event-provenance-2.39.js'");
  expect(js).toContain(".is('ends_at',null)");
  expect(js).toContain('loadOpenEndedContent');
  expect(js).toContain('Ende nicht gemeldet');
  expect(js).toContain('Ende offen');
  expect(proof).toContain('source_url');
  expect(proof).toContain('source_checked_at');
  expect(proof).toContain('Geprüfte Originalquelle');
  expect(proof).toContain("link.target='_blank'");
  expect(sql).toContain('alter column created_by drop not null');
  expect(sql).toContain('source_url');
  expect(sql).toContain('source_checked_at');
  expect(sql).toContain("publisher_kind <> 'hoy'");
  expect(sql).toContain("at time zone 'Europe/Madrid'");
});

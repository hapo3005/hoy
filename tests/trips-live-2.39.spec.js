const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

const EVENT_TITLE='La Clásica Fiesta Ochentera';
const EVENT_START=Date.parse('2026-08-18T22:00:00Z'); // 19 Aug 00:00 Europe/Madrid
const PUBLIC_EXPIRES=Date.parse('2026-08-19T22:00:00Z'); // 20 Aug 00:00 Europe/Madrid
const SOURCE='https://www.fourvenues.com/trips-summer-club/events/la-clasica-fiesta-ochentera-19-08-2026-APPS';

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online'&&window.hoyOpenEndEvent239&&window.hoyEventProvenance239,{timeout:30000});
}

test('real Trips event is source-backed, open-ended and never falsely shown as running',async({page})=>{
  await ready(page);

  const result=await page.evaluate(({title})=>{
    const p=DATA.find(x=>Number(x.id)===241)||null;
    const rows=p?(window.hoyCurrentContentFor?.(p)||[]):[];
    const event=rows.find(r=>String(r.title||'')===title)||null;
    const phase=event?window.hoyOpenEndEvent239.openEndPhase(event,new Date()):null;
    const source=event?window.hoyEventProvenance239.sourceById.get(String(event.id))||null:null;
    return {
      restaurant:!!p,
      event:event?{
        id:String(event.id||''),
        title:event.title,
        startsAt:event.starts_at,
        endsAt:event.ends_at??null,
        publisher:event.publisher_kind||'',
        phase
      }:null,
      source
    };
  },{title:EVENT_TITLE});

  expect(result.restaurant).toBeTruthy();
  const now=Date.now();
  if(now>=PUBLIC_EXPIRES){
    expect(result.event).toBeNull();
    return;
  }

  expect(result.event).not.toBeNull();
  expect(result.event.title).toBe(EVENT_TITLE);
  expect(result.event.endsAt).toBeNull();
  expect(result.event.publisher).toBe('hoy');
  expect(Date.parse(result.event.startsAt)).toBe(EVENT_START);
  expect(result.source).not.toBeNull();
  expect(result.source.url).toBe(SOURCE);

  if(now<EVENT_START){
    expect(['future','tomorrow','soon','today']).toContain(result.event.phase?.key);
    expect(result.event.phase?.label||'').toContain('Ende offen');
  }else{
    expect(result.event.phase?.key).toBe('uncertain');
    expect(result.event.phase?.label||'').toContain('Ende nicht gemeldet');
  }
  expect(result.event.phase?.key).not.toBe('running');

  await page.evaluate(()=>openDetail(241));
  const dialog=page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  const item=dialog.locator('.hoy-current-item').filter({hasText:EVENT_TITLE}).first();
  await expect(item).toBeVisible();
  await expect(item).toContainText(/Ende offen|Ende nicht gemeldet/);
  const sourceLink=item.locator('.hoy-current-proof a');
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute('href',SOURCE);
  await expect(sourceLink).toHaveAttribute('target','_blank');
  await expect(sourceLink).toContainText('Fourvenues');
});

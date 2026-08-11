const fs=require('node:fs');
const path=require('node:path');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyOperatorDataConfirmationVersion==='2.29.0');
}

const schedule={
  mon:[['12:00','23:00']],tue:[['12:00','23:00']],wed:[],thu:[['12:00','23:00']],
  fri:[['12:00','24:00']],sat:[['12:00','24:00']],sun:[['12:00','18:00']]
};

test('HOY 2.29 release assets are wired and cached',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./operator-data-confirmation-2.29.js'),request.get('./operator-data-confirmation-2.29.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.29.0');
  const indexText=await index.text(),workerText=await worker.text();
  expect(indexText).toContain('App 2.29.0');
  expect(indexText).toContain('operator-data-confirmation-2.29.css?v=2.29.0');
  expect(indexText).toContain('operator-data-confirmation-2.29.js?v=2.29.0');
  expect(workerText).toContain("const CACHE='hoy-v2.29.0'");
  expect(workerText).toContain('./operator-data-confirmation-2.29.css');
  expect(workerText).toContain('./operator-data-confirmation-2.29.js');
});

test('confirmation schedule stays structured and supports midnight closing',async({page})=>{
  await ready(page);
  const result=await page.evaluate(input=>({
    normalized:window.hoyOperatorConfirmationNormalizeSchedule(input),
    text:window.hoyOperatorConfirmationScheduleText(input)
  }),schedule);
  expect(result.normalized.fri[0]).toEqual(['12:00','24:00']);
  expect(result.text).toContain('Fr 12:00–24:00');
  expect(result.text).toContain('Mi geschlossen');
});

test('verified restaurant gets one clear confirmation task before live hours exist',async({page})=>{
  await ready(page);
  const html=await page.evaluate(input=>{
    const original=claimedRestaurant;
    const p={...DATA[0],operator_verified:true,hours_weekly:input,hours_source_label:'Offizielle Website',hours_checked_at:new Date().toISOString(),operator_hours:null};
    claimedRestaurant=()=>p;
    try{return partner()}finally{claimedRestaurant=original}
  },schedule);
  expect(html).toContain('Stimmen diese Öffnungszeiten?');
  expect(html).toContain('Ja, stimmt');
  expect(html).toContain('Korrigieren');
  expect(html).toContain('EINMAL KURZ BESTÄTIGEN');
});

test('correction editor is free and contains no specials or paid live fields',async({page})=>{
  await ready(page);
  await page.evaluate(input=>window.hoyOpenOperatorHoursConfirmation({...DATA[0],operator_verified:true,hours_weekly:input,operator_hours:null}),schedule);
  const dialog=page.locator('#operatorHoursConfirmFlow');
  await expect(dialog).toHaveAttribute('open','');
  await expect(dialog).toContainText('FREE · DATENBESTÄTIGUNG');
  await expect(dialog).toContainText('Wochenzeiten korrigieren');
  await expect(dialog.locator('[data-confirm-day]')).toHaveCount(7);
  await expect(dialog.locator('[data-special-date]')).toHaveCount(0);
  await expect(dialog.locator('[data-live-notice]')).toHaveCount(0);
});

test('server endpoint requires verified membership and operator verification without a paid-plan gate',async()=>{
  const source=fs.readFileSync(path.join(process.cwd(),'supabase/functions/operator-hours-confirm/index.ts'),'utf8');
  expect(source).toContain("from('restaurant_memberships')");
  expect(source).toContain('membership?.verified_at');
  expect(source).toContain("from('restaurant_entitlements')");
  expect(source).toContain('entitlement?.operator_verified');
  expect(source).toContain("from('restaurant_live_hours')");
  expect(source).toContain("action === 'confirm'");
  expect(source).toContain("action === 'correct'");
  expect(source).not.toMatch(/active_plan[^\n]*(?:pro|business)/i);
  expect(source).not.toMatch(/resend|sendgrid|mailgun|send_email|sendEmail/i);
});

test('confirmation endpoint does not overwrite researched restaurant base hours',async()=>{
  const source=fs.readFileSync(path.join(process.cwd(),'supabase/functions/operator-hours-confirm/index.ts'),'utf8');
  expect(source).not.toMatch(/from\('restaurants'\)[\s\S]{0,240}\.update\(/);
  expect(source).toContain("upsert(payload, { onConflict: 'restaurant_id' })");
});

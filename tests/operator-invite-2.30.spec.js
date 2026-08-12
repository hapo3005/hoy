const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});
const read=file=>fs.readFileSync(file,'utf8');

test('HOY 2.30 invite assets remain wired in the 2.32 release',async({request})=>{
  const [js,css,pkg,index,worker]=await Promise.all([
    request.get('./operator-invite-2.30.js'),request.get('./operator-invite-2.30.css'),request.get('./package.json'),request.get('./index.html'),request.get('./service-worker.js')
  ]);
  for(const r of [js,css,pkg,index,worker])expect(r.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.32.0');
  const html=await index.text(),sw=await worker.text();
  expect(html).toContain('App 2.32.0');
  expect(html).toContain('operator-invite-2.30.css?v=2.30.0');
  expect(html).toContain('operator-invite-2.30.js?v=2.30.0');
  expect(sw).toContain("const CACHE='hoy-v2.32.0'");
  expect(sw).toContain('./operator-invite-2.30.js');
  expect(sw).toContain('./operator-invite-2.30.css');
});

test('restaurant invite deep link opens the existing three-step claim with the correct venue preselected',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0);
  const id=await page.evaluate(()=>Number(DATA[0].id));
  const name=await page.evaluate(()=>String(DATA[0].name));
  await page.goto(`./?claim=${id}&from=operator_invite`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#claimFlow')).toHaveAttribute('open','',{timeout:5000});
  await expect(page.locator('#claimFlow')).toContainText('1/3');
  await expect(page.locator('#claimFlow')).toContainText(`${name} ist bereits vorbereitet.`);
  expect(await page.evaluate(()=>Number(claimDraft.restaurantId))).toBe(id);
  expect(await page.locator('#claimFlow [data-claim-restaurant]').inputValue()).toBe(String(id));
});

test('invite URL is selection only and contains no authorization material',()=>{
  const js=read('operator-invite-2.30.js');
  expect(js).toContain("const PARAM='claim'");
  expect(js).toContain("openClaimFlow(id,1)");
  expect(js).not.toMatch(/token|secret|service_role|verified_at|operator_verified\s*=|business_claims.*insert/i);
  expect(js).not.toMatch(/submitClaimCloud\s*\(/);
});

test('admin can copy or preview an invite but cannot send or unlock outreach',()=>{
  const js=read('admin-invite-2.22.js');
  const html=read('admin.html');
  expect(html).toContain('HOY Control Center · 2.23.0');
  expect(html).toContain('admin-invite-2.22.js?v=2.22.0');
  expect(js).toContain('data-invite-copy');
  expect(js).toContain('data-invite-preview');
  expect(js).toContain("url.searchParams.set('claim'");
  expect(js).not.toMatch(/venue_sales_pipeline.*update|send_authorized_at|send_lock\s*:|mailgun|sendgrid|send_email|sendEmail/i);
});

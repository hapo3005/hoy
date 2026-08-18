const {test,expect}=require('@playwright/test');

test('loopback QA never calls the production analytics RPC',async({page})=>{
  const analyticsRequests=[];
  page.on('request',request=>{
    if(/\/rest\/v1\/rpc\/log_analytics_event(?:\?|$)/.test(request.url()))analyticsRequests.push(request.url());
  });

  await page.goto('./',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#bottom')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.hoyProductionAnalyticsAllowed181?.())).toBe(false);

  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({timeout:20_000});
  await page.locator('.list-card[data-open]').first().click();
  await expect(page.locator('#detail[open]')).toBeVisible();
  await page.waitForTimeout(300);

  expect(analyticsRequests).toEqual([]);
});

test('proof-gate enrollment accepts only P01-P30, strips the URL token and stays QA-isolated',async({page})=>{
  const analyticsRequests=[];
  page.on('request',request=>{
    if(/\/rest\/v1\/rpc\/log_analytics_event(?:\?|$)/.test(request.url()))analyticsRequests.push(request.url());
  });

  await page.goto('./?pilot=p07&keep=1',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#bottom')).toBeVisible();

  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('hoy-proof-pilot-code-v1'))).toBe('P07');
  const cleaned=new URL(page.url());
  expect(cleaned.searchParams.get('pilot')).toBeNull();
  expect(cleaned.searchParams.get('keep')).toBe('1');

  const enrollment=await expect.poll(()=>page.evaluate(()=>{
    const rows=typeof readEvents==='function'?readEvents():[];
    return [...rows].reverse().find(row=>row.type==='qr_open'&&row.meta?.source==='proof_gate')||null;
  })).not.toBeNull();
  const enrolled=await page.evaluate(()=>{
    const rows=typeof readEvents==='function'?readEvents():[];
    return [...rows].reverse().find(row=>row.type==='qr_open'&&row.meta?.source==='proof_gate')||null;
  });
  expect(enrolled?.meta?.pilot_code).toBe('P07');
  expect(await page.evaluate(()=>localStorage.getItem('hoy-anonymous-id-v1'))).toMatch(/^[0-9a-f-]{36}$/i);
  expect(analyticsRequests).toEqual([]);

  // Malformed/free-text values are removed and cannot overwrite the bound cohort code.
  await page.goto('./?pilot=jan%40example.com&keep=2',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('hoy-proof-pilot-code-v1'))).toBe('P07');
  const invalidCleaned=new URL(page.url());
  expect(invalidCleaned.searchParams.get('pilot')).toBeNull();
  expect(invalidCleaned.searchParams.get('keep')).toBe('2');

  // A second valid participant code cannot silently reassign the same browser.
  await page.goto('./?pilot=P08',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('hoy-proof-pilot-code-v1'))).toBe('P07');
  expect(new URL(page.url()).searchParams.get('pilot')).toBeNull();
  expect(analyticsRequests).toEqual([]);
});

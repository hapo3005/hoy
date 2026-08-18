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

const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

function fixtureEvent() {
  const now = Date.now();
  return {
    id: '11111111-1111-4111-8111-111111111111', restaurant_id: 1, offer_type: 'event', event_kind: 'live_music',
    title: 'Sunset Session', description: 'Live-Musik am Mar Menor.', price_text: null, entry_text: 'Eintritt frei',
    reservation_recommended: true, starts_at: new Date(now - 30 * 60_000).toISOString(), ends_at: new Date(now + 90 * 60_000).toISOString(),
    publisher_kind: 'operator', published_at: new Date(now - 86400000).toISOString(), updated_at: new Date(now - 86400000).toISOString()
  };
}
function fixturePromotion() {
  const now = Date.now();
  return {
    id: '22222222-2222-4222-8222-222222222222', offer_id: '11111111-1111-4111-8111-111111111111', restaurant_id: 1,
    placement: 'home_highlight', status: 'active', billing_status: 'paid', starts_at: new Date(now - 10 * 60_000).toISOString(),
    ends_at: new Date(now + 80 * 60_000).toISOString(), quoted_price_cents: 2900, currency: 'EUR',
    created_at: new Date(now - 3600000).toISOString(), updated_at: new Date(now - 10 * 60_000).toISOString()
  };
}
async function mockCurrent(page) {
  await page.route('**/rest/v1/offers**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([fixtureEvent()]) }));
  await page.route('**/rest/v1/event_promotions**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([fixturePromotion()]) }));
}

test('explicit sponsored open starts a 30 minute same-venue attribution window', async ({ page }) => {
  const calls = [];
  await mockCurrent(page);
  await page.route('**/rest/v1/rpc/log_analytics_event', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: 'null' });
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const highlight = page.locator('.hoy-promo-highlight');
  await expect(highlight).toBeVisible({ timeout: 20_000 });
  await highlight.locator('[data-promotion-open]').click();

  const attribution = await page.evaluate(() => window.hoyPromotionAttribution218?.());
  expect(attribution?.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
  expect(attribution?.restaurant_id).toBe(1);
  expect(attribution?.expires_at - attribution?.opened_at).toBe(30 * 60 * 1000);

  await page.evaluate(() => trackEvent('website_open', 1, { qa: true }));
  await expect.poll(() => calls.filter(x => x?.p_event_type === 'website_open').length).toBeGreaterThan(0);
  const website = calls.find(x => x?.p_event_type === 'website_open');
  expect(website.p_metadata.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
  expect(website.p_metadata.promotion_attribution).toBe('sponsored_open_30m_same_venue');
  expect(website.p_metadata.sponsored).toBe('true');
});

test('promotion attribution never leaks to another venue or past its expiry', async ({ page }) => {
  const calls = [];
  await mockCurrent(page);
  await page.route('**/rest/v1/rpc/log_analytics_event', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: 'null' });
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hoy-promo-highlight')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-promotion-open]').click();
  calls.length = 0;

  await page.evaluate(() => trackEvent('website_open', 2, { qa: 'other-venue' }));
  await expect.poll(() => calls.filter(x => x?.p_event_type === 'website_open').length).toBe(1);
  expect(calls[0].p_metadata.promotion_id).toBeUndefined();

  calls.length = 0;
  await page.evaluate(() => {
    const a = window.hoyPromotionAttribution218();
    sessionStorage.setItem('hoy-promo-attribution-v1', JSON.stringify({ ...a, expires_at: Date.now() - 1 }));
    trackEvent('website_open', 1, { qa: 'expired' });
  });
  await expect.poll(() => calls.filter(x => x?.p_event_type === 'website_open').length).toBe(1);
  expect(calls[0].p_metadata.promotion_id).toBeUndefined();
});

test('2.18 pricing and insights assets are real deployed resources', async ({ request }) => {
  const pkg = await request.get('./package.json');
  expect(pkg.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.18.0');

  for (const asset of ['./promotion-insights-2.18.js','./promotion-insights-2.18.css','./admin-promotion-2.18.js','./admin-promotion-2.18.css']) {
    const res = await request.get(asset);
    expect(res.ok(), `${asset} should load`).toBeTruthy();
    expect((res.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  }

  const worker = await request.get('./service-worker.js');
  const workerText = await worker.text();
  expect(workerText).toContain("const CACHE='hoy-v2.18.0'");
  expect(workerText).toContain('./promotion-insights-2.18.js');
  expect(workerText).toContain('./promotion-insights-2.18.css');

  const admin = await request.get('./admin.html');
  const adminText = await admin.text();
  expect(adminText).toContain('HOY Control Center · 2.18');
  expect(adminText).toContain('admin-promotion-2.18.js?v=2.18.0');
  expect(adminText).not.toContain('admin-promotion-2.17.js');
});

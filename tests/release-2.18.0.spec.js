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
async function openAguaSala(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible({ timeout: 12_000 });
  return detail;
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

  await page.evaluate(() => trackEvent('call_click', 1, { qa: 'phone' }));
  await expect.poll(() => calls.filter(x => x?.p_event_type === 'call_click').length).toBeGreaterThan(0);
  const phone = calls.find(x => x?.p_event_type === 'call_click');
  expect(phone.p_metadata.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
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

test('restaurant profile still opens after a visible discover card is replaced without direct listeners', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('Agua Salá');

  const card = page.locator('.list-card[data-open]').filter({ hasText: 'Agua Salá' }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    const old = [...document.querySelectorAll('.list-card[data-open]')].find(x => (x.textContent || '').includes('Agua Salá'));
    if (!old) throw new Error('Agua Salá card missing');
    old.replaceWith(old.cloneNode(true));
  });

  await card.click();
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible({ timeout: 12_000 });
  await expect(detail).toContainText('Agua Salá');
  await detail.locator('[data-close]').first().click();
  await expect(detail).not.toBeVisible();

  await page.evaluate(() => {
    const old = [...document.querySelectorAll('.list-card[data-open]')].find(x => (x.textContent || '').includes('Agua Salá'));
    if (!old) throw new Error('Agua Salá card missing after close');
    old.replaceWith(old.cloneNode(true));
  });
  await card.focus();
  await card.press('Enter');
  await expect(detail).toBeVisible({ timeout: 12_000 });
  await expect(detail).toContainText('Agua Salá');
});

test('menu refresh stays observer-free and preserves the active profile section', async ({ page }) => {
  const detail = await openAguaSala(page);
  const active = detail.locator('.profile-premium-nav a.active');
  await expect(active).toContainText(/Überblick/i);

  const immediate = await page.evaluate(() => {
    const d = document.querySelector('#detail[open]');
    window.__hoyQaRealIntersectionObserver = window.IntersectionObserver;
    window.__hoyQaObserverConstructed = 0;
    window.IntersectionObserver = class {
      constructor(){ window.__hoyQaObserverConstructed += 1; }
      observe(){}
      disconnect(){}
      unobserve(){}
      takeRecords(){ return []; }
    };
    window.dispatchEvent(new CustomEvent('hoy:profile-menu-refreshed', {
      detail: { restaurantId: Number(d?.dataset.restaurantId || 0), qa: true }
    }));
    return {
      activeHref: d?.querySelector('.profile-premium-nav a.active')?.getAttribute('href') || '',
      activeText: d?.querySelector('.profile-premium-nav a.active')?.textContent || ''
    };
  });

  expect(immediate.activeHref).toBe('#profile-about');
  expect(immediate.activeText).toMatch(/Überblick/i);
  await page.waitForTimeout(200);
  const observerCount = await page.evaluate(() => {
    const count = Number(window.__hoyQaObserverConstructed || 0);
    if (window.__hoyQaRealIntersectionObserver) window.IntersectionObserver = window.__hoyQaRealIntersectionObserver;
    delete window.__hoyQaRealIntersectionObserver;
    delete window.__hoyQaObserverConstructed;
    return count;
  });
  expect(observerCount).toBe(0);
  await expect(active).toContainText(/Überblick/i);
});

test('2.18.3 pricing, insights and lifecycle assets are real deployed resources', async ({ request }) => {
  const pkg = await request.get('./package.json');
  expect(pkg.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.18.3');

  for (const asset of ['./promotion-insights-2.18.js','./promotion-insights-2.18.css','./profile-open-stability-2.18.1.js','./profile-premium-2.12.js','./menu-signature-2.13.js','./admin-promotion-2.18.js','./admin-promotion-2.18.css']) {
    const res = await request.get(asset);
    expect(res.ok(), `${asset} should load`).toBeTruthy();
    expect((res.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  }

  const worker = await request.get('./service-worker.js');
  const workerText = await worker.text();
  expect(workerText).toContain("const CACHE='hoy-v2.18.3'");
  expect(workerText).toContain('./promotion-insights-2.18.js');
  expect(workerText).toContain('./profile-open-stability-2.18.1.js');

  const app = await request.get('./index.html');
  const appText = await app.text();
  expect(appText).toContain('profile-premium-2.12.js?v=2.18.3');
  expect(appText).toContain('menu-signature-2.13.js?v=2.18.3');

  const admin = await request.get('./admin.html');
  const adminText = await admin.text();
  expect(adminText).toContain('HOY Control Center · 2.18.3');
  expect(adminText).toContain('admin-promotion-2.18.js?v=2.18.3');
  expect(adminText).not.toContain('admin-promotion-2.17.js');
});

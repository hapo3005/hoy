const { test, expect } = require('@playwright/test');
const { CURRENT_RELEASE } = require('./helpers/current-release');

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
async function qaPayload(page,type){
  await expect.poll(async()=>page.evaluate(()=>window.hoyLastQaAnalyticsPayload181?.p_event_type||null)).toBe(type);
  return page.evaluate(()=>window.hoyLastQaAnalyticsPayload181);
}

test('explicit sponsored open starts a 30 minute same-venue attribution window', async ({ page }) => {
  await mockCurrent(page);
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const highlight = page.locator('.hoy-promo-highlight');
  await expect(highlight).toBeVisible({ timeout: 20_000 });
  await highlight.locator('[data-promotion-open]').click();
  const attribution = await page.evaluate(() => window.hoyPromotionAttribution218?.());
  expect(attribution?.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
  expect(attribution?.restaurant_id).toBe(1);
  expect(attribution?.expires_at - attribution?.opened_at).toBe(30 * 60 * 1000);

  await page.evaluate(() => trackEvent('website_open', 1, { qa: true }));
  const website=await qaPayload(page,'website_open');
  expect(website.p_metadata.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
  expect(website.p_metadata.promotion_attribution).toBe('sponsored_open_30m_same_venue');
  expect(website.p_metadata.sponsored).toBe('true');
  expect(website.p_metadata.qa_runtime).toBe('1');

  await page.evaluate(() => trackEvent('call_click', 1, { qa: 'phone' }));
  const phone=await qaPayload(page,'call_click');
  expect(phone.p_metadata.promotion_id).toBe('22222222-2222-4222-8222-222222222222');
});

test('promotion attribution never leaks to another venue or past its expiry', async ({ page }) => {
  await mockCurrent(page);
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hoy-promo-highlight')).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-promotion-open]').click();

  await page.evaluate(() => trackEvent('website_open', 2, { qa: 'other-venue' }));
  const otherVenue=await qaPayload(page,'website_open');
  expect(otherVenue.p_restaurant_id).toBe(2);
  expect(otherVenue.p_metadata.promotion_id).toBeUndefined();

  await page.evaluate(() => {
    const a = window.hoyPromotionAttribution218();
    sessionStorage.setItem('hoy-promo-attribution-v1', JSON.stringify({ ...a, expires_at: Date.now() - 1 }));
    trackEvent('website_open', 1, { qa: 'expired' });
  });
  const expired=await qaPayload(page,'website_open');
  expect(expired.p_restaurant_id).toBe(1);
  expect(expired.p_metadata.promotion_id).toBeUndefined();
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
    const card = [...document.querySelectorAll('.list-card[data-open]')].find(x => (x.textContent || '').includes('Agua Salá'));
    if (card) card.remove();
  });
});

test('menu refresh stays observer-free and preserves the active profile section', async ({ page }) => {
  await openAguaSala(page);
  const detail=page.locator('#detail[open]');
  const menuTab=detail.locator('[data-tab="menu"]');
  await menuTab.click();
  await expect(detail.locator('[data-section="menu"]')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hoy-menu-refresh')));
  await expect(detail.locator('[data-section="menu"]')).toBeVisible();
});

test('2.18.5 pricing, insights and lifecycle assets remain real deployed resources after later releases', async ({ request }) => {
  for (const path of [
    './promotion-insights-2.18.js',
    './promotion-insights-2.18.css',
    './supabase/functions/promotion-insights/index.ts',
    './supabase/migrations/20260811010706_event_promotion_integrity_and_metrics_218.sql'
  ]) {
    const response=await request.get(path);
    expect(response.ok(),`${path} should be deployed`).toBeTruthy();
  }
  expect(CURRENT_RELEASE).toBeTruthy();
});

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

function fixtureEvent() {
  const now = Date.now();
  return {
    id: '11111111-1111-4111-8111-111111111111',
    restaurant_id: 1,
    offer_type: 'event',
    event_kind: 'live_music',
    title: 'Sunset Session',
    description: 'Live-Musik und ein entspannter Abend am Mar Menor.',
    price_text: null,
    entry_text: 'Eintritt frei',
    reservation_recommended: true,
    starts_at: new Date(now - 30 * 60_000).toISOString(),
    ends_at: new Date(now + 90 * 60_000).toISOString(),
    publisher_kind: 'operator',
    published_at: new Date(now - 24 * 60 * 60_000).toISOString(),
    updated_at: new Date(now - 24 * 60 * 60_000).toISOString()
  };
}

function fixturePromotion({ billing = 'paid', startsInMinutes = -10 } = {}) {
  const now = Date.now();
  return {
    id: '22222222-2222-4222-8222-222222222222',
    offer_id: '11111111-1111-4111-8111-111111111111',
    restaurant_id: 1,
    placement: 'home_highlight',
    status: 'active',
    billing_status: billing,
    starts_at: new Date(now + startsInMinutes * 60_000).toISOString(),
    ends_at: new Date(now + 80 * 60_000).toISOString(),
    quoted_price_cents: billing === 'paid' ? 2900 : null,
    currency: 'EUR',
    created_at: new Date(now - 60 * 60_000).toISOString(),
    updated_at: new Date(now - 10 * 60_000).toISOString()
  };
}

async function mockCurrent(page, promotions) {
  await page.route('**/rest/v1/offers**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify([fixtureEvent()])
  }));
  await page.route('**/rest/v1/event_promotions**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(promotions)
  }));
}

async function openDiscoverForVenue(page) {
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('El Camarote de la Martinique');
  await expect(page.locator('.list-card[data-open="1"]')).toBeVisible();
}

test('an approved paid highlight is explicitly sponsored across the guest journey without a hidden ranking slot', async ({ page }, testInfo) => {
  await mockCurrent(page, [fixturePromotion()]);
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  await expect.poll(() => page.evaluate(() => window.hoyPromotionSummary?.().eligible ?? -1), { timeout: 20_000 }).toBe(1);
  const highlight = page.locator('.hoy-promo-highlight');
  await expect(highlight).toBeVisible({ timeout: 20_000 });
  await expect(highlight).toContainText('HOY HIGHLIGHT');
  await expect(highlight).toContainText('Gesponsert');
  await expect(highlight).toContainText('Sunset Session');
  await expect(highlight).toContainText('Organische Treffer bleiben unverändert');
  await expect(page.locator('.hoy-promo-highlight')).toHaveCount(1);

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-sponsored-event-home.png`),
    fullPage: false
  });

  await openDiscoverForVenue(page);
  const organicCard = page.locator('.list-card[data-open="1"]');
  await expect(organicCard).toContainText('Gesponsert');
  await expect(organicCard).toContainText('Sunset Session');
  await expect(page.locator('.list-card[data-open="1"]')).toHaveCount(1);

  await page.locator('.journey-view-toggle [data-view-switch="map"]').click();
  const map = page.locator('.map-journey-signature');
  await expect(map.locator('#hoyMap')).toHaveClass(/leaflet-container/, { timeout: 20_000 });
  const mapCard = map.locator('.map-decision-card[data-map-card="1"]');
  await expect(mapCard).toBeVisible();
  await expect(mapCard).toContainText('Gesponsert');
  await expect(mapCard).toContainText('Sunset Session');

  await mapCard.locator('[data-map-profile]').click();
  const detail = page.locator('#detail[open]');
  await expect(detail.locator('#profile-current')).toBeVisible();
  const sponsoredItem = detail.locator('#profile-current .hoy-current-item').filter({ hasText: 'Sunset Session' });
  await expect(sponsoredItem).toContainText('Gesponsert');
  await expect(sponsoredItem).toContainText('Vom Betrieb veröffentlicht');

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-sponsored-event-profile.png`),
    fullPage: false
  });
});

test('unpaid or not-yet-started promotion rows never become guest advertising', async ({ page }) => {
  await mockCurrent(page, [fixturePromotion({ billing: 'pending' }), fixturePromotion({ billing: 'paid', startsInMinutes: 30 })]);
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.hoy-today-strip')).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => window.hoyPromotionSummary?.().eligible ?? -1), { timeout: 20_000 }).toBe(0);
  await expect(page.locator('.hoy-promo-highlight')).toHaveCount(0);
  await expect(page.locator('.hoy-sponsored-chip')).toHaveCount(0);

  await openDiscoverForVenue(page);
  const card = page.locator('.list-card[data-open="1"]');
  await expect(card).toContainText('Live-Musik');
  await expect(card).toContainText('Laut Termin');
  await expect(card.locator('.hoy-sponsored-chip')).toHaveCount(0);
});

test('2.17 sponsored guest assets remain real PWA resources after later releases', async ({ request }) => {
  for (const asset of ['./promotion-2.17.1.js', './promotion-2.17.css']) {
    const res = await request.get(asset);
    expect(res.ok(), `${asset} should load`).toBeTruthy();
    expect((res.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  }

  const worker = await request.get('./service-worker.js');
  const workerText = await worker.text();
  expect(workerText).toContain('./promotion-2.17.1.js');
  expect(workerText).toContain('./promotion-2.17.css');
});

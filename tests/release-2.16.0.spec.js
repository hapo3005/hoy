const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

function fixtureEvent({ running = false } = {}) {
  const now = Date.now();
  const start = new Date(now + (running ? -30 : 60) * 60_000).toISOString();
  const end = new Date(now + (running ? 90 : 180) * 60_000).toISOString();
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
    starts_at: start,
    ends_at: end,
    publisher_kind: 'operator',
    published_at: new Date(now - 24 * 60 * 60_000).toISOString(),
    updated_at: new Date(now - 24 * 60 * 60_000).toISOString()
  };
}

async function mockPublishedEvents(page, rows) {
  await page.route('**/rest/v1/offers**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(rows)
  }));
}

async function openDiscoverForVenue(page) {
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('El Camarote de la Martinique');
  await expect(page.locator('.list-card[data-open="1"]')).toBeVisible();
}

test('one published event is reused across home, discover, map and profile without pretending to be live-confirmed', async ({ page }, testInfo) => {
  await mockPublishedEvents(page, [fixtureEvent({ running: true })]);
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  const today = page.locator('.hoy-today-strip');
  await expect(today).toBeVisible({ timeout: 20_000 });
  await expect(today).toContainText('Sunset Session');
  await expect(today).toContainText(/Laut Termin · jetzt/i);
  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-event-home-journey.png`),
    fullPage: false
  });

  await openDiscoverForVenue(page);
  const listSignal = page.locator('.list-card[data-open="1"] .hoy-current-signal');
  await expect(listSignal).toBeVisible();
  await expect(listSignal).toContainText(/Live-Musik/i);
  await expect(listSignal).toContainText(/Laut Termin · jetzt/i);

  await page.locator('.journey-view-toggle [data-view-switch="map"]').click();
  const map = page.locator('.map-journey-signature');
  await expect(map.locator('#hoyMap')).toHaveClass(/leaflet-container/, { timeout: 20_000 });
  const mapCard = map.locator('.map-decision-card[data-map-card="1"]');
  await expect(mapCard).toBeVisible();
  await expect(mapCard.locator('.hoy-current-signal')).toContainText(/Laut Termin · jetzt/i);

  await mapCard.locator('[data-map-profile]').click();
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible();
  const current = detail.locator('#profile-current');
  await expect(current).toBeVisible();
  await expect(current).toContainText('Sunset Session');
  await expect(current).toContainText('Eintritt frei');
  await expect(current).toContainText('Reservierung empfohlen');
  await expect(current).toContainText('Vom Betrieb veröffentlicht');
  await expect(current).not.toContainText('Heute vom Betrieb bestätigt');

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-event-profile-journey.png`),
    fullPage: false
  });
});

test('a scheduled event stays scheduled until its start time instead of being labelled as running', async ({ page }) => {
  await mockPublishedEvents(page, [fixtureEvent({ running: false })]);
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  const card = page.locator('.hoy-today-card').filter({ hasText: 'Sunset Session' });
  await expect(card).toBeVisible({ timeout: 20_000 });
  await expect(card).toContainText(/Beginnt in \d+ Min\./i);
  await expect(card).not.toContainText(/Laut Termin · jetzt/i);

  await openDiscoverForVenue(page);
  const signal = page.locator('.list-card[data-open="1"] .hoy-current-signal');
  await expect(signal).toContainText(/Beginnt in \d+ Min\./i);
  await expect(signal).not.toContainText(/Laut Termin · jetzt/i);
});

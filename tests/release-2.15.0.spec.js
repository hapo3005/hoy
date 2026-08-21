const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

async function waitForMapMode(root) {
  const map = root.locator('#hoyMap');
  await expect(map).toBeVisible();
  await expect.poll(
    () => map.evaluate(el => el.classList.contains('leaflet-container') || Boolean(el.querySelector('.map-load-error'))),
    { timeout: 20_000 }
  ).toBe(true);
  const leafletReady = await map.evaluate(el => el.classList.contains('leaflet-container'));
  if (!leafletReady) {
    await expect(root.locator('.map-load-error')).toContainText(/Kartenbibliothek konnte nicht geladen werden/i);
    await expect(root.locator('.map-load-error')).toContainText(/Standortangaben bleiben in den Profilen verfügbar/i);
  }
  return leafletReady;
}

async function openMap(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bottom')).toBeVisible();
  await page.locator('[data-btm="map"]').click();
  const root = page.locator('.map-journey-signature');
  await expect(root).toBeVisible();
  await expect(root.locator('.map-decision-card').first()).toBeVisible({ timeout: 20_000 });
  const leafletReady = await waitForMapMode(root);
  return { root, leafletReady };
}

test('map becomes a decision surface with the same useful HOY signals as discover', async ({ page }, testInfo) => {
  const { root, leafletReady } = await openMap(page);
  await expect(root.locator('h1')).toContainText(/Sieh, was hier zu dir passt|Dieser Ort/i);
  await expect(root.locator('.map-journey-bar')).toContainText(/DEINE AUSWAHL/i);
  await expect(root.locator('.map-decision-head')).toContainText(/Orte auf dieser Karte/i);

  const first = root.locator('.map-decision-card').first();
  await expect(first.locator('.map-decision-signals span').first()).toBeVisible();
  await expect(first.locator('[data-map-focus]')).toHaveText(/Auf Karte zeigen/i);
  await expect(first.locator('[data-map-profile]')).toHaveText(/Profil ansehen/i);
  if (leafletReady) await expect(root.locator('.leaflet-marker-icon').first()).toBeVisible();

  const metrics = await page.locator('.view').evaluate(el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-map-decision-journey.png`),
    fullPage: true
  });
});

test('map card focus survives a background rerender and keeps a one-tap route into the profile', async ({ page }, testInfo) => {
  const { root, leafletReady } = await openMap(page);
  const first = root.locator('.map-decision-card').first();
  await first.locator('[data-map-focus]').click();
  await expect(first).toHaveClass(/active/);
  if (leafletReady) await expect(root.locator('.leaflet-popup')).toBeVisible({ timeout: 8_000 });

  await page.evaluate(() => render());
  await expect(root.locator('.map-decision-card').first()).toBeVisible({ timeout: 20_000 });
  const leafletReadyAfterRender = await waitForMapMode(root);
  await expect(first).toHaveClass(/active/);
  if (leafletReadyAfterRender) await expect(root.locator('.leaflet-popup')).toBeVisible({ timeout: 8_000 });

  await first.locator('[data-map-profile]').click();
  await expect(page.locator('#detail[open]')).toBeVisible();

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-map-to-profile.png`),
    fullPage: false
  });
});

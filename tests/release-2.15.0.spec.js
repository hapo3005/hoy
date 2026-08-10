const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

async function openMap(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bottom')).toBeVisible();
  await page.locator('[data-btm="map"]').click();
  const root = page.locator('.map-journey-signature');
  await expect(root).toBeVisible();
  await expect(root.locator('.map-decision-card').first()).toBeVisible({ timeout: 20_000 });
  await expect(root.locator('#hoyMap')).toHaveClass(/leaflet-container/, { timeout: 20_000 });
  await expect(root.locator('.map-load-error')).toHaveCount(0);
  return root;
}

test('map becomes a decision surface with the same useful HOY signals as discover', async ({ page }, testInfo) => {
  const root = await openMap(page);
  await expect(root.locator('h1')).toContainText(/Sieh, was hier zu dir passt|Dieser Ort/i);
  await expect(root.locator('.map-journey-bar')).toContainText(/DEINE AUSWAHL/i);
  await expect(root.locator('.map-decision-head')).toContainText(/Orte auf dieser Karte/i);

  const first = root.locator('.map-decision-card').first();
  await expect(first.locator('.map-decision-signals span').first()).toBeVisible();
  await expect(first.locator('[data-map-focus]')).toHaveText(/Auf Karte zeigen/i);
  await expect(first.locator('[data-map-profile]')).toHaveText(/Profil ansehen/i);
  await expect(root.locator('.leaflet-marker-icon').first()).toBeVisible();

  const metrics = await page.locator('.view').evaluate(el => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-map-decision-journey.png`),
    fullPage: true
  });
});

test('map card focus survives a background rerender and keeps a one-tap route into the profile', async ({ page }, testInfo) => {
  const root = await openMap(page);
  const first = root.locator('.map-decision-card').first();
  await first.locator('[data-map-focus]').click();
  await expect(first).toHaveClass(/active/);
  await expect(root.locator('.leaflet-popup')).toBeVisible({ timeout: 8_000 });

  await page.evaluate(() => render());
  await expect(root.locator('#hoyMap')).toHaveClass(/leaflet-container/, { timeout: 20_000 });
  await expect(first).toHaveClass(/active/);
  await expect(root.locator('.leaflet-popup')).toBeVisible({ timeout: 8_000 });

  await first.locator('[data-map-profile]').click();
  await expect(page.locator('#detail[open]')).toBeVisible();

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-map-to-profile.png`),
    fullPage: false
  });
});

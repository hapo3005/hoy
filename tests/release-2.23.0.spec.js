const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

test.use({ serviceWorkers: 'block' });

async function shot(page, testInfo, name) {
  await page.screenshot({ path: path.join(SCREEN_DIR, `${testInfo.project.name}-${name}.png`), fullPage: false });
}

test('HOY 2.23 keeps guest choices simple while preserving the deep trust model underneath', async ({ page, request }, testInfo) => {
  const [js, css, pkg, index, worker] = await Promise.all([
    request.get('./simplicity-2.23.js'),
    request.get('./simplicity-2.23.css'),
    request.get('./package.json'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for (const res of [js, css, pkg, index, worker]) expect(res.ok()).toBeTruthy();
  expect((js.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  expect((css.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  const { version } = await pkg.json();
  expect(version).toBe('2.23.0');
  const indexText = await index.text();
  const workerText = await worker.text();
  expect(indexText).toContain('App 2.23.0');
  expect(indexText).toContain('simplicity-2.23.js?v=2.23.0');
  expect(indexText).toContain('simplicity-2.23.css?v=2.23.0');
  expect(workerText).toContain("const CACHE='hoy-v2.23.0'");
  expect(workerText).toContain('./simplicity-2.23.js');
  expect(workerText).toContain('./simplicity-2.23.css');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.hoySimplicityVersion)).toBe('2.23.0');
  await expect(page.locator('.journey-hero .hero-copy')).toContainText('aktuellen Öffnungszeiten und Speisekarten');
  await expect(page.locator('.journey-trust-strip')).toContainText('Direkt zum Betrieb');
  await expect(page.locator('.journey-trust-strip')).not.toContainText('Datenstatus');
  await expect(page.locator('[data-home-search-go]')).toHaveText('Suchen');
  await shot(page, testInfo, 'simple-home');

  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await expect(page.locator('.journey-discover-head p')).toHaveText('Suche direkt oder wähle, worauf du gerade Lust hast.');
  const moreFilters = page.locator('[data-simple-filter-toggle]');
  const serviceFilters = page.locator('#hoySecondaryFilters');
  await expect(moreFilters).toBeVisible();
  await expect(moreFilters).toHaveText('Weitere Filter');
  await expect(serviceFilters).toBeHidden();
  await moreFilters.click();
  await expect(serviceFilters).toBeVisible();
  await expect(moreFilters).toHaveText('Weniger Filter');
  await moreFilters.click();
  await expect(serviceFilters).toBeHidden();
  await shot(page, testInfo, 'simple-discover');

  await expect.poll(() => page.evaluate(() => cloud.status), { timeout: 20_000 }).toBe('online');
  await page.locator('#q').fill('Agua Salá');
  const agua = page.locator('.list-card[data-open="16"]');
  await expect(agua).toBeVisible({ timeout: 20_000 });
  const cardNow = agua.locator('[data-hoy-now-status] strong');
  if (await cardNow.count()) {
    await expect(cardNow).toContainText(/Geöffnet|Geschlossen/);
    await expect(cardNow).not.toContainText('Laut Öffnungszeiten');
  }
  await agua.click();
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible();
  const safeHours = detail.locator('[data-hours-simple="safe"]');
  await expect(safeHours).toBeVisible();
  await expect(safeHours).toContainText(/Geöffnet|Geschlossen/);
  await expect(safeHours).not.toContainText('Basiszeiten verifiziert');
  await expect(detail.locator('.profile-trust-line span')).toHaveCount(1);
  await expect(detail.locator('.showcase-warning,.showcase-proof')).toHaveCount(0);
  await expect(detail.locator('.profile-info-section')).toContainText('Aktualität');
  await shot(page, testInfo, 'simple-profile');

  await page.evaluate(() => document.getElementById('detail')?.close());
  await page.locator('#q').fill('Gran Torino');
  const granTorino = page.locator('.list-card[data-open="15"]');
  await expect(granTorino).toBeVisible({ timeout: 20_000 });
  await granTorino.click();
  const uncertain = page.locator('#detail[open] [data-hours-simple="uncertain"]');
  await expect(uncertain).toBeVisible();
  await expect(uncertain).toContainText('Öffnungszeiten aktuell nicht sicher');
  await expect(uncertain.locator('summary')).toHaveText('Warum?');

  expect(pageErrors).toEqual([]);
});

const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('HOY 2.22 loads opening-hours trust assets and keeps one-tap confirmation permission-gated', async ({ page, request }) => {
  const [js, css, index] = await Promise.all([
    request.get('./hours-trust-2.22.js'),
    request.get('./hours-trust-2.22.css'),
    request.get('./index.html')
  ]);
  expect(js.ok()).toBeTruthy();
  expect(css.ok()).toBeTruthy();
  expect(index.ok()).toBeTruthy();
  const jsText = await js.text();
  const indexText = await index.text();
  expect(jsText).toContain("window.hoyHoursTrustVersion='2.22.0'");
  expect(jsText).toContain('hoyCanManageLiveHours');
  expect(jsText).toContain('data-hours-today-confirm');
  expect(indexText).toContain('App 2.22.0');
  expect(indexText).toContain('hours-trust-2.22.js?v=2.22.0');
  expect(indexText).toContain('hours-trust-2.22.css?v=2.22.0');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.hoyHoursTrustVersion)).toBe('2.22.0');
  expect(pageErrors).toEqual([]);
});

test('restaurant profiles explain verified and conflicting hours instead of faking NOW certainty', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => cloud.status), { timeout: 20_000 }).toBe('online');
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();

  await page.locator('#q').fill('Agua Salá');
  const verifiedCard = page.locator('.list-card[data-open="16"]');
  await expect(verifiedCard).toBeVisible({ timeout: 20_000 });
  await verifiedCard.click();
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible();
  const verified = detail.locator('[data-hours-trust="verified"]');
  await expect(verified).toBeVisible();
  await expect(verified).toContainText('Basiszeiten verifiziert');
  await expect(verified).toContainText('HOY GEPRÜFT');

  await page.evaluate(() => document.getElementById('detail')?.close());
  await page.locator('#q').fill('Gran Torino');
  const conflictCard = page.locator('.list-card[data-open="15"]');
  await expect(conflictCard).toBeVisible({ timeout: 20_000 });
  await conflictCard.click();
  const conflict = page.locator('#detail[open] [data-hours-trust="conflict"]');
  await expect(conflict).toBeVisible();
  await expect(conflict).toContainText('Öffnungszeiten derzeit nicht eindeutig');
  await expect(conflict).toContainText('keinen „Jetzt geöffnet“-Status');
});

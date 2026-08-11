const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('HOY 2.22 opening-hours trust assets remain loaded and one-tap confirmation stays permission-gated', async ({ page, request }) => {
  const [js, css, index, pkg] = await Promise.all([
    request.get('./hours-trust-2.22.js'),
    request.get('./hours-trust-2.22.css'),
    request.get('./index.html'),
    request.get('./package.json')
  ]);
  expect(js.ok()).toBeTruthy();
  expect(css.ok()).toBeTruthy();
  expect(index.ok()).toBeTruthy();
  expect(pkg.ok()).toBeTruthy();
  const jsText = await js.text();
  const indexText = await index.text();
  const { version } = await pkg.json();
  expect(jsText).toContain("window.hoyHoursTrustVersion='2.22.0'");
  expect(jsText).toContain('hoyCanManageLiveHours');
  expect(jsText).toContain('data-hours-today-confirm');
  expect(indexText).toContain(`App ${version}`);
  expect(indexText).toContain('hours-trust-2.22.js?v=2.22.0');
  expect(indexText).toContain('hours-trust-2.22.css?v=2.22.0');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.hoyHoursTrustVersion)).toBe('2.22.0');
  expect(pageErrors).toEqual([]);
});

test('later guest layers preserve verified-versus-conflict truth instead of faking NOW certainty', async ({ page }) => {
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
  await expect(verified).toHaveAttribute('data-hours-simple', 'safe');
  await expect(verified).toContainText(/HOY geprüft|Vom Betrieb/i);

  await page.evaluate(() => document.getElementById('detail')?.close());
  await page.locator('#q').fill('Gran Torino');
  const conflictCard = page.locator('.list-card[data-open="15"]');
  await expect(conflictCard).toBeVisible({ timeout: 20_000 });
  await conflictCard.click();
  const conflict = page.locator('#detail[open] [data-hours-trust="conflict"]');
  await expect(conflict).toBeVisible();
  await expect(conflict).toHaveAttribute('data-hours-simple', 'uncertain');
  await expect(conflict).toContainText('Öffnungszeiten aktuell nicht sicher');
});

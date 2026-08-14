const { test, expect } = require('@playwright/test');
const { CURRENT_RELEASE } = require('./helpers/current-release');

test.use({ serviceWorkers: 'block' });

test('HOY Control 2.20 loads the internal decision coverage extension without exposing it to guests', async ({ page, request }) => {
  const [admin, js, css] = await Promise.all([
    request.get('./admin.html'),
    request.get('./admin-coverage-2.20.js'),
    request.get('./admin-coverage-2.20.css')
  ]);
  expect(admin.ok()).toBeTruthy();
  expect(js.ok()).toBeTruthy();
  expect(css.ok()).toBeTruthy();
  expect(js.headers()['content-type'] || '').not.toMatch(/text\/html/i);
  expect(css.headers()['content-type'] || '').not.toMatch(/text\/html/i);

  const adminText = await admin.text();
  expect(adminText).toContain(`HOY Control Center · ${CURRENT_RELEASE}`);
  expect(adminText).toContain('admin-coverage-2.20.css?v=2.20.0');
  expect(adminText).toContain('admin-coverage-2.20.js?v=2.20.0');
  expect(adminText).toContain('noindex,nofollow,noarchive');

  const jsText = await js.text();
  expect(jsText).toContain("window.hoyCoverageVersion220=VERSION");
  expect(jsText).toContain('Küchenzeiten sind noch nicht strukturiert');
  expect(jsText).not.toMatch(/service_role|sb_secret_/i);

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('./admin.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.admin-login')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('.login-card')).toContainText('Zugriff nur für freigeschaltete HOY-Admins');
  expect(await page.evaluate(() => window.hoyCoverageVersion220)).toBe('2.20.0');
  await expect(page.getByText('Decision Coverage.', { exact: true })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('profile section state follows geometry even when the dialog scroll event is unavailable', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();

  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible({ timeout: 12_000 });
  await expect(detail.locator('#profile-menu')).toBeVisible();
  await page.evaluate(() => {
    const d = document.querySelector('#detail[open]');
    const menu = d?.querySelector('#profile-menu');
    if (!d || !menu) throw new Error('profile/menu missing');
    if (d._hoyProfileScrollHandler) d.removeEventListener('scroll', d._hoyProfileScrollHandler);
    menu.scrollIntoView({ block: 'start' });
  });
  await expect(detail.locator('.profile-premium-nav a.active')).toContainText(/Speisekarte/i, { timeout: 2_000 });
});

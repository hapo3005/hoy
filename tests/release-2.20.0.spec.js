const { test, expect } = require('@playwright/test');

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
  expect(adminText).toContain('HOY Control Center · 2.20.0');
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

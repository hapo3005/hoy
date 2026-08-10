const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

function watchPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

async function openDiscover(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bottom')).toBeVisible();
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('#q')).toBeVisible();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({ timeout: 20_000 });
}

async function screenshot(page, testInfo, name) {
  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-${name}.png`),
    fullPage: true
  });
}

test('guest journey renders on the deployed app', async ({ page }, testInfo) => {
  const errors = watchPageErrors(page);
  await page.goto('./', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle(/HOY La Manga/i);
  await expect(page.locator('#view')).toBeVisible();
  await expect(page.locator('#bottom [data-btm="home"]')).toBeVisible();
  await expect(page.locator('#bottom [data-btm="discover"]')).toBeVisible();

  await screenshot(page, testInfo, 'home');
  expect(errors).toEqual([]);
});

test('Agua Sala opens as a continuous profile with an inline German menu', async ({ page }, testInfo) => {
  const errors = watchPageErrors(page);
  await openDiscover(page);

  const search = page.locator('#q');
  await search.fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();

  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/continuous-profile/);
  await expect(dialog.locator('#profile-about')).toBeVisible();
  await expect(dialog.locator('#profile-menu')).toBeVisible();
  await expect(dialog.locator('#profile-info')).toBeVisible();
  await expect(dialog.locator('#profile-menu')).toContainText(/HOY SPEISEKARTE/i);

  const expand = dialog.locator('[data-menu-expand]');
  if (await expand.count()) {
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expand.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'true');
  }

  const menuSearch = dialog.locator('[data-menu-search]');
  await expect(menuSearch).toBeVisible();
  await expect(menuSearch).toHaveAttribute('aria-label', /Agua Salá/i);
  await menuSearch.fill('Caldero');
  await expect(dialog.locator('[data-menu-visible]')).toContainText(/Position/);
  await expect(dialog.locator('[data-menu-item]').filter({ hasText: /Caldero/i }).first()).toBeVisible();

  await screenshot(page, testInfo, 'agua-sala-profile');
  expect(errors).toEqual([]);
});

test('keyboard users can open and close a restaurant profile with focus return', async ({ page }) => {
  const errors = watchPageErrors(page);
  await openDiscover(page);

  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');

  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  const close = dialog.locator('[data-close]');
  await expect(close).toBeFocused();
  await close.click();
  await expect(page.locator('#detail')).not.toHaveAttribute('open', '');
  await expect(card).toBeFocused();

  expect(errors).toEqual([]);
});

test('PWA core endpoints return real HOY 2.10 assets instead of an HTML fallback', async ({ request }) => {
  const manifest = await request.get('./manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  expect(manifest.headers()['content-type'] || '').toMatch(/json|manifest/i);

  const worker = await request.get('./service-worker.js');
  expect(worker.ok()).toBeTruthy();
  const workerText = await worker.text();
  expect(workerText).toContain("const CACHE='hoy-v2.10.0'");
  expect(workerText).toContain('profile-flow-2.7.js');
  expect(workerText).toContain('operator-cockpit-2.10.js');
  expect(workerText).toContain('operator-cockpit-2.10.css');
});

test('HOY Control Center login shell loads the operator review extension without script errors', async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.goto('./admin.html', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/HOY Control Center/i);
  await expect(page.locator('#adminApp')).toBeVisible();
  await expect(page.locator('.admin-login')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#loginEmail')).toBeVisible();
  expect(errors).toEqual([]);
});

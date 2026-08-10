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

async function openAguaSala(page) {
  await openDiscover(page);
  const search = page.locator('#q');
  await search.fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  return dialog;
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
  const dialog = await openAguaSala(page);

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

test('restaurant profile opens with premium hero hierarchy and calm primary navigation', async ({ page }, testInfo) => {
  const errors = watchPageErrors(page);
  const dialog = await openAguaSala(page);

  await expect(dialog).toHaveClass(/profile-premium/);
  await expect(dialog.locator('.detail-art')).toBeVisible();
  await expect(dialog.locator('.profile-identity-card')).toBeVisible();
  await expect(dialog.locator('.profile-identity-card > h2')).toContainText(/Agua Salá/i);
  await expect(dialog.locator('.profile-trust-line')).toBeVisible();
  await expect(dialog.locator('.profile-quick-snapshot')).toBeVisible();
  await expect(dialog.locator('.profile-quick-actions')).toBeVisible();
  await expect(dialog.locator('.profile-premium-nav')).toBeVisible();
  await expect(dialog.locator('.profile-premium-nav a.active')).toContainText(/Überblick/i);
  await expect(dialog.locator('#profile-about .profile-service-facts')).toBeVisible();
  await expect(dialog.locator('.service-summary')).toHaveCount(0);

  const metrics = await dialog.evaluate(el => {
    const art = el.querySelector('.detail-art');
    const body = el.querySelector('.detail-body');
    const visibleActions = [...el.querySelectorAll('.profile-quick-actions > a,.profile-quick-actions > button')]
      .filter(node => getComputedStyle(node).display !== 'none');
    const miniTops = [...el.querySelectorAll('.profile-quick-snapshot .showcase-mini')]
      .map(node => node.getBoundingClientRect().top);
    return {
      heroHeight: art?.getBoundingClientRect().height || 0,
      bodyMarginTop: Number.parseFloat(getComputedStyle(body).marginTop || '0'),
      visibleActionCount: visibleActions.length,
      snapshotCount: miniTops.length,
      snapshotTopSpread: miniTops.length ? Math.max(...miniTops) - Math.min(...miniTops) : 999
    };
  });

  expect(metrics.heroHeight).toBeGreaterThanOrEqual(330);
  expect(metrics.bodyMarginTop).toBeLessThan(0);
  expect(metrics.visibleActionCount).toBe(3);
  expect(metrics.snapshotCount).toBe(3);
  expect(metrics.snapshotTopSpread).toBeLessThanOrEqual(2);

  await screenshot(page, testInfo, 'premium-profile-header');
  expect(errors).toEqual([]);
});

test('restaurant profile has no horizontal page overflow while menu categories stay contained', async ({ page }, testInfo) => {
  const errors = watchPageErrors(page);
  const dialog = await openAguaSala(page);
  const expand = dialog.locator('[data-menu-expand]');
  if (await expand.count() && await expand.getAttribute('aria-expanded') === 'false') await expand.click();

  await expect(dialog.locator('.profile-anchor-nav')).toBeVisible();
  await expect(dialog.locator('.menu-category-nav')).toBeVisible();
  await expect(dialog.locator('.menu-cat').first()).toBeVisible();

  const metrics = await dialog.evaluate(el => {
    const body = el.querySelector('.detail-body');
    const primary = el.querySelector('.profile-anchor-nav');
    const category = el.querySelector('.menu-category-nav');
    const er = el.getBoundingClientRect();
    const pr = primary?.getBoundingClientRect();
    const cr = category?.getBoundingClientRect();
    return {
      dialogClientWidth: el.clientWidth,
      dialogScrollWidth: el.scrollWidth,
      bodyClientWidth: body?.clientWidth || 0,
      bodyScrollWidth: body?.scrollWidth || 0,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      primaryContained: !pr || (pr.left >= er.left - 1 && pr.right <= er.right + 1),
      categoryContained: !cr || (cr.left >= er.left - 1 && cr.right <= er.right + 1),
      categoryOwnsOverflow: !category || category.scrollWidth >= category.clientWidth
    };
  });

  expect(metrics.dialogScrollWidth).toBeLessThanOrEqual(metrics.dialogClientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
  expect(metrics.primaryContained).toBeTruthy();
  expect(metrics.categoryContained).toBeTruthy();
  expect(metrics.categoryOwnsOverflow).toBeTruthy();

  await screenshot(page, testInfo, 'menu-layout-stability');
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

test('PWA core endpoints return real HOY 2.12.2 assets instead of an HTML fallback', async ({ request }) => {
  const manifest = await request.get('./manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  expect(manifest.headers()['content-type'] || '').toMatch(/json|manifest/i);

  const worker = await request.get('./service-worker.js');
  expect(worker.ok()).toBeTruthy();
  const workerText = await worker.text();
  expect(workerText).toContain("const CACHE='hoy-v2.12.2'");
  expect(workerText).toContain('profile-flow-2.7.js');
  expect(workerText).toContain('operator-cockpit-2.10.js');
  expect(workerText).toContain('profile-design-2.11.css');
  expect(workerText).toContain('profile-design-fix-2.11.1.css');
  expect(workerText).toContain('profile-premium-2.12.css');
  expect(workerText).toContain('profile-premium-2.12.js');
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

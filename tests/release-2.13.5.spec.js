const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

async function openAguaSala(page) {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bottom')).toBeVisible();
  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('#q')).toBeVisible();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({ timeout: 20_000 });
  await page.locator('#q').fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  return dialog;
}

test('home never presents zero venues while live data is connecting and settles to a live count', async ({ page }, testInfo) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const kicker = page.locator('.journey-kicker');
  await expect(kicker).toBeVisible();
  await expect(kicker).not.toHaveText(/^0 Orte/);
  await expect(page.locator('.journey-area-scroll button').first()).toBeVisible({ timeout: 20_000 });
  await expect(kicker).toHaveText(/^[1-9]\d* Orte rund ums Mar Menor$/);
  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-home-live.png`),
    fullPage: true
  });
});

test('premium sticky navigation fully covers menu content and category rail signals horizontal continuation', async ({ page }, testInfo) => {
  const dialog = await openAguaSala(page);
  const expand = dialog.locator('[data-menu-expand]');
  if (await expand.count() && await expand.getAttribute('aria-expanded') === 'false') await expand.click();

  const secondCat = dialog.locator('.menu-cat').nth(1);
  await expect(secondCat).toBeVisible();
  await secondCat.scrollIntoViewIfNeeded();

  const metrics = await dialog.evaluate(el => {
    const nav = el.querySelector('.profile-premium-nav');
    const category = el.querySelector('.menu-signature-categories');
    const item = el.querySelector('.localized-menu-item');
    const er = el.getBoundingClientRect();
    const nr = nav?.getBoundingClientRect();
    const cr = category?.getBoundingClientRect();
    const ir = item?.getBoundingClientRect();
    const categoryStyle = category ? getComputedStyle(category) : null;
    const navStyle = nav ? getComputedStyle(nav) : null;
    return {
      navLeftGap: nr ? Math.abs(nr.left - er.left) : 999,
      navRightGap: nr ? Math.abs(nr.right - er.right) : 999,
      navBackground: navStyle?.backgroundColor || '',
      categoryContentLeftGap: cr && ir ? Math.abs(cr.left - ir.left) : 999,
      categoryOwnsOverflow: category ? category.scrollWidth > category.clientWidth : false,
      categoryMask: categoryStyle ? (categoryStyle.maskImage || categoryStyle.webkitMaskImage || 'none') : 'none'
    };
  });

  expect(metrics.navLeftGap).toBeLessThanOrEqual(1.5);
  expect(metrics.navRightGap).toBeLessThanOrEqual(1.5);
  expect(metrics.navBackground).toBe('rgb(248, 243, 233)');
  expect(metrics.categoryContentLeftGap).toBeLessThanOrEqual(1.5);
  expect(metrics.categoryOwnsOverflow).toBeTruthy();
  expect(metrics.categoryMask).not.toBe('none');

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-sticky-rails.png`),
    fullPage: false
  });
});

test('background menu refresh preserves the active profile section at the top', async ({ page }) => {
  const dialog = await openAguaSala(page);
  await expect(dialog.locator('.profile-premium-nav a.active')).toContainText(/Überblick/i);

  await page.evaluate(() => {
    const d=document.querySelector('#detail[open]');
    window.dispatchEvent(new CustomEvent('hoy:profile-menu-refreshed',{
      detail:{restaurantId:Number(d?.dataset.restaurantId||0),qa:true}
    }));
  });

  await expect(dialog.locator('.profile-premium-nav a.active')).toContainText(/Überblick/i);
  await page.waitForTimeout(750);
  await expect(dialog.locator('.profile-premium-nav a.active')).toContainText(/Überblick/i);
});

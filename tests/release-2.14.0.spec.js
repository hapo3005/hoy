const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

test('decision-first home explains the HOY value before the user starts searching', async ({ page }, testInfo) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.journey-area-scroll button').first()).toBeVisible({ timeout: 20_000 });

  const hero = page.locator('.journey-signature-hero');
  await expect(hero).toBeVisible();
  await expect(hero.locator('.hero-copy p')).toContainText(/aktuellen Öffnungszeiten und Speisekarten/i);
  await expect(hero.locator('.journey-trust-strip')).toContainText(/Aktuelle Öffnungszeiten.*Speisekarten.*Direkt zum Betrieb/i);
  await expect(hero.locator('.journey-trust-strip')).not.toContainText(/Datenstatus/i);
  await expect(hero.locator('[data-home-search-go]')).toHaveText('Suchen');

  const metrics = await page.locator('.view').evaluate(el => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-home-decision-first.png`),
    fullPage: true
  });
});

test('discover results expose useful HOY signals before a profile is opened', async ({ page }, testInfo) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-btm="discover"]').click();
  const root = page.locator('.journey-discover-signature');
  await expect(root).toBeVisible();
  await expect(root.locator('h1')).toHaveText('Finde deinen Ort.');

  const first = root.locator('.decision-card-signature').first();
  await expect(first).toBeVisible({ timeout: 20_000 });
  await expect(first.locator('.decision-signals')).toBeVisible();
  expect(await first.locator('.decision-signal').count()).toBeGreaterThan(0);

  const filter = root.locator('.consumer-chips button').filter({ hasText: 'Am Wasser' }).first();
  if (await filter.count()) {
    await filter.click();
    await expect(filter).toHaveClass(/active/);
    await expect(root.locator('.decision-card-signature').first()).toBeVisible();
  }

  const metrics = await page.locator('.view').evaluate(el => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);

  await page.screenshot({
    path: path.join(SCREEN_DIR, `${testInfo.project.name}-discover-decision-first.png`),
    fullPage: true
  });
});

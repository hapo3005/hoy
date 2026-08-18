const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/current-release');

test.use({ serviceWorkers: 'block' });

const JOURNEY_RESTAURANT_ID = 16; // Agua Salá, part of the Premium 24 release contract.

function watchPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

async function ready(page) {
  await gotoReady(page);
  await page.waitForFunction(
    () => typeof cloud !== 'undefined' && cloud.status === 'online' && window.hoyMenuLanguageIntegrityState === 'ready',
    undefined,
    { timeout: 30_000 }
  );
}

test('RC guest journey has no dead end from home through discover, profile, menu and map', async ({ page }) => {
  const errors = watchPageErrors(page);
  await ready(page);

  const target = await page.evaluate(id => {
    const p = DATA.find(row => Number(row.id) === Number(id));
    return p ? { id: Number(p.id), name: p.name } : null;
  }, JOURNEY_RESTAURANT_ID);
  expect(target).not.toBeNull();

  await expect(page.locator('#bottom [data-btm="home"]')).toBeVisible();
  await page.locator('#bottom [data-btm="discover"]').click();
  await expect.poll(() => page.evaluate(() => state.view)).toBe('discover');

  const search = page.locator('#q');
  await expect(search).toBeVisible();
  await search.fill(target.name);

  const card = page.locator(`.list-card[data-open="${target.id}"]`).first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.detail-primary-bar')).toBeVisible();

  const route = dialog.locator('.detail-primary-bar a.external-route');
  await expect(route).toBeVisible();
  await expect(route).toHaveAttribute('target', '_blank');
  const routeHref = await route.getAttribute('href');
  expect(String(routeHref || '').trim().length).toBeGreaterThan(8);

  const menuLink = dialog.locator('.profile-premium-nav a[href="#profile-menu"]');
  await expect(menuLink).toBeVisible();
  await menuLink.click();

  const menu = dialog.locator('#profile-menu');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-menu-item]').first()).toBeVisible();

  const mapButton = dialog.locator('[data-profile-map]');
  await expect(mapButton).toBeVisible();
  await mapButton.click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => state.view)).toBe('map');

  const mapCard = page.locator(`.map-decision-card[data-map-card="${target.id}"]`);
  await expect(mapCard).toBeVisible();
  await expect(mapCard).toHaveClass(/active/, { timeout: 5_000 });

  const profileFromMap = mapCard.locator(`[data-map-profile="${target.id}"]`);
  await expect(profileFromMap).toBeVisible();
  await profileFromMap.click();
  await expect(page.locator('#detail[open]')).toBeVisible();
  await page.locator('#detail[open] [data-close]').click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);

  const listButton = page.locator('[data-map-list]').first();
  await expect(listButton).toBeVisible();
  await listButton.click();
  await expect.poll(() => page.evaluate(() => state.view)).toBe('discover');
  await expect(page.locator(`.list-card[data-open="${target.id}"]`)).toBeVisible();

  expect(errors).toEqual([]);
});

test('RC empty discover state always has a recovery path', async ({ page }) => {
  const errors = watchPageErrors(page);
  await ready(page);

  await page.locator('#bottom [data-btm="discover"]').click();
  const search = page.locator('#q');
  await search.fill('zzzz-no-real-hoy-venue-zzzz');

  const empty = page.locator('.empty');
  await expect(empty).toBeVisible();
  await expect(empty).toContainText(/Hier passt gerade nichts|anderen Suchbegriff/i);

  const reset = empty.locator('[data-consumer-reset],[data-decision-reset],[data-reset-to-discover]').first();
  await expect(reset).toBeVisible();
  await expect(reset).toContainText(/zurücksetzen/i);
  await reset.click();

  await expect.poll(() => page.evaluate(() => ({
    query: state.query,
    service: state.service,
    moment: state.moment,
    decision: state.decision
  }))).toEqual({ query: '', service: 'all', moment: 'all', decision: 'all' });

  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({ timeout: 10_000 });
  expect(errors).toEqual([]);
});

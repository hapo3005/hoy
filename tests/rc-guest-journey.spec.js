const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/current-release');

test.use({ serviceWorkers: 'block' });

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

  await expect(page.locator('#bottom [data-btm="home"]')).toBeVisible();

  await page.locator('#bottom [data-btm="discover"]').click();
  await expect.poll(() => page.evaluate(() => state.view)).toBe('discover');

  const search = page.locator('#q');
  await expect(search).toBeVisible();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({ timeout: 20_000 });

  const target = await page.evaluate(() => {
    const candidates = DATA.filter(p => {
      const hasCoords = Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
      const hasRoute = hasCoords || !!p.address;
      return hasRoute && !!p.name;
    });
    const preferred = candidates.find(p => String(p.name || '').toLowerCase().includes('agua sal'));
    const picked = preferred || candidates[0] || null;
    return picked ? { id: Number(picked.id), name: picked.name } : null;
  });

  expect(target).not.toBeNull();
  await search.fill(target.name);

  const card = page.locator(`.list-card[data-open="${target.id}"]`).first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.click();

  const dialog = page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.detail-primary-bar')).toBeVisible();

  const route = dialog.locator('.detail-primary-bar a.external-route');
  await expect(route).toBeVisible();
  await expect(route).toHaveAttribute('href', /google\.com\/maps/i);

  const menuLink = dialog.locator('.profile-premium-nav a[href="#profile-menu"]');
  if (await menuLink.count()) {
    await menuLink.click();
    const menu = dialog.locator('#profile-menu');
    await expect(menu).toBeVisible();
    const menuItems = menu.locator('[data-menu-item]');
    const honestEmpty = menu.getByText(/noch keine|nicht verfügbar|keine speisekarte|prüfen/i);
    expect((await menuItems.count()) > 0 || (await honestEmpty.count()) > 0).toBeTruthy();
  }

  const mapButton = dialog.locator('[data-profile-map]');
  await expect(mapButton).toBeVisible();
  await mapButton.click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => state.view)).toBe('map');

  const mapCard = page.locator(`.map-decision-card[data-map-card="${target.id}"]`);
  await expect(mapCard).toBeVisible();

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

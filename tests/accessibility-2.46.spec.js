const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { gotoReady } = require('./helpers/current-release');

const prefs = mustKey => ({
  'access.step_free': mustKey === 'access.step_free' ? 'must' : 'ignore',
  'access.wheelchair_seating': mustKey === 'access.wheelchair_seating' ? 'must' : 'ignore',
  'access.toilet': mustKey === 'access.toilet' ? 'must' : 'ignore',
  'access.parking': mustKey === 'access.parking' ? 'must' : 'ignore'
});

test('HOY Accessible keeps unknown separate from no in MUST matching', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const results = await page.evaluate(() => {
    const future = '2027-02-14T00:00:00Z';
    const base = { restaurant_id: 999, feature_key: 'access.step_free', stale_after: future };
    const p = {
      'access.step_free': 'must',
      'access.wheelchair_seating': 'ignore',
      'access.toilet': 'ignore',
      'access.parking': 'ignore'
    };
    return {
      yes: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes' }], p, new Date('2026-08-18T12:00:00Z')).state,
      no: window.HOYAccessible.evaluateFacts([{ ...base, status: 'no' }], p, new Date('2026-08-18T12:00:00Z')).state,
      unknown: window.HOYAccessible.evaluateFacts([{ ...base, status: 'unknown' }], p, new Date('2026-08-18T12:00:00Z')).state,
      stale: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes', stale_after: '2026-08-17T00:00:00Z' }], p, new Date('2026-08-18T12:00:00Z')).state
    };
  });

  expect(results.yes).toBe('match');
  expect(results.no).toBe('no_match');
  expect(results.unknown).toBe('confirmation_required');
  expect(results.stale).toBe('confirmation_required');
});

test('restaurant overview shows concrete accessibility facts without a percentage score', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const restaurantId = await page.evaluate(() => DATA[0]?.id);
  expect(restaurantId).toBeTruthy();
  await page.evaluate(id => openDetail(id), restaurantId);

  const panel = page.locator('#detail [data-hoya-panel]');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('Barrierefreiheit für dich')).toBeVisible();
  await expect(panel.getByText('Stufenfreier Zugang')).toBeVisible();
  await expect(panel.getByText('Barrierefreies WC')).toBeVisible();
  await expect(panel).not.toContainText('% barrierefrei');
});

test('legacy all-unknown audit is not rendered as a negative accessibility claim', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const id = await page.evaluate(() => {
    const core = new Set(['access.step_free','access.wheelchair_seating','access.toilet','access.parking']);
    for (const [restaurantId, facts] of window.HOYAccessible.state.byRestaurant.entries()) {
      const relevant = facts.filter(f => core.has(f.feature_key));
      if (relevant.length === 4 && relevant.every(f => f.status === 'unknown') && DATA.some(p => Number(p.id) === Number(restaurantId))) return restaurantId;
    }
    return null;
  });
  expect(id).toBeTruthy();
  await page.evaluate(restaurantId => openDetail(restaurantId), id);

  const panel = page.locator('#detail [data-hoya-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Noch nicht bestätigt');
  await expect(panel).not.toContainText('Nicht vorhanden');
});

test('migration protects the hearing-loop unknown correction and RLS exposure', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260818093100_hoy_accessible_v1.sql'), 'utf8');
  expect(sql).toContain("'access.hearing_loop','unknown'");
  expect(sql).toContain('not publicly listed => unknown, not no');
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('public reads current published accessibility facts');
  expect(sql).toContain('grant select on public.restaurant_accessibility_facts to anon, authenticated');
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { gotoReady } = require('./helpers/current-release');

test('HOY Accessible keeps unknown, stale and unverified facts out of confirmed MUST matching', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const results = await page.evaluate(() => {
    const future = '2027-02-14T00:00:00Z';
    const now = new Date('2026-08-18T12:00:00Z');
    const base = {
      restaurant_id: 999,
      feature_key: 'access.step_free',
      stale_after: future,
      verification_level: 'hoy_verified',
      review_state: 'clean'
    };
    const p = {
      'access.step_free': 'must',
      'access.wheelchair_seating': 'ignore',
      'access.toilet': 'ignore',
      'access.parking': 'ignore'
    };
    return {
      yes: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes' }], p, now).state,
      no: window.HOYAccessible.evaluateFacts([{ ...base, status: 'no' }], p, now).state,
      unknown: window.HOYAccessible.evaluateFacts([{ ...base, status: 'unknown' }], p, now).state,
      stale: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes', stale_after: '2026-08-17T00:00:00Z' }], p, now).state,
      externalYes: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes', verification_level: 'external_unverified' }], p, now).state,
      externalNo: window.HOYAccessible.evaluateFacts([{ ...base, status: 'no', verification_level: 'external_unverified' }], p, now).state,
      disputedYes: window.HOYAccessible.evaluateFacts([{ ...base, status: 'yes', review_state: 'disputed' }], p, now).state
    };
  });

  expect(results.yes).toBe('match');
  expect(results.no).toBe('no_match');
  expect(results.unknown).toBe('confirmation_required');
  expect(results.stale).toBe('confirmation_required');
  expect(results.externalYes).toBe('confirmation_required');
  expect(results.externalNo).toBe('confirmation_required');
  expect(results.disputedYes).toBe('confirmation_required');
});

test('numeric comparator evaluates confirmed measurements and requires trust', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const results = await page.evaluate(() => {
    const now = new Date('2026-08-18T12:00:00Z');
    const base = {
      restaurant_id: 999,
      feature_key: 'access.entrance_door_width_cm',
      status: 'yes',
      unit: 'cm',
      stale_after: '2027-08-18T00:00:00Z',
      verification_level: 'hoy_verified',
      review_state: 'clean'
    };
    const requirement = {
      'access.entrance_door_width_cm': { importance: 'must', comparator: 'gte', targetValue: 85 }
    };
    return {
      wide: window.HOYAccessible.evaluateFacts([{ ...base, value_number: 91 }], requirement, now).state,
      narrow: window.HOYAccessible.evaluateFacts([{ ...base, value_number: 79 }], requirement, now).state,
      missing: window.HOYAccessible.evaluateFacts([{ ...base, value_number: null }], requirement, now).state,
      unverifiedWide: window.HOYAccessible.evaluateFacts([{ ...base, value_number: 91, verification_level: 'external_unverified' }], requirement, now).state
    };
  });

  expect(results.wide).toBe('match');
  expect(results.narrow).toBe('no_match');
  expect(results.missing).toBe('confirmation_required');
  expect(results.unverifiedWide).toBe('confirmation_required');
});

test('PREFER changes ordering but can never compensate a failed MUST', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const results = await page.evaluate(() => {
    const now = new Date('2026-08-18T12:00:00Z');
    const fact = (restaurant_id, feature_key, status) => ({
      restaurant_id,
      feature_key,
      status,
      verification_level: 'business_confirmed',
      stale_after: '2027-02-14T00:00:00Z',
      review_state: 'clean'
    });
    const prefs = {
      'access.step_free': 'must',
      'access.parking': 'prefer'
    };
    const a = window.HOYAccessible.evaluateFacts([
      fact(1, 'access.step_free', 'yes'),
      fact(1, 'access.parking', 'no')
    ], prefs, now);
    const b = window.HOYAccessible.evaluateFacts([
      fact(2, 'access.step_free', 'yes'),
      fact(2, 'access.parking', 'yes')
    ], prefs, now);
    const c = window.HOYAccessible.evaluateFacts([
      fact(3, 'access.step_free', 'no'),
      fact(3, 'access.parking', 'yes')
    ], prefs, now);
    return {
      a,
      b,
      c,
      preferRanksBFirst: window.HOYAccessible.compareEvaluations(a, b) > 0
    };
  });

  expect(results.a.state).toBe('match');
  expect(results.a.preferBlocked).toEqual(['access.parking']);
  expect(results.b.state).toBe('match');
  expect(results.b.preferMatched).toEqual(['access.parking']);
  expect(results.preferRanksBFirst).toBeTruthy();
  expect(results.c.state).toBe('no_match');
});

test('2.46 is the canonical guest accessibility surface without legacy 2.43 claims', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);
  await page.evaluate(() => render());

  await expect(page.locator('.access-card-line')).toHaveCount(0);

  const restaurantId = await page.evaluate(() => DATA[0]?.id);
  expect(restaurantId).toBeTruthy();
  await page.evaluate(id => openDetail(id), restaurantId);

  const panel = page.locator('#detail [data-hoya-panel]');
  await expect(panel).toHaveCount(1);
  await expect(panel).toBeVisible();
  await expect(page.locator('#detail [data-accessibility-panel]')).toHaveCount(1);
  await expect(page.locator('#detail [data-accessibility-panel]:not([data-hoya-panel])')).toHaveCount(0);
  await expect(panel.getByText('Barrierefreiheit für dich')).toBeVisible();
  await expect(panel.getByText('Stufenfreier Zugang')).toBeVisible();
  await expect(panel.getByText('Barrierefreies WC')).toBeVisible();
  await expect(panel).not.toContainText('% barrierefrei');
});

test('all-unknown facts are not rendered as a negative accessibility claim', async ({ page }) => {
  await gotoReady(page);
  await page.waitForFunction(() => window.HOYAccessible?.state?.ready === true);

  const restaurantId = await page.evaluate(() => Number(DATA[0]?.id));
  expect(restaurantId).toBeTruthy();

  await page.evaluate(id => {
    const checked_at = '2026-08-18T00:00:00Z';
    const stale_after = '2027-02-14T00:00:00Z';
    const fact = feature_key => ({
      restaurant_id: Number(id),
      feature_key,
      status: 'unknown',
      verification_level: 'external_unverified',
      source_type: 'test_unknown',
      checked_at,
      stale_after,
      review_state: 'clean'
    });
    window.HOYAccessible.state.byRestaurant.set(Number(id), [
      fact('access.step_free'),
      fact('access.wheelchair_seating'),
      fact('access.toilet'),
      fact('access.parking')
    ]);
    openDetail(id);
  }, restaurantId);

  const panel = page.locator('#detail [data-hoya-panel]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Noch nicht bestätigt');
  await expect(panel).not.toContainText('Nicht vorhanden');
  await expect(page.locator('#detail [data-accessibility-panel]:not([data-hoya-panel])')).toHaveCount(0);
});

test('migration protects unknown semantics, RLS, advisor hygiene and operator-to-fact synchronization', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260818093100_hoy_accessible_v1.sql'), 'utf8');
  expect(sql).toContain("'access.hearing_loop','unknown'");
  expect(sql).toContain('not publicly listed => unknown, not no');
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('anon reads current published accessibility facts');
  expect(sql).toContain('authenticated reads published or admin accessibility facts');
  expect(sql).toContain('authenticated reads active or admin accessibility features');
  expect(sql).not.toContain('for all to authenticated');
  expect(sql).toContain('grant select on public.restaurant_accessibility_facts to anon, authenticated');
  expect(sql).toContain('hoy_sync_accessibility_facts_from_legacy');
  expect(sql).toContain('security invoker');
  expect(sql).toContain('set is_current = false');
  expect(sql).toContain("when 'operator' then 'business_confirmed'");
  expect(sql).toContain('create trigger hoy_accessibility_fact_sync');
});

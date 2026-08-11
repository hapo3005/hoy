const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('base opening hours answer the moment without pretending to be live-confirmed', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => window.hoyNowStatus219For?.(
    { hours_text: 'Mo–So 08:00–23:00' },
    new Date('2026-08-10T18:00:00Z')
  ));
  expect(result).toMatchObject({ state: 'open', source: 'base', operatorConfirmed: false, label: 'Laut Öffnungszeiten · offen bis 23:00', proof: 'Nicht live bestätigt' });
});

test('overnight schedules work while uncertain public hours stay deliberately silent', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const values = await page.evaluate(() => ({
    overnight: window.hoyNowStatus219For?.({ hours_text: 'Mo–So 13:30–02:00' }, new Date('2026-08-11T23:00:00Z')),
    uncertain: window.hoyNowStatus219For?.({ hours_text: 'Aktuelle Betreiberprofile widersprechen sich deutlich bei den Öffnungszeiten · vor Live-Anzeige erneut prüfen' }, new Date('2026-08-11T18:00:00Z'))
  }));
  expect(values.overnight).toMatchObject({ state: 'open', label: 'Laut Öffnungszeiten · offen bis 02:00' });
  expect(values.uncertain).toBeNull();
});

test('operator special hours may truthfully use a live label while current status stays on decision surfaces', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const operator = await page.evaluate(() => window.hoyNowStatus219For?.({ operator_special_hours: { service_date: '2026-08-11', intervals: [['10:00','14:00']], is_closed: false, updated_at: '2026-08-11T07:00:00Z' } }, new Date('2026-08-11T10:30:00Z')));
  expect(operator).toMatchObject({ state: 'open', source: 'operator-special', operatorConfirmed: true, label: 'Jetzt geöffnet · bis 14:00', proof: 'Sonderzeit vom Betrieb' });

  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    const p = DATA.find(x => Number(x.id) === 16);
    p.hours_text = 'Täglich 00:00–12:00 & 12:00–24:00'; p.operator_hours = null; p.operator_special_hours = null; render();
  });
  await expect(card.locator('[data-hoy-now-status]')).toContainText('Laut Öffnungszeiten · offen bis');

  await card.click();
  const detail = page.locator('#detail[open]');
  await expect(detail.locator('.profile-hours')).toBeVisible();
  await expect(detail.locator('[data-hoy-now-status]')).toHaveCount(0);
  await detail.locator('[data-close]').first().click();

  await page.evaluate(() => nav('map'));
  await expect(page.locator('.map-journey-signature')).toBeVisible();
  const mapCard = page.locator('.map-decision-card[data-map-card="16"]');
  await expect(mapCard).toBeVisible({ timeout: 20_000 });
  await expect(mapCard.locator('[data-hoy-now-status]')).toContainText('Laut Öffnungszeiten · offen bis');
});

test('2.19.3 current-status assets are deployed and PWA-cached', async ({ request }) => {
  const pkg = await request.get('./package.json');
  expect(pkg.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.19.3');
  for (const asset of ['./now-status-2.19.js','./now-status-2.19.css']) {
    const res = await request.get(asset); expect(res.ok(), `${asset} should load`).toBeTruthy(); expect((res.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  }
  const appText = await (await request.get('./index.html')).text();
  expect(appText).toContain('HOY La Manga · Mar Menor · App 2.19.3');
  expect(appText).toContain('now-status-2.19.css?v=2.19.2');
  expect(appText).toContain('now-status-2.19.js?v=2.19.2');
  expect(appText).toContain('menu-signature-2.13.js?v=2.20.1');
  expect(appText).toContain('profile-flow-2.7.js?v=2.20.1');
  const workerText = await (await request.get('./service-worker.js')).text();
  expect(workerText).toContain("const CACHE='hoy-v2.19.3'");
  expect(workerText).toContain('./now-status-2.19.js');
  expect(workerText).toContain('./now-status-2.19.css');
});

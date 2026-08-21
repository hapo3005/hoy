const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block' });

test('base opening hours answer the moment without pretending to be live-confirmed', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(() => window.hoyNowStatus219For?.(
    { hours_status: 'verified', hours_text: 'Mo–So 08:00–23:00' },
    new Date('2026-08-10T18:00:00Z')
  ));
  expect(result).toMatchObject({ state: 'open', source: 'base', operatorConfirmed: false, label: 'Laut Öffnungszeiten · offen bis 23:00', proof: 'Nicht live bestätigt' });
});

test('overnight schedules work while uncertain public hours stay deliberately silent', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const values = await page.evaluate(() => ({
    overnight: window.hoyNowStatus219For?.({ hours_status: 'verified', hours_text: 'Mo–So 13:30–02:00' }, new Date('2026-08-11T23:00:00Z')),
    uncertain: window.hoyNowStatus219For?.({ hours_status: 'verified', hours_text: 'Aktuelle Betreiberprofile widersprechen sich deutlich bei den Öffnungszeiten · vor Live-Anzeige erneut prüfen' }, new Date('2026-08-11T18:00:00Z'))
  }));
  expect(values.overnight).toMatchObject({ state: 'open', label: 'Laut Öffnungszeiten · offen bis 02:00' });
  expect(values.uncertain).toBeNull();
});

test('operator special hours may truthfully use a live label while current status stays on decision surfaces', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const operator = await page.evaluate(() => window.hoyNowStatus219For?.({ operator_special_hours: { service_date: '2026-08-11', intervals: [['10:00','14:00']], is_closed: false, updated_at: '2026-08-11T07:00:00Z' } }, new Date('2026-08-11T10:30:00Z')));
  expect(operator).toMatchObject({ state: 'open', source: 'operator-special', operatorConfirmed: true, label: 'Jetzt geöffnet · bis 14:00', proof: 'Sonderzeit vom Betrieb · heute 09:00' });

  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('.journey-discover-signature')).toBeVisible();
  await page.locator('#q').fill('Agua Salá');
  const card = page.locator('.list-card[data-open="16"]');
  await expect(card).toBeVisible({ timeout: 20_000 });

  // Wait for the initial cloud refresh to settle before mutating the fixture in-memory.
  // WebKit can finish that refresh later than Chromium; without this guard the real
  // cloud response may legitimately overwrite the test fixture between render and assertion.
  await expect.poll(() => page.evaluate(() => cloud.status), { timeout: 20_000 }).toBe('online');
  await page.evaluate(() => {
    const p = DATA.find(x => Number(x.id) === 16);
    p.hours_text = 'Täglich 00:00–12:00 & 12:00–24:00'; p.operator_hours = null; p.operator_special_hours = null; render();
  });
  await expect(page.locator('.list-card[data-open="16"]')).toBeVisible({ timeout: 12_000 });
  const listNow = page.locator('.list-card[data-open="16"] [data-hoy-now-status]');
  await expect(listNow).toContainText(/Geöffnet · bis/);
  await expect(listNow).not.toContainText('Laut Öffnungszeiten');

  await page.locator('.list-card[data-open="16"]').click();
  const detail = page.locator('#detail[open]');
  await expect(detail.locator('.profile-hours')).toBeVisible();
  await expect(detail.locator('[data-hoy-now-status]')).toHaveCount(0);
  await detail.locator('[data-close]').first().click();

  await page.evaluate(() => nav('map'));
  await expect(page.locator('.map-journey-signature')).toBeVisible();
  const mapCard = page.locator('.map-decision-card[data-map-card="16"]');
  await expect(mapCard).toBeVisible({ timeout: 20_000 });
  const mapNow = mapCard.locator('[data-hoy-now-status]');
  await expect(mapNow).toContainText(/Geöffnet · bis/);
  await expect(mapNow).not.toContainText('Laut Öffnungszeiten');
});

test('cloud provenance gate exposes NOW only for verified base schedules', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => cloud.status)).toBe('online');
  const values = await page.evaluate(() => {
    const summarize = slug => {
      const p = DATA.find(x => x.slug === slug);
      return {
        status: p?.hours_status,
        displayHours: p?.hours,
        nowHours: p?.hours_text,
        now: p ? window.hoyNowStatus219For?.(p, new Date('2026-08-16T12:30:00Z')) : null
      };
    };
    return {
      verified: summarize('brunch-le-buffet'),
      conditional: summarize('la-cascada'),
      conflict: summarize('hatsune-japanese-bar')
    };
  });
  expect(values.verified.status).toBe('verified');
  expect(values.verified.nowHours).toContain('13:00');
  expect(values.verified.now).toMatchObject({ state: 'open', source: 'base' });
  expect(values.conditional.status).toBe('conditional');
  expect(values.conditional.displayHours).toContain('10:00');
  expect(values.conditional.nowHours).toBe('');
  expect(values.conditional.now).toBeNull();
  expect(values.conflict.status).toBe('conflict');
  expect(values.conflict.nowHours).toBe('');
  expect(values.conflict.now).toBeNull();
});

test('2.21.0 opening-hours quality assets remain deployed and PWA-cached after later releases', async ({ request }) => {
  const pkg = await request.get('./package.json');
  expect(pkg.ok()).toBeTruthy();
  const { version } = await pkg.json();
  expect(version).toMatch(/^2\.\d+\.\d+$/);
  for (const asset of ['./hours-quality-2.21.js','./now-status-2.19.js','./now-status-2.19.css']) {
    const res = await request.get(asset); expect(res.ok(), `${asset} should load`).toBeTruthy(); expect((res.headers()['content-type'] || '')).not.toMatch(/text\/html/i);
  }
  const appText = await (await request.get('./index.html')).text();
  expect(appText).toContain(`HOY La Manga · Mar Menor · App ${version}`);
  expect(appText).toContain('hours-quality-2.21.js?v=2.21.0');
  expect(appText).toContain('now-status-2.19.css?v=2.19.2');
  expect(appText).toContain('now-status-2.19.js?v=2.19.2');
  expect(appText).toContain('menu-signature-2.13.js?v=2.20.1');
  expect(appText).toContain('profile-flow-2.7.js?v=2.20.1');
  const workerText = await (await request.get('./service-worker.js')).text();
  expect(workerText).toContain(`const CACHE='hoy-v${version}'`);
  expect(workerText).toContain('./hours-quality-2.21.js');
  expect(workerText).toContain('./now-status-2.19.js');
  expect(workerText).toContain('./now-status-2.19.css');
});

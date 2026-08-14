const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/current-release');

test.use({ serviceWorkers: 'block' });

test('HOY 2.22 opening-hours trust assets remain loaded and one-tap confirmation stays permission-gated', async ({ page, request }) => {
  const [js, css, index, pkg] = await Promise.all([
    request.get('./hours-trust-2.22.js'),
    request.get('./hours-trust-2.22.css'),
    request.get('./index.html'),
    request.get('./package.json')
  ]);
  expect(js.ok()).toBeTruthy();
  expect(css.ok()).toBeTruthy();
  expect(index.ok()).toBeTruthy();
  expect(pkg.ok()).toBeTruthy();
  const jsText = await js.text();
  const indexText = await index.text();
  const { version } = await pkg.json();
  expect(jsText).toContain("window.hoyHoursTrustVersion='2.22.0'");
  expect(jsText).toContain('hoyCanManageLiveHours');
  expect(jsText).toContain('data-hours-today-confirm');
  expect(indexText).toContain(`App ${version}`);
  expect(indexText).toContain('hours-trust-2.22.js?v=2.22.0');
  expect(indexText).toContain('hours-trust-2.22.css?v=2.22.0');

  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.hoyHoursTrustVersion)).toBe('2.22.0');
  expect(pageErrors).toEqual([]);
});

test('later guest layers preserve verified-versus-conflict truth instead of faking NOW certainty', async ({ page }) => {
  await gotoReady(page);
  await expect.poll(() => page.evaluate(() => cloud.status), { timeout: 20_000 }).toBe('online');

  await page.evaluate(() => openDetail(16));
  const detail = page.locator('#detail[open]');
  await expect(detail).toBeVisible();
  const verified = detail.locator('[data-hours-trust="verified"]');
  await expect(verified).toBeVisible();
  await expect(verified).toHaveAttribute('data-hours-simple', 'safe');
  await expect(verified).toContainText(/HOY geprüft|Vom Betrieb/i);

  await page.evaluate(() => {
    document.getElementById('detail')?.close();
    const p=DATA.find(x=>Number(x.id)===16);
    window.__hoyQaHoursBackup={
      status:p.hours_status,note:p.hours_note,hours:p.hours,raw:p.hours_raw_text,
      operatorHours:p.operator_hours,operatorSpecial:p.operator_special_hours
    };
    p.hours_status='conflict';
    p.hours_note='QA: mehrere aktuelle Angaben widersprechen sich.';
    p.hours_raw_text='QA-Konflikt zwischen zwei aktuellen Quellen.';
    p.operator_hours=null;
    p.operator_special_hours=null;
    openDetail(p.id);
  });
  const conflict = page.locator('#detail[open] [data-hours-trust="conflict"]');
  await expect(conflict).toBeVisible();
  await expect(conflict).toHaveAttribute('data-hours-simple', 'uncertain');
  await expect(conflict).toContainText('Öffnungszeiten aktuell nicht sicher');

  await page.evaluate(() => {
    const p=DATA.find(x=>Number(x.id)===16),b=window.__hoyQaHoursBackup;
    if(p&&b){
      p.hours_status=b.status;p.hours_note=b.note;p.hours=b.hours;p.hours_raw_text=b.raw;
      p.operator_hours=b.operatorHours;p.operator_special_hours=b.operatorSpecial;
    }
    delete window.__hoyQaHoursBackup;
  });
});

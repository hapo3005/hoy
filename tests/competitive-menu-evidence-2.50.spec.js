const { test, expect } = require('@playwright/test');

const CANDIDATES = [
  ['https://trasteverelamanga.es/wp-content/uploads/2024/07/menunuevo.jpg', 'trastevere-menu-current.jpg'],
  ['https://trasteverelamanga.es/wp-content/uploads/2019/05/FABIMENUtras-.png', 'trastevere-menu-secondary.png'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-01-copia-480x1024.jpg', 'isla-grosa-es-01.jpg'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-02-copia-480x1024.jpg', 'isla-grosa-es-02.jpg'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-04-copia-480x1024.jpg', 'isla-grosa-es-04.jpg'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-01-copia-480x1024.jpg', 'isla-grosa-en-01.jpg'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-02-copia-480x1024.jpg', 'isla-grosa-en-02.jpg'],
  ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-04-copia-480x1024.jpg', 'isla-grosa-en-04.jpg']
];

test('capture current first-party competitive menu candidates without publishing them', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1800, height: 2400 });

  for (const [url, filename] of CANDIDATES) {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fff"><img id="menu" style="display:block;max-width:none;width:auto;height:auto" src="${url.replace(/&/g, '&amp;')}"></body></html>`, { waitUntil: 'domcontentloaded' });
    const img = page.locator('#menu');
    await expect(img).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0), { timeout: 30_000 }).toBe(true);
    const natural = await img.evaluate(el => ({ width: el.naturalWidth, height: el.naturalHeight }));
    expect(natural.width, `${url} must remain a real readable image`).toBeGreaterThan(250);
    expect(natural.height, `${url} must remain a real readable image`).toBeGreaterThan(250);

    const target = `qa-screenshots/competitive-menus/${filename}`;
    await img.screenshot({ path: target, animations: 'disabled' });
    await testInfo.attach(`competitive-menu-${filename}`, {
      path: target,
      contentType: /\.png$/i.test(filename) ? 'image/png' : 'image/jpeg'
    });
    await testInfo.attach(`competitive-menu-${filename}-metadata`, {
      body: Buffer.from(JSON.stringify({ url, filename, natural }, null, 2)),
      contentType: 'application/json'
    });
  }
});

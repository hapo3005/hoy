const { test, expect } = require('@playwright/test');

const VENUES = [
  {
    name: 'Trastevere',
    pageUrl: 'https://trasteverelamanga.es/menu/',
    sources: [
      ['https://trasteverelamanga.es/wp-content/uploads/2024/07/menunuevo.jpg', 'trastevere-menu-current.jpg'],
      ['https://trasteverelamanga.es/wp-content/uploads/2019/05/FABIMENUtras-.png', 'trastevere-menu-secondary.png']
    ]
  },
  {
    name: 'Isla Grosa',
    pageUrl: 'https://restauranteislagrosalamanga.es/menu/',
    sources: [
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-01-copia-480x1024.jpg', 'isla-grosa-es-01.jpg'],
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-02-copia-480x1024.jpg', 'isla-grosa-es-02.jpg'],
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-04-copia-480x1024.jpg', 'isla-grosa-es-04.jpg'],
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-01-copia-480x1024.jpg', 'isla-grosa-en-01.jpg'],
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-02-copia-480x1024.jpg', 'isla-grosa-en-02.jpg'],
      ['https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-04-copia-480x1024.jpg', 'isla-grosa-en-04.jpg']
    ]
  }
];

async function captureVenue(page, testInfo, venue) {
  await page.setViewportSize({ width: 1800, height: 2400 });
  await page.goto(venue.pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1500);

  for (const [url, filename] of venue.sources) {
    const anchor = page.locator(`a[href="${url}"]`).first();
    await expect(anchor, `${venue.name} must still publish ${url} from its own menu page`).toBeVisible({ timeout: 20_000 });
    const img = anchor.locator('img').first();
    await expect(img, `${venue.name} source link must contain a rendered menu image`).toBeVisible({ timeout: 20_000 });
    await expect.poll(
      () => img.evaluate(el => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0),
      { timeout: 20_000, message: `${venue.name} must render ${url} in first-party context` }
    ).toBe(true);

    const metadata = await img.evaluate((el, sourceUrl) => ({
      sourceUrl,
      src: el.getAttribute('src'),
      currentSrc: el.currentSrc,
      alt: el.getAttribute('alt'),
      natural: { width: el.naturalWidth, height: el.naturalHeight }
    }), url);
    expect(metadata.natural.width, `${url} must remain a readable menu image`).toBeGreaterThan(250);
    expect(metadata.natural.height, `${url} must remain a readable menu image`).toBeGreaterThan(250);

    const target = `qa-screenshots/competitive-menus/${filename}`;
    await img.screenshot({ path: target, animations: 'disabled' });
    await testInfo.attach(`competitive-menu-${filename}`, {
      path: target,
      contentType: /\.png$/i.test(filename) ? 'image/png' : 'image/jpeg'
    });
    await testInfo.attach(`competitive-menu-${filename}-metadata`, {
      body: Buffer.from(JSON.stringify({ venue: venue.name, pageUrl: venue.pageUrl, filename, ...metadata }, null, 2)),
      contentType: 'application/json'
    });
  }
}

for (const venue of VENUES) {
  test(`capture ${venue.name} current first-party menu evidence without publishing it`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
    await captureVenue(page, testInfo, venue);
  });
}

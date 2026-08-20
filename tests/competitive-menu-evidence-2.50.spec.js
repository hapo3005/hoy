const { test, expect } = require('@playwright/test');

const TRASTEVERE = {
  name: 'Trastevere',
  pageUrl: 'https://trasteverelamanga.es/menu/',
  primaryMenuUrl: 'https://trasteverelamanga.es/wp-content/uploads/2024/07/menunuevo.jpg',
  knownHeaderAsset: 'https://trasteverelamanga.es/wp-content/uploads/2019/05/FABIMENUtras-.png'
};

const ISLA_GROSA = {
  name: 'Isla Grosa',
  pageUrl: 'https://restauranteislagrosalamanga.es/menu/',
  expectedImageStem: '/wp-content/uploads/2026/03/ISLA-'
};

async function attachJson(testInfo, name, payload) {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2)),
    contentType: 'application/json'
  });
}

test('classify Trastevere first-party menu source fail-closed', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1800, height: 2400 });
  const pageResponse = await page.goto(TRASTEVERE.pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(pageResponse?.status(), 'Trastevere first-party menu page itself must remain reachable').toBe(200);
  await page.waitForTimeout(1200);

  const primary = page.locator(`img[src="${TRASTEVERE.primaryMenuUrl}"]`).first();
  await expect(primary, 'Trastevere menu page must still reference the primary menu asset even if that asset is broken').toBeAttached();

  const primaryResponse = await request.get(TRASTEVERE.primaryMenuUrl, { failOnStatusCode: false });
  const primaryMeta = await primary.evaluate(el => ({
    src: el.getAttribute('src'),
    currentSrc: el.currentSrc,
    complete: el.complete,
    natural: { width: el.naturalWidth, height: el.naturalHeight }
  }));

  const header = page.locator(`img[src="${TRASTEVERE.knownHeaderAsset}"]`).first();
  await expect(header, 'known 2019 asset should remain identifiable as site/header media rather than silently becoming menu truth').toBeAttached();
  const headerMeta = await header.evaluate(el => ({
    src: el.getAttribute('src'),
    alt: el.getAttribute('alt'),
    classes: el.className,
    natural: { width: el.naturalWidth, height: el.naturalHeight }
  }));

  const evidence = {
    venue: TRASTEVERE.name,
    pageUrl: TRASTEVERE.pageUrl,
    pageStatus: pageResponse?.status(),
    primaryMenuUrl: TRASTEVERE.primaryMenuUrl,
    primaryStatus: primaryResponse.status(),
    primaryMeta,
    knownHeaderAsset: TRASTEVERE.knownHeaderAsset,
    headerMeta,
    classification: primaryResponse.ok() && primaryMeta.natural.width > 250 && primaryMeta.natural.height > 250
      ? 'FIRST_PARTY_MENU_RENDERABLE'
      : 'FIRST_PARTY_PAGE_CONFIRMED_MENU_ASSET_BROKEN_FAIL_CLOSED',
    structuringAllowed: false
  };

  const target = 'qa-screenshots/competitive-menus/trastevere-first-party-page.png';
  await page.screenshot({ path: target, fullPage: true, animations: 'disabled' });
  await testInfo.attach('trastevere-first-party-page', { path: target, contentType: 'image/png' });
  await attachJson(testInfo, 'trastevere-source-classification', evidence);

  // Current evidence must never promote a broken/zero-size primary source into structured menu truth.
  if (primaryResponse.ok()) {
    expect(primaryMeta.natural.width, 'a recovered Trastevere menu source requires real readable image bytes').toBeGreaterThan(250);
    expect(primaryMeta.natural.height, 'a recovered Trastevere menu source requires real readable image bytes').toBeGreaterThan(250);
  } else {
    expect(primaryResponse.status(), 'broken primary menu source stays explicit instead of being replaced by unrelated header media').toBe(404);
    expect(evidence.classification).toBe('FIRST_PARTY_PAGE_CONFIRMED_MENU_ASSET_BROKEN_FAIL_CLOSED');
  }
});

test('capture Isla Grosa current first-party menu images from rendered page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1800, height: 2400 });
  const response = await page.goto(ISLA_GROSA.pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(response?.status(), 'Isla Grosa first-party menu page must remain reachable').toBe(200);
  await page.waitForTimeout(1500);

  const metadata = await page.locator('img').evaluateAll((els, stem) => els
    .map((el, index) => ({
      index,
      src: el.getAttribute('src') || '',
      currentSrc: el.currentSrc || '',
      alt: el.getAttribute('alt'),
      complete: el.complete,
      natural: { width: el.naturalWidth, height: el.naturalHeight }
    }))
    .filter(x => x.src.includes(stem) || x.currentSrc.includes(stem)), ISLA_GROSA.expectedImageStem);

  expect(metadata.length, 'Isla Grosa should expose all six current ES/EN menu images from its own page').toBeGreaterThanOrEqual(6);
  const unique = [];
  const seen = new Set();
  for (const item of metadata) {
    const key = item.src || item.currentSrc;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  expect(unique.length, 'Isla Grosa should expose six unique menu image sources').toBeGreaterThanOrEqual(6);

  for (let i = 0; i < unique.length; i++) {
    const item = unique[i];
    expect(item.complete, `${item.src} must finish loading`).toBe(true);
    expect(item.natural.width, `${item.src} must be a readable image`).toBeGreaterThan(250);
    expect(item.natural.height, `${item.src} must be a readable image`).toBeGreaterThan(250);

    const locator = page.locator('img').nth(item.index);
    const clean = (item.src || item.currentSrc).split('/').pop().replace(/[^a-z0-9._-]+/gi, '-');
    const target = `qa-screenshots/competitive-menus/isla-grosa-${String(i + 1).padStart(2, '0')}-${clean}`;
    await locator.screenshot({ path: target, animations: 'disabled' });
    await testInfo.attach(`isla-grosa-menu-${String(i + 1).padStart(2, '0')}`, {
      path: target,
      contentType: /\.png$/i.test(clean) ? 'image/png' : 'image/jpeg'
    });
  }

  await attachJson(testInfo, 'isla-grosa-menu-metadata', {
    venue: ISLA_GROSA.name,
    pageUrl: ISLA_GROSA.pageUrl,
    pageStatus: response?.status(),
    imageCount: unique.length,
    images: unique,
    classification: 'FIRST_PARTY_MENU_IMAGES_RENDERED_CAPTURED',
    structuringAllowed: false
  });
});

const { test, expect } = require('@playwright/test');

// Internal one-shot QA helper: capture official, image-based menu sources at readable resolution.
// It never publishes extracted data and runs only on the desktop Chromium QA project.
test('capture official image menus for conservative manual review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'source capture only needs one browser');
  await page.setViewportSize({ width: 1800, height: 2400 });

  const captureImage = async (url, filename) => {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}img{display:block;max-width:none;width:auto;height:auto}</style></head><body><img id="menu" src="${url.replace(/&/g, '&amp;')}"></body></html>`, { waitUntil: 'domcontentloaded' });
    const img = page.locator('#menu');
    await expect(img).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => img.evaluate(el => ({ w: el.naturalWidth, h: el.naturalHeight }))).toMatchObject({ w: expect.any(Number), h: expect.any(Number) });
    const natural = await img.evaluate(el => ({ w: el.naturalWidth, h: el.naturalHeight }));
    expect(natural.w, `${url} should load a real image`).toBeGreaterThan(250);
    expect(natural.h, `${url} should load a real image`).toBeGreaterThan(250);
    await img.screenshot({ path: `qa-screenshots/source-menus/${filename}`, animations: 'disabled' });
  };

  const sources = [
    ['https://cabop.es/wp-content/uploads/2025/06/CARTA-ONLINE-GR-1024x768.png', 'cabop-food.png'],
    ['https://cabop.es/wp-content/uploads/2025/06/BEBIDAS-ONLINE-GR-878x1024.png', 'cabop-drinks.png'],
    ['https://images.squarespace-cdn.com/content/v1/68764f54ec72312578ee3de5/e4681cd8-261d-4294-b163-bd420a57c0e6/IMG_5636.jpeg', 'casa-india-daily-1.jpg'],
    ['https://images.squarespace-cdn.com/content/v1/68764f54ec72312578ee3de5/9f719263-93de-4306-b91e-a07de6e12750/IMG_5637.jpeg', 'casa-india-daily-2.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/01SOULa--scaled.jpg', 'soul-01.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/02SOULa--scaled.jpg', 'soul-02.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/03SOULa--scaled.jpg', 'soul-03.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/04SOULa-copia-scaled.jpg', 'soul-04.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2024/07/05SOULa-scaled.jpg', 'soul-05.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/06SOULab.jpg', 'soul-06.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/05/06soulcafe-scaled.jpg', 'soul-cafe.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2026/07/01soulcervezz-scaled.jpg', 'soul-beer.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2025/07/vinos06-scaled.jpg', 'soul-wine.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2025/07/chupitosj-scaled.jpg', 'soul-shots.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2024/07/03soulbebidav-scaled.jpg', 'soul-drinks.jpg'],
    ['https://menurestauranteqr.es/wp-content/uploads/2025/07/coctelsin.jpg', 'soul-cocktails.jpg']
  ];

  for (const [url, filename] of sources) await captureImage(url, filename);

  await page.goto('https://www.bonoboplaya.com/nuestra-carta/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'qa-screenshots/source-menus/bonobo-main-page.png', fullPage: true, animations: 'disabled' });
});

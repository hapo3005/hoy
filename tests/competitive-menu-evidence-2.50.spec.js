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

const SOUL_KITCHEN = {
  name: 'Soul Kitchen',
  pageUrl: 'https://menurestauranteqr.es/soulkitchen/',
  assets: [
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/01SOULa--scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/02SOULa--scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/03SOULa--scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/04SOULa-copia-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2024/07/05SOULa-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/06SOULab.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/05/06soulcafe-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2026/07/01soulcervezz-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2025/07/vinos06-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2025/07/chupitosj-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2024/07/03soulbebidav-scaled.jpg',
    'https://menurestauranteqr.es/wp-content/uploads/2025/07/coctelsin.jpg'
  ]
};

async function attachJson(testInfo, name, payload) {
  await testInfo.attach(name, {body: Buffer.from(JSON.stringify(payload, null, 2)), contentType: 'application/json'});
}

test('classify Trastevere first-party menu source fail-closed', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1800, height: 2400 });
  const pageResponse = await page.goto(TRASTEVERE.pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(pageResponse?.status()).toBe(200);
  await page.waitForTimeout(1200);
  const primary = page.locator(`img[src="${TRASTEVERE.primaryMenuUrl}"]`).first();
  await expect(primary).toBeAttached();
  const primaryResponse = await request.get(TRASTEVERE.primaryMenuUrl, { failOnStatusCode: false });
  const primaryMeta = await primary.evaluate(el => ({src: el.getAttribute('src'), currentSrc: el.currentSrc, complete: el.complete, natural: { width: el.naturalWidth, height: el.naturalHeight }}));
  const header = page.locator(`img[src="${TRASTEVERE.knownHeaderAsset}"]`).first();
  await expect(header).toBeAttached();
  const headerMeta = await header.evaluate(el => ({src: el.getAttribute('src'), alt: el.getAttribute('alt'), classes: el.className, natural: { width: el.naturalWidth, height: el.naturalHeight }}));
  const evidence = {venue: TRASTEVERE.name,pageUrl: TRASTEVERE.pageUrl,pageStatus: pageResponse?.status(),primaryMenuUrl: TRASTEVERE.primaryMenuUrl,primaryStatus: primaryResponse.status(),primaryMeta,knownHeaderAsset: TRASTEVERE.knownHeaderAsset,headerMeta,classification: primaryResponse.ok() && primaryMeta.natural.width > 250 && primaryMeta.natural.height > 250 ? 'FIRST_PARTY_MENU_RENDERABLE' : 'FIRST_PARTY_PAGE_CONFIRMED_MENU_ASSET_BROKEN_FAIL_CLOSED',structuringAllowed: false};
  const target = 'qa-screenshots/competitive-menus/trastevere-first-party-page.png';
  await page.screenshot({ path: target, fullPage: true, animations: 'disabled' });
  await testInfo.attach('trastevere-first-party-page', { path: target, contentType: 'image/png' });
  await attachJson(testInfo, 'trastevere-source-classification', evidence);
  if (primaryResponse.ok()) {
    expect(primaryMeta.natural.width).toBeGreaterThan(250);
    expect(primaryMeta.natural.height).toBeGreaterThan(250);
  } else {
    expect(primaryResponse.status()).toBe(404);
    expect(evidence.classification).toBe('FIRST_PARTY_PAGE_CONFIRMED_MENU_ASSET_BROKEN_FAIL_CLOSED');
  }
});

test('capture Isla Grosa current first-party menu images from rendered page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1800, height: 2400 });
  const response = await page.goto(ISLA_GROSA.pageUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(response?.status()).toBe(200);
  await page.waitForTimeout(1500);
  const metadata = await page.locator('img').evaluateAll((els, stem) => els.map((el,index)=>({index,src:el.getAttribute('src')||'',currentSrc:el.currentSrc||'',alt:el.getAttribute('alt'),complete:el.complete,natural:{width:el.naturalWidth,height:el.naturalHeight}})).filter(x=>x.src.includes(stem)||x.currentSrc.includes(stem)),ISLA_GROSA.expectedImageStem);
  expect(metadata.length).toBeGreaterThanOrEqual(6);
  const unique=[]; const seen=new Set();
  for(const item of metadata){const key=item.src||item.currentSrc;if(!key||seen.has(key))continue;seen.add(key);unique.push(item);}
  expect(unique.length).toBeGreaterThanOrEqual(6);
  for(let i=0;i<unique.length;i++){
    const item=unique[i];
    expect(item.complete).toBe(true);
    expect(item.natural.width).toBeGreaterThan(250);
    expect(item.natural.height).toBeGreaterThan(250);
    const locator=page.locator('img').nth(item.index);
    const clean=(item.src||item.currentSrc).split('/').pop().replace(/[^a-z0-9._-]+/gi,'-');
    const target=`qa-screenshots/competitive-menus/isla-grosa-${String(i+1).padStart(2,'0')}-${clean}`;
    await locator.screenshot({path:target,animations:'disabled'});
    await testInfo.attach(`isla-grosa-menu-${String(i+1).padStart(2,'0')}`,{path:target,contentType:/\.png$/i.test(clean)?'image/png':'image/jpeg'});
  }
  await attachJson(testInfo,'isla-grosa-menu-metadata',{venue:ISLA_GROSA.name,pageUrl:ISLA_GROSA.pageUrl,pageStatus:response?.status(),imageCount:unique.length,images:unique,classification:'FIRST_PARTY_MENU_IMAGES_RENDERED_CAPTURED',structuringAllowed:false});
});

test('capture all 12 Soul Kitchen hosted first-party menu assets without publishing them', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'competitive evidence capture uses one browser only');
  await page.setViewportSize({ width: 1600, height: 2200 });
  const pageResponse=await request.get(SOUL_KITCHEN.pageUrl,{failOnStatusCode:false});
  expect(pageResponse.status()).toBe(200);
  const captured=[];
  for(let i=0;i<SOUL_KITCHEN.assets.length;i++){
    const url=SOUL_KITCHEN.assets[i];
    const response=await request.get(url,{failOnStatusCode:false});
    expect(response.status(),`${url} must remain reachable`).toBe(200);
    await page.setContent(`<main style="margin:0;padding:16px;background:white"><img id="source" src="${url}" style="display:block;max-width:100%;height:auto"></main>`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>{const img=document.getElementById('source');return img?.complete&&img.naturalWidth>250&&img.naturalHeight>250},{timeout:20_000});
    const meta=await page.locator('#source').evaluate(img=>({natural:{width:img.naturalWidth,height:img.naturalHeight},currentSrc:img.currentSrc}));
    const clean=url.split('/').pop().replace(/[^a-z0-9._-]+/gi,'-');
    const target=`qa-screenshots/competitive-menus/soul-kitchen/${String(i+1).padStart(2,'0')}-${clean}`;
    await page.locator('#source').screenshot({path:target,animations:'disabled'});
    await testInfo.attach(`soul-kitchen-menu-${String(i+1).padStart(2,'0')}`,{path:target,contentType:'image/jpeg'});
    captured.push({url,status:response.status(),bytes:(await response.body()).length,natural:meta.natural});
  }
  expect(captured).toHaveLength(12);
  expect(captured.every(row=>row.bytes>10000&&row.natural.width>250&&row.natural.height>250)).toBe(true);
  await attachJson(testInfo,'soul-kitchen-source-capture',{venue:SOUL_KITCHEN.name,pageUrl:SOUL_KITCHEN.pageUrl,pageStatus:pageResponse.status(),imageCount:captured.length,images:captured,classification:'FIRST_PARTY_HOSTED_IMAGE_MENU_CAPTURED_EDITORIAL_STRUCTURING_REQUIRED',guestPublishAllowed:false,productionMutationPerformed:false});
});

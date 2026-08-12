const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

test('in-app source normalization runs before localization and integrity runs last',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const inapp=html.indexOf('menu-inapp-2.31.js');
  const i18n=html.indexOf('menu-i18n-2.5.js');
  const integrity=html.indexOf('menu-integrity-2.32.js');
  expect(inapp).toBeGreaterThan(0);
  expect(i18n).toBeGreaterThan(inapp);
  expect(integrity).toBeGreaterThan(i18n);
});

test('complete localized menu survives integrity classification without external provenance CTA',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>cloud.status==='online'&&window.hoyMenuIntegrityVersion==='2.32.0'&&MENUS[16]?.integrity==='complete',{timeout:15000});
  const menu=await page.evaluate(()=>menuFor(DATA.find(x=>Number(x.id)===16)));
  expect(menu.integrity).toBe('complete');
  expect(menu.status).toBe('structured');
  expect(menu.localized).toBeTruthy();
  expect(menu.locale).toBe('de');
  expect(menu.itemCount).toBe(130);
  expect(menu.source).toBeFalsy();
  await page.evaluate(()=>openDetail(16));
  const section=page.locator('#detail #profile-menu');
  await expect(section).toContainText(/Speisekarte auf Deutsch/i);
  await expect(section.locator('a').filter({hasText:/Originalkarte öffnen/i})).toHaveCount(0);
});

test('legacy evidence entries cannot reopen external menu links for classified source-only venues',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>cloud.status==='online'&&window.hoyMenuIntegrityVersion==='2.32.0'&&MENUS[21]?.integrity==='source_only',{timeout:15000});
  await page.evaluate(()=>openDetail(21));
  const menu=page.locator('#detail #profile-menu');
  await expect(menu).toContainText('Speisekarte wird in HOY aufbereitet');
  await expect(menu.locator('a[href*="cabop.es/carta-online"]')).toHaveCount(0);
});

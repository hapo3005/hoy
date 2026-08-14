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
  await page.waitForFunction(()=>cloud.status==='online'&&window.hoyMenuIntegrityVersion==='2.37.0'&&window.hoyMenuLanguageIntegrityState==='ready'&&MENUS[16]?.integrity==='complete',null,{timeout:40000});
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

test('synthetic source-only evidence cannot reopen an external menu link after classification',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuIntegrityVersion==='2.37.0',null,{timeout:30000});
  const html=await page.evaluate(()=>{
    const p=DATA[0],old=MENUS[p.id];
    MENUS[p.id]={status:'source_only',integrity:'source_only',source:null,provenanceUrls:['https://example.com/menu'],label:'Offizielle Quelle'};
    try{return menuPanel(p)}finally{if(old)MENUS[p.id]=old;else delete MENUS[p.id]}
  });
  expect(html).toContain('Speisekarte wird in HOY aufbereitet');
  expect(html).not.toContain('example.com/menu');
  expect(html).not.toMatch(/href=/i);
});

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud?.status==='online'&&typeof window.hoyMenuInAppComplete238==='function',{timeout:30000});
}

test('external menu authority never masquerades as a complete in-app HOY menu',async({page,request})=>{
  const source=await (await request.get('./menu-authority-2.38.js')).text();
  expect(source).toContain("status:'source_only',integrity:'verified_snapshot_complete'");
  expect(source).toContain("status:'integrity_partial',integrity:complete?'transactional_complete':'transactional_partial'");
  expect(source).not.toContain("status:'structured',integrity:'verified_snapshot_complete'");
  expect(source).not.toContain("status:complete?'structured':'integrity_partial'");

  await ready(page);
  const contract=await page.evaluate(()=>({
    structured:window.hoyMenuInAppComplete238({integrity:'complete',categories:[['Essen',[['Paella','18 €']]]]}),
    emptyStructured:window.hoyMenuInAppComplete238({integrity:'complete',categories:[]}),
    image:window.hoyMenuInAppComplete238({integrity:'image_complete',displayMode:'image_pages',pages:[{url:'https://example.com/page.jpg'}]}),
    embed:window.hoyMenuInAppComplete238({integrity:'embed_complete',displayMode:'official_embed',embedUrl:'https://example.com/menu'}),
    snapshot:window.hoyMenuInAppComplete238({integrity:'verified_snapshot_complete',status:'source_only',officialMenuUrl:'https://example.com/menu.jpg'}),
    transactional:window.hoyMenuInAppComplete238({integrity:'transactional_complete',status:'integrity_partial',officialMenuUrl:'https://example.com/order'})
  }));
  expect(contract.structured).toBe(true);
  expect(contract.emptyStructured).toBe(false);
  expect(contract.image).toBe(true);
  expect(contract.embed).toBe(true);
  expect(contract.snapshot).toBe(false);
  expect(contract.transactional).toBe(false);
});

test('snapshot and ordering sources create no full-menu guest signal, raw PDF CTA or venue-media inside the menu section',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);

  await page.evaluate(id=>{
    MENUS[id]={
      status:'source_only',integrity:'verified_snapshot_complete',sourceCompleteness:'complete',guestAvailability:'external_reference',
      officialMenuUrl:'https://example.com/current-menu.pdf',label:'Öffentliche Kartenaufnahme',checked:'2026-08-16',sourceAuthority:'verified_public_snapshot',localized:false,
      note:'Quellenreferenz, keine vollständige HOY-Speisekarte.'
    };
    openDetail(id);
  },id);

  const profile=page.locator('#detail');
  await expect(profile).toBeVisible();
  await expect(profile.locator('#profile-menu')).toContainText('Quellenbeleg');
  await expect(profile.locator('#profile-menu')).not.toContainText('Speisekarte verfügbar');
  await expect(profile.locator('#profile-menu a[href*=".pdf"]')).toHaveCount(0);
  await expect(profile.locator('#profile-menu .detail-art, #profile-menu .media-photo, #profile-menu .profile-media-mark')).toHaveCount(0);
  const snapshotSignals=await page.evaluate(id=>window.hoyDecision280For(DATA.find(x=>Number(x.id)===Number(id))).reasons.map(x=>x.label),id);
  expect(snapshotSignals).not.toContain('Speisekarte verfügbar');

  await page.evaluate(id=>{
    document.getElementById('detail')?.close();
    MENUS[id]={
      status:'integrity_partial',integrity:'transactional_complete',sourceCompleteness:'complete',guestAvailability:'external_reference',
      officialMenuUrl:'https://example.com/order',label:'Bestellplattform',checked:'2026-08-16',sourceAuthority:'authorized_transactional',localized:false,
      note:'Bestellquelle kann vom Vor-Ort-Angebot abweichen.'
    };
    openDetail(id);
  },id);
  await expect(profile.locator('#profile-menu')).toContainText('Bestellangebot und Vor-Ort-Speisekarte bleiben getrennte Wahrheiten');
  await expect(profile.locator('#profile-menu')).not.toContainText('Speisekarte verfügbar');
  const transactionalSignals=await page.evaluate(id=>window.hoyDecision280For(DATA.find(x=>Number(x.id)===Number(id))).reasons.map(x=>x.label),id);
  expect(transactionalSignals).not.toContain('Speisekarte verfügbar');
});

test('a genuinely complete in-app menu still earns the normal guest signal',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>{
    const p=DATA[0];
    MENUS[p.id]={status:'structured',integrity:'complete',categories:[['Hauptgerichte',[['Arroz','18 €']]]],localized:false};
    return {
      available:window.hoyMenuInAppComplete238(MENUS[p.id]),
      signals:window.hoyDecision280For(p).reasons.map(x=>x.label)
    };
  });
  expect(result.available).toBe(true);
  expect(result.signals).toContain('Speisekarte verfügbar');
});

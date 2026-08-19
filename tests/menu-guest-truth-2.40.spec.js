const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud?.status==='online'&&typeof window.hoyMenuInAppComplete238==='function'&&typeof window.hoyMenuInAppPartial238==='function',{timeout:30000});
}

test('external menu authority never masquerades as a complete in-app HOY menu',async({page,request})=>{
  const source=await (await request.get('./menu-authority-2.38.js')).text();
  expect(source).toContain("status:'source_only',integrity:'verified_snapshot_complete'");
  expect(source).toContain("status:'integrity_partial',integrity:complete?'transactional_complete':'transactional_partial'");
  expect(source).toContain('function currentStrong(m){return inAppComplete(m)||inAppPartial(m)}');
  expect(source).not.toContain("status:'structured',integrity:'verified_snapshot_complete'");
  expect(source).not.toContain("status:complete?'structured':'integrity_partial'");

  await ready(page);
  const contract=await page.evaluate(()=>({
    structured:window.hoyMenuInAppComplete238({integrity:'complete',categories:[['Essen',[['Paella','18 €']]]]}),
    emptyStructured:window.hoyMenuInAppComplete238({integrity:'complete',categories:[]}),
    partial:window.hoyMenuInAppPartial238({status:'integrity_partial',integrity:'partial',categories:[['Essen',[['Paella','18 €']]]]}),
    emptyPartial:window.hoyMenuInAppPartial238({status:'integrity_partial',integrity:'partial',categories:[]}),
    image:window.hoyMenuInAppComplete238({integrity:'image_complete',displayMode:'image_pages',pages:[{url:'https://example.com/page.jpg'}]}),
    embed:window.hoyMenuInAppComplete238({integrity:'embed_complete',displayMode:'official_embed',embedUrl:'https://example.com/menu'}),
    snapshot:window.hoyMenuInAppComplete238({integrity:'verified_snapshot_complete',status:'source_only',officialMenuUrl:'https://example.com/menu.jpg'}),
    transactional:window.hoyMenuInAppComplete238({integrity:'transactional_complete',status:'integrity_partial',officialMenuUrl:'https://example.com/order'})
  }));
  expect(contract.structured).toBe(true);
  expect(contract.emptyStructured).toBe(false);
  expect(contract.partial).toBe(true);
  expect(contract.emptyPartial).toBe(false);
  expect(contract.image).toBe(true);
  expect(contract.embed).toBe(true);
  expect(contract.snapshot).toBe(false);
  expect(contract.transactional).toBe(false);
});

test('snapshot and ordering sources create no full-menu guest signal, raw PDF CTA, false HOY heading or venue-media inside the menu section',async({page})=>{
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
  const menu=profile.locator('#profile-menu');
  const kicker=menu.locator(':scope > .profile-section-head small');
  const title=menu.locator(':scope > .profile-section-head h3');
  await expect(profile).toBeVisible();
  await expect(menu).toContainText('Quellenbeleg');
  await expect(menu).not.toContainText('Speisekarte verfügbar');
  await expect(kicker).toHaveText('KARTENQUELLE');
  await expect(title).toHaveText('Speisekarten-Quelle');
  await expect(menu.locator('a[href*=".pdf"]')).toHaveCount(0);
  await expect(menu.locator('.detail-art, .media-photo, .profile-media-mark')).toHaveCount(0);
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
  await expect(menu).toContainText('Quellenbeleg');
  await expect(menu).toContainText('Speisekarte wird in HOY aufbereitet');
  await expect(menu).not.toContainText('Speisekarte verfügbar');
  await expect(kicker).toHaveText('KARTENQUELLE');
  await expect(title).toHaveText('Speisekarten-Quelle');
  await expect(menu.locator('a[href="https://example.com/order"]')).toHaveCount(0);
  const transactionalSignals=await page.evaluate(id=>window.hoyDecision280For(DATA.find(x=>Number(x.id)===Number(id))).reasons.map(x=>x.label),id);
  expect(transactionalSignals).not.toContain('Speisekarte verfügbar');
});

test('a real in-app partial menu stays a visible partial truth, never a full menu claim',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);
  const result=await page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id));
    MENUS[p.id]={status:'integrity_partial',integrity:'partial',categories:[['Hauptgerichte',[['Arroz','18 €']]]],localized:false,coverage:{text:'1 von 3 Kartenbereichen ist aktuell in HOY.'}};
    openDetail(p.id);
    return {
      partial:window.hoyMenuInAppPartial238(MENUS[p.id]),
      complete:window.hoyMenuInAppComplete238(MENUS[p.id]),
      signals:window.hoyDecision280For(p).reasons.map(x=>x.label)
    };
  },id);
  expect(result.partial).toBe(true);
  expect(result.complete).toBe(false);
  expect(result.signals).not.toContain('Speisekarte verfügbar');
  const menu=page.locator('#detail #profile-menu');
  await expect(menu).toContainText('Teilkarte – bewusst gekennzeichnet');
  await expect(menu.locator(':scope > .profile-section-head small')).toHaveText('HOY · TEILSTAND');
  await expect(menu.locator(':scope > .profile-section-head h3')).toHaveText('Erfasste Auswahl');
});

test('a genuinely complete in-app menu still earns the normal guest signal and HOY menu heading',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);
  const result=await page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id));
    MENUS[p.id]={status:'structured',integrity:'complete',categories:[['Hauptgerichte',[['Arroz','18 €']]]],localized:false};
    openDetail(p.id);
    return {
      available:window.hoyMenuInAppComplete238(MENUS[p.id]),
      signals:window.hoyDecision280For(p).reasons.map(x=>x.label)
    };
  },id);
  expect(result.available).toBe(true);
  expect(result.signals).toContain('Speisekarte verfügbar');
  const menu=page.locator('#detail #profile-menu');
  await expect(menu.locator(':scope > .profile-section-head small')).toHaveText('HOY SPEISEKARTE');
  await expect(menu.locator(':scope > .profile-section-head h3')).toHaveText('Speisekarte');
});
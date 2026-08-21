const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud?.status==='online'&&typeof window.hoyMenuInAppComplete238==='function'&&typeof window.hoyMenuInAppPartial238==='function'&&typeof window.hoyGuestMenuReady251==='function',{timeout:30000});
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

test('snapshot and ordering sources create no guest menu section, raw source CTA or full-menu signal',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);

  await page.evaluate(id=>{
    MENUS[id]={
      nativeMenu:true,status:'source_only',integrity:'native_source_only',guestAvailability:'blocked_until_structured',
      officialMenuUrl:null,categories:[],localized:false,locale:null,
      languageCoverage:{locale:'de',total:0,ready:0,missing:0,complete:false},
      note:'Quellenreferenz, keine vollständige HOY-Speisekarte.'
    };
    openDetail(id);
  },id);

  const profile=page.locator('#detail');
  await expect(profile).toBeVisible();
  await expect(profile.locator('#profile-menu')).toHaveCount(0);
  await expect(profile.locator('a[href="#profile-menu"]')).toHaveCount(0);
  await expect(profile.locator('a[href*=".pdf"]')).toHaveCount(0);
  await expect(profile).not.toContainText('Speisekarte wird in HOY aufbereitet');
  await expect(profile).not.toContainText('Speisekarten-Quelle');
  const snapshotSignals=await page.evaluate(id=>window.hoyDecision280For(DATA.find(x=>Number(x.id)===Number(id))).reasons.map(x=>x.label),id);
  expect(snapshotSignals).not.toContain('Speisekarte verfügbar');

  await page.evaluate(id=>{
    document.getElementById('detail')?.close();
    MENUS[id]={
      nativeMenu:true,status:'integrity_partial',integrity:'transactional_complete',guestAvailability:'external_reference',
      officialMenuUrl:'https://example.com/order',categories:[],localized:false,locale:null,
      languageCoverage:{locale:'de',total:0,ready:0,missing:0,complete:false}
    };
    openDetail(id);
  },id);
  await expect(profile.locator('#profile-menu')).toHaveCount(0);
  await expect(profile).not.toContainText('Speisekarte wird in HOY aufbereitet');
  await expect(profile.locator('a[href="https://example.com/order"]')).toHaveCount(0);
  const transactionalSignals=await page.evaluate(id=>window.hoyDecision280For(DATA.find(x=>Number(x.id)===Number(id))).reasons.map(x=>x.label),id);
  expect(transactionalSignals).not.toContain('Speisekarte verfügbar');
});

test('partial in-app menu data remains internal and is not exposed as a guest menu',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);
  const result=await page.evaluate(id=>{
    const p=DATA.find(x=>Number(x.id)===Number(id));
    MENUS[p.id]={
      nativeMenu:true,status:'integrity_partial',integrity:'partial',guestAvailability:'blocked_until_locale_complete',
      categories:[['Hauptgerichte',[['Arroz','18 €']]]],localized:false,locale:null,itemCount:3,
      languageCoverage:{locale:'de',total:3,ready:1,missing:2,complete:false}
    };
    openDetail(p.id);
    return {
      partial:window.hoyMenuInAppPartial238(MENUS[p.id]),
      complete:window.hoyMenuInAppComplete238(MENUS[p.id]),
      guestReady:window.hoyGuestMenuReady251(MENUS[p.id],'de'),
      signals:window.hoyDecision280For(p).reasons.map(x=>x.label)
    };
  },id);
  expect(result.partial).toBe(true);
  expect(result.complete).toBe(false);
  expect(result.guestReady).toBe(false);
  expect(result.signals).not.toContain('Speisekarte verfügbar');
  const profile=page.locator('#detail');
  await expect(profile.locator('#profile-menu')).toHaveCount(0);
  await expect(profile).not.toContainText('Teilkarte');
  await expect(profile).not.toContainText('Erfasste Auswahl');
});

test('only a complete localized HOY-native menu earns the guest menu surface and normal signal',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);
  const result=await page.evaluate(id=>{
    state.lang='de';
    const p=DATA.find(x=>Number(x.id)===Number(id));
    MENUS[p.id]={
      nativeMenu:true,status:'structured',integrity:'complete',guestAvailability:'in_app_native',
      categories:[['Hauptgerichte',[['Arroz','18 €','Arroz','Reisgericht']]]],localized:true,locale:'de',itemCount:1,
      languageCoverage:{locale:'de',total:1,ready:1,missing:0,complete:true}
    };
    openDetail(p.id);
    return {
      available:window.hoyMenuInAppComplete238(MENUS[p.id]),
      guestReady:window.hoyGuestMenuReady251(MENUS[p.id],'de'),
      signals:window.hoyDecision280For(p).reasons.map(x=>x.label)
    };
  },id);
  expect(result.available).toBe(true);
  expect(result.guestReady).toBe(true);
  expect(result.signals).toContain('Speisekarte verfügbar');
  const menu=page.locator('#detail #profile-menu');
  await expect(menu).toBeVisible();
  await expect(menu.locator(':scope > .profile-section-head small')).toHaveText('HOY SPEISEKARTE');
  await expect(menu).toContainText('Hauptgerichte');
  await expect(menu).toContainText('Reisgericht');
});

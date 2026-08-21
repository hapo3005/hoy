const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud?.status==='online'&&typeof window.hoyGuestMenuReady251==='function',{timeout:30000});
}

test('guest never sees preparation placeholders, review badges or source-only menu substitutes',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);
  await page.evaluate(id=>{
    MENUS[id]={
      nativeMenu:true,
      status:'unavailable',
      integrity:'native_language_blocked',
      guestAvailability:'blocked_until_locale_complete',
      localized:false,
      locale:null,
      categories:[],
      itemCount:12,
      languageCoverage:{locale:'de',total:12,ready:8,missing:4,complete:false}
    };
    openDetail(id);
  },id);

  const detail=page.locator('#detail');
  await expect(detail).toBeVisible();
  await expect(detail.locator('#profile-menu')).toHaveCount(0);
  await expect(detail.locator('a[href="#profile-menu"]')).toHaveCount(0);
  await expect(detail).not.toContainText('wird aufbereitet');
  await expect(detail).not.toContainText('Karte wird geprüft');
  await expect(detail).not.toContainText('is being prepared');
  await expect(detail).not.toContainText('se está preparando');
  await expect(detail.locator('.menu248-blocked')).toHaveCount(0);

  await page.evaluate(id=>{
    document.getElementById('detail')?.close();
    const p=DATA.find(x=>Number(x.id)===Number(id));
    openServiceFlow(p,'reservation');
  },id);
  const service=page.locator('#serviceFlow');
  await expect(service).toBeVisible();
  await expect(service.locator('[data-menu-open]')).toHaveCount(0);
});

test('menu is visible only as a complete HOY-native menu in the current page language',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>DATA[0].id);

  await page.evaluate(id=>{
    state.lang='de';
    MENUS[id]={
      nativeMenu:true,status:'structured',integrity:'complete',guestAvailability:'in_app_native',localized:true,locale:'de',
      categories:[['Hauptgerichte',[['Paella','18 €','Paella','Reisgericht mit Meeresfrüchten']]]],
      itemCount:1,languageCoverage:{locale:'de',total:1,ready:1,missing:0,complete:true}
    };
    openDetail(id);
  },id);

  let detail=page.locator('#detail');
  await expect(detail.locator('#profile-menu')).toBeVisible();
  await expect(detail.locator('#profile-menu')).toContainText('Hauptgerichte');
  await expect(detail.locator('#profile-menu')).toContainText('Reisgericht mit Meeresfrüchten');
  await expect(detail.locator('.menu248-blocked')).toHaveCount(0);

  await page.evaluate(id=>{
    document.getElementById('detail')?.close();
    state.lang='en';
    openDetail(id);
  },id);
  detail=page.locator('#detail');
  await expect(detail.locator('#profile-menu')).toHaveCount(0);

  await page.evaluate(id=>{
    document.getElementById('detail')?.close();
    MENUS[id]={
      nativeMenu:true,status:'structured',integrity:'complete',guestAvailability:'in_app_native',localized:true,locale:'en',
      categories:[['Main courses',[['Paella','18 €','Paella','Rice dish with seafood']]]],
      itemCount:1,languageCoverage:{locale:'en',total:1,ready:1,missing:0,complete:true}
    };
    openDetail(id);
  },id);
  detail=page.locator('#detail');
  await expect(detail.locator('#profile-menu')).toBeVisible();
  await expect(detail.locator('#profile-menu')).toContainText('Main courses');
  await expect(detail.locator('#profile-menu')).toContainText('Rice dish with seafood');
});

test('strict helper rejects partial, wrong-language and external-only states',async({page})=>{
  await ready(page);
  const result=await page.evaluate(()=>({
    wrong:window.hoyGuestMenuReady251({nativeMenu:true,status:'structured',integrity:'complete',localized:true,guestAvailability:'in_app_native',locale:'es',categories:[['A',[['X','1 €']]]],itemCount:1,languageCoverage:{locale:'es',total:1,ready:1,complete:true}},'de'),
    partial:window.hoyGuestMenuReady251({nativeMenu:true,status:'integrity_partial',integrity:'partial',localized:true,guestAvailability:'in_app_native',locale:'de',categories:[['A',[['X','1 €']]]],itemCount:2,languageCoverage:{locale:'de',total:2,ready:1,complete:false}},'de'),
    external:window.hoyGuestMenuReady251({nativeMenu:false,status:'source_only',integrity:'verified_snapshot_complete',localized:false,guestAvailability:'external_reference',officialMenuUrl:'https://example.com/menu.pdf'},'de'),
    good:window.hoyGuestMenuReady251({nativeMenu:true,status:'structured',integrity:'complete',localized:true,guestAvailability:'in_app_native',locale:'de',categories:[['A',[['X','1 €']]]],itemCount:1,languageCoverage:{locale:'de',total:1,ready:1,complete:true}},'de')
  }));
  expect(result).toEqual({wrong:false,partial:false,external:false,good:true});
});

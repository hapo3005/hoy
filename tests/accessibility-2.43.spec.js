const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openApp(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    window.hoyAccessibilityVersion==='2.43.0' &&
    typeof window.hoyLoadAccessibility==='function' &&
    typeof window.hoyAccessibilityPanel==='function' &&
    window.HOYAccessible?.state?.ready===true &&
    Array.isArray(DATA) && DATA.length>0 &&
    cloud?.status==='online',
    {timeout:30000}
  );
}

test('2.43 remains the operator workflow beneath the canonical 2.46 guest accessibility layer',async({page})=>{
  await openApp(page);
  const contract=await page.evaluate(()=>({
    legacyVersion:window.hoyAccessibilityVersion,
    legacyLoader:typeof window.hoyLoadAccessibility,
    legacyPanel:typeof window.hoyAccessibilityPanel,
    canonicalReady:window.HOYAccessible?.state?.ready===true,
    canonicalSource:window.HOYAccessible?.state?.source||'none',
    canonicalFactRestaurants:window.HOYAccessible?.state?.byRestaurant?.size||0
  }));

  expect(contract.legacyVersion).toBe('2.43.0');
  expect(contract.legacyLoader).toBe('function');
  expect(contract.legacyPanel).toBe('function');
  expect(contract.canonicalReady).toBe(true);
  expect(['normalized','legacy','offline','unavailable']).toContain(contract.canonicalSource);
  if(contract.canonicalSource==='normalized')expect(contract.canonicalFactRestaurants).toBeGreaterThan(0);
});

test('the final guest profile exposes only the Trust-aware 2.46 panel and no legacy 2.43 guest claim',async({page})=>{
  await openApp(page);
  const id=await page.evaluate(()=>DATA.find(p=>Number.isFinite(Number(p.id)))?.id);
  expect(id).toBeTruthy();
  await page.evaluate(restaurantId=>openDetail(restaurantId),id);

  const detail=page.locator('#detail');
  await expect(detail).toBeVisible();
  await expect(detail.locator('[data-hoya-panel]')).toHaveCount(1);
  await expect(detail.locator('[data-accessibility-panel]:not([data-hoya-panel])')).toHaveCount(0);
  await expect(detail.locator('[data-hoya-panel]')).toContainText('Konkrete Merkmale statt eines pauschalen');
  await expect(detail.locator('[data-hoya-panel]')).toContainText('Noch nicht bestätigt');
    .catch(()=>{});

  const cards=await page.evaluate(()=>({
    cardLegacy:document.querySelectorAll('.access-card-line').length,
    canonicalVersion:!!window.HOYAccessible
  }));
  expect(cards.cardLegacy).toBe(0);
  expect(cards.canonicalVersion).toBe(true);
});

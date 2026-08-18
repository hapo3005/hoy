const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openApp(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    window.hoyAccessibilityVersion==='2.43.0' &&
    Array.isArray(DATA) && DATA.length>0 &&
    cloud?.status==='online' &&
    DATA.every(p=>p.accessibility&&p.accessibility.restaurant_id),
    {timeout:30000}
  );
}

async function openByStatus(page,status){
  const id=await page.evaluate(status=>DATA.find(p=>p.accessibility?.overall_status===status)?.id||null,status);
  expect(id).not.toBeNull();
  await page.evaluate(id=>openDetail(id),id);
  await expect(page.locator('#detail [data-accessibility-panel]')).toBeVisible();
  return page.locator('#detail [data-accessibility-panel]');
}

test('every loaded HOY-Gastro venue receives a granular accessibility record',async({page})=>{
  await openApp(page);
  const audit=await page.evaluate(()=>({
    total:DATA.length,
    withAccessibility:DATA.filter(p=>p.accessibility?.restaurant_id).length,
    statuses:[...new Set(DATA.map(p=>p.accessibility?.overall_status))].sort(),
  }));
  expect(audit.withAccessibility).toBe(audit.total);
  expect(audit.statuses).toEqual(['A','B','C','D']);
});

test('profile communicates confirmed, partial, barrier and unknown states without overclaiming',async({page})=>{
  await openApp(page);

  let panel=await openByStatus(page,'A');
  await expect(panel).toHaveClass(/good/);
  await expect(panel.locator('.access-feature.yes')).toHaveCount(3);
  await expect(panel).toContainText('Eingang, Sitzplätze und WC');
  await page.locator('#detail .x').click().catch(()=>page.evaluate(()=>document.getElementById('detail')?.close()));

  panel=await openByStatus(page,'B');
  await expect(panel).toHaveClass(/partial/);
  await expect(panel).toContainText('teilweise bestätigt');
  await page.locator('#detail .x').click().catch(()=>page.evaluate(()=>document.getElementById('detail')?.close()));

  panel=await openByStatus(page,'C');
  await expect(panel).toHaveClass(/barrier/);
  await expect(panel.locator('.access-feature.no').first()).toBeVisible();
  await expect(panel).toContainText('Barriere dokumentiert');
  await page.locator('#detail .x').click().catch(()=>page.evaluate(()=>document.getElementById('detail')?.close()));

  panel=await openByStatus(page,'D');
  await expect(panel).toHaveClass(/unknown/);
  await expect(panel).toContainText('noch nicht bestätigt');
  await expect(panel).toContainText('kein Negativurteil');
});

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function openApp(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>
    window.hoyAccessibilityVersion==='2.43.1' &&
    Array.isArray(DATA) && DATA.length>0 &&
    cloud?.status==='online' &&
    DATA.every(p=>p.accessibility&&p.accessibility.restaurant_id),
    {timeout:30000}
  );
}

async function renderSyntheticState(page,status,{sourceUrl='https://example.com/evidence',verificationSource='public_research'}={}){
  await page.evaluate(({status,sourceUrl,verificationSource})=>{
    document.getElementById('accessibility-test-host')?.remove();
    const byStatus={
      A:{wheelchair_entrance_state:'yes',wheelchair_seating_state:'yes',wheelchair_toilet_state:'yes',accessible_parking_state:'unknown',hearing_loop_state:'unknown'},
      B:{wheelchair_entrance_state:'yes',wheelchair_seating_state:'unknown',wheelchair_toilet_state:'unknown',accessible_parking_state:'unknown',hearing_loop_state:'unknown'},
      C:{wheelchair_entrance_state:'yes',wheelchair_seating_state:'no',wheelchair_toilet_state:'unknown',accessible_parking_state:'unknown',hearing_loop_state:'unknown'},
      D:{wheelchair_entrance_state:'unknown',wheelchair_seating_state:'unknown',wheelchair_toilet_state:'unknown',accessible_parking_state:'unknown',hearing_loop_state:'unknown'},
    };
    const host=document.createElement('div');
    host.id='accessibility-test-host';
    host.innerHTML=hoyAccessibilityPanel({accessibility:{
      restaurant_id:999999,
      overall_status:status,
      verification_source:verificationSource,
      source_url:sourceUrl,
      source_label:'HOY Test',
      checked_at:'2026-08-18T00:00:00+02:00',
      ...byStatus[status],
    }});
    document.body.appendChild(host);
  },{status,sourceUrl,verificationSource});
  return page.locator('#accessibility-test-host [data-accessibility-panel]');
}

test('every loaded HOY-Gastro venue receives a granular accessibility record',async({page})=>{
  await openApp(page);
  const audit=await page.evaluate(()=>({
    total:DATA.length,
    withAccessibility:DATA.filter(p=>p.accessibility?.restaurant_id).length,
    invalidStatuses:DATA.filter(p=>!['A','B','C','D'].includes(p.accessibility?.overall_status)).map(p=>p.id),
  }));
  expect(audit.withAccessibility).toBe(audit.total);
  expect(audit.invalidStatuses).toEqual([]);

  const firstId=await page.evaluate(()=>DATA[0].id);
  await page.evaluate(id=>openDetail(id),firstId);
  await expect(page.locator('#detail [data-accessibility-panel]')).toBeVisible();
});

test('unverified public accessibility claims fail closed without a concrete evidence URL',async({page})=>{
  await openApp(page);
  const audit=await page.evaluate(()=>({
    unsafe:DATA.filter(p=>p.accessibility?.verification_source==='public_research' && !String(p.accessibility?.source_url||'').trim() && p.accessibility?.overall_status!=='D').map(p=>p.id),
    unprovenStates:DATA.filter(p=>p.accessibility?.verification_source==='public_research' && !String(p.accessibility?.source_url||'').trim()).flatMap(p=>[
      p.accessibility.wheelchair_entrance_state,
      p.accessibility.wheelchair_seating_state,
      p.accessibility.wheelchair_toilet_state,
      p.accessibility.accessible_parking_state,
      p.accessibility.hearing_loop_state,
    ]).filter(v=>v!=='unknown'),
  }));
  expect(audit.unsafe).toEqual([]);
  expect(audit.unprovenStates).toEqual([]);

  const panel=await renderSyntheticState(page,'A',{sourceUrl:''});
  await expect(panel).toHaveClass(/unknown/);
  await expect(panel).toContainText('noch nicht bestätigt');
  await expect(panel).toContainText('konkrete Quelle noch nicht DD-verifiziert');
});

test('operator-confirmed accessibility remains publishable without an external source URL',async({page})=>{
  await openApp(page);
  const panel=await renderSyntheticState(page,'A',{sourceUrl:'',verificationSource:'operator'});
  await expect(panel).toHaveClass(/good/);
  await expect(panel).toContainText('Vom verifizierten Betrieb bestätigt');
});

test('profile communicates confirmed, partial, barrier and unknown states without overclaiming',async({page})=>{
  await openApp(page);

  let panel=await renderSyntheticState(page,'A');
  await expect(panel).toHaveClass(/good/);
  expect(await panel.locator('.access-feature.yes').count()).toBeGreaterThanOrEqual(3);
  await expect(panel).toContainText('Eingang, Sitzplätze und WC');

  panel=await renderSyntheticState(page,'B');
  await expect(panel).toHaveClass(/partial/);
  await expect(panel).toContainText('teilweise bestätigt');

  panel=await renderSyntheticState(page,'C');
  await expect(panel).toHaveClass(/barrier/);
  await expect(panel.locator('.access-feature.no').first()).toBeVisible();
  await expect(panel).toContainText('Barriere dokumentiert');

  panel=await renderSyntheticState(page,'D');
  await expect(panel).toHaveClass(/unknown/);
  await expect(panel).toContainText('noch nicht bestätigt');
  await expect(panel).toContainText('kein Negativurteil');
});

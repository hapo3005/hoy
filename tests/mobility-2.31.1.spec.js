const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function waitForData(page){
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=2);
}

async function openFirstProfile(page){
  await page.evaluate(()=>openDetail(Number(DATA[0].id)));
  await expect(page.locator('#detail')).toHaveAttribute('open','');
}

async function mockRuntimeConfig(page,overrides={}){
  const config={
    routing_enabled:true,
    consumer_visible:false,
    preview_visible:true,
    status_note:'CI Mobility runtime fixture',
    ...overrides
  };
  await page.route('**/rest/v1/mobility_runtime_config*',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)});
  });
}

async function mockMobilityResult(page,result){
  await page.route('**/functions/v1/mobility-resolve',async route=>{
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
}

test('HOY 2.31.1 wires Mobility after cloud init and into the PWA cache',async({request})=>{
  const [js,css,index,worker,pkg]=await Promise.all([
    request.get('./mobility-2.29.js'),
    request.get('./mobility-2.29.css'),
    request.get('./index.html'),
    request.get('./service-worker.js'),
    request.get('./package.json')
  ]);
  for(const response of [js,css,index,worker,pkg])expect(response.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe('2.31.1');
  const indexText=await index.text();
  const workerText=await worker.text();
  expect(indexText).toContain('App 2.31.1');
  expect(indexText).toContain('menu-inapp-2.31.js?v=2.31.0');
  expect(indexText).toContain('mobility-2.29.css?v=2.29.1');
  expect(indexText).toContain('mobility-2.29.js?v=2.29.1');
  expect(indexText.indexOf('<script src="app-3-6.js"></script>')).toBeLessThan(indexText.indexOf('<script src="mobility-2.29.js?v=2.29.1"></script>'));
  expect(workerText).toContain("const CACHE='hoy-v2.31.1'");
  expect(workerText).toContain('./menu-inapp-2.31.js');
  expect(workerText).toContain('./mobility-2.29.css');
  expect(workerText).toContain('./mobility-2.29.js');
});

test('Mobility stays hidden for normal guests while consumer_visible is false',async({page})=>{
  await mockRuntimeConfig(page,{consumer_visible:false});
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await waitForData(page);
  await openFirstProfile(page);
  await page.waitForTimeout(250);
  await expect(page.locator('#detail [data-mobility229-card]')).toHaveCount(0);
});

test('preview mode exposes Mobility without enabling normal consumer visibility',async({page})=>{
  await mockRuntimeConfig(page,{consumer_visible:false,preview_visible:true});
  await page.goto('./?mobility=preview',{waitUntil:'domcontentloaded'});
  await waitForData(page);
  await openFirstProfile(page);
  const card=page.locator('#detail [data-mobility229-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Das richtige Taxi');
  await expect(card).toContainText('PREVIEW');
});

test('runtime routing kill switch hides Mobility even in preview mode',async({page})=>{
  await mockRuntimeConfig(page,{routing_enabled:false,consumer_visible:true,preview_visible:true});
  await page.goto('./?mobility=preview',{waitUntil:'domcontentloaded'});
  await waitForData(page);
  await openFirstProfile(page);
  await page.waitForTimeout(250);
  await expect(page.locator('#detail [data-mobility229-card]')).toHaveCount(0);
});

test('fail-closed resolver response never exposes a phone action',async({page,context})=>{
  await mockRuntimeConfig(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:37.6750,longitude:-0.7300});
  await mockMobilityResult(page,{status:'uncertain',code:'near_municipal_boundary',municipality:'Cartagena',distance_to_boundary_m:24,safety_radius_m:80});

  await page.goto('./?mobility=preview',{waitUntil:'domcontentloaded'});
  await waitForData(page);
  await openFirstProfile(page);
  await page.locator('[data-mobility229-open]').click();
  await page.locator('[data-mobility229-direction="to"]').click();

  const flow=page.locator('#mobilityFlow');
  await expect(flow).toHaveAttribute('open','');
  await expect(flow).toContainText('Du bist im Grenzbereich');
  await expect(flow.locator('[data-mobility229-call]')).toHaveCount(0);
});

test('resolved result exposes only the verified provider and does not persist raw GPS',async({page,context})=>{
  await mockRuntimeConfig(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:37.705673,longitude:-0.742513});
  await mockMobilityResult(page,{
    status:'resolved',
    confidence:'verified_local_boundary',
    municipality:'San Javier',
    distance_to_boundary_m:4228,
    safety_radius_m:80,
    area:{slug:'san-javier',name:'San Javier · La Manga Nord',verified_at:'2026-08-12T00:00:00Z',source_label:'Ayuntamiento de San Javier'},
    provider:{slug:'radio-taxi-san-javier',name:'Radio Taxi San Javier',phone_e164:'+34968573300',phone_display:'968 573 300',alternate_phone_e164:null,alternate_phone_display:null,verified_at:'2026-08-12T00:00:00Z',source_label:'Turismo Región de Murcia'},
    source:{boundary:'IGN cached geometry',boundary_dataset_date:'2026-02-12',boundary_dataset_uncertainty_m:40}
  });

  await page.goto('./?mobility=preview',{waitUntil:'domcontentloaded'});
  await waitForData(page);
  await openFirstProfile(page);
  await page.locator('[data-mobility229-open]').click();
  await page.locator('[data-mobility229-direction="to"]').click();

  const flow=page.locator('#mobilityFlow');
  await expect(flow).toContainText('ZUSTÄNDIGKEIT GEPRÜFT');
  await expect(flow).toContainText('Radio Taxi San Javier');
  await expect(flow.locator('[data-mobility229-call]')).toBeVisible();
  await expect(flow.locator('[data-mobility229-call]')).toContainText('968 573 300');

  const stored=await page.evaluate(()=>localStorage.getItem('hoy-analytics-v1')||'');
  expect(stored).not.toMatch(/latitude|longitude/i);
  expect(stored).not.toContain('37.705673');
  expect(stored).not.toContain('-0.742513');
});

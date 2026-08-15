const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online',{timeout:30000});
}

const PREMIUM24=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,152,234,239];

test('Maloca profile exposes direct HOY map and external route actions',async({page})=>{
  await ready(page);
  const target=await page.evaluate(()=>DATA.find(p=>/maloca/i.test(String(p.name||'')))||null);
  expect(target).toBeTruthy();
  expect(Number.isFinite(Number(target.latitude))).toBeTruthy();
  expect(Number.isFinite(Number(target.longitude))).toBeTruthy();

  await page.evaluate(id=>openDetail(Number(id)),target.id);
  const dialog=page.locator('#detail[open]');
  await expect(dialog).toBeVisible();

  const mapButton=dialog.locator('[data-profile-map]');
  const route=dialog.locator('.detail-primary-bar a.external-route');
  await expect(mapButton).toBeVisible();
  await expect(mapButton).toContainText('Auf Karte');
  await expect(route).toBeVisible();
  await expect(route).toContainText('Route');
  await expect(route).toHaveAttribute('target','_blank');
  const href=await route.getAttribute('href');
  expect(String(href||'').trim().length).toBeGreaterThan(8);

  const viewport=page.viewportSize();
  if(viewport&&viewport.width>=700){
    const position=await dialog.locator('.detail-primary-bar').evaluate(el=>getComputedStyle(el).position);
    expect(position).not.toBe('fixed');
  }

  await mapButton.click();
  await expect(page.locator('#detail[open]')).toHaveCount(0);
  await expect(page.locator('.map-journey-signature')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('map');
  await expect.poll(()=>page.evaluate(()=>state.query)).toBe(String(target.name||'').trim());

  const card=page.locator(`.map-decision-card[data-map-card="${Number(target.id)}"]`);
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/active/,{timeout:5000});
  await expect(page.locator('.map-journey-signature .head h1')).toContainText('Dieser Ort. Genau hier.');
});

test('Premium 24 all expose direct map and external route actions',async({page})=>{
  await ready(page);

  const inventory=await page.evaluate(ids=>ids.map(id=>{
    const p=DATA.find(row=>Number(row.id)===Number(id));
    return {
      id,
      name:p?.name||'',
      exists:!!p,
      hasCoords:!!p&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))
    };
  }),PREMIUM24);

  expect(inventory.filter(row=>!row.exists)).toEqual([]);
  expect(inventory.filter(row=>!row.hasCoords)).toEqual([]);

  for(const row of inventory){
    await page.evaluate(id=>openDetail(Number(id)),row.id);
    const dialog=page.locator('#detail[open]');
    await expect(dialog,`${row.name} profile should open`).toBeVisible();

    const mapButton=dialog.locator('[data-profile-map]');
    const route=dialog.locator('.detail-primary-bar a.external-route');
    await expect(mapButton,`${row.name} needs direct HOY map action`).toBeVisible();
    await expect(mapButton).toContainText('Auf Karte');
    await expect(route,`${row.name} needs direct external route action`).toBeVisible();
    await expect(route).toContainText('Route');
    await expect(route).toHaveAttribute('target','_blank');
    const href=await route.getAttribute('href');
    expect(String(href||'').trim().length,`${row.name} route href`).toBeGreaterThan(8);

    await page.evaluate(()=>document.getElementById('detail')?.close());
    await expect(page.locator('#detail[open]')).toHaveCount(0);
  }
});

test('non-showcase published profiles also keep the direct Route action',async({page})=>{
  await ready(page);
  const target=await page.evaluate(()=>{
    const showcase=new Set([1,2,3,5,7,8,9,11,13,14,15,16,17,20,21,22]);
    return DATA.find(p=>!showcase.has(Number(p.id))&&(String(p.address||'').trim()||(
      Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))
    )))||null;
  });
  expect(target).toBeTruthy();
  await page.evaluate(id=>openDetail(Number(id)),target.id);
  const route=page.locator('#detail[open] .detail-primary-bar a.external-route');
  await expect(route).toBeVisible();
  await expect(route).toContainText('Route');
});

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online',{timeout:30000});
}

test('ordinary restaurant profiles expose a direct route action without returning to the map',async({page})=>{
  await ready(page);
  const target=await page.evaluate(()=>{
    const showcase=new Set([1,2,3,5,7,8,9,11,13,14,15,16,17,20,21,22]);
    return DATA.find(p=>/maloca/i.test(String(p.name||'')))
      ||DATA.find(p=>!showcase.has(Number(p.id))&&(String(p.address||'').trim()||(
        Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))
      )));
  });
  expect(target).toBeTruthy();
  expect([1,2,3,5,7,8,9,11,13,14,15,16,17,20,21,22]).not.toContain(Number(target.id));

  await page.evaluate(id=>openDetail(Number(id)),target.id);
  const dialog=page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  const route=dialog.locator('.detail-primary-bar a.secondary');
  await expect(route).toBeVisible();
  await expect(route).toContainText('Route');
  await expect(route).toHaveAttribute('target','_blank');
  const href=await route.getAttribute('href');
  expect(String(href||'').trim().length).toBeGreaterThan(8);
});

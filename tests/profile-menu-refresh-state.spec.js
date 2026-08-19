const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&cloud.status==='online',{timeout:30000});
}

function menuItems(count,prefix){
  return Array.from({length:count},(_,i)=>[`${prefix} ${i+1}`,`${i+1},00 €`]);
}

test('async menu refresh does not invent an expanded state',async({page})=>{
  await ready(page);
  const id=await page.evaluate(()=>Number(DATA[0]?.id||0));
  expect(id).toBeGreaterThan(0);

  await page.evaluate(({id,items})=>{
    const current=MENUS[id]||{};
    MENUS[id]={...current,status:'structured',localized:false,categories:[['Test',items]]};
    openDetail(id);
  },{id,items:menuItems(5,'Kurz')});

  const dialog=page.locator('#detail[open]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-menu-expand]')).toHaveCount(0);
  await expect(dialog.locator('[data-inline-menu-wrap]')).not.toHaveClass(/is-collapsed/);

  await page.evaluate(({id,items})=>{
    MENUS[id]={...(MENUS[id]||{}),status:'structured',localized:false,categories:[['Test',items]]};
    window.hoyRefreshOpenProfileMenu();
  },{id,items:menuItems(16,'Lang')});

  const expand=dialog.locator('[data-menu-expand]');
  const wrap=dialog.locator('[data-inline-menu-wrap]');
  await expect(expand).toBeVisible();
  await expect(expand).toHaveAttribute('aria-expanded','false');
  await expect(wrap).toHaveClass(/is-collapsed/);

  await expand.click();
  await expect(expand).toHaveAttribute('aria-expanded','true');
  await expect(wrap).not.toHaveClass(/is-collapsed/);

  await page.evaluate(({id,items})=>{
    MENUS[id]={...(MENUS[id]||{}),status:'structured',localized:false,categories:[['Test',items]]};
    window.hoyRefreshOpenProfileMenu();
  },{id,items:menuItems(18,'Aktualisiert')});

  const refreshedExpand=dialog.locator('[data-menu-expand]');
  const refreshedWrap=dialog.locator('[data-inline-menu-wrap]');
  await expect(refreshedExpand).toHaveAttribute('aria-expanded','true');
  await expect(refreshedWrap).not.toHaveClass(/is-collapsed/);
});

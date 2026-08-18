const {test,expect}=require('@playwright/test');

function watchPageErrors(page){
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  return errors;
}

async function expectDomIntegrity(page,label){
  const snapshot=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(el=>el.id).filter(Boolean);
    const duplicateIds=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
    const overflow=Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)-window.innerWidth;
    const unnamed=[...document.querySelectorAll('button,a[href]')]
      .filter(el=>{
        const style=getComputedStyle(el);
        const visible=style.display!=='none'&&style.visibility!=='hidden'&&el.getClientRects().length>0;
        if(!visible)return false;
        const name=(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').replace(/\s+/g,' ').trim();
        return !name;
      })
      .map(el=>`${el.tagName.toLowerCase()}${el.id?`#${el.id}`:''}${el.className?`.${String(el.className).trim().replace(/\s+/g,'.')}`:''}`)
      .slice(0,20);
    return {duplicateIds,overflow,unnamed};
  });
  expect(snapshot.duplicateIds,`${label}: duplicate DOM ids`).toEqual([]);
  expect(snapshot.overflow,`${label}: horizontal overflow in pixels`).toBeLessThanOrEqual(1);
  expect(snapshot.unnamed,`${label}: visible interactive controls without an accessible text/label`).toEqual([]);
}

test('320px guest shell stays horizontally safe and structurally accessible',async({page})=>{
  const errors=watchPageErrors(page);
  await page.setViewportSize({width:320,height:700});
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#bottom')).toBeVisible();
  await expectDomIntegrity(page,'home');

  await page.locator('[data-btm="discover"]').click();
  await expect(page.locator('#q')).toBeVisible();
  await expect(page.locator('.list-card[data-open]').first()).toBeVisible({timeout:20_000});
  await expectDomIntegrity(page,'discover');

  await page.locator('.list-card[data-open]').first().click();
  await expect(page.locator('#detail[open]')).toBeVisible();
  await expectDomIntegrity(page,'profile');
  expect(errors).toEqual([]);
});

const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page,url='./?familyPreview=1'){
  await page.setViewportSize({width:1280,height:900});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyAuditedPreview240?.state?.mode==='live'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
}

test('desktop Family shell stays centered while live Family data overrides research-preview injection',async({page})=>{
  await ready(page);

  const shell=await page.evaluate(()=>{
    const app=document.querySelector('.desktop>.app')?.getBoundingClientRect();
    return {
      appWidth:app?.width||0,
      appCenter:app?((app.left+app.right)/2):0,
      viewportCenter:innerWidth/2,
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth
    };
  });
  expect(shell.appWidth).toBeGreaterThan(400);
  expect(shell.appWidth).toBeLessThanOrEqual(460.5);
  expect(Math.abs(shell.appCenter-shell.viewportCenter)).toBeLessThanOrEqual(1.5);
  expect(shell.documentWidth).toBeLessThanOrEqual(shell.viewportWidth+1);

  const expected=await page.evaluate(()=>{
    const previous=state.family;
    state.family='family';
    try{return filtered().length}finally{state.family=previous}
  });
  expect(expected).toBeGreaterThan(0);

  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText(String(expected));
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
  await expect(page.locator('[data-family240-preview-badge]')).toHaveCount(0);

  const cards=page.locator('.list-card[data-open]');
  await expect(cards).toHaveCount(expected);

  const layout=await cards.first().evaluate(el=>{
    const rect=el.getBoundingClientRect();
    return {
      display:getComputedStyle(el).display,
      height:rect.height,
      scrollWidth:el.scrollWidth,
      clientWidth:el.clientWidth
    };
  });
  expect(layout.height).toBeLessThan(320);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth+1);
});

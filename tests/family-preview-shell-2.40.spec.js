const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page,url='./?familyPreview=1'){
  await page.setViewportSize({width:1280,height:900});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
}

test('desktop Family preview stays centered and research draft cards keep the decision verdict in their content grid',async({page})=>{
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

  await page.locator('[data-family240-home-context]').click();
  await expect(page.locator('[data-result-count]')).toHaveText('19');

  const card=page.locator('.family240-research-card').first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('RESEARCH-DRAFT');

  const layout=await card.evaluate(el=>{
    const verdict=el.querySelector(':scope > .decision280-card-verdict');
    const art=el.querySelector(':scope > .family240-research-art');
    const lock=el.querySelector(':scope > .family240-research-lock');
    const rect=el.getBoundingClientRect();
    return {
      display:getComputedStyle(el).display,
      verdictArea:verdict?getComputedStyle(verdict).gridArea:'',
      artArea:art?getComputedStyle(art).gridArea:'',
      lockDisplay:lock?getComputedStyle(lock).display:'missing',
      height:rect.height,
      scrollWidth:el.scrollWidth,
      clientWidth:el.clientWidth
    };
  });
  expect(layout.display).toBe('grid');
  expect(layout.verdictArea).toBe('verdict');
  expect(layout.artArea).toBe('art');
  expect(layout.lockDisplay).toBe('none');
  expect(layout.height).toBeLessThan(260);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth+1);
});

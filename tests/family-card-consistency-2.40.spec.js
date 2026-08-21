const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function isolateResearchFamily(page){
  await page.route('**/rest/v1/restaurant_family_features**',route=>route.fulfill({
    status:200,
    contentType:'application/json',
    headers:{'access-control-allow-origin':'*'},
    body:'[]'
  }));
}

async function openFamily(page){
  await isolateResearchFamily(page);
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyAuditedPreview240?.state?.mode==='research'&&window.hoyFamilyAuditedPreview240?.state?.readyCount===19&&window.__hoyFamilyCardConsistency240===true&&window.hoyFamilyResearchStandard241?.state?.applied===true,{timeout:30000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-result-count]')).toHaveText('19');
}

test('all Family result cards expose Family decision signals, including existing HOY profiles',async({page})=>{
  await openFamily(page);

  const cards=page.locator('[data-journey-results] .list-card[data-open]');
  await expect(cards).toHaveCount(19);
  const withoutBadges=await cards.evaluateAll(nodes=>nodes.filter(card=>!card.querySelector('.family240-card-badges')).map(card=>card.dataset.open));
  expect(withoutBadges).toEqual([]);

  const existing=cards.filter({hasNot:page.locator('.family240-research-art')}).first();
  await expect(existing.locator('.family240-card-badges')).toBeVisible();
  await expect(existing.locator('.family240-card-badges span').first()).not.toHaveText('');
});

test('research drafts use normal decision copy plus the established direct verdict grid slot',async({page})=>{
  await openFamily(page);

  const draft=page.locator('.family240-research-card').first();
  await expect(draft).toBeVisible();
  await expect(draft.locator(':scope > .decision-copy')).toHaveCount(1);
  await expect(draft.locator('.family240-card-badges')).toBeVisible();
  await expect(draft.locator(':scope > .decision280-card-verdict')).toBeVisible();
  const legacyLock=draft.locator(':scope > .family240-research-lock');
  await expect(legacyLock).toHaveCount(1);
  await expect(legacyLock).toBeHidden();

  const sizes=await draft.evaluate(card=>{
    const art=card.querySelector(':scope > .family240-research-art');
    const verdict=card.querySelector(':scope > .decision280-card-verdict');
    const lock=card.querySelector(':scope > .family240-research-lock');
    const c=card.getBoundingClientRect(),a=art.getBoundingClientRect();
    return {
      cardHeight:c.height,
      artHeight:a.height,
      artArea:getComputedStyle(art).gridArea,
      verdictArea:getComputedStyle(verdict).gridArea,
      lockDisplay:getComputedStyle(lock).display,
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    };
  });
  expect(sizes.artArea).toBe('art');
  expect(sizes.verdictArea).toBe('verdict');
  expect(sizes.lockDisplay).toBe('none');
  expect(sizes.artHeight).toBeLessThanOrEqual(110);
  expect(sizes.cardHeight).toBeLessThan(260);
  expect(sizes.overflow).toBe(false);
});

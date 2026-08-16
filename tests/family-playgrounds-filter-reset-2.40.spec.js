const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page,url='./'){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240,{timeout:30000});
}

async function seedOneVerifiedFamily(page){
  await page.evaluate(()=>{
    const p=DATA[0];
    p.family_features={restaurant_id:Number(p.id),play_types:['outdoor_playground'],relationship:'directly_adjacent',access_type:'free',playground_distance_m:18,distance_method:'hoy_measured',visible_from_seating:true,road_crossing:'none',fenced:true,traffic_separated:true,shade_available:true,supervision_types:['parent'],indoor_play_area:false,highchairs:true,changing_facility:true,kids_menu:true,stroller_friendly:true,suitable_age_min:2,suitable_age_max:10,notes:null,verification_status:'hoy_verified',source_count:1,source_url:null,source_label:'HOY Vor-Ort-Prüfung',verified_at:'2026-08-16T06:00:00.000Z'};
  });
}

test('family entry points stay hidden until verified play data is actually available',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{
    for(const p of DATA||[])p.family_features=null;
    state.family='playground';state.view='home';render();
  });
  await expect(page.locator('[data-family240-home]')).toHaveCount(0);
  await expect(page.locator('[data-family240-home-context]')).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasVerifiedPlayData())).toBe(false);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasPreviewPlayData())).toBe(false);

  await page.evaluate(()=>{state.view='discover';render()});
  await expect(page.locator('.family240-filter')).toHaveCount(0);
  await expect(page.locator('[data-family240-context-main]')).toHaveCount(0);
  await expect(page.locator('[data-family240-context-bar]')).toHaveCount(0);
  await expect(page.locator('.list')).toBeVisible();
});

test('family preview is integrated into the normal HOY decision flow',async({page})=>{
  await ready(page,'./?familyPreview=1');
  await page.evaluate(()=>{
    for(const p of DATA||[])p.family_features=null;
    state.family='all';state.view='home';render();
  });

  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.isPreviewEnabled())).toBe(true);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasVerifiedPlayData())).toBe(false);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsHardening240.hasPreviewPlayData())).toBe(true);
  await expect(page.locator('[data-family240-home]')).toHaveCount(0);
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await expect(page.locator('[data-family240-home-context] [data-family240-preview-badge]')).toBeVisible();
  await expect(page.locator('[data-family240-preview-notice]')).toHaveCount(0);

  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect(page.locator('[data-family240-context-main]')).toHaveClass(/active/);
  await expect(page.locator('[data-family240-context-bar]')).toBeVisible();
  await expect(page.locator('[data-family240-context-bar] [data-family240-preview-badge]')).toBeVisible();
  await expect(page.locator('.family240-filter')).toHaveCount(0);

  const firstCard=page.locator('.journey-results .list-card').first();
  await expect(firstCard).toBeVisible();
  expect(await firstCard.locator('.family240-card-badges span').count()).toBeLessThanOrEqual(2);

  await page.locator('[data-family240-subfilter="visible"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('visible');
  await expect(page.locator('[data-family240-subfilter="visible"]')).toHaveClass(/active/);

  const previewId=await page.evaluate(()=>Number((DATA||[]).find(p=>p.family_features?.__family240_preview&&p.family_features.visible_from_seating===true)?.id));
  await page.evaluate(id=>openDetail(id),previewId);
  const profile=page.locator('[data-family240-preview-profile]');
  await expect(profile).toBeVisible();
  await expect(profile.locator('[data-family240-preview-badge]')).toBeVisible();
  await expect(profile.locator('.family240-profile-highlights')).toContainText(/Spielplatz|Playground|Parque infantil/i);
  await expect(profile.locator('[data-family240-details]')).not.toHaveAttribute('open','');
  await profile.locator('[data-family240-details] summary').click();
  await expect(profile.locator('[data-family240-details]')).toHaveAttribute('open','');
  await expect(profile).toContainText(/Auditierte Research-Daten|Audited research data|Datos de investigación auditados|Beispieldaten|sample data|datos de ejemplo/i);
});

test('regular HOY situations leave the Family context',async({page})=>{
  await ready(page);
  await seedOneVerifiedFamily(page);
  await page.evaluate(()=>{state.family='family';state.view='discover';render()});
  await expect(page.locator('[data-family240-context-main]')).toHaveClass(/active/);
  await page.locator('[data-decision="all"]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect(page.locator('[data-family240-context-bar]')).toHaveCount(0);
});

test('normal home intent discovery clears a previous family-only filter',async({page})=>{
  await ready(page);
  await seedOneVerifiedFamily(page);
  await page.evaluate(()=>{state.family='visible';state.view='home';render()});
  await page.locator('[data-home-intent]').first().click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
});

test('normal home search clears a previous family-only filter',async({page})=>{
  await ready(page);
  await seedOneVerifiedFamily(page);
  await page.evaluate(()=>{state.family='playground';state.view='home';render()});
  await page.locator('[data-home-search]').fill('La Manga');
  await page.locator('[data-home-search-go]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('all');
  await expect.poll(()=>page.evaluate(()=>state.view)).toBe('discover');
});

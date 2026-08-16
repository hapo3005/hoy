const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyPlaygroundsHardening240,{timeout:30000});
}

async function seedVisualFamily(page){
  await page.evaluate(()=>{
    const now='2026-08-16T06:00:00.000Z';
    DATA[0].family_features={
      restaurant_id:Number(DATA[0].id),play_types:['outdoor_playground'],relationship:'directly_adjacent',access_type:'free',
      playground_distance_m:18,distance_method:'hoy_measured',visible_from_seating:true,road_crossing:'none',fenced:true,traffic_separated:true,shade_available:true,
      supervision_types:['parent'],indoor_play_area:false,highchairs:true,changing_facility:true,kids_menu:true,stroller_friendly:true,suitable_age_min:2,suitable_age_max:10,
      notes:'Spielplatz direkt an der Terrasse.',verification_status:'hoy_verified',source_count:1,source_url:'https://example.com/family-proof',source_label:'HOY Vor-Ort-Prüfung',verified_at:now
    };
    DATA[1].family_features={
      restaurant_id:Number(DATA[1].id),play_types:['amusement_park','inflatable'],relationship:'directly_adjacent',access_type:'paid',
      playground_distance_m:8,distance_method:'source',visible_from_seating:false,road_crossing:'pedestrian_area',fenced:true,traffic_separated:true,shade_available:false,
      supervision_types:['parent'],indoor_play_area:false,highchairs:true,changing_facility:false,kids_menu:true,stroller_friendly:true,suitable_age_min:null,suitable_age_max:null,
      notes:'Kommerzielles Spielangebot direkt daneben.',verification_status:'community_verified',source_count:2,source_url:'https://example.com/community-proof',source_label:'Zwei aktuelle Community-Quellen',verified_at:now
    };
    state.family='all';state.service='all';state.query='';state.view='home';render();
  });
}

test('capture native HOY Family home, discover and profile for visual QA',async({page},testInfo)=>{
  await ready(page);
  await seedVisualFamily(page);

  await expect(page.locator('[data-family240-home]')).toHaveCount(0);
  const home=page.locator('.journey-intent-grid');
  await expect(page.locator('[data-family240-home-context]')).toBeVisible();
  await testInfo.attach('family-home-native.png',{body:await home.screenshot(),contentType:'image/png'});

  await page.locator('[data-family240-home-context]').click();
  await expect(page.locator('[data-family240-context-bar]')).toBeVisible();
  await expect(page.locator('.family240-filter')).toHaveCount(0);
  await testInfo.attach('family-discover-native.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});

  const id=await page.evaluate(()=>Number(DATA[0].id));
  await page.evaluate(id=>openDetail(id),id);
  const profile=page.locator('[data-family240-final-profile]');
  await expect(profile).toBeVisible();
  await expect(profile.locator('[data-family240-details]')).not.toHaveAttribute('open','');
  await testInfo.attach('family-profile-native.png',{body:await profile.screenshot(),contentType:'image/png'});
});

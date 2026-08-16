const {test,expect}=require('@playwright/test');
const fs=require('fs');
const path=require('path');

test.use({serviceWorkers:'block'});

async function waitForFamily(page){
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>=3&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240,{timeout:30000});
}

async function seedFamilyFixtures(page){
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
    DATA[2].family_features={
      restaurant_id:Number(DATA[2].id),play_types:['outdoor_playground'],relationship:'nearby',access_type:'unknown',
      playground_distance_m:120,distance_method:'map_estimate',visible_from_seating:null,road_crossing:'unknown',fenced:null,traffic_separated:null,shade_available:null,
      supervision_types:[],indoor_play_area:false,highchairs:true,changing_facility:null,kids_menu:true,stroller_friendly:true,suitable_age_min:null,suitable_age_max:null,
      notes:'Noch nicht für Gäste freigegeben.',verification_status:'unverified',source_count:0,source_url:null,source_label:null,verified_at:null
    };
    state.family='all';state.service='all';state.query='';state.view='home';render();
  });
}

test('family assets are wired without changing the guarded 2.39 release shell',async({page,request})=>{
  const [js,css,index]=await Promise.all([
    request.get('./family-playgrounds-2.40.js'),
    request.get('./family-playgrounds-2.40.css'),
    request.get('./index.html')
  ]);
  expect(js.ok()).toBeTruthy();expect(css.ok()).toBeTruthy();expect(index.ok()).toBeTruthy();
  const html=await index.text();
  expect(html).toContain('App 2.39.0');
  expect(html).toContain('family-playgrounds-2.40.js?v=2.40.0');
  expect(html).toContain('family-playgrounds-2.40.css?v=2.40.0');
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForFamily(page);
  expect(await page.evaluate(()=>window.hoyFamilyPlaygroundsVersion)).toBe('2.40.0');
});

test('migration encodes the orthogonal HOY family quality model',async()=>{
  const sql=fs.readFileSync(path.join(process.cwd(),'supabase/migrations/20260816_family_playgrounds_240.sql'),'utf8');
  for(const token of ['play_types text[]','relationship text','access_type text','distance_method text','road_crossing text','supervision_types text[]','community_verified'])expect(sql).toContain(token);
  expect(sql).toContain('source_count >= 2');
  expect(sql).toContain('visible_from_seating');
  expect(sql).not.toContain('playground_type text not null');
});

test('Essen & Spielen only surfaces verified play facts',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForFamily(page);await seedFamilyFixtures(page);
  const block=page.locator('[data-family240-home]');
  await expect(block).toBeVisible();
  await expect(block).toContainText('Essen & Spielen');
  const names=await page.evaluate(()=>DATA.slice(0,3).map(x=>x.name));
  await expect(block).toContainText(names[0]);
  await expect(block).toContainText(names[1]);
  await expect(block).not.toContainText(names[2]);
  await expect(block).toContainText('Vom Sitzplatz einsehbar');
  await expect(block).toContainText('HOY verifiziert');
  await expect(block).toContainText('Community bestätigt');
});

test('family filters distinguish play, direct and visible use cases without guessing unknown sightlines',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForFamily(page);await seedFamilyFixtures(page);
  const result=await page.evaluate(()=>{
    const api=window.hoyFamilyPlaygrounds240;
    return {
      play:DATA.slice(0,3).filter(p=>api.matches(p,'playground')).map(p=>p.id),
      direct:DATA.slice(0,3).filter(p=>api.matches(p,'direct')).map(p=>p.id),
      visible:DATA.slice(0,3).filter(p=>api.matches(p,'visible')).map(p=>p.id),
      hiddenUnverified:api.familyFor(DATA[2])===null,
      paidLabel:api.accessLabel(api.familyFor(DATA[1])),
      context:api.contextLabel(api.familyFor(DATA[1]))
    };
  });
  expect(result.play).toHaveLength(2);
  expect(result.direct).toHaveLength(2);
  expect(result.visible).toHaveLength(1);
  expect(result.hiddenUnverified).toBeTruthy();
  expect(result.paidLabel).toBe('Kostenpflichtig');
  expect(result.context).toContain('Freizeitpark');

  await page.locator('[data-family240-situation]').click();
  await expect(page.locator('.family240-filter')).toBeVisible();
  await expect(page.locator('[data-family240-filter="playground"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-family240-filter="visible"]').click();
  const firstName=await page.evaluate(()=>DATA[0].name);
  const secondName=await page.evaluate(()=>DATA[1].name);
  await expect(page.locator('.list')).toContainText(firstName);
  await expect(page.locator('.list')).not.toContainText(secondName);
});

test('restaurant profile explains access, route, supervision and verification provenance',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});await waitForFamily(page);await seedFamilyFixtures(page);
  const id=await page.evaluate(()=>Number(DATA[0].id));
  await page.evaluate(id=>openDetail(id),id);
  const dialog=page.locator('#detail');
  await expect(dialog.locator('.family240-status')).toContainText('Direkt daneben');
  const panel=dialog.locator('.family240-profile');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Für Familien');
  await expect(panel).toContainText('Spielplatz');
  await expect(panel).toContainText('Kostenlos');
  await expect(panel).toContainText('18 m · HOY gemessen');
  await expect(panel).toContainText('Vom Sitzplatz einsehbar');
  await expect(panel).toContainText('Keine Straßenquerung');
  await expect(panel).toContainText('Eltern');
  await expect(panel).toContainText('Kindergerichte');
  await expect(panel).toContainText('HOY verifiziert');
  await expect(panel.locator('a')).toHaveAttribute('href','https://example.com/family-proof');
});

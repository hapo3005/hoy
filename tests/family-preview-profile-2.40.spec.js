const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

const EXPECTED_LIVE_FAMILY_IDS=[96,101,132,218,243,244,245,246,247,248,249,250,251,252,253,254,257,259];

async function openFamily(page){
  await page.goto('./?familyPreview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&cloud?.status==='online'&&window.hoyFamilyPlaygrounds240?.state?.loaded===true&&window.hoyFamilyAuditedPreview240?.state?.status==='ready'&&window.hoyFamilyProfileEnrichment240?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.status==='ready'&&window.hoyFamilyResearchStandard241?.state?.applied===true&&window.hoyFamilyDataCompletion242?.state?.status==='ready',null,{timeout:40000});
  await page.locator('[data-family240-home-context]').click();
  await expect.poll(()=>page.evaluate(()=>state.family)).toBe('family');
  await expect.poll(async()=>Number(await page.locator('[data-result-count]').textContent())).toBeGreaterThanOrEqual(EXPECTED_LIVE_FAMILY_IDS.length);
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
}

async function openLive(page,name){
  const card=page.locator('[data-journey-results] .list-card[data-open]',{hasText:name}).first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.locator('#detail')).toBeVisible();
  const family=page.locator('#detail .family240-profile');
  await expect(family).toBeVisible();
  return {detail:page.locator('#detail'),family};
}

async function productionRow(page,slug){
  return page.evaluate(slug=>{
    const p=(DATA||[]).find(x=>x.slug===slug);
    if(!p)return null;
    const f=window.hoyFamilyPlaygrounds240.familyFor(p);
    return {
      id:Number(p.id),slug:p.slug,name:p.name,area:p.area,address:p.address,phone:p.phone,website:p.website,hours:p.hours,
      family:f?{play_types:f.play_types,relationship:f.relationship,access_type:f.access_type,visible_from_seating:f.visible_from_seating,road_crossing:f.road_crossing,indoor_play_area:f.indoor_play_area,highchairs:f.highchairs,kids_menu:f.kids_menu,verification_status:f.verification_status,source_count:f.source_count}:null
    };
  },slug);
}

test('La Rusticana is a live profile with the previously audited Family facts',async({page})=>{
  await openFamily(page);
  const row=await productionRow(page,'la-rusticana');
  expect(row).toMatchObject({id:246,area:'La Manga Club / Atamaría'});
  expect(row.address).toContain('Carretera de Atamaría 76B');
  expect(row.phone).toContain('626 919 020');
  expect(row.family).toMatchObject({play_types:['outdoor_playground','indoor_playroom'],relationship:'on_premises',road_crossing:'none',indoor_play_area:true,verification_status:'operator_confirmed'});
  expect(row.family.visible_from_seating).toBe(null);

  const {detail,family}=await openLive(page,'La Rusticana');
  await expect(detail.locator('[data-family240-enriched-profile]')).toHaveCount(0);
  await expect(family).toContainText('Spielplatz');
  await expect(family).toContainText('Indoor-Spielraum');
  await expect(family).toContainText('Keine Straßenquerung');
  await expect(family).toContainText('Vom Betrieb bestätigt');
  await expect(family).not.toContainText('Vom Sitzplatz einsehbar');
});

test('the full sourced research inventory remains auditable while Production is authoritative',async({page,request})=>{
  const baseline=await (await request.get('./data/family-profile-enrichment-2026-08-17.json')).json();
  const batch=await (await request.get('./data/family-profile-batch2-2026-08-17.json')).json();
  expect(baseline.production_import_allowed).toBe(false);
  expect(batch.production_import_allowed).toBe(false);
  expect(baseline.profiles).toHaveLength(13);
  expect(batch.profiles).toHaveLength(5);
  expect([...baseline.profiles,...batch.profiles]).toHaveLength(18);
  for(const p of [...baseline.profiles,...batch.profiles]){
    expect(p.description.length).toBeGreaterThan(80);
    expect(p.address.length).toBeGreaterThan(10);
    expect(p.sources.length).toBeGreaterThan(0);
    expect(p.profile_checked_at).toBe('2026-08-17');
  }

  await openFamily(page);
  const state=await page.evaluate(()=>({
    virtual:DATA.filter(x=>x.__family240_preview_profile===true).length,
    liveIds:DATA.filter(p=>window.hoyFamilyPlaygrounds240.hasPlay(window.hoyFamilyPlaygrounds240.familyFor(p))).map(p=>Number(p.id)),
    slugs:DATA.map(x=>x.slug),
    locked:window.hoyFamilyResearchStandard241.state.lockedCount
  }));
  expect(state.virtual).toBe(0);
  expect(state.liveIds).toEqual(expect.arrayContaining(EXPECTED_LIVE_FAMILY_IDS));
  expect(state.locked).toBe(3);
  for(const slug of ['restaurante-bamboo-la-manga','restaurante-imperial-la-manga','kinita-restaurant-beach-club','pizzeria-nicos-bar'])expect(state.slugs).not.toContain(slug);
});

test('operator-backed Family profiles retain their audited live facts',async({page})=>{
  await openFamily(page);

  let row=await productionRow(page,'marea-narejos');
  expect(row).toMatchObject({id:248,website:'https://www.mareanarejos.com/'});
  expect(row.hours).toContain('09:00–00:00');
  expect(row.family).toMatchObject({play_types:['splash','minigolf'],relationship:'on_premises',access_type:'paid',road_crossing:'none',verification_status:'operator_confirmed'});
  let opened=await openLive(page,'Marea Narejos');
  await expect(opened.family).toContainText('Splash');
  await expect(opened.family).toContainText('Minigolf');
  await expect(opened.family).toContainText('Kostenpflichtig');
  await page.locator('#detail [data-close]').click();

  row=await productionRow(page,'si-bar-restaurant');
  expect(row).toMatchObject({id:245,website:'https://www.si-bar.eu/'});
  expect(row.hours).toContain('Küche 12:00–22:50');
  expect(row.family).toMatchObject({relationship:'on_premises',road_crossing:'none',verification_status:'operator_confirmed'});
  opened=await openLive(page,'Si! Bar & Restaurant');
  await expect(opened.family).toContainText('Vom Betrieb bestätigt');
});

test('Da Sebastián is restored as live Production with its audited kids menu and playground',async({page})=>{
  await openFamily(page);
  const row=await productionRow(page,'pizzeria-da-sebastian');
  expect(row).toMatchObject({id:257,area:'La Manga del Mar Menor',website:'https://pizzeriadasebastian.com/'});
  expect(row.address).toContain('km 8.5');
  expect(row.phone).toContain('968 337 063');
  expect(row.hours).toContain('Täglich 13:30–16:00');
  expect(row.family).toMatchObject({play_types:['outdoor_playground'],relationship:'on_premises',kids_menu:true,verification_status:'source_verified',source_count:2});
  expect(row.family.visible_from_seating).toBe(null);

  const {family}=await openLive(page,'Pizzería Da Sebastián');
  await expect(family).toContainText('Spielplatz');
  await expect(family).toContainText('Kindergerichte');
  await expect(family).toContainText('Quelle geprüft');
  await expect(family).not.toContainText('Vom Sitzplatz einsehbar');
});

test('Mediterráneo El Mojón is restored under its real area with only supported Family facts',async({page})=>{
  await openFamily(page);
  const row=await productionRow(page,'restaurante-mediterraneo-el-mojon');
  expect(row).toMatchObject({id:259,area:'El Mojón / Pilar de la Horadada'});
  expect(row.address).toContain('Calle Madrid 1');
  expect(row.address).toContain('Pilar de la Horadada');
  expect(row.phone).toContain('965 355 319');
  expect(row.hours).toContain('Mi geschlossen');
  expect(row.family).toMatchObject({play_types:['indoor_playroom'],relationship:'on_premises',road_crossing:'none',indoor_play_area:true,highchairs:true,verification_status:'source_verified',source_count:2});
  expect(row.family.visible_from_seating).toBe(null);

  const {detail,family}=await openLive(page,'Restaurante Mediterráneo El Mojón');
  await expect(detail).toContainText('Pilar de la Horadada');
  await expect(family).toContainText('Indoor-Spielraum');
  await expect(family).toContainText('Hochstühle');
  await expect(family).toContainText('Quelle geprüft');
  await expect(family).not.toContainText('Vom Sitzplatz einsehbar');
});

test('blocked Family candidates stay out of the live decision surface',async({page,request})=>{
  const batch=await (await request.get('./data/family-profile-batch2-2026-08-17.json')).json();
  const locked=batch.profiles.filter(x=>x.family_publication_allowed===false);
  expect(locked.map(x=>x.slug).sort()).toEqual(['kinita-restaurant-beach-club','pizzeria-nicos-bar','restaurante-imperial-la-manga']);

  await openFamily(page);
  const slugs=await page.evaluate(()=>DATA.map(x=>x.slug));
  for(const slug of ['restaurante-bamboo-la-manga',...locked.map(x=>x.slug)])expect(slugs).not.toContain(slug);
  await expect(page.locator('.family240-research-card')).toHaveCount(0);
});

test('José Antonio uses the restored current Lo Pagán contact and not stale details',async({page})=>{
  await openFamily(page);
  const row=await productionRow(page,'confiteria-cafe-jose-antonio');
  expect(row).toMatchObject({id:254});
  expect(row.address).toContain('Avenida Romería Virgen del Carmen 99');
  expect(row.phone).toContain('636 756 940');
  expect(row.hours).toContain('Lo-Pagán-Filiale');
  expect(row.phone).not.toContain('638 958 995');

  const {detail}=await openLive(page,'Confitería Café José Antonio');
  await expect(detail).toContainText('Avenida Romería Virgen del Carmen 99');
  await expect(detail).not.toContainText('638 958 995');
});

test('verified extra Family facts are restored without inventing geometry',async({page})=>{
  await openFamily(page);
  const facts=await page.evaluate(()=>{
    const api=window.hoyFamilyPlaygrounds240;
    const row=slug=>api.familyFor(DATA.find(x=>x.slug===slug));
    return {
      club:row('restaurante-club-deportivo-mar-de-cristal'),
      tap:row('la-tap-pizzella'),enc:row('restaurante-la-encarnacion'),lucrecia:row('casa-lucrecia'),
      mardesal:row('mardesal'),porto:row('porto-chico')
    };
  });
  expect(facts.club.highchairs).toBe(true);
  expect(facts.tap.kids_menu).toBe(true);
  expect(facts.enc.highchairs).toBe(true);
  expect(facts.lucrecia.highchairs).toBe(true);
  expect(facts.mardesal.kids_menu).toBe(true);
  expect(facts.porto.highchairs).toBe(true);
  for(const f of Object.values(facts)){
    expect(f.playground_distance_m).toBe(null);
    expect(f.fenced).toBe(null);
    expect(f.shade_available).toBe(null);
  }
});

test('premium enrichment and research standard remain read-only audit layers',async({request})=>{
  for(const path of ['./family-profile-enrichment-2.40.js','./family-research-standard-2.41.js','./family-data-completion-2.42.js']){
    const js=await (await request.get(path)).text();
    expect(js).not.toMatch(/\.insert\s*\(/);
    expect(js).not.toMatch(/\.upsert\s*\(/);
    expect(js).not.toMatch(/\.update\s*\(/);
    expect(js).not.toMatch(/\.delete\s*\(/);
    expect(js).not.toMatch(/sb\.from\s*\(/);
  }
});

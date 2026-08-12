const {test,expect}=require('@playwright/test');

test.use({serviceWorkers:'block'});

async function ready(page){
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.isArray(DATA)&&DATA.length>0&&window.hoyMenuSourceTruthVersion==='2.34.0'&&cloud.status==='online',{timeout:30000});
}

test('newly verified operator image menus render directly in HOY',async({page})=>{
  await ready(page);
  const rows=await page.evaluate(()=>[21,110,116,144].map(id=>{
    const p=DATA.find(x=>Number(x.id)===id),m=p?menuFor(p):null;
    return {id,name:p?.name,integrity:m?.integrity,mode:m?.displayMode,pages:m?.pages?.length||0,status:m?.status};
  }));
  const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
  expect(byId[21]).toMatchObject({integrity:'image_complete',mode:'image_pages',pages:2,status:'structured'});
  expect(byId[110]).toMatchObject({integrity:'image_complete',mode:'image_pages',pages:8,status:'structured'});
  expect(byId[116]).toMatchObject({integrity:'image_complete',mode:'image_pages',pages:1,status:'structured'});
  expect(byId[144]).toMatchObject({integrity:'image_complete',mode:'image_pages',pages:6,status:'structured'});
});

test('Rincón de la Hormiga exposes all eight official menu sections inside HOY',async({page})=>{
  await ready(page);
  await page.evaluate(()=>openDetail(110));
  const profile=page.locator('#detail #profile-menu');
  await expect(profile).toBeVisible();
  await expect(profile).toContainText('Offizielle Karte in HOY');
  for(const section of ['Rones','Gins','Vodkas','Tequilas','Vermouths & Martinis','Whiskey','Cócteles aperitivos','Tapas'])await expect(profile).toContainText(section);
  await expect(profile.locator('.menu231-page')).toHaveCount(8);
});

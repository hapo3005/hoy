const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const {gotoReady}=require('./helpers/current-release');

test('Food Finder searches only guest-approved localized native menus',async({page})=>{
  await gotoReady(page);
  await page.waitForFunction(()=>window.hoyFoodFinder250?.version==='2.50.0');
  const result=await page.evaluate(()=>{
    DATA=[
      {id:9101,name:'Open Test',area:'La Manga del Mar Menor'},
      {id:9102,name:'Closed Test',area:'La Manga del Mar Menor'},
      {id:9103,name:'Blocked Test',area:'La Manga del Mar Menor'}
    ];
    MENUS={
      9101:{nativeMenu:true,localized:true,guestAvailability:'in_app_native',locale:'de',languageCoverage:{complete:true},categories:[['Reis',[['Paélla Mar','18,50 €','Paella Mar','Reisgericht']]]]},
      9102:{nativeMenu:true,localized:true,guestAvailability:'in_app_native',locale:'de',languageCoverage:{complete:true},categories:[['Reis',[['Paella Barata','12 €','','']]]]},
      9103:{nativeMenu:true,localized:false,guestAvailability:'blocked_until_locale_complete',locale:null,languageCoverage:{complete:false},categories:[['Reis',[['Paella Leak','9 €','','']]]]}
    };
    state.lang='de';
    window.hoyNowStatus219For=p=>Number(p.id)===9101?{state:'open'}:Number(p.id)===9102?{state:'closed'}:null;
    window.hoyDecision280For=p=>({score:Number(p.id)===9101?90:10});
    return {
      catalog:window.hoyFoodFinder250.catalog().map(x=>x.restaurantId),
      accent:window.hoyFoodFinder250.search({query:'paella'}).map(x=>x.restaurantId),
      open:window.hoyFoodFinder250.search({query:'paella',openOnly:true}).map(x=>x.restaurantId),
      price:window.hoyFoodFinder250.search({query:'paella',sort:'price'}).map(x=>[x.restaurantId,x.price]),
      weird:window.hoyFoodFinder250.comparablePrice('S/M')
    };
  });
  expect(result.catalog).toEqual([9101,9102]);
  expect(result.accent).toEqual([9101,9102]);
  expect(result.open).toEqual([9101]);
  expect(result.price[0]).toEqual([9102,12]);
  expect(result.weird).toBeNull();
});

test('Food Finder runtime is wired into shell',async()=>{
  const root=path.join(__dirname,'..');
  const shell=fs.readFileSync(path.join(root,'app-3-6.js'),'utf8');
  expect(shell).toContain("./food-finder-2.50.js?v=2.50.0");
  expect(shell).toContain("./food-finder-2.50.css?v=2.50.0");
});

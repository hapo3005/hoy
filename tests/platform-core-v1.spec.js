const {test,expect}=require('@playwright/test');
const core=require('../platform-core/hoy-platform-core-v1.js');
const now=new Date('2026-08-18T12:00:00Z');

const confirmed=(value,extra={})=>({value,verification:'business_confirmed',isCurrent:true,...extra});

test('Platform Core canonical contract is stable in Node and browser',async({page})=>{
  expect(core.CORE_VERSION).toBe('1.0.0');
  expect(core.CONTRACT_VERSION).toBe('HOY-PC-1.0');
  expect(core.evaluateRequirement(confirmed('yes'),{level:'MUST',value:'yes'},now).state).toBe('MATCH');
  expect(core.evaluateRequirement(confirmed('partial'),{level:'MUST',value:'yes'},now).state).toBe('NO_MATCH');
  expect(core.evaluateRequirement(confirmed('temporarily_unavailable'),{level:'MUST',value:'yes'},now).state).toBe('NO_MATCH');
  expect(core.evaluateRequirement({value:'yes',verification:'external_unverified'},{level:'MUST',value:'yes'},now).state).toBe('NEEDS_CONFIRMATION');

  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('./',{waitUntil:'domcontentloaded'});
  const runtime=await page.evaluate(()=>({
    coreVersion:window.HOYPlatformCore?.CORE_VERSION,
    contractVersion:window.HOYPlatformCore?.CONTRACT_VERSION,
    gastroCore:window.HOYGastroPlatform?.CORE_VERSION,
    partial:window.HOYPlatformCore?.evaluateRequirement(
      {value:'partial',verification:'business_confirmed',isCurrent:true},
      {level:'MUST',value:'yes'},
      new Date('2026-08-18T12:00:00Z')
    )?.state
  }));
  expect(runtime).toEqual({coreVersion:'1.0.0',contractVersion:'HOY-PC-1.0',gastroCore:'1.0.0',partial:'NO_MATCH'});
  expect(errors).toEqual([]);
});

test('Gastro accessibility adapter translates legacy facts without inventing confirmation',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    const restaurant={id:1,accessibility:{
      wheelchair_entrance_state:'yes',
      wheelchair_seating_state:'partial',
      wheelchair_toilet_state:'unknown',
      accessible_parking_state:'no',
      verification_source:'operator',
      checked_at:'2026-08-18T08:00:00Z'
    }};
    const facts=window.HOYGastroPlatform.accessibilityFacts(restaurant);
    const evaluation=window.HOYGastroPlatform.evaluateAccessibility(restaurant,[
      {key:'access.step_free',level:'MUST',value:'yes'},
      {key:'access.wheelchair_seating',level:'MUST',value:'yes'}
    ],new Date('2026-08-18T12:00:00Z'));
    return{facts,evaluation};
  });
  expect(result.facts.find(x=>x.key==='access.step_free').verification).toBe('business_confirmed');
  expect(result.evaluation.state).toBe('NO_MATCH');
  expect(result.evaluation.blockers).toContain('access.wheelchair_seating');
});

test('commercial placement cannot buy a better organic rank',async({page})=>{
  await page.goto('./',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(()=>{
    const core=window.HOYPlatformCore;
    const now=new Date('2026-08-18T12:00:00Z');
    const score=e=>({score:e.id==='a'?90:70});
    const before=core.rankOrganic([{id:'a'},{id:'b'}],score,{},now);
    const after=core.rankOrganic([{id:'a'},{id:'b',commercial:{placement:{status:'active',reviewState:'approved',disclosureRequired:true}}}],score,{},now);
    return{same:core.sameOrganicRanking(before,after),label:after[1].sponsorship.label};
  });
  expect(result).toEqual({same:true,label:'Anzeige'});
});

const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../hoy-platform-core-v1.js');
const now=new Date('2026-08-18T12:00:00Z');
const confirmed=(value,extra={})=>({value,verification:'business_confirmed',isCurrent:true,...extra});

test('contract version is stable',()=>{
  assert.equal(core.CORE_VERSION,'1.0.0');
  assert.equal(core.CONTRACT_VERSION,'HOY-PC-1.0');
});

test('unknown MUST needs confirmation',()=>{
  const r=core.evaluateRequirement(confirmed('unknown'),{level:'MUST',value:'yes'},now);
  assert.equal(r.state,core.MATCH_STATES.NEEDS_CONFIRMATION);
});

test('confirmed partial and temporarily unavailable do not satisfy MUST yes',()=>{
  assert.equal(core.evaluateRequirement(confirmed('partial'),{level:'MUST',value:'yes'},now).state,core.MATCH_STATES.NO_MATCH);
  assert.equal(core.evaluateRequirement(confirmed('temporarily_unavailable'),{level:'MUST',value:'yes'},now).state,core.MATCH_STATES.NO_MATCH);
});

test('external, stale and disputed evidence never create a confirmed positive',()=>{
  assert.equal(core.evaluateRequirement({value:'yes',verification:'external_unverified',checkedAt:'2026-08-18'},{level:'MUST',value:'yes'},now).state,core.MATCH_STATES.NEEDS_CONFIRMATION);
  assert.equal(core.evaluateRequirement({...confirmed('yes'),stale:true},{level:'MUST',value:'yes'},now).state,core.MATCH_STATES.NEEDS_CONFIRMATION);
  assert.equal(core.evaluateRequirement({...confirmed('yes'),reviewState:'disputed'},{level:'MUST',value:'yes'},now).state,core.MATCH_STATES.NEEDS_CONFIRMATION);
});

test('numeric comparators are canonical',()=>{
  const fact=confirmed('yes',{measurement:85});
  assert.equal(core.evaluateRequirement(fact,{level:'MUST',operator:'gte',value:80},now).state,core.MATCH_STATES.MATCH);
  assert.equal(core.evaluateRequirement(fact,{level:'MUST',operator:'lte',value:80},now).state,core.MATCH_STATES.NO_MATCH);
});

test('failed MUST wins over successful PREFER',()=>{
  const result=core.evaluateRequirements({facts:{must:confirmed('no'),prefer:confirmed('yes')}},[
    {key:'must',level:'MUST',value:'yes'},
    {key:'prefer',level:'PREFER',value:'yes'}
  ],now);
  assert.equal(result.state,core.MATCH_STATES.NO_MATCH);
  assert.equal(result.preferScore,1);
});

test('fresh research is distinct from confirmation and becomes stale after 180 days',()=>{
  assert.equal(core.evidenceTrust({verification:'source_checked',sourceCheckedAt:'2026-08-01'},now).key,core.TRUST_STATES.RESEARCHED);
  assert.equal(core.evidenceTrust({verification:'source_checked',sourceCheckedAt:'2025-01-01'},now).key,core.TRUST_STATES.STALE);
  assert.equal(core.evidenceTrust({verification:'source_checked'},now).key,core.TRUST_STATES.STALE);
});

test('live availability requires confirmation plus future expiry',()=>{
  const fresh={availabilityStatus:'available_now',availabilityConfirmedAt:'2026-08-18T10:00:00Z',availabilityExpiresAt:'2026-08-18T14:00:00Z'};
  const stale={...fresh,availabilityExpiresAt:'2026-08-18T11:00:00Z'};
  assert.equal(core.availabilityState(fresh,now).current,true);
  assert.equal(core.availabilityState(stale,now).current,false);
});

test('safety gate is a hard override',()=>{
  assert.equal(core.safetyGate({id:'x'},{safetyStatus:'blocked'}).eligible,false);
  assert.equal(core.safetyGate({id:'x',safetyStatus:'unsafe'},{}).eligible,false);
});

test('sponsorship needs approval and disclosure',()=>{
  const active={commercial:{placement:{status:'active',reviewState:'approved',disclosureRequired:true}}};
  assert.equal(core.sponsorshipState(active,now).label,'Anzeige');
  assert.equal(core.sponsorshipState({commercial:{placement:{status:'active',reviewState:'approved'}}},now).eligible,false);
});

test('commercial metadata never changes organic rank',()=>{
  const a={id:'a'},b={id:'b'};
  const score=e=>({score:e.id==='a'?90:70});
  const before=core.rankOrganic([a,b],score,{},now);
  const after=core.rankOrganic([a,{...b,commercial:{placement:{status:'active',reviewState:'approved',disclosureRequired:true}}}],score,{},now);
  assert.equal(core.sameOrganicRanking(before,after),true);
  assert.equal(after[1].sponsorship.label,'Anzeige');
});

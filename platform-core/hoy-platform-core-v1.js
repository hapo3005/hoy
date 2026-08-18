/* HOY Platform Core v1.0.0
 * Canonical cross-vertical truth, matching, freshness, live-status,
 * safety and commercial-integrity contract for HOY Gastro/Lifestyle/Works.
 * Runtime: globalThis.HOYPlatformCore in browsers/ESM + CommonJS require().
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.HOYPlatformCore=Object.freeze(api);
})(typeof globalThis!=='undefined'?globalThis:null,function(){
  'use strict';

  const CORE_VERSION='1.0.0';
  const CONTRACT_VERSION='HOY-PC-1.0';
  const DAY_MS=86400000;

  const FACT_VALUES=Object.freeze({
    YES:'yes',NO:'no',PARTIAL:'partial',UNKNOWN:'unknown',
    NOT_APPLICABLE:'not_applicable',TEMPORARILY_UNAVAILABLE:'temporarily_unavailable'
  });
  const VERIFICATION=Object.freeze({
    HOY_VERIFIED:'hoy_verified',BUSINESS_CONFIRMED:'business_confirmed',
    COMMUNITY_CONFIRMED:'community_confirmed',EXTERNAL_UNVERIFIED:'external_unverified',
    SOURCE_CHECKED:'source_checked',DIRECTORY_ONLY:'directory_only',UNKNOWN:'unknown'
  });
  const CONFIRMED_VERIFICATION=new Set([
    VERIFICATION.HOY_VERIFIED,VERIFICATION.BUSINESS_CONFIRMED,VERIFICATION.COMMUNITY_CONFIRMED
  ]);
  const REQUIREMENT_LEVELS=Object.freeze({MUST:'MUST',PREFER:'PREFER',IGNORE:'IGNORE'});
  const MATCH_STATES=Object.freeze({MATCH:'MATCH',NO_MATCH:'NO_MATCH',NEEDS_CONFIRMATION:'NEEDS_CONFIRMATION'});
  const TRUST_STATES=Object.freeze({
    LIVE_TODAY:'LIVE_TODAY',HOY_VERIFIED:'HOY_VERIFIED',BUSINESS_CONFIRMED:'BUSINESS_CONFIRMED',
    COMMUNITY_CONFIRMED:'COMMUNITY_CONFIRMED',RESEARCHED:'RESEARCHED',EXTERNAL_UNVERIFIED:'EXTERNAL_UNVERIFIED',
    STALE:'STALE',UNKNOWN:'UNKNOWN',CONFLICT:'CONFLICT'
  });
  const LIVE_STATUSES=new Set(['available_now','available_today','limited','unavailable']);
  const DEFAULT_POLICY=Object.freeze({researchMaxAgeDays:180,requireResearchTimestamp:true});

  const clean=v=>String(v??'').trim().toLowerCase();
  const upper=v=>String(v??'').trim().toUpperCase();
  const parseDate=v=>{const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null};
  const numeric=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const ageDays=(value,now=new Date())=>{const d=parseDate(value);return d?Math.max(0,(now.getTime()-d.getTime())/DAY_MS):Number.POSITIVE_INFINITY};

  function normalizeFactValue(value){
    const v=clean(value||FACT_VALUES.UNKNOWN);
    return Object.values(FACT_VALUES).includes(v)?v:FACT_VALUES.UNKNOWN;
  }

  function normalizeRequirement(raw={}){
    if(typeof raw==='string')return{level:upper(raw)||REQUIREMENT_LEVELS.IGNORE,operator:'equals',value:FACT_VALUES.YES};
    const level=upper(raw.level||raw.importance||REQUIREMENT_LEVELS.MUST);
    const operator=clean(raw.operator||raw.comparator||'equals');
    return{
      key:raw.key||raw.feature_key||null,
      level:Object.values(REQUIREMENT_LEVELS).includes(level)?level:REQUIREMENT_LEVELS.MUST,
      operator:['equals','gte','lte'].includes(operator)?operator:'equals',
      value:raw.value??raw.targetValue??FACT_VALUES.YES
    };
  }

  function factShape(fact){
    if(!fact)return null;
    return{
      value:normalizeFactValue(fact.status??fact.value),
      measurement:fact.measurement??fact.value_number??null,
      text:fact.value_text??null,
      verification:clean(fact.verification_level??fact.verification??VERIFICATION.UNKNOWN),
      checkedAt:fact.checked_at??fact.checkedAt??fact.sourceCheckedAt??fact.source_checked_at??null,
      staleAt:fact.stale_after??fact.staleAt??null,
      reviewState:clean(fact.review_state??fact.reviewState??'clean'),
      explicitStale:fact.stale===true,
      isCurrent:fact.isCurrent!==false&&fact.is_current!==false
    };
  }

  function factIsStale(fact,now=new Date(),policy=DEFAULT_POLICY){
    const f=factShape(fact);if(!f)return true;
    if(f.explicitStale||!f.isCurrent)return true;
    const staleAt=parseDate(f.staleAt);
    if(staleAt&&now>staleAt)return true;
    if(f.verification===VERIFICATION.SOURCE_CHECKED||f.verification===VERIFICATION.EXTERNAL_UNVERIFIED||f.verification===VERIFICATION.DIRECTORY_ONLY){
      if(policy.requireResearchTimestamp!==false&&!parseDate(f.checkedAt))return true;
      if(Number.isFinite(Number(policy.researchMaxAgeDays))&&ageDays(f.checkedAt,now)>Number(policy.researchMaxAgeDays))return true;
    }
    return false;
  }

  function factIsConfirmed(fact,now=new Date(),policy=DEFAULT_POLICY){
    const f=factShape(fact);if(!f||factIsStale(fact,now,policy))return false;
    if(!['','clean','approved'].includes(f.reviewState))return false;
    return CONFIRMED_VERIFICATION.has(f.verification);
  }

  function compareFact(fact,requirement){
    const f=factShape(fact),r=normalizeRequirement(requirement);
    if(!f)return null;
    if(r.operator==='gte'||r.operator==='lte'){
      const actual=numeric(f.measurement),expected=numeric(r.value);
      if(actual===null||expected===null)return null;
      return r.operator==='gte'?actual>=expected:actual<=expected;
    }
    const expected=clean(r.value);
    if(f.text!==null&&f.text!==undefined&&expected&&!Object.values(FACT_VALUES).includes(expected))return clean(f.text)===expected;
    return f.value===normalizeFactValue(expected);
  }

  function evaluateRequirement(fact,rawRequirement={},now=new Date(),policy=DEFAULT_POLICY){
    const requirement=normalizeRequirement(rawRequirement);
    if(requirement.level===REQUIREMENT_LEVELS.IGNORE)return{state:MATCH_STATES.MATCH,level:requirement.level,ignored:true,confirmed:false,reason:'ignored'};
    if(!fact)return{state:MATCH_STATES.NEEDS_CONFIRMATION,level:requirement.level,confirmed:false,reason:'missing_fact'};
    const shaped=factShape(fact);
    if(factIsStale(fact,now,policy))return{state:MATCH_STATES.NEEDS_CONFIRMATION,level:requirement.level,confirmed:false,reason:'stale_fact'};
    if(!factIsConfirmed(fact,now,policy))return{state:MATCH_STATES.NEEDS_CONFIRMATION,level:requirement.level,confirmed:false,reason:'unconfirmed_fact'};
    if(shaped.value===FACT_VALUES.UNKNOWN)return{state:MATCH_STATES.NEEDS_CONFIRMATION,level:requirement.level,confirmed:true,reason:'unknown_value'};
    const compared=compareFact(fact,requirement);
    if(compared===null)return{state:MATCH_STATES.NEEDS_CONFIRMATION,level:requirement.level,confirmed:true,reason:'missing_comparison_value'};
    return{state:compared?MATCH_STATES.MATCH:MATCH_STATES.NO_MATCH,level:requirement.level,confirmed:true,reason:compared?'confirmed_match':'confirmed_mismatch'};
  }

  function factsMap(entity){
    if(!entity)return new Map();
    if(Array.isArray(entity.facts))return new Map(entity.facts.map(f=>[f.key||f.feature_key,f]));
    if(entity.facts&&typeof entity.facts==='object')return new Map(Object.entries(entity.facts));
    if(Array.isArray(entity))return new Map(entity.map(f=>[f.key||f.feature_key,f]));
    return new Map();
  }

  function evaluateRequirements(entity,requirements=[],now=new Date(),policy=DEFAULT_POLICY){
    const facts=factsMap(entity);
    const evaluations=(requirements||[]).map(raw=>{
      const requirement=normalizeRequirement(raw);
      return{requirement,...evaluateRequirement(facts.get(requirement.key),requirement,now,policy)};
    });
    const must=evaluations.filter(x=>x.level===REQUIREMENT_LEVELS.MUST&&!x.ignored);
    const prefer=evaluations.filter(x=>x.level===REQUIREMENT_LEVELS.PREFER&&!x.ignored);
    let state=MATCH_STATES.MATCH;
    if(must.some(x=>x.state===MATCH_STATES.NO_MATCH))state=MATCH_STATES.NO_MATCH;
    else if(must.some(x=>x.state===MATCH_STATES.NEEDS_CONFIRMATION))state=MATCH_STATES.NEEDS_CONFIRMATION;
    const preferMatched=prefer.filter(x=>x.state===MATCH_STATES.MATCH).length;
    return{
      state,evaluations,mustCount:must.length,preferCount:prefer.length,
      preferMatched,preferScore:prefer.length?preferMatched/prefer.length:1,
      blockers:must.filter(x=>x.state===MATCH_STATES.NO_MATCH).map(x=>x.requirement.key),
      unresolved:must.filter(x=>x.state===MATCH_STATES.NEEDS_CONFIRMATION).map(x=>x.requirement.key)
    };
  }

  function availabilityState(entity,now=new Date()){
    const status=clean(entity?.availabilityStatus??entity?.availability_status??entity?.liveStatus??'unknown');
    const confirmedAt=parseDate(entity?.availabilityConfirmedAt??entity?.availability_confirmed_at??entity?.liveConfirmedAt);
    const expiresAt=parseDate(entity?.availabilityExpiresAt??entity?.availability_expires_at??entity?.liveExpiresAt);
    if(!LIVE_STATUSES.has(status))return{status:'unknown',current:false,confirmed:false,label:'Bestätigung erforderlich'};
    if(!confirmedAt||!expiresAt||now>=expiresAt)return{status:'unknown',current:false,confirmed:false,label:'Bestätigung erforderlich'};
    const labels={available_now:'Jetzt verfügbar',available_today:'Heute verfügbar',limited:'Heute eingeschränkt',unavailable:'Aktuell nicht verfügbar'};
    return{status,current:true,confirmed:true,confirmedAt:confirmedAt.toISOString(),expiresAt:expiresAt.toISOString(),label:labels[status]};
  }

  function evidenceTrust(entity,now=new Date(),policy=DEFAULT_POLICY){
    if(!entity||entity.suppressed===true||['conflict','disputed','blocked'].includes(clean(entity.reviewState??entity.review_state)))return{key:TRUST_STATES.CONFLICT,score:0,label:'Nicht ausspielen'};
    const live=availabilityState(entity,now);
    if(live.current)return{key:TRUST_STATES.LIVE_TODAY,score:1,label:live.label,live};
    const verification=clean(entity.verification??entity.verificationStatus??entity.verification_level??entity.source_status??VERIFICATION.UNKNOWN);
    if(verification===VERIFICATION.HOY_VERIFIED)return{key:TRUST_STATES.HOY_VERIFIED,score:.92,label:'HOY Verified'};
    if(verification===VERIFICATION.BUSINESS_CONFIRMED)return{key:TRUST_STATES.BUSINESS_CONFIRMED,score:.84,label:'Vom Betrieb bestätigt'};
    if(verification===VERIFICATION.COMMUNITY_CONFIRMED)return{key:TRUST_STATES.COMMUNITY_CONFIRMED,score:.76,label:'Community bestätigt'};
    const checkedAt=entity.sourceCheckedAt??entity.source_checked_at??entity.checkedAt??entity.checked_at??entity.lastVerified??null;
    if(verification===VERIFICATION.SOURCE_CHECKED){
      if((policy.requireResearchTimestamp!==false&&!parseDate(checkedAt))||ageDays(checkedAt,now)>Number(policy.researchMaxAgeDays??180))return{key:TRUST_STATES.STALE,score:.22,label:'Recherche veraltet · Bestätigung erforderlich'};
      return{key:TRUST_STATES.RESEARCHED,score:.58,label:'Quelle geprüft · nicht Betreiber-bestätigt'};
    }
    if(verification===VERIFICATION.EXTERNAL_UNVERIFIED||verification===VERIFICATION.DIRECTORY_ONLY)return{key:TRUST_STATES.EXTERNAL_UNVERIFIED,score:.32,label:'Externe Angabe · Bestätigung erforderlich'};
    return{key:TRUST_STATES.UNKNOWN,score:.22,label:'Bestätigung erforderlich'};
  }

  function safetyGate(entity,context={}){
    if(!entity||entity.suppressed===true)return{eligible:false,reason:'suppressed'};
    const entityState=clean(entity.safetyStatus??entity.safety_status??entity.reviewState??entity.review_state);
    const requestState=clean(context.safetyStatus??context.safety_status);
    if(['blocked','unsafe','conflict'].includes(entityState)||['blocked','unsafe'].includes(requestState))return{eligible:false,reason:'safety_block'};
    return{eligible:true,reason:null};
  }

  function sponsorshipState(entity,now=new Date()){
    const placement=entity?.commercial?.placement??entity?.commercialPlacement??entity?.commercial_placement;
    if(!placement)return{eligible:false,label:null,reason:'none'};
    if(entity?.suppressed===true)return{eligible:false,label:null,reason:'suppressed'};
    if(clean(placement.status)!=='active')return{eligible:false,label:null,reason:'inactive'};
    if(clean(placement.reviewState??placement.review_state)!=='approved')return{eligible:false,label:null,reason:'not_approved'};
    if(placement.disclosureRequired!==true&&placement.disclosure_required!==true)return{eligible:false,label:null,reason:'disclosure_missing'};
    const starts=parseDate(placement.startsAt??placement.starts_at),ends=parseDate(placement.endsAt??placement.ends_at);
    if(starts&&now<starts)return{eligible:false,label:null,reason:'not_started'};
    if(ends&&now>ends)return{eligible:false,label:null,reason:'expired'};
    return{eligible:true,label:'Anzeige',reason:'active'};
  }

  function rankOrganic(entities,scoreFn,context={},now=new Date()){
    if(typeof scoreFn!=='function')throw new TypeError('scoreFn must be a function');
    return(entities||[]).map((entity,index)=>{
      const safety=safetyGate(entity,context);
      if(!safety.eligible)return{entity,eligible:false,score:-1,index,safety};
      const result=scoreFn(entity,context,now)||{};
      return{entity,index,safety,eligible:result.eligible!==false,score:Number.isFinite(Number(result.score))?Number(result.score):0,...result};
    }).filter(x=>x.eligible).sort((a,b)=>b.score-a.score||a.index-b.index).map((row,index)=>({...row,organicRank:index+1,sponsorship:sponsorshipState(row.entity,now)}));
  }

  function commercialIntegritySnapshot(rows){
    return(rows||[]).map(row=>({id:row?.entity?.id??row?.item?.id??row?.provider?.id,score:Number(row?.score),organicRank:Number(row?.organicRank)}));
  }

  function sameOrganicRanking(before,after){
    const a=commercialIntegritySnapshot(before),b=commercialIntegritySnapshot(after);
    return a.length===b.length&&a.every((row,i)=>row.id===b[i].id&&row.score===b[i].score&&row.organicRank===b[i].organicRank);
  }

  return{
    CORE_VERSION,CONTRACT_VERSION,FACT_VALUES,VERIFICATION,REQUIREMENT_LEVELS,MATCH_STATES,TRUST_STATES,DEFAULT_POLICY,
    normalizeFactValue,normalizeRequirement,factShape,factIsStale,factIsConfirmed,evaluateRequirement,evaluateRequirements,
    availabilityState,evidenceTrust,safetyGate,sponsorshipState,rankOrganic,commercialIntegritySnapshot,sameOrganicRanking
  };
});

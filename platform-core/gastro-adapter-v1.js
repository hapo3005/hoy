/* HOY Gastro Platform Adapter v1.0
 * Translates current Gastro domain records into HOY Platform Core facts.
 * It does not redefine Platform Core truth, freshness, safety or commercial semantics.
 */
(function(root){
  'use strict';
  const core=root?.HOYPlatformCore;
  if(!core||core.CORE_VERSION!=='1.0.0'||core.CONTRACT_VERSION!=='HOY-PC-1.0')throw new Error('HOY Platform Core v1 is missing or incompatible');

  const ACCESS_MAP=Object.freeze({
    'access.step_free':'wheelchair_entrance_state',
    'access.wheelchair_seating':'wheelchair_seating_state',
    'access.toilet':'wheelchair_toilet_state',
    'access.parking':'accessible_parking_state',
    'access.hearing_loop':'hearing_loop_state'
  });

  function verificationFromLegacy(a){
    if(a?.verification_level)return a.verification_level;
    if(a?.verification_source==='operator')return core.VERIFICATION.BUSINESS_CONFIRMED;
    if(a?.verification_source==='onsite')return core.VERIFICATION.HOY_VERIFIED;
    if(a?.verification_source==='community')return core.VERIFICATION.COMMUNITY_CONFIRMED;
    return core.VERIFICATION.EXTERNAL_UNVERIFIED;
  }

  function staleAfterFromLegacy(a){
    if(a?.stale_after)return a.stale_after;
    if(!a?.checked_at)return null;
    const d=new Date(a.checked_at);
    if(Number.isNaN(d.getTime()))return null;
    const days=verificationFromLegacy(a)===core.VERIFICATION.HOY_VERIFIED?365:180;
    d.setUTCDate(d.getUTCDate()+days);
    return d.toISOString();
  }

  function accessibilityFacts(restaurant){
    const a=restaurant?.accessibility;
    if(!a)return [];
    const verification=verificationFromLegacy(a);
    const checkedAt=a.checked_at||null;
    const staleAfter=staleAfterFromLegacy(a);
    return Object.entries(ACCESS_MAP).map(([key,legacyKey])=>({
      key,
      value:core.normalizeFactValue(a[legacyKey]),
      verification,
      checkedAt,
      staleAt:staleAfter,
      reviewState:a.review_state||'clean',
      sourceUrl:a.source_url||null
    }));
  }

  function entityForAccessibility(restaurant){
    return{...restaurant,facts:accessibilityFacts(restaurant)};
  }

  function evaluateAccessibility(restaurant,requirements=[],now=new Date()){
    return core.evaluateRequirements(entityForAccessibility(restaurant),requirements,now);
  }

  function trust(entity,now=new Date()){
    return core.evidenceTrust(entity,now);
  }

  function safety(entity,context={}){
    return core.safetyGate(entity,context);
  }

  function sponsorship(entity,now=new Date()){
    return core.sponsorshipState(entity,now);
  }

  root.HOYGastroPlatform=Object.freeze({
    CORE_VERSION:core.CORE_VERSION,
    CONTRACT_VERSION:core.CONTRACT_VERSION,
    PLATFORM_CORE:core,
    ACCESS_MAP,
    accessibilityFacts,
    evaluateAccessibility,
    trust,
    safety,
    sponsorship
  });
})(typeof globalThis!=='undefined'?globalThis:null);

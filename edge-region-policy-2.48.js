/* HOY 2.48.0 — fail-closed Supabase Edge Function execution-region policy */
(function(){
  'use strict';

  const VERSION='2.48.0';
  const PINNED_REGION='eu-central-1';

  // Snapshot of all ACTIVE Core Edge Function slugs audited through 2026-08-19.
  // Every current function is pinned to the Core database region because each is
  // database/storage coupled and/or handles operator, business, content, analytics
  // or precise-location data. New/unclassified functions fail closed until reviewed.
  const POLICY=Object.freeze({
    'claim-submit':Object.freeze({region:PINNED_REGION,class:'identity_business'}),
    'publish-offer':Object.freeze({region:PINNED_REGION,class:'identity_business'}),
    'venue-media-approve':Object.freeze({region:PINNED_REGION,class:'business_media'}),
    'admin-ops':Object.freeze({region:PINNED_REGION,class:'admin_business'}),
    'location-geocode-once':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'cartociudad-geocode-once':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'cartociudad-debug':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'address-fallback-geocode-once':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'cartociudad-find-fallback':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'cartociudad-locate-debug':Object.freeze({region:PINNED_REGION,class:'geo_admin'}),
    'menu-intake-process':Object.freeze({region:PINNED_REGION,class:'operator_content_ai'}),
    'promotion-insights':Object.freeze({region:PINNED_REGION,class:'business_analytics'}),
    'menu-image-once':Object.freeze({region:PINNED_REGION,class:'content_processing'}),
    'operator-hours-confirm':Object.freeze({region:PINNED_REGION,class:'operator_business'}),
    'mobility-resolve':Object.freeze({region:PINNED_REGION,class:'precise_location'}),
    'menu-discovery':Object.freeze({region:PINNED_REGION,class:'content_research'}),
    'menu-editorial-import':Object.freeze({region:PINNED_REGION,class:'content_processing'}),
    'menu-social-handoff':Object.freeze({region:PINNED_REGION,class:'content_research'}),
    'operator-accessibility-confirm':Object.freeze({region:PINNED_REGION,class:'operator_business'})
  });

  const errorResult=(error)=>({data:null,error,response:undefined});

  function ruleFor(name){
    const key=String(name||'').trim();
    const rule=POLICY[key];
    if(!rule)throw new Error(`hoy_edge_region_unclassified:${key||'empty'}`);
    return {name:key,rule};
  }

  function invokeOptions(name,options={}){
    const {rule}=ruleFor(name);
    return {...(options||{}),region:rule.region};
  }

  function install(client){
    if(!client?.functions||typeof client.functions.invoke!=='function'){
      throw new Error('hoy_edge_region_client_invalid');
    }
    if(client.functions.invoke.__hoyEdgeRegionWrapped248)return client;

    const original=client.functions.invoke.bind(client.functions);
    const wrapped=async function(name,options={}){
      let scoped;
      let classification;
      try{
        const found=ruleFor(name);
        classification=found.rule.class;
        scoped=invokeOptions(name,options);
      }catch(error){
        try{window.__hoyEdgeRegionLast248={name:String(name||''),blocked:true,error:String(error?.message||error),at:new Date().toISOString()}}catch{}
        return errorResult(error);
      }

      const result=await original(name,scoped);
      let observed=null;
      try{observed=result?.response?.headers?.get?.('x-sb-edge-region')||null}catch{}
      try{window.__hoyEdgeRegionLast248={name:String(name),requested:PINNED_REGION,observed,classification,blocked:false,at:new Date().toISOString()}}catch{}

      // The SDK sends both x-region and forceFunctionRegion for explicit regions.
      // If Supabase exposes a contradictory execution-region response header, fail closed.
      if(observed&&observed!==PINNED_REGION){
        return {data:null,error:new Error(`hoy_edge_region_mismatch:${name}:${observed}`),response:result?.response};
      }
      return result;
    };
    wrapped.__hoyEdgeRegionWrapped248=true;
    client.functions.invoke=wrapped;
    return client;
  }

  function installFactory(){
    const lib=window.supabase;
    if(!lib||typeof lib.createClient!=='function'){
      window.HOY_EDGE_REGION_POLICY_ERROR='supabase_library_missing';
      return false;
    }
    if(lib.createClient.__hoyEdgeRegionWrapped248)return true;
    const create=lib.createClient.bind(lib);
    const wrappedCreate=function(...args){return install(create(...args))};
    wrappedCreate.__hoyEdgeRegionWrapped248=true;
    lib.createClient=wrappedCreate;
    return true;
  }

  window.HOY_EDGE_REGION_POLICY=Object.freeze({
    version:VERSION,
    pinnedRegion:PINNED_REGION,
    functionCount:Object.keys(POLICY).length,
    functions:POLICY,
    unknownFunctionBehavior:'BLOCK'
  });
  window.hoyEdgeRegionRule248=(name)=>ruleFor(name).rule;
  window.hoyEdgeRegionInvokeOptions248=invokeOptions;
  window.hoyInstallEdgeRegionPolicy248=install;
  window.hoyInstallEdgeRegionFactory248=installFactory;

  installFactory();
})();

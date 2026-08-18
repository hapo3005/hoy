/* HOY 1.8.4 — explicit-consent, fail-closed production analytics */
(function(){
  const ANON_KEY='hoy-anonymous-id-v1';
  const SESSION_KEY='hoy-session-id-v1';
  const PILOT_KEY='hoy-proof-pilot-code-v1';
  const PILOT_SENT_KEY='hoy-proof-pilot-enrolled-v1';
  const CONSENT_KEY='hoy-privacy-analytics-consent-v1';
  const PRODUCTION_HOSTS=new Set(['hapo3005.github.io']);

  function productionHost(){
    const host=String(window.location?.hostname||'').toLowerCase();
    return PRODUCTION_HOSTS.has(host);
  }
  function safeGet(storage,key){
    try{return storage.getItem(key)}catch{return null}
  }
  function safeSet(storage,key,value){
    try{storage.setItem(key,value);return true}catch{return false}
  }
  function safeRemove(storage,key){
    try{storage.removeItem(key)}catch{}
  }
  function analyticsConsentStatus(){
    const value=safeGet(localStorage,CONSENT_KEY);
    return value==='granted'||value==='denied'?value:'unset';
  }
  function analyticsConsentGranted(){
    return analyticsConsentStatus()==='granted';
  }
  function qaRuntimeDetected(){
    if(navigator.webdriver===true)return true;
    // Production must not touch the QA localStorage marker before consent.
    if(productionHost())return false;
    return safeGet(localStorage,'hoy-qa-runtime')==='1';
  }
  function analyticsStorageAllowed(){
    return !productionHost()||analyticsConsentGranted();
  }
  function productionAnalyticsAllowed(){
    return productionHost()&&!qaRuntimeDetected()&&analyticsConsentGranted();
  }
  function clearAnalyticsIdentifiers(){
    safeRemove(localStorage,ANON_KEY);
    safeRemove(sessionStorage,SESSION_KEY);
    safeRemove(localStorage,PILOT_KEY);
    safeRemove(localStorage,PILOT_SENT_KEY);
    if(typeof ANALYTICS_KEY==='string'&&ANALYTICS_KEY)safeRemove(localStorage,ANALYTICS_KEY);
  }
  function randomId(){
    const c=window.crypto;
    if(c&&typeof c.randomUUID==='function')return c.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,ch=>{
      const r=Math.random()*16|0,v=ch==='x'?r:(r&3|8);return v.toString(16);
    });
  }
  function storedUuid(storage,key){
    if(!analyticsStorageAllowed())return null;
    let value=safeGet(storage,key);
    if(!value){
      value=randomId();
      if(!safeSet(storage,key,value))return null;
    }
    return value;
  }
  function safeMeta(meta={}){
    const out={};
    const blocked=/email|phone|address|note|message|name/i;
    for(const [key,value] of Object.entries(meta||{})){
      if(blocked.test(key))continue;
      if(['string','number','boolean'].includes(typeof value))out[key]=String(value).slice(0,120);
    }
    out.lang=state.lang;
    out.view=state.view;
    out.client_version='1.8.4';
    return out;
  }
  function buildPayload(type,restaurantId,meta={}){
    if(productionHost()&&!analyticsConsentGranted())return null;
    const anonymousId=storedUuid(localStorage,ANON_KEY);
    const sessionId=storedUuid(sessionStorage,SESSION_KEY);
    if(!anonymousId||!sessionId)return null;
    const venue=restaurantId?DATA.find(x=>Number(x.id)===Number(restaurantId)):null;
    const metadata={
      ...safeMeta(meta),
      venue_type:venue?.venue_type||undefined,
      profile_quality:venue?.profile_quality||undefined,
      ...(qaRuntimeDetected()?{qa_runtime:'1'}:{})
    };
    return {
      p_event_type:type,
      p_restaurant_id:Number(restaurantId)||null,
      p_anonymous_id:anonymousId,
      p_session_id:sessionId,
      p_metadata:metadata
    };
  }
  function pilotCode(raw){
    const value=String(raw||'').trim().toUpperCase();
    return /^P(?:0[1-9]|[12][0-9]|30)$/.test(value)?value:null;
  }
  function stripPilotQuery(params,hasPilotParam){
    if(!hasPilotParam)return;
    params.delete('pilot');
    if(window.history&&typeof window.history.replaceState==='function'){
      const query=params.toString();
      const clean=`${window.location.pathname}${query?`?${query}`:''}${window.location.hash||''}`;
      window.history.replaceState(window.history.state,'',clean);
    }
  }
  function capturePilotEnrollment(){
    const params=new URLSearchParams(window.location.search||'');
    const hasPilotParam=params.has('pilot');
    const incoming=pilotCode(params.get('pilot'));

    // Remove the URL parameter regardless of consent so it cannot become a second store.
    stripPilotQuery(params,hasPilotParam);

    // On Production, pilot attribution is analytics state and must remain absent
    // until explicit analytics consent exists.
    if(!analyticsStorageAllowed())return null;

    const stored=pilotCode(safeGet(localStorage,PILOT_KEY));
    let selected=stored;
    if(incoming){
      if(stored&&stored!==incoming){
        console.warn('HOY proof-gate pilot code conflict ignored');
      }else if(!stored&&safeSet(localStorage,PILOT_KEY,incoming)){
        selected=incoming;
      }
    }
    return selected||incoming||null;
  }
  function schedulePilotEnrollment(code,attempt=0){
    if(!code||!analyticsStorageAllowed())return;
    if(safeGet(localStorage,PILOT_SENT_KEY)===code)return;

    // Preview/Playwright may exercise the sanitized analytics path, but cannot
    // reach the Production RPC transport gate.
    if(!productionAnalyticsAllowed()){
      if(!productionHost()&&qaRuntimeDetected()&&attempt===0){
        trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code});
      }
      return;
    }

    if(!sb||cloud.status!=='online'){
      if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
      return;
    }
    Promise.resolve(trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code})).then(sent=>{
      if(sent)safeSet(localStorage,PILOT_SENT_KEY,code);
      else if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
    });
  }

  // Upgrade cleanup: Production without explicit consent must not retain identifiers
  // or raw event history left by older client versions.
  if(productionHost()&&!analyticsConsentGranted())clearAnalyticsIdentifiers();

  window.hoyAnalyticsPrivacy181={
    consentKey:CONSENT_KEY,
    status:analyticsConsentStatus,
    granted:analyticsConsentGranted,
    grant:()=>{
      safeSet(localStorage,CONSENT_KEY,'granted');
      return analyticsConsentStatus();
    },
    deny:()=>{
      safeSet(localStorage,CONSENT_KEY,'denied');
      clearAnalyticsIdentifiers();
      return analyticsConsentStatus();
    },
    withdraw:()=>{
      safeSet(localStorage,CONSENT_KEY,'denied');
      clearAnalyticsIdentifiers();
      return analyticsConsentStatus();
    },
    clear:()=>{
      safeRemove(localStorage,CONSENT_KEY);
      clearAnalyticsIdentifiers();
      return analyticsConsentStatus();
    }
  };
  window.hoyAnalyticsConsentGranted181=analyticsConsentGranted;
  window.hoyProductionAnalyticsAllowed181=productionAnalyticsAllowed;

  trackEvent=function(type,restaurantId,meta={}){
    // Critical invariant: on Production, absence of explicit consent exits before
    // readEvents(), buildPayload(), UUID creation or any analytics persistence.
    if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false);

    // Raw local analytics history is a QA/preview facility only. Production never
    // persists the raw event queue in localStorage, even after consent.
    if(!productionHost()){
      const rows=readEvents();
      rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});
      safeSet(localStorage,ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));
    }

    const payload=buildPayload(type,restaurantId,meta);
    if(!payload)return Promise.resolve(false);

    if(qaRuntimeDetected())window.hoyLastQaAnalyticsPayload181=payload;
    else if('hoyLastQaAnalyticsPayload181' in window)delete window.hoyLastQaAnalyticsPayload181;

    if(!productionAnalyticsAllowed())return Promise.resolve(false);
    if(!sb||cloud.status!=='online')return Promise.resolve(false);
    return sb.rpc('log_analytics_event',payload).then(({error})=>{
      if(error){console.warn('HOY analytics RPC rejected',error.message);return false}
      return true;
    }).catch(error=>{
      console.warn('HOY analytics RPC failed',error?.message||error);
      return false;
    });
  };

  const proofPilotCode=capturePilotEnrollment();
  if(proofPilotCode)schedulePilotEnrollment(proofPilotCode);
})();

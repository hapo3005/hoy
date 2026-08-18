/* HOY 1.8.3 — consent-gated Supabase RPC analytics + proof-gate enrollment */
(function(){
  const ANON_KEY='hoy-anonymous-id-v1';
  const SESSION_KEY='hoy-session-id-v1';
  const PILOT_KEY='hoy-proof-pilot-code-v1';
  const PILOT_SENT_KEY='hoy-proof-pilot-enrolled-v1';
  const CONSENT_KEY='hoy-analytics-consent-v1';
  const PRODUCTION_HOSTS=new Set(['hapo3005.github.io']);

  function productionHost(){
    const host=String(window.location?.hostname||'').toLowerCase();
    return PRODUCTION_HOSTS.has(host);
  }
  function randomId(){
    const c=window.crypto;
    if(c&&typeof c.randomUUID==='function')return c.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,ch=>{
      const r=Math.random()*16|0,v=ch==='x'?r:(r&3|8);return v.toString(16);
    });
  }
  function storedUuid(storage,key){
    let value=storage.getItem(key);
    if(!value){value=randomId();storage.setItem(key,value)}
    return value;
  }
  function analyticsConsentGranted(){
    // Reading the consent preference is necessary to honour the user's choice.
    // Production analytics remain OFF unless the dedicated consent UI has stored
    // the exact value "granted". No implicit/continued-use consent is accepted.
    try{return localStorage.getItem(CONSENT_KEY)==='granted'}catch{return false}
  }
  function clearProductionAnalyticsStorage(){
    if(!productionHost()||analyticsConsentGranted())return;
    // Remove identifiers/history that may have been written by a previous version.
    // Do not remove the consent preference itself.
    try{
      localStorage.removeItem(ANON_KEY);
      localStorage.removeItem(PILOT_KEY);
      localStorage.removeItem(PILOT_SENT_KEY);
      if(typeof ANALYTICS_KEY!=='undefined'&&ANALYTICS_KEY)localStorage.removeItem(ANALYTICS_KEY);
    }catch{}
    try{sessionStorage.removeItem(SESSION_KEY)}catch{}
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
    out.client_version='1.8.3';
    return out;
  }
  function qaRuntimeDetected(){
    // Never inspect the QA localStorage marker on Production before analytics
    // consent. navigator.webdriver does not require persistent device storage.
    if(navigator.webdriver===true)return true;
    if(productionHost())return false;
    try{return localStorage.getItem('hoy-qa-runtime')==='1'}catch{return false}
  }
  function productionAnalyticsAllowed(){
    return productionHost()&&!qaRuntimeDetected()&&analyticsConsentGranted();
  }
  function buildPayload(type,restaurantId,meta={}){
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
      p_anonymous_id:storedUuid(localStorage,ANON_KEY),
      p_session_id:storedUuid(sessionStorage,SESSION_KEY),
      p_metadata:metadata
    };
  }
  function pilotCode(raw){
    const value=String(raw||'').trim().toUpperCase();
    return /^P(?:0[1-9]|[12][0-9]|30)$/.test(value)?value:null;
  }
  function capturePilotEnrollment(){
    const params=new URLSearchParams(window.location.search||'');
    const hasPilotParam=params.has('pilot');
    const incoming=pilotCode(params.get('pilot'));
    let selected=null;

    // Always strip the pilot query value, including malformed/free-text values, so
    // the URL cannot retain accidental personal information or become a second store.
    if(hasPilotParam){
      params.delete('pilot');
      if(window.history&&typeof window.history.replaceState==='function'){
        const query=params.toString();
        const clean=`${window.location.pathname}${query?`?${query}`:''}${window.location.hash||''}`;
        window.history.replaceState(window.history.state,'',clean);
      }
    }

    // On Production, pilot cohort identifiers are analytics storage and therefore
    // remain memory-only until analytics consent exists. Preview/QA retains the old
    // deterministic behavior so the flow can be tested without Production writes.
    const mayPersist=!productionHost()||analyticsConsentGranted();
    if(mayPersist){
      let stored=null;
      try{stored=pilotCode(localStorage.getItem(PILOT_KEY))}catch{}
      selected=stored;
      if(incoming){
        if(stored&&stored!==incoming){
          console.warn('HOY proof-gate pilot code conflict ignored');
        }else if(!stored){
          try{localStorage.setItem(PILOT_KEY,incoming)}catch{}
          selected=incoming;
        }
      }
    }
    return selected||incoming||null;
  }
  function schedulePilotEnrollment(code,attempt=0){
    if(!code)return;

    const prodAllowed=productionAnalyticsAllowed();
    if(prodAllowed){
      try{if(localStorage.getItem(PILOT_SENT_KEY)===code)return}catch{}
    }

    // Local/preview/Playwright runs exercise the sanitized payload once for QA, but
    // never retry or write to Production. Production without consent stops here.
    if(!prodAllowed){
      if(!productionHost()&&qaRuntimeDetected()&&attempt===0)trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code});
      return;
    }

    if(!sb||cloud.status!=='online'){
      if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
      return;
    }
    Promise.resolve(trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code})).then(sent=>{
      if(sent){try{localStorage.setItem(PILOT_SENT_KEY,code)}catch{}}
      else if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
    });
  }

  clearProductionAnalyticsStorage();
  window.hoyAnalyticsConsentGranted181=analyticsConsentGranted;
  window.hoyProductionAnalyticsAllowed181=productionAnalyticsAllowed;

  trackEvent=function(type,restaurantId,meta={}){
    // Production is fail-closed before any analytics identifier, raw event history
    // or Supabase payload is created. A future consent UI must set CONSENT_KEY only
    // after informed, granular opt-in and must support revocation/cleanup.
    if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false);

    // Local/preview QA keeps a bounded local event history for deterministic tests.
    // Production never stores the raw analytics event history in localStorage.
    if(!productionHost()){
      const rows=readEvents();
      rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});
      localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));
    }

    const payload=buildPayload(type,restaurantId,meta);
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

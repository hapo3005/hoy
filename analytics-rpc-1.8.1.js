/* HOY 1.8.2 — validated Supabase RPC analytics + proof-gate enrollment */
(function(){
  const ANON_KEY='hoy-anonymous-id-v1';
  const SESSION_KEY='hoy-session-id-v1';
  const PILOT_KEY='hoy-proof-pilot-code-v1';
  const PILOT_SENT_KEY='hoy-proof-pilot-enrolled-v1';
  const CONSENT_KEY='hoy-privacy-analytics-consent-v1';
  const PRODUCTION_HOSTS=new Set(['hapo3005.github.io']);
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
  function safeMeta(meta={}){
    const out={};
    const blocked=/email|phone|address|note|message|name/i;
    for(const [key,value] of Object.entries(meta||{})){
      if(blocked.test(key))continue;
      if(['string','number','boolean'].includes(typeof value))out[key]=String(value).slice(0,120);
    }
    out.lang=state.lang;
    out.view=state.view;
    out.client_version='1.8.2';
    return out;
  }
  function qaRuntimeDetected(){
    return localStorage.getItem('hoy-qa-runtime')==='1'||navigator.webdriver===true;
  }
  function analyticsConsentGranted(){
    return localStorage.getItem(CONSENT_KEY)==='granted';
  }
  function analyticsStorageAllowed(){
    return qaRuntimeDetected()||analyticsConsentGranted();
  }
  function clearAnalyticsIdentifiers(){
    localStorage.removeItem(ANON_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PILOT_KEY);
    localStorage.removeItem(PILOT_SENT_KEY);
    if(typeof ANALYTICS_KEY==='string'&&ANALYTICS_KEY)localStorage.removeItem(ANALYTICS_KEY);
  }
  function productionAnalyticsAllowed(){
    const host=String(window.location?.hostname||'').toLowerCase();
    return PRODUCTION_HOSTS.has(host)&&!qaRuntimeDetected()&&analyticsConsentGranted();
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
    const storageAllowed=analyticsStorageAllowed();
    const stored=storageAllowed?pilotCode(localStorage.getItem(PILOT_KEY)):null;
    let selected=stored;

    if(incoming&&storageAllowed){
      if(stored&&stored!==incoming){
        console.warn('HOY proof-gate pilot code conflict ignored');
      }else if(!stored){
        localStorage.setItem(PILOT_KEY,incoming);
        selected=incoming;
      }
    }

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
    return storageAllowed?(selected||incoming||null):null;
  }
  function schedulePilotEnrollment(code,attempt=0){
    if(!code||!analyticsStorageAllowed()||localStorage.getItem(PILOT_SENT_KEY)===code)return;

    // Local/preview/Playwright runs exercise the sanitized payload once for QA, but
    // never retry or write to Production. The production isolation rule stays intact.
    if(!productionAnalyticsAllowed()){
      if(qaRuntimeDetected()&&attempt===0)trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code});
      return;
    }

    // Analytics loads before the final cloud initialization in the current shell.
    // Retry briefly instead of losing the one-time enrollment event while Supabase
    // is still connecting. Mark as enrolled only after the RPC confirms success.
    if(!sb||cloud.status!=='online'){
      if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
      return;
    }
    Promise.resolve(trackEvent('qr_open',null,{source:'proof_gate',pilot_code:code})).then(sent=>{
      if(sent)localStorage.setItem(PILOT_SENT_KEY,code);
      else if(attempt<30)setTimeout(()=>schedulePilotEnrollment(code,attempt+1),1000);
    });
  }

  // Deliberately minimal API for the future consent UI. The default state is no
  // analytics consent. Denial/withdrawal removes HOY analytics identifiers/history.
  window.hoyAnalyticsPrivacy181={
    consentKey:CONSENT_KEY,
    status:()=>localStorage.getItem(CONSENT_KEY)||'unset',
    grant:()=>{localStorage.setItem(CONSENT_KEY,'granted');return 'granted'},
    deny:()=>{localStorage.setItem(CONSENT_KEY,'denied');clearAnalyticsIdentifiers();return 'denied'},
    withdraw:()=>{localStorage.setItem(CONSENT_KEY,'denied');clearAnalyticsIdentifiers();return 'denied'},
    clear:()=>{localStorage.removeItem(CONSENT_KEY);clearAnalyticsIdentifiers();return 'unset'}
  };

  window.hoyProductionAnalyticsAllowed181=productionAnalyticsAllowed;
  trackEvent=function(type,restaurantId,meta={}){
    // Privacy fail-closed: outside the explicit QA runtime, no identifier, local
    // analytics history or payload is created until the user has opted in.
    if(!analyticsStorageAllowed())return Promise.resolve(false);

    const rows=readEvents();
    rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});
    localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));

    // Build the exact sanitized payload only after the storage/consent gate. This
    // avoids creating persistent anonymous/session identifiers before consent.
    const payload=buildPayload(type,restaurantId,meta);
    if(qaRuntimeDetected())window.hoyLastQaAnalyticsPayload181=payload;
    else if('hoyLastQaAnalyticsPayload181' in window)delete window.hoyLastQaAnalyticsPayload181;

    // Production analytics are fail-closed: only the explicit production host,
    // a real non-QA browser and explicit analytics consent may write.
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

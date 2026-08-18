/* HOY 1.8.1 — validated Supabase RPC analytics hotfix */
(function(){
  const ANON_KEY='hoy-anonymous-id-v1';
  const SESSION_KEY='hoy-session-id-v1';
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
    out.client_version='1.8.1';
    return out;
  }
  function qaRuntimeDetected(){
    return localStorage.getItem('hoy-qa-runtime')==='1'||navigator.webdriver===true;
  }
  function productionAnalyticsAllowed(){
    const host=String(window.location?.hostname||'').toLowerCase();
    return PRODUCTION_HOSTS.has(host)&&!qaRuntimeDetected();
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
  window.hoyProductionAnalyticsAllowed181=productionAnalyticsAllowed;
  trackEvent=function(type,restaurantId,meta={}){
    const rows=readEvents();
    rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});
    localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));

    // Build the exact sanitized payload before deciding on transport. In QA this
    // creates a test-only snapshot so attribution/metadata can be verified without
    // calling the production RPC. Real production sessions expose no debug snapshot.
    const payload=buildPayload(type,restaurantId,meta);
    if(qaRuntimeDetected())window.hoyLastQaAnalyticsPayload181=payload;
    else if('hoyLastQaAnalyticsPayload181' in window)delete window.hoyLastQaAnalyticsPayload181;

    // Production analytics are fail-closed: only the explicit production host and
    // a real non-QA browser may write. Local, preview and Playwright runs still
    // exercise the complete analytics enrichment path but stop before transport.
    if(!productionAnalyticsAllowed())return;
    if(!sb||cloud.status!=='online')return;
    sb.rpc('log_analytics_event',payload).then(({error})=>{if(error)console.warn('HOY analytics RPC rejected',error.message)});
  };
})();

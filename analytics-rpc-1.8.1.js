/* HOY 1.8.1 — validated Supabase RPC analytics hotfix */
(function(){
  const ANON_KEY='hoy-anonymous-id-v1';
  const SESSION_KEY='hoy-session-id-v1';
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
  trackEvent=function(type,restaurantId,meta={}){
    const rows=readEvents();
    rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});
    localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));
    if(!sb||cloud.status!=='online')return;
    const venue=restaurantId?DATA.find(x=>Number(x.id)===Number(restaurantId)):null;
    const metadata={...safeMeta(meta),venue_type:venue?.venue_type||undefined,profile_quality:venue?.profile_quality||undefined};
    sb.rpc('log_analytics_event',{
      p_event_type:type,
      p_restaurant_id:Number(restaurantId)||null,
      p_anonymous_id:storedUuid(localStorage,ANON_KEY),
      p_session_id:storedUuid(sessionStorage,SESSION_KEY),
      p_metadata:metadata
    }).then(({error})=>{if(error)console.warn('HOY analytics RPC rejected',error.message)});
  };
})();

/* HOY 2.18 — privacy-safe sponsored attribution, launch pricing and operator results */
(function(){
  const ATTR_KEY='hoy-promo-attribution-v1';
  const WINDOW_MS=30*60*1000;
  const LAUNCH_PRICE_CENTS=2900;
  const ATTRIBUTABLE=new Set(['profile_view','route_start','service_open','website_open','reservation_start','reservation_submit','call_start','menu_open']);
  const asDate=v=>{const d=v instanceof Date?v:new Date(v);return Number.isFinite(d.getTime())?d:null};
  const fmtMoney=cents=>Number.isInteger(Number(cents))?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(cents)/100):'—';
  const esc2=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentRestaurant=()=>{try{const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;return p&&typeof isClaimed==='function'&&isClaimed(p)?p:null}catch(_){return null}};

  function readAttribution(){
    try{
      const raw=sessionStorage.getItem(ATTR_KEY);if(!raw)return null;
      const a=JSON.parse(raw);if(!a?.promotion_id||!a?.restaurant_id||Number(a.expires_at)<=Date.now()){sessionStorage.removeItem(ATTR_KEY);return null}
      return a;
    }catch(_){return null}
  }
  function writeAttribution(open){
    const promotionId=String(open?.dataset?.promotionTrack||'');const offerId=String(open?.dataset?.promotionOffer||'');const restaurantId=Number(open?.dataset?.promotionOpen);
    if(!promotionId||!Number.isInteger(restaurantId))return;
    try{sessionStorage.setItem(ATTR_KEY,JSON.stringify({promotion_id:promotionId,offer_id:offerId,restaurant_id:restaurantId,opened_at:Date.now(),expires_at:Date.now()+WINDOW_MS,model:'sponsored_open_30m_same_venue'}))}catch(_){}
  }
  document.addEventListener('click',e=>{const open=e.target.closest?.('[data-promotion-open]');if(open)writeAttribution(open)},true);

  if(typeof trackEvent==='function'&&!window.__hoyPromotionAttribution218){
    window.__hoyPromotionAttribution218=true;
    const baseTrack=trackEvent;
    trackEvent=function(type,restaurantId,meta={}){
      const a=readAttribution();let next=meta||{};
      if(a&&Number(restaurantId)===Number(a.restaurant_id)&&ATTRIBUTABLE.has(String(type))){
        next={...next,promotion_id:a.promotion_id,offer_id:a.offer_id,promotion_attribution:a.model,sponsored:true};
      }
      return baseTrack(type,restaurantId,next);
    };
  }
  window.hoyPromotionAttribution218=()=>readAttribution();

  function decorateLaunchPrice(){
    document.querySelectorAll('.hoy-promo-request-panel:not([data-launch-price-218])').forEach(panel=>{
      panel.dataset.launchPrice218='1';
      const target=panel.querySelector('dl')||panel;
      target.insertAdjacentHTML('afterend',`<div class="hoy-promo-launch-price"><div><small>HOY STARTMODELL</small><b>${fmtMoney(LAUNCH_PRICE_CENTS)} pro Event</b></div><p>Empfohlener Einführungspreis. Verbindlich wird der Preis erst mit der manuellen HOY-Freigabe. Keine automatische Abbuchung.</p></div>`);
    });
  }

  async function loadCampaigns(p){
    const {data,error}=await sb.from('event_promotions')
      .select('id,offer_id,restaurant_id,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,approved_at,created_at,updated_at')
      .eq('restaurant_id',Number(p.id)).order('created_at',{ascending:false}).limit(8);
    if(error)throw error;return data||[];
  }
  async function loadInsight(id){
    const {data,error}=await sb.functions.invoke('promotion-insights',{body:{promotion_id:id}});if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  }
  function metric(label,value,sub=''){return `<div class="hoy-promo-result-metric"><b>${esc2(value)}</b><span>${esc2(label)}</span>${sub?`<small>${esc2(sub)}</small>`:''}</div>`}
  function resultCard(row,insight){
    const m=insight?.metrics||{};const ended=asDate(row.ends_at)&&asDate(row.ends_at)<=new Date();
    const price=Number(row.quoted_price_cents);const paid=Number.isFinite(price)&&price>0?fmtMoney(price):'Kostenfrei';
    const cpo=m.cost_per_profile_open_cents==null?'—':fmtMoney(m.cost_per_profile_open_cents);
    const cpa=m.cost_per_qualified_action_cents==null?'—':fmtMoney(m.cost_per_qualified_action_cents);
    return `<article class="hoy-promo-result-card"><div class="hoy-promo-result-head"><div><small>${ended?'ABGESCHLOSSEN':'LIVE'}</small><b>HOY Highlight</b></div><span>${esc2(paid)}</span></div><div class="hoy-promo-result-grid">${metric('erreichte Sitzungen',m.reached_sessions||0)}${metric('Profilöffnungen',m.profile_open_sessions||0,`${m.profile_open_rate_pct||0}% Rate`)}${metric('qualifizierte Aktionen',m.qualified_action_sessions||0,`${m.qualified_action_rate_pct||0}% Rate`)}${metric('Kosten / Profilöffnung',cpo)}${metric('Kosten / Aktion',cpa)}</div><p>Attribution: nach Klick auf die gesponserte HOY-Fläche, 30 Minuten, nur für denselben Betrieb. Ausschließlich aggregierte Werte.</p></article>`;
  }
  async function renderOperatorResults(){
    const d=document.getElementById('hoyCurrentManager'),p=currentRestaurant();
    if(!d?.open||!p||!sb||!cloud?.user)return;
    if(d.dataset.promoResultsLoading218==='1')return;d.dataset.promoResultsLoading218='1';
    try{
      const rows=(await loadCampaigns(p)).filter(x=>['active','cancelled'].includes(String(x.status))||asDate(x.ends_at)<=new Date()).filter(x=>x.approved_at||x.quoted_price_cents!=null).slice(0,4);
      const sig=rows.map(x=>`${x.id}:${x.status}:${x.billing_status}:${x.updated_at||x.ends_at}`).join('|');
      if(sig&&d.dataset.promoResultsSig218===sig&&d.querySelector('.hoy-promo-performance-218'))return;
      d.querySelector('.hoy-promo-performance-218')?.remove();
      d.dataset.promoResultsSig218=sig;
      if(!rows.length)return;
      const insights=[];for(const row of rows){try{insights.push([row,await loadInsight(row.id)])}catch(_){}}
      if(!insights.length)return;
      const sec=document.createElement('section');sec.className='hoy-promo-performance-218';sec.innerHTML=`<div class="hoy-promo-performance-head"><small>HOY HIGHLIGHT</small><h3>Ergebnisse deiner Hervorhebungen</h3><p>Messbar, klar gekennzeichnet und getrennt vom organischen Ranking.</p></div>${insights.map(([row,i])=>resultCard(row,i)).join('')}`;
      d.appendChild(sec);
    }catch(err){console.warn('HOY promotion insights unavailable',err)}finally{d.dataset.promoResultsLoading218='0'}
  }

  let timer=0;
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{decorateLaunchPrice();renderOperatorResults()},80)});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  setTimeout(()=>{decorateLaunchPrice();renderOperatorResults()},0);
})();

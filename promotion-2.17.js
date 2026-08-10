/* HOY 2.17 — transparent sponsored event placement without changing organic ranking */
(function(){
  const KIND_LABELS={live_music:'Live-Musik',dj:'DJ',sports:'Sportübertragung',tasting:'Verkostung',themed_evening:'Themenabend',party:'Party',other:'Event'};
  const promoState={rows:[],byOffer:new Map(),loaded:false,error:''};
  const operatorState={restaurantId:null,offers:[],promotions:[],sig:'',loading:false};
  const escAttr=v=>esc(String(v??''));
  const asDate=v=>{const d=v instanceof Date?v:new Date(v);return Number.isFinite(d.getTime())?d:null};
  const formatTime=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(d):''};
  const formatShort=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d):'—'};
  const formatMoney=cents=>Number.isInteger(Number(cents))?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(cents)/100):'';
  const madridDay=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(d):''};
  const tomorrowKey=()=>madridDay(new Date(Date.now()+86400000));

  function normalizePromo(row){return {...row,restaurant_id:Number(row.restaurant_id),quoted_price_cents:row.quoted_price_cents==null?null:Number(row.quoted_price_cents)}}
  function guestEligible(row,now=new Date()){
    const start=asDate(row?.starts_at),end=asDate(row?.ends_at);
    return String(row?.status)==='active'&&['paid','comped'].includes(String(row?.billing_status))&&!!start&&!!end&&start<=now&&end>now;
  }
  function promoForOffer(id){return (promoState.byOffer.get(String(id))||[]).find(x=>guestEligible(x))||null}
  function currentRowsFor(p){return typeof window.hoyCurrentContentFor==='function'?(window.hoyCurrentContentFor(p)||[]):[]}
  function promoTuple(row){
    if(!row)return null;
    const p=(DATA||[]).find(x=>Number(x.id)===Number(row.restaurant_id));if(!p)return null;
    const offer=currentRowsFor(p).find(x=>String(x.id)===String(row.offer_id));if(!offer)return null;
    return {promo:row,p,offer};
  }
  function venuePromotion(p){
    for(const offer of currentRowsFor(p)){
      const promo=promoForOffer(offer.id);if(promo)return {promo,offer};
    }
    return null;
  }
  function eventWhen(row,now=new Date()){
    const start=asDate(row?.starts_at),end=asDate(row?.ends_at);if(!start||!end)return 'Termin prüfen';
    if(now>=start&&now<end)return `Laut Termin · jetzt${formatTime(end)?` bis ${formatTime(end)}`:''}`;
    const mins=Math.round((start-now)/60000);
    if(madridDay(start)===madridDay(now))return mins>0&&mins<=120?`Beginnt in ${mins} Min.`:`Heute · ab ${formatTime(start)}`;
    if(madridDay(start)===tomorrowKey())return `Morgen · ${formatTime(start)}`;
    return `${new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',weekday:'short',day:'2-digit',month:'short'}).format(start)} · ${formatTime(start)}`;
  }
  function kindLabel(row){return KIND_LABELS[row?.event_kind]||'Event'}

  async function loadPublicPromotions(){
    if(!sb)return;
    try{
      const {data,error}=await sb.from('event_promotions')
        .select('id,offer_id,restaurant_id,placement,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,created_at,updated_at')
        .eq('status','active')
        .order('created_at',{ascending:true});
      if(error)throw error;
      promoState.rows=(data||[]).map(normalizePromo).filter(guestEligible);
      promoState.byOffer=new Map();
      for(const row of promoState.rows){const key=String(row.offer_id);const list=promoState.byOffer.get(key)||[];list.push(row);promoState.byOffer.set(key,list)}
      promoState.loaded=true;promoState.error='';
    }catch(err){promoState.loaded=true;promoState.error=err?.message||String(err);console.warn('HOY promotions unavailable',err)}
  }
  window.hoyLoadPublicPromotions=loadPublicPromotions;

  const baseLoadCloudRestaurants217=loadCloudRestaurants;
  loadCloudRestaurants=async function(){await baseLoadCloudRestaurants217();await loadPublicPromotions()};

  function pickHighlight(){
    const candidates=promoState.rows.map(promoTuple).filter(Boolean);
    if(!candidates.length)return null;
    candidates.sort((a,b)=>(asDate(a.promo.created_at)?.getTime()||0)-(asDate(b.promo.created_at)?.getTime()||0));
    let seed=0;
    try{
      let raw=sessionStorage.getItem('hoy-promo-slot-seed-v1');
      if(!raw){raw=String(Math.floor(Math.random()*1_000_000_000));sessionStorage.setItem('hoy-promo-slot-seed-v1',raw)}
      seed=Math.abs(Number(raw)||0);
    }catch(_){seed=Math.floor(Date.now()/3600000)}
    return candidates[seed%candidates.length];
  }
  function sponsoredChip(extra=''){return `<span class="hoy-sponsored-chip"${extra}>Gesponsert</span>`}
  function highlightMarkup(tuple){
    const {promo,p,offer}=tuple;
    return `<section class="hoy-promo-highlight" data-promotion-id="${escAttr(promo.id)}" data-promotion-offer="${escAttr(offer.id)}" data-promotion-restaurant="${Number(p.id)}"><div class="hoy-promo-kicker"><span>HOY HIGHLIGHT</span>${sponsoredChip()}</div><button type="button" class="hoy-promo-card" data-promotion-open="${Number(p.id)}" data-promotion-track="${escAttr(promo.id)}" data-promotion-offer="${escAttr(offer.id)}"><span class="hoy-promo-when">${escAttr(eventWhen(offer))}</span><strong>${escAttr(offer.title)}</strong><small>${escAttr(p.name)} · ${escAttr(kindLabel(offer))}</small><span class="hoy-promo-cta">Event ansehen <b aria-hidden="true">→</b></span></button><p>Gesponserte Platzierung · Terminangaben vom Betrieb. Organische Treffer bleiben unverändert.</p></section>`;
  }

  const baseHome217=home;
  home=function(){
    const html=baseHome217();const tuple=pickHighlight();if(!tuple)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const hero=root.querySelector('.journey-hero')||root.firstElementChild;
    if(hero)hero.insertAdjacentHTML('afterend',highlightMarkup(tuple));else root.insertAdjacentHTML('afterbegin',highlightMarkup(tuple));
    root.querySelectorAll(`.hoy-today-card[data-current-open="${Number(tuple.p.id)}"]`).forEach(card=>{
      const title=card.querySelector('strong')?.textContent?.trim();if(title===String(tuple.offer.title||'').trim())card.remove();
    });
    return root.outerHTML;
  };

  const baseListCard217=listCard;
  listCard=function(p){
    const html=baseListCard217(p);const active=venuePromotion(p);if(!active)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const card=shell.firstElementChild;if(!card)return html;
    card.classList.add('has-sponsored-event');
    const signal=card.querySelector('.hoy-current-signal');
    const marker=`<div class="hoy-sponsored-context">${sponsoredChip()}<span>${escAttr(active.offer.title)}</span></div>`;
    if(signal)signal.insertAdjacentHTML('beforebegin',marker);else (card.querySelector('.decision-copy')||card).insertAdjacentHTML('beforeend',marker);
    return card.outerHTML;
  };

  const baseMapView217=mapView;
  mapView=function(){
    const html=baseMapView217();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.map-decision-card[data-map-card]').forEach(card=>{
      const p=(DATA||[]).find(x=>Number(x.id)===Number(card.dataset.mapCard));const active=venuePromotion(p);if(!active)return;
      card.classList.add('has-sponsored-event');
      const signal=card.querySelector('.hoy-current-signal');const marker=`<div class="hoy-sponsored-context map-sponsored">${sponsoredChip()}<span>${escAttr(active.offer.title)}</span></div>`;
      if(signal)signal.insertAdjacentHTML('beforebegin',marker);else (card.querySelector('.map-decision-signals')||card).insertAdjacentHTML('beforebegin',marker);
    });
    return root.outerHTML;
  };

  function decorateProfilePromotions(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));const d=document.getElementById('detail');if(!p||!d?.open)return;
    const rows=currentRowsFor(p).slice(0,5),items=[...d.querySelectorAll('#profile-current .hoy-current-item')];
    items.forEach((item,i)=>{const row=rows[i];const promo=promoForOffer(row?.id);if(!promo||item.querySelector('.hoy-sponsored-chip'))return;item.classList.add('sponsored');item.querySelector('.hoy-current-item-top')?.insertAdjacentHTML('afterbegin',sponsoredChip())});
  }
  const baseOpenDetail217=openDetail;
  openDetail=function(id){baseOpenDetail217(id);decorateProfilePromotions(id);setTimeout(()=>decorateProfilePromotions(id),0)};

  function trackOnce(promoId,offerId,restaurantId){
    const key=`hoy-promo-impression:${promoId}`;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch(_){}
    if(typeof trackEvent==='function')trackEvent('promotion_impression',restaurantId,{promotion_id:promoId,offer_id:offerId,placement:'home_highlight',sponsored:true});
  }
  function inspectHighlight(){
    const el=document.querySelector('.hoy-promo-highlight[data-promotion-id]');if(!el)return;
    trackOnce(el.dataset.promotionId,el.dataset.promotionOffer,Number(el.dataset.promotionRestaurant));
  }
  if(!document.documentElement.dataset.hoyPromotionActions217){
    document.documentElement.dataset.hoyPromotionActions217='1';
    document.addEventListener('click',e=>{
      const open=e.target.closest?.('[data-promotion-open]');if(!open)return;
      e.preventDefault();
      if(typeof trackEvent==='function')trackEvent('promotion_open',Number(open.dataset.promotionOpen),{promotion_id:open.dataset.promotionTrack,offer_id:open.dataset.promotionOffer,placement:'home_highlight',sponsored:true});
      openDetail(Number(open.dataset.promotionOpen));
    });
  }
  const baseWire217=wire;
  wire=function(){baseWire217();setTimeout(inspectHighlight,0)};

  function currentRestaurant(){const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;return p&&typeof isClaimed==='function'&&isClaimed(p)?p:null}
  function nativeManagerSignature(d){
    return [...d.querySelectorAll('.hoy-manager-row')].map(row=>{
      const id=row.querySelector('[data-current-archive],[data-current-edit],[data-current-publish],[data-current-next-week]')?.dataset;
      const value=id?.currentArchive||id?.currentEdit||id?.currentPublish||id?.currentNextWeek||'';
      return `${value}:${row.querySelector('[data-current-archive]')?'published':'draft'}:${row.querySelector('.hoy-manager-row-main b')?.textContent||''}`;
    }).join('|');
  }
  async function loadOperatorPromotionData(p){
    if(!sb||!cloud?.user||!p)return;
    operatorState.loading=true;
    try{
      const [offers,promos]=await Promise.all([
        sb.from('offers').select('id,offer_type,event_kind,title,status,starts_at,ends_at').eq('restaurant_id',Number(p.id)).order('starts_at',{ascending:false}),
        sb.from('event_promotions').select('id,offer_id,restaurant_id,placement,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,rejection_reason,created_at,updated_at,approved_at').eq('restaurant_id',Number(p.id)).order('created_at',{ascending:false})
      ]);
      if(offers.error)throw offers.error;if(promos.error)throw promos.error;
      operatorState.restaurantId=Number(p.id);operatorState.offers=offers.data||[];operatorState.promotions=(promos.data||[]).map(normalizePromo);
    }catch(err){console.warn('HOY operator promotions unavailable',err)}finally{operatorState.loading=false}
  }
  function latestPromotion(offerId){return operatorState.promotions.find(x=>String(x.offer_id)===String(offerId))||null}
  function operatorPromoStatus(promo){
    if(!promo)return '';
    if(promo.status==='requested')return `<div class="hoy-promo-operator-status pending"><b>Hervorhebung angefragt</b><span>Preis und Aktivierung werden von HOY bestätigt. Keine automatische Abbuchung.</span><button type="button" data-promo-withdraw="${escAttr(promo.id)}">Anfrage zurückziehen</button></div>`;
    if(promo.status==='active'){
      const billing=promo.billing_status==='paid'?(formatMoney(promo.quoted_price_cents)||'manuell bestätigt'):'kostenfrei aktiviert';
      return `<div class="hoy-promo-operator-status active"><b>HOY Highlight freigegeben</b><span>${escAttr(billing)} · sichtbar ${escAttr(formatShort(promo.starts_at))}–${escAttr(formatShort(promo.ends_at))}</span></div>`;
    }
    if(promo.status==='rejected')return `<div class="hoy-promo-operator-status closed"><b>Zuletzt nicht aktiviert</b><span>${escAttr(promo.rejection_reason||'Du kannst eine neue Hervorhebung anfragen.')}</span></div>`;
    return '';
  }
  function decorateManager(){
    const d=document.getElementById('hoyCurrentManager');if(!d?.open)return;
    d.querySelectorAll('.hoy-promo-operator-status,.hoy-promo-request-panel').forEach(x=>x.remove());
    d.querySelectorAll('.hoy-manager-row').forEach(row=>{
      const control=row.querySelector('[data-current-archive],[data-current-edit],[data-current-publish],[data-current-next-week]');
      const ds=control?.dataset||{};const offerId=ds.currentArchive||ds.currentEdit||ds.currentPublish||ds.currentNextWeek;if(!offerId)return;
      const offer=operatorState.offers.find(x=>String(x.id)===String(offerId));
      if(!offer||offer.offer_type!=='event'||offer.status!=='published'||!asDate(offer.ends_at)||asDate(offer.ends_at)<=new Date())return;
      const promo=latestPromotion(offerId);const actions=row.querySelector('.hoy-manager-actions');if(!actions)return;
      if(promo)row.insertAdjacentHTML('beforeend',operatorPromoStatus(promo));
      if(!promo||['rejected','cancelled'].includes(String(promo.status))){
        const btn=document.createElement('button');btn.type='button';btn.className='hoy-promo-request-button';btn.dataset.promoRequestFor=offerId;btn.textContent='Event hervorheben';actions.appendChild(btn);
      }
    });
  }
  function showRequestPanel(offerId){
    const d=document.getElementById('hoyCurrentManager');const offer=operatorState.offers.find(x=>String(x.id)===String(offerId));if(!d||!offer)return;
    const row=[...d.querySelectorAll('.hoy-manager-row')].find(x=>x.querySelector(`[data-current-archive="${CSS.escape(String(offerId))}"]`));if(!row)return;
    d.querySelectorAll('.hoy-promo-request-panel').forEach(x=>x.remove());
    const start=new Date(Math.max(Date.now(),new Date(offer.starts_at).getTime()-86400000));
    row.insertAdjacentHTML('beforeend',`<div class="hoy-promo-request-panel"><div><small>SEPARAT BUCHBAR</small><h4>HOY Highlight</h4><p>Dein Event bekommt einen klar gekennzeichneten gesponserten Platz auf der Startseite und einen Hinweis in passenden Kontextflächen. Die organische Reihenfolge bleibt unverändert.</p><dl><div><dt>Laufzeit</dt><dd>${escAttr(formatShort(start))} bis ${escAttr(formatShort(offer.ends_at))}</dd></div><div><dt>Abrechnung</dt><dd>Preis wird vor Aktivierung von HOY bestätigt. Keine automatische Abbuchung.</dd></div></dl></div><div class="hoy-promo-request-actions"><button type="button" data-promo-request-cancel>Abbrechen</button><button type="button" class="primary" data-promo-request-confirm="${escAttr(offerId)}">Hervorhebung anfragen</button></div></div>`);
  }
  async function requestPromotion(offerId){
    const p=currentRestaurant(),offer=operatorState.offers.find(x=>String(x.id)===String(offerId));if(!p||!offer||!cloud?.user)return;
    const start=new Date(Math.max(Date.now(),new Date(offer.starts_at).getTime()-86400000)).toISOString();const end=new Date(offer.ends_at).toISOString();
    try{
      const {error}=await sb.from('event_promotions').insert({offer_id:offer.id,restaurant_id:Number(p.id),requested_by:cloud.user.id,placement:'home_highlight',status:'requested',billing_status:'pending',starts_at:start,ends_at:end,currency:'EUR'});if(error)throw error;
      toast('Hervorhebung angefragt – keine automatische Abbuchung');operatorState.sig='';await syncManager();
    }catch(err){toast(err?.code==='23505'?'Für dieses Event gibt es bereits eine offene Hervorhebung.':(err?.message||'Hervorhebung konnte nicht angefragt werden'))}
  }
  async function withdrawPromotion(id){
    try{const {error}=await sb.from('event_promotions').delete().eq('id',id);if(error)throw error;toast('Anfrage zurückgezogen');operatorState.sig='';await syncManager()}catch(err){toast(err?.message||'Anfrage konnte nicht zurückgezogen werden')}
  }
  async function syncManager(){
    const d=document.getElementById('hoyCurrentManager');
    if(!d?.open){operatorState.sig='';return}
    const p=currentRestaurant();if(!p)return;
    const sig=nativeManagerSignature(d);if(operatorState.restaurantId===Number(p.id)&&operatorState.sig===sig)return;
    operatorState.sig=sig;await loadOperatorPromotionData(p);decorateManager();
  }
  let managerTimer=0;
  const observer=new MutationObserver(()=>{clearTimeout(managerTimer);managerTimer=setTimeout(syncManager,60)});
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('click',e=>{
    const request=e.target.closest?.('[data-promo-request-for]');if(request){e.preventDefault();showRequestPanel(request.dataset.promoRequestFor);return}
    const cancel=e.target.closest?.('[data-promo-request-cancel]');if(cancel){e.preventDefault();cancel.closest('.hoy-promo-request-panel')?.remove();return}
    const confirm=e.target.closest?.('[data-promo-request-confirm]');if(confirm){e.preventDefault();requestPromotion(confirm.dataset.promoRequestConfirm);return}
    const withdraw=e.target.closest?.('[data-promo-withdraw]');if(withdraw){e.preventDefault();withdrawPromotion(withdraw.dataset.promoWithdraw)}
  });
})();
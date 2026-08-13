/* HOY 2.39.0 — live decision benchmark layer: nearby, next-two-hours timeline and personal plan */
(function(){
  if(window.__hoyLiveDecision239)return;
  window.__hoyLiveDecision239=true;
  window.hoyLiveDecisionVersion='2.39.0';

  const PLAN_KEY='hoy-live-plan-v239';
  const TZ='Europe/Madrid';
  const live={position:null,geoState:'idle',geoError:''};
  const esc239=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function restaurantById(id){return (DATA||[]).find(x=>Number(x.id)===Number(id))||null}
  function nowStatus(p,now=new Date()){return window.hoyNowStatus219For?.(p,now)||null}
  function currentFor(p){return window.hoyBestCurrentFor?.(p)||null}
  function ranked(rows,now=new Date()){return window.hoyDecision280Rank?.(rows,now)||[...(rows||[])]}
  function openRestaurant(id){if(typeof openDetail==='function')openDetail(Number(id))}

  function madridParts(value=new Date()){
    const date=value instanceof Date?value:new Date(value);if(!Number.isFinite(date.getTime()))return null;
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return {day:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))};
  }
  function sameMadridDay(a,b=new Date()){const pa=madridParts(a),pb=madridParts(b);return !!pa&&!!pb&&pa.day===pb.day}
  function formatTime(value){
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
    return new Intl.DateTimeFormat('de-DE',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}).format(d);
  }
  function phaseFor(row,now=new Date()){
    if(!row)return null;const start=new Date(row.starts_at),end=new Date(row.ends_at);
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return null;
    if(now>=start&&now<end)return {key:'running',label:`Läuft jetzt · bis ${formatTime(end)}`,rank:0};
    if(start>now&&sameMadridDay(start,now)){
      const mins=Math.max(1,Math.round((start-now)/60000));
      if(mins<=120)return {key:'soon',label:`Startet in ${mins} Min. · ${formatTime(start)}`,rank:1,mins};
      return {key:'today',label:`Heute · ${formatTime(start)}`,rank:2,mins};
    }
    return null;
  }

  function readPlan(){
    try{return [...new Set((JSON.parse(localStorage.getItem(PLAN_KEY)||'[]')||[]).map(Number).filter(Number.isFinite))].slice(0,4)}catch{return []}
  }
  function savePlan(ids){localStorage.setItem(PLAN_KEY,JSON.stringify([...new Set(ids.map(Number).filter(Number.isFinite))].slice(0,4)))}
  function planHas(id){return readPlan().includes(Number(id))}
  function addPlan(id){const ids=readPlan();if(!ids.includes(Number(id)))ids.push(Number(id));savePlan(ids);if(typeof trackEvent==='function')trackEvent('live_plan_add',id,{surface:'live239'});render()}
  function removePlan(id){savePlan(readPlan().filter(x=>x!==Number(id)));if(typeof trackEvent==='function')trackEvent('live_plan_remove',id,{surface:'live239'});render()}
  function clearPlan(){savePlan([]);if(typeof trackEvent==='function')trackEvent('live_plan_clear',null,{surface:'live239'});render()}

  function haversineKm(a,b){
    const toRad=x=>x*Math.PI/180,R=6371;
    const dLat=toRad(b.lat-a.lat),dLon=toRad(b.lon-a.lon),lat1=toRad(a.lat),lat2=toRad(b.lat);
    const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  function coordsFor(p){
    const lat=Number(p?.latitude),lon=Number(p?.longitude);
    return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null;
  }
  function distanceFor(p){const c=coordsFor(p);return live.position&&c?haversineKm(live.position,c):null}
  function distanceLabel(km){if(km==null)return '';if(km<1)return `${Math.max(50,Math.round(km*1000/50)*50)} m`;return `${km.toFixed(km<10?1:0).replace('.',',')} km`}

  function proofFor(p,now=new Date()){
    const status=nowStatus(p,now);if(!status)return {label:'Aktualität prüfen',tone:'uncertain'};
    if(status.operatorConfirmed)return {label:status.proof||'Vom Betrieb gepflegt',tone:'confirmed'};
    return {label:status.proof||'Nicht live bestätigt',tone:'base'};
  }
  function statusLine(p,now=new Date()){
    const status=nowStatus(p,now);const proof=proofFor(p,now);const event=currentFor(p);const phase=phaseFor(event,now);
    return `<div class="live239-signals">${status?`<span class="${esc239(status.state||'')}">${esc239(status.label||'')}</span>`:''}${phase?`<span class="event">${esc239(phase.label)}</span>`:''}<small class="${esc239(proof.tone)}">${esc239(proof.label)}</small></div>`;
  }

  function cardFor(p,{nearby=false,now=new Date()}={}){
    const km=distanceFor(p),inPlan=planHas(p.id);
    return `<article class="live239-card" data-live239-card="${Number(p.id)}">
      <button type="button" class="live239-card-main" data-live239-open="${Number(p.id)}">
        <div class="live239-card-top"><strong>${esc239(p.name)}</strong>${nearby&&km!=null?`<span class="live239-distance">${esc239(distanceLabel(km))}</span>`:''}</div>
        <span class="live239-area">${esc239(p.area||'')}</span>
        ${statusLine(p,now)}
      </button>
      <button type="button" class="live239-plan-toggle ${inPlan?'active':''}" data-live239-plan-toggle="${Number(p.id)}" aria-pressed="${inPlan?'true':'false'}">${inPlan?'Im Plan ✓':'Zum Plan +'}</button>
    </article>`;
  }

  function timelineRows(now=new Date()){
    const rows=[];
    for(const p of DATA||[]){
      const row=currentFor(p),phase=phaseFor(row,now);if(!row||!phase||!['running','soon'].includes(phase.key))continue;
      rows.push({p,row,phase,start:new Date(row.starts_at).getTime()||0});
    }
    return rows.sort((a,b)=>a.phase.rank-b.phase.rank||a.start-b.start).slice(0,6);
  }
  function timelineMarkup(now=new Date()){
    const rows=timelineRows(now);
    if(!rows.length)return `<div class="live239-empty"><b>In den nächsten 2 Stunden ist noch nichts Sicheres gemeldet.</b><span>HOY zeigt hier nur veröffentlichte aktuelle Hinweise – keine erfundenen Programmpunkte.</span></div>`;
    return `<div class="live239-timeline">${rows.map(({p,row,phase})=>`<button type="button" data-live239-open="${Number(p.id)}"><span class="live239-time ${esc239(phase.key)}">${esc239(phase.key==='running'?'JETZT':formatTime(row.starts_at))}</span><div><strong>${esc239(row.title||'Aktuell')}</strong><small>${esc239(p.name)} · ${esc239(phase.label)}</small></div><i aria-hidden="true">→</i></button>`).join('')}</div>`;
  }

  function nearbyMarkup(now=new Date()){
    if(live.geoState==='requesting')return `<div class="live239-empty"><b>Standort wird abgefragt …</b><span>HOY fragt deinen Standort nur nach deinem Klick ab.</span></div>`;
    if(live.geoState==='error')return `<div class="live239-empty warning"><b>Standort nicht verfügbar.</b><span>${esc239(live.geoError||'Bitte Standortfreigabe prüfen.')}</span><button type="button" data-live239-locate>Erneut versuchen</button></div>`;
    if(!live.position)return `<div class="live239-empty"><b>Was ist wirklich in deiner Nähe?</b><span>Mit deiner Freigabe sortiert HOY nach echter Entfernung – nicht nach Stadtteilnamen.</span><button type="button" data-live239-locate>Standort verwenden</button></div>`;
    const rows=(DATA||[]).filter(p=>coordsFor(p)).map(p=>({p,km:distanceFor(p)})).filter(x=>x.km!=null).sort((a,b)=>a.km-b.km).slice(0,3).map(x=>x.p);
    if(!rows.length)return `<div class="live239-empty"><b>Noch keine verlässlichen Koordinaten verfügbar.</b></div>`;
    return `<div class="live239-nearby-list">${rows.map(p=>cardFor(p,{nearby:true,now})).join('')}</div>`;
  }

  function planMarkup(now=new Date()){
    const rows=readPlan().map(restaurantById).filter(Boolean);
    if(!rows.length)return `<div class="live239-empty"><b>Dein HOY Plan ist noch leer.</b><span>Füge interessante Orte mit „Zum Plan +“ hinzu. Maximal vier – bewusst kompakt statt endloser Merkliste.</span></div>`;
    return `<div class="live239-plan-list">${rows.map((p,i)=>`<article><span class="live239-plan-index">${i+1}</span><button type="button" class="live239-plan-main" data-live239-open="${Number(p.id)}"><strong>${esc239(p.name)}</strong><small>${esc239(p.area||'')}</small>${statusLine(p,now)}</button><button type="button" class="live239-plan-remove" data-live239-plan-remove="${Number(p.id)}" aria-label="${esc239(p.name)} aus Plan entfernen">×</button></article>`).join('')}</div><button type="button" class="live239-clear" data-live239-plan-clear>Plan leeren</button>`;
  }

  function homeBlock(){
    const now=new Date();const recommended=ranked((DATA||[]).filter(p=>['open','later'].includes(nowStatus(p,now)?.state)),now).slice(0,3);
    return `<section class="live239" data-live239-root>
      <div class="live239-head"><div><span>HOY LIVE · 2.39</span><h2>Weniger suchen. Direkt entscheiden.</h2><p>Die besten Benidorm-Prinzipien als eigene HOY-Logik: nächste Stunden, echte Nähe und ein kleiner persönlicher Plan.</p></div><span class="live239-plan-count">${readPlan().length}/4 im Plan</span></div>
      <div class="live239-grid">
        <section class="live239-panel"><div class="live239-panel-head"><div><small>NÄCHSTE 2 STUNDEN</small><h3>Was gleich passiert.</h3></div></div>${timelineMarkup(now)}</section>
        <section class="live239-panel"><div class="live239-panel-head"><div><small>NEARBY</small><h3>Was wirklich nah ist.</h3></div>${live.position?'<button type="button" data-live239-locate>Neu orten</button>':''}</div>${nearbyMarkup(now)}</section>
      </div>
      ${recommended.length?`<section class="live239-recommended"><div class="live239-panel-head"><div><small>HOY EMPFIEHLT</small><h3>Jetzt gute Optionen.</h3></div></div><div class="live239-recommend-list">${recommended.map(p=>cardFor(p,{now})).join('')}</div></section>`:''}
      <section class="live239-panel live239-plan"><div class="live239-panel-head"><div><small>MEIN HOY PLAN</small><h3>Maximal vier gute Entscheidungen.</h3></div></div>${planMarkup(now)}</section>
    </section>`;
  }

  const baseHome239=home;
  home=function(){
    const html=baseHome239();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    if(root.querySelector('[data-live239-root]'))return root.outerHTML;
    const decision=root.querySelector('[data-decision280-home]');const today=root.querySelector('.hoy-today-strip');const hero=root.querySelector('.journey-hero')||root.firstElementChild;
    const anchor=decision||today||hero;
    if(anchor)anchor.insertAdjacentHTML('afterend',homeBlock());else root.insertAdjacentHTML('afterbegin',homeBlock());
    return root.outerHTML;
  };

  function requestLocation(){
    if(!navigator.geolocation){live.geoState='error';live.geoError='Dieses Gerät stellt HOY keinen Standort bereit.';render();return}
    live.geoState='requesting';live.geoError='';render();
    navigator.geolocation.getCurrentPosition(pos=>{
      live.position={lat:Number(pos.coords.latitude),lon:Number(pos.coords.longitude)};live.geoState='ready';
      if(typeof trackEvent==='function')trackEvent('live_nearby_enabled',null,{surface:'live239'});render();
    },err=>{
      live.geoState='error';live.geoError=err?.code===1?'Standortfreigabe wurde nicht erteilt.':'Standort konnte gerade nicht bestimmt werden.';render();
    },{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  }

  const baseWire239=wire;
  wire=function(){
    baseWire239();
    document.querySelectorAll('[data-live239-open]').forEach(b=>b.onclick=()=>openRestaurant(b.dataset.live239Open));
    document.querySelectorAll('[data-live239-plan-toggle]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=Number(b.dataset.live239PlanToggle);planHas(id)?removePlan(id):addPlan(id)});
    document.querySelectorAll('[data-live239-plan-remove]').forEach(b=>b.onclick=()=>removePlan(b.dataset.live239PlanRemove));
    document.querySelectorAll('[data-live239-plan-clear]').forEach(b=>b.onclick=clearPlan);
    document.querySelectorAll('[data-live239-locate]').forEach(b=>b.onclick=requestLocation);
  };

  window.hoyLiveDecision239={readPlan,addPlan,removePlan,requestLocation,distanceFor,timelineRows};
})();

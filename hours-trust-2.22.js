/* HOY 2.22.0 — customer-facing opening-hours trust states + one-tap operator day confirmation */
(function(){
  if(window.__hoyHoursTrust220)return;
  window.__hoyHoursTrust220=true;
  window.hoyHoursTrustVersion='2.22.0';

  const TZ='Europe/Madrid';
  const DAY_KEYS=['sun','mon','tue','wed','thu','fri','sat'];
  const escTrust=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUrl=v=>/^https?:\/\//i.test(String(v||''));

  function madridDate(value=new Date()){
    const d=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(d.getTime()))return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function prettyDate(value){
    if(!value)return '';
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
    try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}catch{return ''}
  }
  function sourceMarkup(p){
    const label=String(p?.hours_source_label||'').trim();
    const url=String(p?.hours_source_url||'').trim();
    const date=prettyDate(p?.hours_checked_at);
    if(!label&&!date)return '';
    const source=label?(validUrl(url)?`<a href="${escTrust(url)}" target="_blank" rel="noopener">${escTrust(label)} ↗</a>`:`<span>${escTrust(label)}</span>`):'';
    return `<div class="hours-trust-source">${source}${source&&date?'<i aria-hidden="true">·</i>':''}${date?`<span>geprüft ${escTrust(date)}</span>`:''}</div>`;
  }
  function operatorState(p){
    const meta=window.hoyLiveHoursMeta?.(p)||null;
    if(!meta?.operator)return null;
    const special=p?.operator_special_hours;
    const today=madridDate();
    const specialToday=special&&String(special.service_date||'')===today;
    const confirmedAt=p?.operator_hours?.confirmed_at||'';
    const confirmedToday=!!confirmedAt&&madridDate(confirmedAt)===today;
    const text=typeof effectiveValue==='function'?effectiveValue(p,'hours'):(p?.hours||'');
    if(specialToday)return {
      key:'operator-special',tone:'live',badge:'SONDERZEIT',title:'Heute gilt eine Betreiber-Sonderzeit',value:text||'Sonderzeit vom Betrieb hinterlegt',proof:'Direkte Betreiberangabe für heute.',note:special?.note||'',source:''
    };
    if(confirmedToday)return {
      key:'operator-today',tone:'live',badge:'HEUTE BESTÄTIGT',title:'Heute vom Betrieb bestätigt',value:text||'Zeiten vom Betrieb gepflegt',proof:'Der Betrieb hat heute bestätigt, dass der hinterlegte Plan gilt.',note:meta?.notice||'',source:''
    };
    return {
      key:'operator',tone:'operator',badge:'BETREIBER',title:'Vom Betrieb gepflegte Öffnungszeiten',value:text||'Zeiten vom Betrieb gepflegt',proof:meta?.updated?`Zuletzt bestätigt ${meta.updated}.`:'Direkte Betreiberangabe.',note:meta?.notice||'',source:''
    };
  }
  function baseState(p){
    const status=String(p?.hours_status||'missing');
    const raw=String(p?.hours_raw_text||p?.hours||'').trim();
    const note=String(p?.hours_note||'').trim();
    if(status==='verified')return {key:status,tone:'verified',badge:'HOY GEPRÜFT',title:'Basiszeiten verifiziert',value:raw||'Verifizierter Wochenplan vorhanden',proof:'Diese Basiszeiten sind für den HOY-NOW-Status freigegeben. Heute noch nicht vom Betrieb bestätigt.',note:'',source:sourceMarkup(p)};
    if(status==='conditional')return {key:status,tone:'conditional',badge:'BEDINGT',title:'Öffnungszeiten können heute abweichen',value:raw||'Saison- oder wetterabhängige Zeiten',proof:'HOY zeigt daraus bewusst keinen eindeutigen NOW-Status.',note:note,source:sourceMarkup(p)};
    if(status==='conflict')return {key:status,tone:'conflict',badge:'NICHT EINDEUTIG',title:'Öffnungszeiten derzeit nicht eindeutig',value:'Mehrere aktuelle Angaben widersprechen sich.',proof:'HOY zeigt deshalb bewusst keinen „Jetzt geöffnet“-Status.',note:raw||note,source:sourceMarkup(p)};
    if(status==='needs_review')return {key:status,tone:'review',badge:'IN PRÜFUNG',title:'Aktuelle Zeiten noch nicht bestätigt',value:raw||'Aktuelle Angaben liegen vor, sind aber noch nicht belastbar genug.',proof:'NOW bleibt aus, bis die Basis eindeutig bestätigt ist.',note:note,source:sourceMarkup(p)};
    return {key:'missing',tone:'missing',badge:'NOCH OFFEN',title:'Öffnungszeiten noch nicht belastbar verfügbar',value:'HOY hat aktuell keinen ausreichend sicheren Wochenplan.',proof:'Bitte im Zweifel direkt beim Betrieb prüfen.',note:note,source:sourceMarkup(p)};
  }
  function trustState(p){return operatorState(p)||baseState(p)}

  function renderTrustCard(p,block){
    if(!p||!block)return;
    const state=trustState(p);
    block.className=`profile-hours hours-trust-card trust-${state.tone}`;
    block.setAttribute('data-hours-trust',state.key);
    const detail=state.note?`<details class="hours-trust-detail"><summary>${state.key==='conflict'?'Warum ist das nicht eindeutig?':'Mehr zur Einordnung'}</summary><p>${escTrust(state.note)}</p></details>`:'';
    block.innerHTML=`<div class="hours-trust-head"><div><small>ÖFFNUNGSZEITEN</small><span class="hours-trust-badge">${escTrust(state.badge)}</span></div><h4>${escTrust(state.title)}</h4></div><strong class="hours-trust-value">${escTrust(state.value)}</strong><p class="hours-trust-proof">${escTrust(state.proof)}</p>${state.source||''}${detail}`;
  }
  function enhanceOpenProfile(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    const block=d?.querySelector('.profile-hours');
    if(p&&block)renderTrustCard(p,block);
  }

  const baseOpenDetail222=openDetail;
  openDetail=function(id){
    baseOpenDetail222(id);
    enhanceOpenProfile(id);
  };

  // A profile can be opened while the initial cloud/provenance refresh is still in flight,
  // especially in Mobile WebKit. Once the complete loader chain settles, re-evaluate the
  // already-open trust card against the enriched hours_status/provenance instead of leaving
  // the optimistic first render stuck on "missing".
  const baseLoadCloudRestaurants222=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurants222();
    const d=document.getElementById('detail');
    if(!d?.open)return;
    const id=Number(d.dataset.restaurantId||0);
    if(id)enhanceOpenProfile(id);
  };

  function todayPlanLabel(p){
    const h=window.hoyLiveHoursFor?.(p);const weekly=h?.weekly_hours;
    if(!weekly||typeof weekly!=='object')return '';
    const weekday=new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'short'}).format(new Date());
    const idx={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[weekday];
    const key=DAY_KEYS[idx];const rows=Array.isArray(weekly[key])?weekly[key]:[];
    if(!rows.length)return 'Heute im Wochenplan geschlossen';
    return `Heute ${rows.map(x=>Array.isArray(x)&&x.length===2?`${x[0]}–${x[1]}`:'').filter(Boolean).join(' & ')}`;
  }
  function confirmedToday(p){
    const stamp=window.hoyLiveHoursFor?.(p)?.confirmed_at||'';
    return !!stamp&&madridDate(stamp)===madridDate();
  }
  function hasTodaySpecial(p){
    const sp=p?.operator_special_hours;
    return !!sp&&String(sp.service_date||'')===madridDate();
  }
  function quickConfirmMarkup(p){
    const plan=todayPlanLabel(p);if(!plan)return '';
    if(hasTodaySpecial(p))return `<div class="today-confirm-card special"><div><small>HEUTE</small><b>Sonderzeit bereits hinterlegt</b><span>Der heutige Sonderplan hat Vorrang vor dem Wochenplan.</span></div></div>`;
    const done=confirmedToday(p);
    return `<div class="today-confirm-card ${done?'confirmed':''}" data-today-confirm-card><div><small>HEUTE</small><b>${done?'Heute bereits bestätigt':'Alles wie gewohnt heute?'}</b><span>${escTrust(plan)}. ${done?'Diese Bestätigung ist für Gäste sichtbar.':'Ein Klick bestätigt, dass der hinterlegte Plan heute gilt.'}</span></div><button type="button" ${done?'disabled':''} data-hours-today-confirm>${done?'✓ Heute bestätigt':'Ja, gilt heute'}</button></div>`;
  }
  function enhanceOwnerTodayConfirm(){
    if(typeof claimedRestaurant!=='function'||typeof window.hoyCanManageLiveHours!=='function')return;
    const p=claimedRestaurant();if(!p||!window.hoyCanManageLiveHours(p)||!window.hoyLiveHoursFor?.(p))return;
    const card=document.querySelector('.live-hours-owner-card');if(!card||card.querySelector('[data-today-confirm-card]')||card.querySelector('.today-confirm-card.special'))return;
    const markup=quickConfirmMarkup(p);if(!markup)return;
    const current=card.querySelector('.live-hours-current');
    if(current)current.insertAdjacentHTML('afterend',markup);else card.insertAdjacentHTML('beforeend',markup);
    const btn=card.querySelector('[data-hours-today-confirm]');if(!btn||btn.disabled)return;
    btn.onclick=async()=>{
      if(!window.hoyCanManageLiveHours(p)||!cloud?.user){toast('Verifiziertes Betreiberkonto erforderlich');return}
      btn.disabled=true;btn.textContent='Bestätigt …';
      const stamp=new Date().toISOString();
      const {error}=await sb.from('restaurant_live_hours').update({confirmed_at:stamp,confirmed_by:cloud.user.id,updated_at:stamp}).eq('restaurant_id',Number(p.id));
      if(error){console.error(error);btn.disabled=false;btn.textContent='Ja, gilt heute';toast(error.message||'Bestätigung fehlgeschlagen');return}
      const live=window.hoyLiveHoursFor(p);if(live){live.confirmed_at=stamp;live.updated_at=stamp;p.operator_hours=live}
      if(typeof addAudit==='function')addAudit('live_hours_updated',p.id,'Tagesplan mit einem Klick bestätigt');
      const wrap=btn.closest('[data-today-confirm-card]');if(wrap){wrap.classList.add('confirmed');wrap.querySelector('b').textContent='Heute bereits bestätigt';wrap.querySelector('span').textContent=`${todayPlanLabel(p)}. Diese Bestätigung ist für Gäste sichtbar.`}
      btn.textContent='✓ Heute bestätigt';
      const meta=card.querySelector('.live-hours-current small');if(meta)meta.textContent='Heute vom Betrieb bestätigt · gerade eben';
      toast('Heute als gültig bestätigt');
    };
  }

  const baseWire222=wire;
  wire=function(){
    baseWire222();
    enhanceOwnerTodayConfirm();
  };
})();

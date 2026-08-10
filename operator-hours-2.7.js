/* HOY 2.7 — operator-confirmed live hours + paid-plan editor */
(function(){
  const DAYS=[['mon','Mo'],['tue','Di'],['wed','Mi'],['thu','Do'],['fri','Fr'],['sat','Sa'],['sun','So']];
  const liveState={hours:new Map(),special:new Map(),memberships:new Set()};

  const safeDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
  const validTime=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));
  const pair=(a,b)=>validTime(a)&&validTime(b)?[a,b]:null;
  const today=()=>todayISO();

  function normalizeIntervals(v){
    if(!Array.isArray(v))return [];
    return v.map(x=>Array.isArray(x)&&x.length===2&&validTime(x[0])&&validTime(x[1])?[x[0],x[1]]:null).filter(Boolean).slice(0,2);
  }
  function normalizeSchedule(v){
    const out={};
    for(const [k] of DAYS)out[k]=normalizeIntervals(v?.[k]);
    return out;
  }
  function scheduleText(schedule){
    const s=normalizeSchedule(schedule);
    return DAYS.map(([k,l])=>{
      const rows=s[k];
      if(!rows.length)return `${l} geschlossen`;
      return `${l} ${rows.map(x=>`${x[0]}–${x[1]}`).join(' & ')}`;
    }).join(' · ');
  }
  function specialFor(p,date=today()){
    return liveState.special.get(`${Number(p?.id)}:${date}`)||null;
  }
  function liveHoursFor(p){return liveState.hours.get(Number(p?.id))||null}
  function liveHoursLabel(p){
    const sp=specialFor(p);
    if(sp){
      if(sp.is_closed)return sp.note?`Heute geschlossen · ${sp.note}`:'Heute geschlossen';
      const rows=normalizeIntervals(sp.intervals);
      if(rows.length)return `Heute ${rows.map(x=>`${x[0]}–${x[1]}`).join(' & ')}${sp.note?' · '+sp.note:''}`;
    }
    const h=liveHoursFor(p);
    return h?.display_text||'';
  }
  function liveHoursMeta(p){
    const h=liveHoursFor(p);const sp=specialFor(p);
    if(!h&&!sp)return null;
    const stamp=sp?.updated_at||h?.confirmed_at||h?.updated_at||'';
    let date='';
    try{date=new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(stamp))}catch{}
    return {operator:true,special:!!sp,updated:date,notice:h?.notice||'',noticeUntil:h?.notice_until||''};
  }
  window.hoyLiveHoursMeta=liveHoursMeta;
  window.hoyLiveHoursFor=liveHoursFor;

  async function loadPublicLiveHours(){
    if(!sb)return;
    const from=today();
    const until=new Date();until.setDate(until.getDate()+60);
    const untilISO=until.toISOString().slice(0,10);
    const [{data:h,error:he},{data:s,error:se}]=await Promise.all([
      sb.from('restaurant_live_hours').select('restaurant_id,timezone,weekly_hours,display_text,notice,notice_until,confirmed_at,updated_at'),
      sb.from('restaurant_special_hours').select('restaurant_id,service_date,intervals,is_closed,note,updated_at').gte('service_date',from).lte('service_date',untilISO)
    ]);
    if(he){console.warn('HOY operator hours unavailable',he);return}
    if(se){console.warn('HOY special hours unavailable',se);return}
    liveState.hours=new Map((h||[]).map(x=>[Number(x.restaurant_id),x]));
    liveState.special=new Map((s||[]).map(x=>[`${Number(x.restaurant_id)}:${x.service_date}`,x]));
    for(const p of DATA||[]){
      p.operator_hours=liveState.hours.get(Number(p.id))||null;
      p.operator_special_hours=specialFor(p)||null;
    }
  }
  async function loadLivePermissions(){
    liveState.memberships.clear();
    if(!sb||!cloud.user)return;
    const {data,error}=await sb.from('restaurant_memberships').select('restaurant_id,verified_at').not('verified_at','is',null);
    if(error){console.warn('HOY live-hours membership check unavailable',error);return}
    for(const x of data||[])liveState.memberships.add(Number(x.restaurant_id));
  }
  function canManageLiveHours(p){
    return !!(cloud.user&&p&&p.operator_verified&&['pro','business'].includes(String(p.active_plan||''))&&liveState.memberships.has(Number(p.id)));
  }
  window.hoyCanManageLiveHours=canManageLiveHours;

  const baseLoadCloudRestaurants27=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurants27();
    await loadPublicLiveHours();
  };
  const baseLoadOwnClaims27=loadOwnClaims;
  loadOwnClaims=async function(){
    await baseLoadOwnClaims27();
    await loadLivePermissions();
  };
  const baseAuthLogout27=authLogout;
  authLogout=async function(){liveState.memberships.clear();await baseAuthLogout27()};

  const baseEffectiveValue27=effectiveValue;
  effectiveValue=function(p,key){
    if(key==='hours'){
      const live=liveHoursLabel(p);
      if(live)return live;
    }
    return baseEffectiveValue27(p,key);
  };

  function planCard(p){
    if(!p||!isClaimed(p))return '';
    const paid=['pro','business'].includes(String(p.active_plan||claimDraft.activePlan||'free'));
    const permitted=canManageLiveHours(p);
    const meta=liveHoursMeta(p);
    const current=liveHoursLabel(p)||baseEffectiveValue27(p,'hours')||'Noch keine Zeiten hinterlegt';
    return `<section class="live-hours-owner-card ${paid?'paid':'locked'}">
      <div class="live-hours-owner-head"><div><small>LIVE-ÖFFNUNGSZEITEN</small><h3>Aktuell statt ungefähr.</h3></div><span class="live-hours-plan">${paid?esc(String(p.active_plan||'pro').toUpperCase()):'PRO'}</span></div>
      <p>${paid?'Wochenzeiten, Sondertage und kurzfristige Hinweise können direkt vom Betrieb bestätigt werden.':'HOY-geprüfte Zeiten bleiben kostenlos. Exakte Live-Zeiten und Sondertage pflegt der Betreiber mit Pro oder Business selbst.'}</p>
      <div class="live-hours-current"><b>${esc(current)}</b><small>${meta?.updated?`Vom Betrieb bestätigt · zuletzt ${esc(meta.updated)}`:'HOY-Basisangabe'}</small></div>
      ${permitted?'<button class="primary" data-live-hours-open>Öffnungszeiten verwalten</button>':paid?'<button data-live-hours-open>Mit Betreiberkonto prüfen</button>':'<button data-plan-demo="pro">Pro-Funktion ansehen</button>'}
    </section>`;
  }

  const basePartner27=partner;
  partner=function(){
    const html=basePartner27();
    const p=claimedRestaurant();
    if(!p||!isClaimed(p))return html;
    const card=planCard(p);
    return html.replace('<div class="system-card">',card+'<div class="system-card">');
  };

  function editorDialog(){
    let d=document.getElementById('liveHoursFlow');
    if(!d){d=document.createElement('dialog');d.id='liveHoursFlow';d.className='dialog';document.body.appendChild(d)}
    return d;
  }
  function inputTime(v,attr){return `<input type="time" ${attr} value="${esc(v||'')}">`}
  function dayRows(schedule){
    const s=normalizeSchedule(schedule);
    return DAYS.map(([k,l])=>{
      const a=s[k]?.[0]||['',''];const b=s[k]?.[1]||['',''];const closed=!s[k]?.length;
      return `<div class="live-day" data-live-day="${k}"><div class="live-day-name"><b>${l}</b><label><input type="checkbox" data-day-closed ${closed?'checked':''}> geschlossen</label></div><div class="live-intervals">${inputTime(a[0],'data-open-1')}<span>–</span>${inputTime(a[1],'data-close-1')}<em>+</em>${inputTime(b[0],'data-open-2')}<span>–</span>${inputTime(b[1],'data-close-2')}</div></div>`;
    }).join('');
  }
  function specialEditor(p){
    const existing=specialFor(p)||{};const rows=normalizeIntervals(existing.intervals);const a=rows[0]||['',''];const b=rows[1]||['',''];
    return `<div class="special-editor"><h3>Sondertag</h3><p>Für Feiertag, Betriebsurlaub oder eine spontane Abweichung.</p><div class="special-grid"><label>Datum<input type="date" data-special-date value="${esc(existing.service_date||'')}"></label><label class="special-closed"><input type="checkbox" data-special-closed ${existing.is_closed?'checked':''}> an diesem Tag geschlossen</label>${inputTime(a[0],'data-special-open-1')}<span>–</span>${inputTime(a[1],'data-special-close-1')}${inputTime(b[0],'data-special-open-2')}<span>–</span>${inputTime(b[1],'data-special-close-2')}<label class="special-note">Hinweis<input data-special-note maxlength="120" value="${esc(existing.note||'')}" placeholder="z. B. Küche heute erst ab 19 Uhr"></label></div></div>`;
  }
  function renderEditor(p){
    const d=editorDialog();const h=liveHoursFor(p)||{};
    d.innerHTML=`<div class="live-hours-flow"><div class="claim-head"><button class="round" data-live-close>${icons.back}</button><span class="claim-step">PRO · LIVE-DATEN</span></div><h2>Öffnungszeiten von ${esc(p.name)}</h2><p class="claim-lead">Diese Angaben werden nach dem Speichern unmittelbar als <b>vom Betrieb bestätigt</b> gekennzeichnet. Bitte nur tatsächlich gültige Zeiten eintragen.</p><div class="live-week">${dayRows(h.weekly_hours||{})}</div><div class="claim-field"><label>Aktueller Hinweis</label><input data-live-notice maxlength="160" value="${esc(h.notice||'')}" placeholder="z. B. Küche heute nur bis 22 Uhr"><small>Optionaler Hinweis für Gäste. Sondertage haben Vorrang.</small></div>${specialEditor(p)}<div class="live-hours-actions"><button data-live-close>Abbrechen</button><button class="primary" data-live-save>Live speichern</button></div><div class="prototype-note"><b>Serverseitig geschützt:</b> Speichern funktioniert nur für verifizierte Mitglieder dieses Betriebs mit aktivem Pro- oder Business-Tarif.</div></div>`;
    d.showModal();
    d.querySelectorAll('[data-live-close]').forEach(x=>x.onclick=()=>d.close());
    d.querySelectorAll('[data-day-closed]').forEach(x=>x.onchange=()=>{const row=x.closest('[data-live-day]');row.classList.toggle('closed',x.checked);row.querySelectorAll('input[type=time]').forEach(i=>i.disabled=x.checked)});
    d.querySelectorAll('[data-day-closed]').forEach(x=>x.dispatchEvent(new Event('change')));
    d.querySelector('[data-live-save]').onclick=()=>saveEditor(p,d);
  }
  async function saveEditor(p,d){
    if(!canManageLiveHours(p)){toast('Pro/Business und verifiziertes Betreiberkonto erforderlich');return}
    const schedule={};
    for(const [k] of DAYS){
      const row=d.querySelector(`[data-live-day="${k}"]`);const closed=row.querySelector('[data-day-closed]').checked;
      if(closed){schedule[k]=[];continue}
      const rows=[];const a=pair(row.querySelector('[data-open-1]').value,row.querySelector('[data-close-1]').value);const b=pair(row.querySelector('[data-open-2]').value,row.querySelector('[data-close-2]').value);if(a)rows.push(a);if(b)rows.push(b);schedule[k]=rows;
    }
    const now=new Date().toISOString();const uid=cloud.user.id;
    const payload={restaurant_id:Number(p.id),timezone:'Europe/Madrid',weekly_hours:schedule,display_text:scheduleText(schedule),notice:d.querySelector('[data-live-notice]').value.trim()||null,notice_until:null,confirmed_by:uid,confirmed_at:now,updated_at:now};
    const btn=d.querySelector('[data-live-save]');btn.disabled=true;btn.textContent='Speichert …';
    try{
      const {error}=await sb.from('restaurant_live_hours').upsert(payload,{onConflict:'restaurant_id'});if(error)throw error;
      const date=safeDate(d.querySelector('[data-special-date]').value);if(date){
        const closed=d.querySelector('[data-special-closed]').checked;const rows=[];
        const a=pair(d.querySelector('[data-special-open-1]').value,d.querySelector('[data-special-close-1]').value);const b=pair(d.querySelector('[data-special-open-2]').value,d.querySelector('[data-special-close-2]').value);if(a)rows.push(a);if(b)rows.push(b);
        const {error:se}=await sb.from('restaurant_special_hours').upsert({restaurant_id:Number(p.id),service_date:date,intervals:rows,is_closed:closed,note:d.querySelector('[data-special-note]').value.trim()||null,updated_by:uid,updated_at:now},{onConflict:'restaurant_id,service_date'});if(se)throw se;
      }
      await loadPublicLiveHours();addAudit('live_hours_updated',p.id,'Betreiberzeiten gespeichert');d.close();render();toast('Öffnungszeiten live aktualisiert');
    }catch(err){console.error(err);toast(err?.message||'Speichern fehlgeschlagen');btn.disabled=false;btn.textContent='Live speichern'}
  }
  window.openLiveHoursEditor=renderEditor;

  const baseWire27=wire;
  wire=function(){
    baseWire27();
    document.querySelectorAll('[data-live-hours-open]').forEach(btn=>btn.onclick=async()=>{
      const p=claimedRestaurant();if(!p)return;
      if(!liveState.memberships.has(Number(p.id)))await loadLivePermissions();
      if(!canManageLiveHours(p)){toast('Verifiziertes Pro-/Business-Profil erforderlich');return}
      renderEditor(p);
    });
  };
})();

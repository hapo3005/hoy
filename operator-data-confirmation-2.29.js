/* HOY 2.29.0 — one clear free operator task: confirm or correct prepared weekly hours */
(function(){
  if(window.__hoyOperatorDataConfirmation290)return;
  window.__hoyOperatorDataConfirmation290=true;
  window.hoyOperatorDataConfirmationVersion='2.29.0';

  const DAYS=[['mon','Mo'],['tue','Di'],['wed','Mi'],['thu','Do'],['fri','Fr'],['sat','Sa'],['sun','So']];
  const validStart=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));
  const validEnd=v=>/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(String(v||''));
  const clean=v=>String(v??'').trim();

  function normalizeSchedule(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const out={};let count=0;
    for(const [key] of DAYS){
      if(!Array.isArray(value[key]))return null;
      const rows=[];
      for(const raw of value[key].slice(0,2)){
        if(!Array.isArray(raw)||raw.length!==2)return null;
        const start=clean(raw[0]),end=clean(raw[1]);
        if(!validStart(start)||!validEnd(end))return null;
        rows.push([start,end]);count++;
      }
      out[key]=rows;
    }
    return count?out:null;
  }
  function blankSchedule(){return Object.fromEntries(DAYS.map(([key])=>[key,[]]))}
  function scheduleText(value){
    const schedule=normalizeSchedule(value);if(!schedule)return '';
    return DAYS.map(([key,label])=>schedule[key].length?`${label} ${schedule[key].map(x=>`${x[0]}–${x[1]}`).join(' & ')}`:`${label} geschlossen`).join(' · ');
  }
  function fmtDate(value){try{return value?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)):''}catch{return ''}}
  function currentRestaurant(){const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;return p&&typeof isClaimed==='function'&&isClaimed(p)?p:null}
  function preparedSchedule(p){return normalizeSchedule(p?.hours_weekly)||null}
  function hasOperatorHours(p){return !!(p?.operator_hours?.weekly_hours&&normalizeSchedule(p.operator_hours.weekly_hours))}

  function confirmationCard(p){
    if(!p||hasOperatorHours(p))return '';
    const prepared=preparedSchedule(p);const preview=prepared?scheduleText(prepared):'';
    const checked=fmtDate(p.hours_checked_at);const source=clean(p.hours_source_label)||'HOY-Datenbestand';
    return `<section class="operator-confirmation-290" data-operator-confirmation>
      <div class="operator-confirmation-mark">✓</div>
      <div class="operator-confirmation-copy">
        <div class="eyebrow">EINMAL KURZ BESTÄTIGEN · FREE</div>
        <h2>${prepared?'Stimmen diese Öffnungszeiten?':'Welche Öffnungszeiten gelten wirklich?'}</h2>
        <p>${prepared?'HOY hat den Wochenplan bereits vorbereitet. Ein Klick macht daraus eine direkte Betreiberbestätigung für HOY NOW.':'HOY hat noch keinen sicheren Wochenplan. Trage ihn einmal ein – danach kann HOY Gästen verlässlich sagen, wann ihr geöffnet habt.'}</p>
        ${prepared?`<div class="operator-confirmation-schedule"><b>${esc(preview)}</b><small>${esc(source)}${checked?' · geprüft '+esc(checked):''}</small></div>`:''}
        <div class="operator-confirmation-actions">
          ${prepared?'<button type="button" class="primary" data-hours-confirm>Ja, stimmt</button>':''}
          <button type="button" data-hours-correct>${prepared?'Korrigieren':'Zeiten eintragen'}</button>
        </div>
        <small class="operator-confirmation-plan-note">Die Bestätigung des Wochenplans ist kostenlos. Sondertage und kurzfristige Hinweise bleiben Teil der erweiterten Live-Pflege.</small>
      </div>
    </section>`;
  }

  const basePartner290=partner;
  partner=function(){
    const html=basePartner290();const p=currentRestaurant();
    if(!p||!p.operator_verified)return html;
    const card=confirmationCard(p);if(!card)return html;
    if(html.includes('<section class="operator-command-center">'))return html.replace('<section class="operator-command-center">',card+'<section class="operator-command-center">');
    return html.replace('<div class="partner-hero">',card+'<div class="partner-hero">');
  };

  function ensureDialog(){let d=document.getElementById('operatorHoursConfirmFlow');if(!d){d=document.createElement('dialog');d.id='operatorHoursConfirmFlow';d.className='dialog';document.body.appendChild(d)}return d}
  function timeInput(value,attr,placeholder){return `<input ${attr} inputmode="numeric" maxlength="5" value="${esc(value||'')}" placeholder="${placeholder}">`}
  function dayRows(value){
    const schedule=normalizeSchedule(value)||blankSchedule();
    return DAYS.map(([key,label])=>{
      const rows=schedule[key]||[],a=rows[0]||['',''],b=rows[1]||['',''],closed=!rows.length;
      return `<div class="confirm-hours-day ${closed?'closed':''}" data-confirm-day="${key}">
        <div class="confirm-hours-day-head"><b>${label}</b><label><input type="checkbox" data-confirm-closed ${closed?'checked':''}> geschlossen</label></div>
        <div class="confirm-hours-intervals">${timeInput(a[0],'data-confirm-open-1','12:00')}<span>–</span>${timeInput(a[1],'data-confirm-close-1','23:00')}<em>+</em>${timeInput(b[0],'data-confirm-open-2','')}<span>–</span>${timeInput(b[1],'data-confirm-close-2','')}</div>
      </div>`;
    }).join('');
  }
  function toggleDay(row,closed){row.classList.toggle('closed',closed);row.querySelectorAll('.confirm-hours-intervals input').forEach(i=>i.disabled=closed)}
  function readSchedule(d){
    const schedule={};let intervals=0;
    for(const [key] of DAYS){
      const row=d.querySelector(`[data-confirm-day="${key}"]`);if(!row)return null;
      if(row.querySelector('[data-confirm-closed]').checked){schedule[key]=[];continue}
      const values=[[row.querySelector('[data-confirm-open-1]').value,row.querySelector('[data-confirm-close-1]').value],[row.querySelector('[data-confirm-open-2]').value,row.querySelector('[data-confirm-close-2]').value]];
      const rows=[];
      for(const [startRaw,endRaw] of values){
        const start=clean(startRaw),end=clean(endRaw);if(!start&&!end)continue;
        if(!validStart(start)||!validEnd(end))return null;
        rows.push([start,end]);intervals++;
      }
      if(!rows.length)return null;schedule[key]=rows;
    }
    return intervals?schedule:null;
  }
  function openCorrection(p){
    const d=ensureDialog();const schedule=normalizeSchedule(p?.operator_hours?.weekly_hours)||preparedSchedule(p)||blankSchedule();
    d.innerHTML=`<div class="operator-confirm-hours-flow"><div class="claim-head"><button type="button" class="round" data-confirm-close>${icons.back}</button><span class="claim-step">FREE · DATENBESTÄTIGUNG</span></div><h2>Wochenzeiten korrigieren.</h2><p class="claim-lead">Trage die normalen Öffnungszeiten ein. HOY nutzt sie anschließend als direkte Betreiberangabe. Sondertage und kurzfristige Hinweise werden hier bewusst nicht vermischt.</p><div class="confirm-hours-week">${dayRows(schedule)}</div><div class="operator-flow-actions"><button type="button" data-confirm-close>Abbrechen</button><button type="button" class="primary" data-confirm-save>Bestätigen & speichern</button></div><div class="prototype-note"><b>Wichtig:</b> Diese Angabe wird als vom verifizierten Betrieb bestätigt gekennzeichnet.</div></div>`;
    d.showModal();d.querySelectorAll('[data-confirm-close]').forEach(x=>x.onclick=()=>d.close());
    d.querySelectorAll('[data-confirm-closed]').forEach(x=>{x.onchange=()=>toggleDay(x.closest('[data-confirm-day]'),x.checked);x.dispatchEvent(new Event('change'))});
    d.querySelector('[data-confirm-save]').onclick=()=>saveCorrection(p,d);
  }
  async function invokeHours(p,action,extra={}){
    if(!sb||!cloud.user)throw new Error('Bitte zuerst anmelden');
    const {data,error}=await sb.functions.invoke('operator-hours-confirm',{body:{action,restaurant_id:Number(p.id),...extra}});if(error)throw error;
    if(data?.error)throw new Error(data.error);return data;
  }
  async function refreshAfterConfirmation(p){
    await loadCloudRestaurants();const fresh=currentRestaurant()||p;
    if(typeof window.hoyLoadOperatorWorkspace==='function')await window.hoyLoadOperatorWorkspace(fresh,true);
    render();
  }
  async function confirmPrepared(p,button){
    button.disabled=true;button.textContent='Bestätigt …';
    try{await invokeHours(p,'confirm');await refreshAfterConfirmation(p);toast('Öffnungszeiten vom Betrieb bestätigt')}
    catch(err){button.disabled=false;button.textContent='Ja, stimmt';toast(err?.message==='no_prepared_schedule'?'Kein vorbereiteter Wochenplan vorhanden':err?.message||'Bestätigung nicht möglich')}
  }
  async function saveCorrection(p,d){
    const schedule=readSchedule(d);if(!schedule){toast('Bitte gültige Zeiten für alle geöffneten Tage eintragen');return}
    const btn=d.querySelector('[data-confirm-save]');btn.disabled=true;btn.textContent='Speichert …';
    try{await invokeHours(p,'correct',{weekly_hours:schedule});d.close();await refreshAfterConfirmation(p);toast('Korrigierte Öffnungszeiten bestätigt')}
    catch(err){btn.disabled=false;btn.textContent='Bestätigen & speichern';toast(err?.message||'Öffnungszeiten konnten nicht gespeichert werden')}
  }

  const baseWire290=wire;
  wire=function(){
    baseWire290();const p=currentRestaurant();if(!p||!p.operator_verified||hasOperatorHours(p))return;
    document.querySelectorAll('[data-hours-confirm]').forEach(b=>b.onclick=()=>confirmPrepared(p,b));
    document.querySelectorAll('[data-hours-correct]').forEach(b=>b.onclick=()=>openCorrection(p));
  };

  window.hoyOperatorConfirmationNormalizeSchedule=normalizeSchedule;
  window.hoyOperatorConfirmationScheduleText=scheduleText;
  window.hoyOpenOperatorHoursConfirmation=openCorrection;
})();

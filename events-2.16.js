/* HOY 2.16 — structured events & specials: one operator entry, automatically reused across the guest journey */
(function(){
  const EVENT_KINDS={
    live_music:'Live-Musik',
    dj:'DJ',
    sports:'Sportübertragung',
    tasting:'Verkostung',
    themed_evening:'Themenabend',
    party:'Party',
    other:'Event'
  };
  const TYPE_LABELS={event:'Veranstaltung',special:'Special',dish:'Tagesgericht'};
  const currentState={rows:[],byRestaurant:new Map(),loaded:false,error:''};
  const manager={rows:[],editing:null,duplicateSeed:null,loading:false};

  const escAttr=v=>esc(String(v??''));
  const asDate=v=>{const d=v instanceof Date?v:new Date(v);return Number.isFinite(d.getTime())?d:null};
  const sameMadridDay=(a,b=new Date())=>{
    const fmt=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
    const da=asDate(a),db=asDate(b);return !!da&&!!db&&fmt(da)===fmt(db);
  };
  const tomorrowMadrid=(a,b=new Date())=>{
    const db=asDate(b);if(!db)return false;const t=new Date(db.getTime()+86400000);return sameMadridDay(a,t);
  };
  const formatTime=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(d):''};
  const formatDate=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',weekday:'short',day:'2-digit',month:'short'}).format(d):''};
  const minutesUntil=(v,now=new Date())=>{const d=asDate(v);return d?Math.round((d-now)/60000):null};
  const normalizeType=v=>({angebot:'special',tagesgericht:'dish',event:'event',special:'special',dish:'dish'}[String(v||'').trim().toLowerCase()]||'special');
  const normalizeRow=row=>({...row,restaurant_id:Number(row.restaurant_id),offer_type:normalizeType(row.offer_type),reservation_recommended:!!row.reservation_recommended,publisher_kind:row.publisher_kind||'operator'});

  function phase(row,now=new Date()){
    const start=asDate(row?.starts_at),end=asDate(row?.ends_at);
    if(!start||!end)return {key:'scheduled',label:'Termin prüfen',tone:'muted'};
    if(now>=end)return {key:'ended',label:'Beendet',tone:'muted'};
    if(now>=start){
      return {key:'running',label:`Laut Termin · jetzt${formatTime(end)?` bis ${formatTime(end)}`:''}`,tone:'now'};
    }
    const mins=minutesUntil(start,now);
    if(sameMadridDay(start,now)){
      if(mins!=null&&mins>0&&mins<=120)return {key:'soon',label:`Beginnt in ${mins} Min.`,tone:'soon'};
      return {key:'today',label:`Heute · ab ${formatTime(start)}`,tone:'today'};
    }
    if(tomorrowMadrid(start,now))return {key:'tomorrow',label:`Morgen · ${formatTime(start)}`,tone:'future'};
    return {key:'future',label:`${formatDate(start)} · ${formatTime(start)}`,tone:'future'};
  }

  function typeLabel(row){return TYPE_LABELS[normalizeType(row?.offer_type)]||'Aktuell'}
  function kindLabel(row){return normalizeType(row?.offer_type)==='event'?(EVENT_KINDS[row?.event_kind]||'Event'):typeLabel(row)}
  function proofLabel(row){return row?.publisher_kind==='operator'?'Vom Betrieb veröffentlicht':'Von HOY geprüft'}
  function rowsFor(p){return currentState.byRestaurant.get(Number(p?.id))||[]}
  function currentFor(p){return rowsFor(p).filter(x=>phase(x).key!=='ended')}
  function bestFor(p){
    const rows=currentFor(p);
    if(!rows.length)return null;
    const rank={running:0,soon:1,today:2,tomorrow:3,future:4,scheduled:5};
    return [...rows].sort((a,b)=>(rank[phase(a).key]??9)-(rank[phase(b).key]??9)||(asDate(a.starts_at)?.getTime()||0)-(asDate(b.starts_at)?.getTime()||0))[0]||null;
  }
  window.hoyCurrentContentFor=rowsFor;
  window.hoyBestCurrentFor=bestFor;

  async function loadPublicCurrentContent(){
    if(!sb)return;
    try{
      const {data,error}=await sb.from('offers')
        .select('id,restaurant_id,offer_type,event_kind,title,description,price_text,entry_text,reservation_recommended,starts_at,ends_at,publisher_kind,published_at,updated_at')
        .eq('status','published')
        .order('starts_at',{ascending:true});
      if(error)throw error;
      currentState.rows=(data||[]).map(normalizeRow).filter(x=>phase(x).key!=='ended');
      currentState.byRestaurant=new Map();
      for(const row of currentState.rows){
        const key=Number(row.restaurant_id);const list=currentState.byRestaurant.get(key)||[];list.push(row);currentState.byRestaurant.set(key,list);
      }
      for(const p of DATA||[])p.hoy_current=currentState.byRestaurant.get(Number(p.id))||[];
      currentState.loaded=true;currentState.error='';
    }catch(err){
      currentState.loaded=true;currentState.error=err?.message||String(err);console.warn('HOY current content unavailable',err);
    }
  }
  window.hoyLoadPublicCurrentContent=loadPublicCurrentContent;

  const baseLoadCloudRestaurants216=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurants216();
    await loadPublicCurrentContent();
  };

  function signalMarkup(row,compact=false){
    if(!row)return '';
    const ph=phase(row);
    return `<div class="hoy-current-signal ${escAttr(ph.tone)}${compact?' compact':''}"><span class="hoy-current-dot" aria-hidden="true"></span><div><small>${escAttr(kindLabel(row))}</small><strong>${escAttr(ph.label)}</strong></div></div>`;
  }

  const baseListCard216=listCard;
  listCard=function(p){
    const html=baseListCard216(p);const row=bestFor(p);if(!row)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const card=shell.firstElementChild;if(!card)return html;
    card.classList.add('has-current-content');
    const copy=card.querySelector('.decision-copy')||card.querySelector('div:nth-child(2)');
    if(copy&&!copy.querySelector('.hoy-current-signal'))copy.insertAdjacentHTML('beforeend',signalMarkup(row,true));
    return card.outerHTML;
  };

  function homeCurrentBlock(){
    const rows=currentState.rows
      .filter(x=>['running','soon','today'].includes(phase(x).key))
      .sort((a,b)=>{
        const rank={running:0,soon:1,today:2};const pa=phase(a),pb=phase(b);
        return (rank[pa.key]??9)-(rank[pb.key]??9)||(asDate(a.starts_at)?.getTime()||0)-(asDate(b.starts_at)?.getTime()||0);
      })
      .slice(0,4);
    if(!rows.length)return null;
    const section=document.createElement('section');section.className='hoy-today-strip';
    section.innerHTML=`<div class="hoy-today-head"><div><span>HEUTE AUF HOY</span><h2>Was heute passiert.</h2></div><small>${rows.length}${currentState.rows.length>rows.length?'+':''}</small></div><div class="hoy-today-rail">${rows.map(row=>{
      const p=DATA.find(x=>Number(x.id)===Number(row.restaurant_id));if(!p)return '';
      const ph=phase(row);
      return `<button type="button" class="hoy-today-card" data-current-open="${Number(p.id)}"><span class="hoy-today-time ${escAttr(ph.tone)}">${escAttr(ph.label)}</span><strong>${escAttr(row.title)}</strong><small>${escAttr(p.name)} · ${escAttr(kindLabel(row))}</small></button>`;
    }).join('')}</div>`;
    return section;
  }

  const baseHome216=home;
  home=function(){
    const html=baseHome216();const block=homeCurrentBlock();if(!block)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const hero=root.querySelector('.journey-hero')||root.firstElementChild;
    if(hero)hero.insertAdjacentElement('afterend',block);else root.prepend(block);
    return root.outerHTML;
  };

  const baseMapView216=mapView;
  mapView=function(){
    const html=baseMapView216();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    let count=0;
    root.querySelectorAll('.map-decision-card[data-map-card]').forEach(card=>{
      const p=DATA.find(x=>Number(x.id)===Number(card.dataset.mapCard));const row=bestFor(p);if(!row)return;count++;
      const signals=card.querySelector('.map-decision-signals');
      if(signals&&!card.querySelector('.hoy-current-signal'))signals.insertAdjacentHTML('beforebegin',signalMarkup(row,true));
    });
    if(count){
      const bar=root.querySelector('.map-journey-bar > div');
      if(bar&&!bar.querySelector('.hoy-map-current-count'))bar.insertAdjacentHTML('beforeend',`<span class="hoy-map-current-count">${count} ${count===1?'aktueller Hinweis':'aktuelle Hinweise'}</span>`);
    }
    return root.outerHTML;
  };

  function profileCurrentSection(p){
    const rows=currentFor(p).slice(0,5);if(!rows.length)return null;
    const sec=document.createElement('section');sec.className='profile-section hoy-profile-current';sec.id='profile-current';
    sec.innerHTML=`<div class="profile-section-head"><div><small>HEUTE & DEMNÄCHST</small><h3>Aktuell bei ${escAttr(p.name)}</h3></div><span class="hoy-current-count">${rows.length}</span></div><div class="hoy-profile-current-list">${rows.map(row=>{
      const ph=phase(row);const detail=[row.entry_text,row.price_text,row.reservation_recommended?'Reservierung empfohlen':''].filter(Boolean).join(' · ');
      return `<article class="hoy-current-item"><div class="hoy-current-item-top"><span class="hoy-current-kind">${escAttr(kindLabel(row))}</span><span class="hoy-current-when ${escAttr(ph.tone)}">${escAttr(ph.label)}</span></div><h4>${escAttr(row.title)}</h4>${row.description?`<p>${escAttr(row.description)}</p>`:''}${detail?`<div class="hoy-current-meta">${escAttr(detail)}</div>`:''}<small class="hoy-current-proof">${escAttr(proofLabel(row))}</small></article>`;
    }).join('')}</div>`;
    return sec;
  }

  const baseOpenDetail216=openDetail;
  openDetail=function(id){
    baseOpenDetail216(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));const d=document.getElementById('detail');if(!p||!d?.open)return;
    const sec=profileCurrentSection(p);if(!sec)return;
    const flow=d.querySelector('.profile-continuous-flow');const about=flow?.querySelector('#profile-about');
    if(flow&&!flow.querySelector('#profile-current'))(about||flow.firstElementChild)?.insertAdjacentElement('afterend',sec);
    const nav=d.querySelector('.profile-anchor-nav');
    if(nav&&!nav.querySelector('a[href="#profile-current"]')){
      const a=document.createElement('a');a.href='#profile-current';a.textContent='Heute';
      a.onclick=e=>{e.preventDefault();d.querySelector('#profile-current')?.scrollIntoView({behavior:'smooth',block:'start'})};
      const menuLink=nav.querySelector('a[href="#profile-menu"]');nav.insertBefore(a,menuLink||null);
    }
  };

  function ensureDialog(){let d=document.getElementById('hoyCurrentManager');if(!d){d=document.createElement('dialog');d.id='hoyCurrentManager';d.className='dialog';document.body.appendChild(d)}return d}
  const currentRestaurant=()=>{const p=claimedRestaurant();return p&&isClaimed(p)?p:null};
  const paid=p=>['pro','business'].includes(String(p?.active_plan||''));

  function madridInputValue(v){
    const d=asDate(v);if(!d)return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  }
  function madridLocalToIso(v){
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(v||'')))return null;
    const [date,time]=v.split('T');const [y,m,d]=date.split('-').map(Number);const [hh,mm]=time.split(':').map(Number);
    const desired=Date.UTC(y,m-1,d,hh,mm,0,0);let guess=desired;
    for(let i=0;i<3;i++){
      const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));
      const get=t=>Number(parts.find(x=>x.type===t)?.value||0);
      const shown=Date.UTC(get('year'),get('month')-1,get('day'),get('hour'),get('minute'),get('second'));
      const delta=desired-shown;guess+=delta;if(Math.abs(delta)<1000)break;
    }
    return new Date(guess).toISOString();
  }
  function defaultTimes(){const now=new Date();const start=new Date(now.getTime()+86400000);start.setMinutes(0,0,0);start.setHours(20);const end=new Date(start.getTime()+3*3600000);return {start:madridInputValue(start),end:madridInputValue(end)}}

  async function loadManagerRows(p){
    if(!sb||!cloud.user||!p)return;
    manager.loading=true;
    try{
      const {data,error}=await sb.from('offers').select('id,restaurant_id,offer_type,event_kind,title,description,price_text,entry_text,reservation_recommended,starts_at,ends_at,publisher_kind,status,published_at,updated_at').eq('restaurant_id',Number(p.id)).order('starts_at',{ascending:false}).limit(40);
      if(error)throw error;manager.rows=(data||[]).map(normalizeRow);
    }catch(err){toast(err?.message||'Aktuelles konnte nicht geladen werden')}finally{manager.loading=false}
  }

  function kindOptions(value){return Object.entries(EVENT_KINDS).map(([k,l])=>`<option value="${k}" ${value===k?'selected':''}>${escAttr(l)}</option>`).join('')}
  function typeTabs(type){return [['event','Veranstaltung'],['special','Special'],['dish','Tagesgericht']].map(([k,l])=>`<button type="button" class="${type===k?'active':''}" data-current-type="${k}">${l}</button>`).join('')}
  function editorMarkup(p){
    const seed=manager.editing||manager.duplicateSeed||{};const type=normalizeType(seed.offer_type||'event');const defs=defaultTimes();
    const start=madridInputValue(seed.starts_at)||defs.start,end=madridInputValue(seed.ends_at)||defs.end;
    return `<section class="hoy-current-editor"><div class="hoy-current-editor-head"><div><small>IN UNTER 2 MINUTEN</small><h3>${manager.editing?'Eintrag bearbeiten':'Was passiert?'}</h3></div><span>${paid(p)?String(p.active_plan).toUpperCase():'VORSCHAU'}</span></div><div class="hoy-current-type-tabs">${typeTabs(type)}</div><input type="hidden" data-current-edit-id value="${escAttr(manager.editing?.id||'')}"><div class="claim-form"><div class="claim-field"><label>Titel</label><input data-current-title maxlength="100" value="${escAttr(seed.title||'')}" placeholder="z. B. Sunset Session"></div><div class="claim-field"><label>Kurzbeschreibung</label><textarea data-current-description maxlength="500" placeholder="Was erwartet die Gäste?">${escAttr(seed.description||'')}</textarea></div>${type==='event'?`<div class="claim-field"><label>Art der Veranstaltung</label><select data-current-kind>${kindOptions(seed.event_kind||'live_music')}</select></div>`:''}<div class="hoy-current-dates"><div class="claim-field"><label>Beginn</label><input type="datetime-local" data-current-start value="${escAttr(start)}"></div><div class="claim-field"><label>Ende</label><input type="datetime-local" data-current-end value="${escAttr(end)}"></div></div>${type==='event'?`<div class="claim-field"><label>Eintritt / Hinweis</label><input data-current-entry maxlength="120" value="${escAttr(seed.entry_text||'')}" placeholder="z. B. Eintritt frei"></div><label class="hoy-current-check"><input type="checkbox" data-current-reservation ${seed.reservation_recommended?'checked':''}><span>Reservierung für dieses Event empfehlen</span></label>`:`<div class="claim-field"><label>Preis / Hinweis</label><input data-current-price maxlength="120" value="${escAttr(seed.price_text||'')}" placeholder="z. B. 24,90 € p. P."></div>`}</div><div class="hoy-current-editor-actions">${manager.editing||manager.duplicateSeed?'<button type="button" data-current-cancel>Abbrechen</button>':''}<button type="button" class="primary" data-current-save>${manager.editing?'Entwurf aktualisieren':'Entwurf speichern'}</button></div><p class="hoy-current-editor-note">${paid(p)?'Veröffentlichen ist nach dem Speichern mit einem Klick möglich. HOY verteilt den Eintrag automatisch in Profil, Entdecken, Karte und – wenn zeitlich relevant – auf die Startseite.':'Erstellen und Vorschau bleiben möglich. Die Veröffentlichung ist für Pro/Business vorgesehen.'}</p></section>`;
  }

  function rowMarkup(p,row){
    const ph=phase(row);const published=String(row.status)==='published';const expired=ph.key==='ended';
    return `<article class="hoy-manager-row"><div class="hoy-manager-row-main"><small>${escAttr(kindLabel(row))} · ${published?'VERÖFFENTLICHT':'ENTWURF'}</small><b>${escAttr(row.title)}</b><span>${escAttr(ph.label)}</span></div><div class="hoy-manager-actions">${!published?`<button data-current-edit="${row.id}">Bearbeiten</button>${paid(p)?`<button class="primary" data-current-publish="${row.id}">Veröffentlichen</button>`:'<button data-current-plan>Pro ansehen</button>'}`:`<button data-current-archive="${row.id}">Archivieren</button>`}${normalizeType(row.offer_type)==='event'?`<button data-current-next-week="${row.id}">Nächste Woche</button>`:''}</div>${published&&!expired?`<small class="hoy-manager-proof">${escAttr(proofLabel(row))} · verschwindet nach Veranstaltungsende automatisch aus aktuellen Gastflächen.</small>`:''}</article>`;
  }

  async function renderManager(p){
    const d=ensureDialog();
    d.innerHTML=`<div class="operator-flow wide hoy-current-manager"><div class="claim-head"><button class="round" data-current-close>${icons.back}</button><span class="claim-step">EVENTS & SPECIALS</span></div><div class="hoy-current-manager-hero"><span>HOY verteilt für dich</span><h2>Einmal eintragen.<br>Überall passend sichtbar.</h2><p>Veranstaltung oder Special anlegen, veröffentlichen und nach dem Ende automatisch aus den aktuellen Gastflächen nehmen.</p></div>${editorMarkup(p)}<section class="hoy-current-existing"><div class="hoy-current-existing-head"><h3>Deine Einträge</h3><small>${manager.rows.length}</small></div>${manager.rows.length?manager.rows.map(row=>rowMarkup(p,row)).join(''):'<div class="menu-intake-empty">Noch keine Veranstaltung oder kein Special vorbereitet.</div>'}</section></div>`;
    if(!d.open)d.showModal();
    d.querySelector('[data-current-close]').onclick=()=>{manager.editing=null;manager.duplicateSeed=null;d.close()};
    wireManager(p,d);
  }

  function currentFormType(d){return d.querySelector('.hoy-current-type-tabs .active')?.dataset.currentType||'event'}
  function wireManager(p,d){
    d.querySelectorAll('[data-current-type]').forEach(btn=>btn.onclick=()=>{manager.editing={...(manager.editing||manager.duplicateSeed||{}),offer_type:btn.dataset.currentType,title:d.querySelector('[data-current-title]')?.value||'',description:d.querySelector('[data-current-description]')?.value||'',starts_at:madridLocalToIso(d.querySelector('[data-current-start]')?.value),ends_at:madridLocalToIso(d.querySelector('[data-current-end]')?.value)};manager.duplicateSeed=null;renderManager(p)});
    d.querySelector('[data-current-cancel]')?.addEventListener('click',()=>{manager.editing=null;manager.duplicateSeed=null;renderManager(p)});
    d.querySelector('[data-current-save]')?.addEventListener('click',()=>saveCurrent(p,d));
    d.querySelectorAll('[data-current-edit]').forEach(btn=>btn.onclick=()=>{const row=manager.rows.find(x=>x.id===btn.dataset.currentEdit);if(String(row?.status)==='published'){toast('Veröffentlichte Einträge zuerst archivieren');return}manager.editing=row||null;manager.duplicateSeed=null;renderManager(p)});
    d.querySelectorAll('[data-current-publish]').forEach(btn=>btn.onclick=()=>publishCurrent(p,btn.dataset.currentPublish));
    d.querySelectorAll('[data-current-archive]').forEach(btn=>btn.onclick=()=>archiveCurrent(p,btn.dataset.currentArchive));
    d.querySelectorAll('[data-current-next-week]').forEach(btn=>btn.onclick=()=>duplicateNextWeek(p,btn.dataset.currentNextWeek));
    d.querySelectorAll('[data-current-plan]').forEach(btn=>btn.onclick=()=>toast('Veröffentlichen ist mit Pro oder Business möglich'));
  }

  async function saveCurrent(p,d){
    if(!sb||!cloud.user){toast('Bitte zuerst mit dem Betreiberkonto anmelden');return}
    const type=currentFormType(d);const title=d.querySelector('[data-current-title]')?.value.trim()||'';if(!title){toast('Bitte einen Titel eintragen');return}
    const start=madridLocalToIso(d.querySelector('[data-current-start]')?.value),end=madridLocalToIso(d.querySelector('[data-current-end]')?.value);
    if(!start||!end||new Date(end)<=new Date(start)){toast('Bitte gültigen Beginn und ein späteres Ende eintragen');return}
    const payload={restaurant_id:Number(p.id),offer_type:type,event_kind:type==='event'?(d.querySelector('[data-current-kind]')?.value||'other'):null,title,description:d.querySelector('[data-current-description]')?.value.trim()||null,price_text:type==='event'?null:(d.querySelector('[data-current-price]')?.value.trim()||null),entry_text:type==='event'?(d.querySelector('[data-current-entry]')?.value.trim()||null):null,reservation_recommended:type==='event'&&!!d.querySelector('[data-current-reservation]')?.checked,starts_at:start,ends_at:end,publisher_kind:'operator',status:'draft',updated_at:new Date().toISOString()};
    const id=d.querySelector('[data-current-edit-id]')?.value||'';const btn=d.querySelector('[data-current-save]');btn.disabled=true;btn.textContent='Speichert …';
    try{
      let error;if(id){({error}=await sb.from('offers').update(payload).eq('id',id))}else{({error}=await sb.from('offers').insert({...payload,created_by:cloud.user.id}))}if(error)throw error;
      manager.editing=null;manager.duplicateSeed=null;await loadManagerRows(p);await window.hoyLoadOperatorWorkspace?.(p,true);toast('Entwurf gespeichert');renderManager(p);render();
    }catch(err){btn.disabled=false;btn.textContent=id?'Entwurf aktualisieren':'Entwurf speichern';toast(err?.message||'Entwurf konnte nicht gespeichert werden')}
  }

  async function publishCurrent(p,id){
    try{
      const {error}=await sb.rpc('operator_publish_offer',{p_offer_id:id});if(error)throw error;
      await Promise.all([loadManagerRows(p),loadPublicCurrentContent(),window.hoyLoadOperatorWorkspace?.(p,true)]);toast('Veröffentlicht – HOY verteilt den Eintrag automatisch');renderManager(p);render();
    }catch(err){toast(err?.message||'Veröffentlichung nicht möglich')}
  }
  async function archiveCurrent(p,id){
    try{
      const {error}=await sb.rpc('operator_archive_offer',{p_offer_id:id});if(error)throw error;
      await Promise.all([loadManagerRows(p),loadPublicCurrentContent(),window.hoyLoadOperatorWorkspace?.(p,true)]);toast('Archiviert');renderManager(p);render();
    }catch(err){toast(err?.message||'Archivieren nicht möglich')}
  }
  async function duplicateNextWeek(p,id){
    const row=manager.rows.find(x=>x.id===id);if(!row)return;
    const addWeek=v=>{const d=asDate(v);return d?new Date(d.getTime()+7*86400000).toISOString():null};
    manager.editing=null;manager.duplicateSeed={...row,id:null,status:'draft',starts_at:addWeek(row.starts_at),ends_at:addWeek(row.ends_at),published_at:null,updated_at:null};
    renderManager(p);
    setTimeout(()=>ensureDialog().querySelector('[data-current-title]')?.focus(),40);
  }

  async function openManager(){
    const p=currentRestaurant();if(!p){toast('Verifiziertes Betreiberprofil erforderlich');return}
    await loadManagerRows(p);manager.editing=null;manager.duplicateSeed=null;renderManager(p);
  }
  window.hoyOpenCurrentManager=openManager;

  const basePartner216=partner;
  partner=function(){
    const html=basePartner216();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.hub-module').forEach(card=>{
      const action=card.querySelector('[data-hub-action="offers"]');if(!action)return;
      const h3=card.querySelector('h3');const p=card.querySelector('p');if(h3)h3.textContent='Events & Specials';if(p)p.textContent='Veranstaltungen, Specials und Tagesgerichte einmal eintragen – HOY verteilt sie automatisch.';
      action.textContent=paid(currentRestaurant())?'Events & Specials verwalten':'Vorschau erstellen';
    });
    return root.outerHTML;
  };

  function installDelegation(){
    if(document.documentElement.dataset.hoyCurrentActions216==='1')return;
    document.documentElement.dataset.hoyCurrentActions216='1';
    document.addEventListener('click',e=>{
      const card=e.target.closest?.('[data-current-open]');
      if(card){e.preventDefault();openDetail(Number(card.dataset.currentOpen));return}
      const offers=e.target.closest?.('[data-hub-action="offers"]');
      if(offers){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openManager()}
    },true);
  }
  installDelegation();

  const baseWire216=wire;
  wire=function(){baseWire216();};

  window.hoyEvents216={phase,rowsFor,bestFor,loadPublicCurrentContent};
})();

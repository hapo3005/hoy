/* HOY 2.1 — showcase profile presentation + honest menu completeness */
(function(){
  const SHOWCASE_IDS=new Set([1,2,3,5,7,8,9,11,13,14,15,16,17,20,21,22]);
  const showcaseMeta=new Map();
  let menuAuditRows=[];

  const validUrl=v=>/^https?:\/\//i.test(String(v||''));
  const dateLabel=v=>{
    if(!v)return '';
    try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(String(v).slice(0,10)+'T12:00:00'))}catch{return String(v).slice(0,10)}
  };
  const menuCount=m=>(m?.categories||[]).reduce((n,[,items])=>n+(items?.length||0),0);
  const hoursNeedCheck=p=>/bestätig|widersprech|prüf|saisonal|unklar|aktuell etwa|offen/i.test(String(p?.hours||''));
  const sourceTrustLabel=meta=>/offiziell/i.test(meta?.source_label||'')?'Offizielle Quelle':'HOY geprüft';

  function menuStatusFor(id){
    const rows=menuAuditRows.filter(x=>Number(x.restaurant_id)===Number(id));
    if(!rows.length)return null;
    if(rows.some(x=>x.import_status==='imported'))return 'imported';
    if(rows.some(x=>x.import_status==='partial'))return 'partial';
    if(rows.some(x=>x.import_status==='link_only'))return 'link_only';
    return rows[0]?.import_status||null;
  }

  async function loadShowcaseMeta(){
    if(!sb)return;
    const [{data:restaurants,error:re},{data:sources,error:se}]=await Promise.all([
      sb.from('restaurants').select('id,source_url,source_label,source_checked_at,profile_quality').eq('is_published',true).in('id',[...SHOWCASE_IDS]),
      sb.from('menu_sources').select('restaurant_id,source_url,import_status,last_checked_at').in('restaurant_id',[...SHOWCASE_IDS])
    ]);
    if(!re){for(const row of restaurants||[])showcaseMeta.set(Number(row.id),row)}
    if(!se)menuAuditRows=sources||[];
  }

  const baseLoadCloudMenus=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus();
    if(!sb)return;
    const {data,error}=await sb.from('menu_sources').select('restaurant_id,source_url,import_status,last_checked_at').in('restaurant_id',[...SHOWCASE_IDS]);
    if(error)return;
    menuAuditRows=data||[];
    for(const id of SHOWCASE_IDS){
      const m=MENUS[id];
      if(!m)continue;
      const status=menuStatusFor(id);
      if(status==='partial' && Array.isArray(m.categories) && m.categories.length){
        m.status='partial';
        m.label='Offizielle Quelle · teilweise strukturiert';
      }
    }
  };

  const baseInitCloud21=initCloud;
  initCloud=async function(){
    await baseInitCloud21();
    if(cloud.status==='online'){
      await loadShowcaseMeta();
      render();
    }
  };

  function decorateShowcaseCards(){
    document.querySelectorAll('[data-open]').forEach(card=>{
      const id=Number(card.getAttribute('data-open'));
      if(!SHOWCASE_IDS.has(id)||card.querySelector('.showcase-card-badge'))return;
      const art=card.querySelector('.card-art,.list-art');
      if(!art)return;
      const badge=document.createElement('span');
      badge.className='showcase-card-badge';
      badge.textContent='HOY Auswahl';
      art.appendChild(badge);
    });
  }

  const baseWire21=wire;
  wire=function(){
    baseWire21();
    decorateShowcaseCards();
  };

  function previewItems(m,limit=4){
    const rows=[];
    for(const [cat,items] of m?.categories||[]){
      for(const item of items||[]){
        rows.push({cat,name:item?.[0]||'',price:item?.[1]||''});
        if(rows.length>=limit)return rows;
      }
    }
    return rows;
  }

  function menuSnapshot(m){
    const count=menuCount(m);
    if(m?.status==='structured')return {value:`${count} Positionen`,note:'Strukturiert in HOY'};
    if(m?.status==='partial')return {value:`${count} Positionen`,note:'Teilimport · Original verlinkt'};
    if(m?.status==='official_link')return {value:'Originalkarte',note:'Direkt verlinkt'};
    return {value:'Noch offen',note:'Keine Gerichte erfunden'};
  }

  function addShowcaseDetail(p,d){
    if(!SHOWCASE_IDS.has(Number(p.id))||!d)return;
    d.classList.add('showcase-detail');
    const m=menuFor(p);
    const meta=showcaseMeta.get(Number(p.id))||{};
    const art=d.querySelector('.detail-art');
    if(art&&!art.querySelector('.showcase-mark')){
      const mark=document.createElement('div');
      mark.className='showcase-mark';
      mark.innerHTML='<span>HOY</span> Auswahl';
      art.appendChild(mark);
    }

    const statusrow=d.querySelector('.statusrow');
    if(statusrow&&!d.querySelector('.showcase-snapshot')){
      const menu=menuSnapshot(m);
      const hours=hoursNeedCheck(p)?{value:'Vor Besuch prüfen',note:'Zeiten nicht eindeutig'}:{value:'Aktuell gepflegt',note:p.hours||'Öffnungszeiten offen'};
      const reservation=effectiveServiceState(p,'reservation')==='available'?{value:'Reservierbar',note:'Direkt beim Betrieb'}:{value:'Noch prüfen',note:'Kein bestätigter Reservierungsweg'};
      const snapshot=document.createElement('section');
      snapshot.className='showcase-snapshot';
      snapshot.innerHTML=`
        <div class="showcase-mini"><small>SPEISEKARTE</small><strong>${esc(menu.value)}</strong><span>${esc(menu.note)}</span></div>
        <div class="showcase-mini"><small>ÖFFNUNGSZEITEN</small><strong>${esc(hours.value)}</strong><span>${esc(hours.note)}</span></div>
        <div class="showcase-mini"><small>RESERVIERUNG</small><strong>${esc(reservation.value)}</strong><span>${esc(reservation.note)}</span></div>`;
      statusrow.insertAdjacentElement('afterend',snapshot);
    }

    const tabs=d.querySelector('.tabs');
    const items=previewItems(m,4);
    if(tabs&&items.length&&!d.querySelector('.showcase-menu-preview')){
      const preview=document.createElement('section');
      preview.className='showcase-menu-preview';
      const title=m.status==='partial'?'Aus dem aktuellen Teilimport':'Aus der aktuellen Karte';
      preview.innerHTML=`<div class="showcase-section-head"><div><small>HOY SPEISEKARTE</small><h3>${esc(title)}</h3></div><button type="button" data-showcase-menu>Alle ansehen</button></div>
        <div class="showcase-dishes">${items.map(x=>`<div class="showcase-dish"><div><small>${esc(x.cat)}</small><strong>${esc(x.name)}</strong></div><span>${esc(x.price)}</span></div>`).join('')}</div>`;
      tabs.parentNode.insertBefore(preview,tabs);
      preview.querySelector('[data-showcase-menu]')?.addEventListener('click',()=>{
        const btn=d.querySelector('[data-tab="menu"]');
        if(btn)btn.click();
      });
    }

    const body=d.querySelector('.detail-body');
    const claim=d.querySelector('.claim');
    if(body&&!d.querySelector('.showcase-proof')){
      const checked=dateLabel(meta.source_checked_at||p.source_checked_at);
      const proof=document.createElement('section');
      proof.className='showcase-proof';
      const sourceLink=validUrl(meta.source_url)?`<a href="${esc(meta.source_url)}" target="_blank" rel="noopener noreferrer nofollow">Quelle öffnen ↗</a>`:'';
      proof.innerHTML=`<div><small>DATENVERTRAUEN</small><strong>${esc(sourceTrustLabel(meta))}</strong><span>${checked?`Zuletzt geprüft ${esc(checked)}`:'Aktuell geprüft'}${meta.source_label?' · '+esc(meta.source_label):''}</span></div>${sourceLink}`;
      if(claim)body.insertBefore(proof,claim);else body.appendChild(proof);
    }

    if(hoursNeedCheck(p)&&body&&!d.querySelector('.showcase-warning')){
      const warning=document.createElement('div');
      warning.className='showcase-warning';
      warning.innerHTML='<b>Öffnungszeiten mit Vorbehalt.</b><span>Die aktuell verfügbaren Quellen sind nicht eindeutig. HOY zeigt deshalb bewusst keine scheinpräzise Angabe.</span>';
      const proof=d.querySelector('.showcase-proof');
      if(proof)proof.insertAdjacentElement('beforebegin',warning);else body.appendChild(warning);
    }

    const menuPill=[...d.querySelectorAll('.statusrow .pill')][1];
    if(menuPill&&m.status==='partial'){
      menuPill.className='pill warn';
      menuPill.textContent='Speisekarte teilweise erfasst';
    }
  }

  const baseOpenDetail21=openDetail;
  openDetail=function(id){
    baseOpenDetail21(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)addShowcaseDetail(p,d);
  };
})();

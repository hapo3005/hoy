/* HOY 2.39 — trust-safe support for verified events whose end time is not published */
(function(){
  if(window.__hoyOpenEndedEvents239)return;
  window.__hoyOpenEndedEvents239=true;

  const TZ='Europe/Madrid';
  const rawRowsFor=window.hoyCurrentContentFor||(()=>[]);
  const esc239=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const openState={rows:[],byRestaurant:new Map(),loaded:false,error:''};
  const EVENT_KINDS={live_music:'Live-Musik',dj:'DJ',sports:'Sportübertragung',tasting:'Verkostung',themed_evening:'Themenabend',party:'Party',other:'Event'};

  const asDate=v=>{
    if(v===null||v===undefined||String(v).trim()==='')return null;
    const d=v instanceof Date?v:new Date(v);
    return Number.isFinite(d.getTime())?d:null;
  };
  const parts=v=>{
    const d=asDate(v);if(!d)return null;
    const p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
    const get=t=>p.find(x=>x.type===t)?.value||'';
    return {day:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))};
  };
  const sameDay=(a,b=new Date())=>{const pa=parts(a),pb=parts(b);return !!pa&&!!pb&&pa.day===pb.day};
  const tomorrow=(a,b=new Date())=>{const db=asDate(b);return !!db&&sameDay(a,new Date(db.getTime()+86400000))};
  const formatTime=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}).format(d):''};
  const formatDate=v=>{const d=asDate(v);return d?new Intl.DateTimeFormat('de-DE',{timeZone:TZ,weekday:'short',day:'2-digit',month:'short'}).format(d):''};
  const isOpenEndedEvent=row=>String(row?.offer_type||'')==='event'&&!!asDate(row?.starts_at)&&!asDate(row?.ends_at);
  const kindLabel=row=>EVENT_KINDS[String(row?.event_kind||'')]||'Event';

  function openEndPhase(row,now=new Date()){
    if(!isOpenEndedEvent(row))return null;
    const start=asDate(row.starts_at);if(!start)return null;
    if(now<start){
      const mins=Math.max(1,Math.round((start-now)/60000));
      if(sameDay(start,now)){
        if(mins<=120)return {key:'soon',label:`Beginnt in ${mins} Min. · Ende offen`,tone:'soon',mins};
        return {key:'today',label:`Heute · ab ${formatTime(start)} · Ende offen`,tone:'today',mins};
      }
      if(tomorrow(start,now))return {key:'tomorrow',label:`Morgen · ${formatTime(start)} · Ende offen`,tone:'future'};
      return {key:'future',label:`${formatDate(start)} · ${formatTime(start)} · Ende offen`,tone:'future'};
    }
    if(sameDay(start,now))return {key:'uncertain',label:`Beginn ${formatTime(start)} · Ende nicht gemeldet`,tone:'muted'};
    return {key:'expired',label:'Termin beendet oder Status nicht mehr aktuell',tone:'muted'};
  }

  function rowKey(row){return String(row?.id||`${Number(row?.restaurant_id)||0}|${String(row?.title||'')}|${String(row?.starts_at||'')}`)}
  function mergeRows(base,extra){
    const map=new Map();
    for(const row of [...(base||[]),...(extra||[])])if(row)map.set(rowKey(row),row);
    return [...map.values()];
  }
  const openRowsFor=p=>openState.byRestaurant.get(Number(p?.id))||[];
  const safeRowsFor=(p,now=new Date())=>mergeRows(rawRowsFor(p)||[],openRowsFor(p)).filter(row=>!isOpenEndedEvent(row)||openEndPhase(row,now)?.key!=='expired');

  function rowPhase(row,now=new Date()){
    if(isOpenEndedEvent(row))return openEndPhase(row,now)||{key:'expired',tone:'muted',label:'Status unbekannt'};
    try{return window.hoyEvents216?.phase?.(row,now)||{key:'future',tone:'future',label:'Termin'}}catch{return {key:'future',tone:'future',label:'Termin'}}
  }
  function bestFor(p,now=new Date()){
    const rank={running:0,soon:1,today:2,uncertain:3,tomorrow:4,future:5,scheduled:6,ended:9,expired:9};
    return safeRowsFor(p,now).sort((a,b)=>(rank[rowPhase(a,now)?.key]??8)-(rank[rowPhase(b,now)?.key]??8)||(asDate(a.starts_at)?.getTime()||0)-(asDate(b.starts_at)?.getTime()||0))[0]||null;
  }
  function bestOpenEndedFor(p,now=new Date()){
    return safeRowsFor(p,now).filter(isOpenEndedEvent).sort((a,b)=>(asDate(a.starts_at)?.getTime()||0)-(asDate(b.starts_at)?.getTime()||0))[0]||null;
  }

  window.hoyCurrentContentFor=p=>safeRowsFor(p);
  window.hoyBestCurrentFor=p=>bestFor(p);

  async function loadOpenEndedContent(){
    if(!sb)return;
    try{
      const {data,error}=await sb.from('offers')
        .select('id,restaurant_id,offer_type,event_kind,title,description,price_text,entry_text,reservation_recommended,starts_at,ends_at,publisher_kind,published_at,updated_at')
        .eq('status','published')
        .eq('offer_type','event')
        .is('ends_at',null)
        .order('starts_at',{ascending:true});
      if(error)throw error;
      openState.rows=(data||[]).map(row=>({...row,restaurant_id:Number(row.restaurant_id),offer_type:'event',reservation_recommended:!!row.reservation_recommended,publisher_kind:row.publisher_kind||'operator'})).filter(isOpenEndedEvent).filter(row=>openEndPhase(row)?.key!=='expired');
      openState.byRestaurant=new Map();
      for(const row of openState.rows){
        const key=Number(row.restaurant_id),list=openState.byRestaurant.get(key)||[];list.push(row);openState.byRestaurant.set(key,list);
      }
      for(const p of DATA||[])p.hoy_current=mergeRows(p.hoy_current||[],openRowsFor(p));
      openState.loaded=true;openState.error='';
    }catch(err){
      openState.loaded=true;openState.error=err?.message||String(err);console.warn('HOY open-ended events unavailable; continuing without them',err);
    }
  }

  const baseLoadCloudRestaurantsOpen239=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurantsOpen239();
    await loadOpenEndedContent();
  };

  window.hoyOpenEndEvent239={isOpenEndedEvent,openEndPhase,safeRowsFor,bestFor,openRowsFor,loadOpenEndedContent};

  function openSignalMarkup(row,compact=false){
    const ph=openEndPhase(row);if(!ph)return '';
    return `<div class="hoy-current-signal ${esc239(ph.tone)}${compact?' compact':''}"><span class="hoy-current-dot" aria-hidden="true"></span><div><small>${esc239(kindLabel(row))}</small><strong>${esc239(ph.label)}</strong></div></div>`;
  }
  function applySignal(signal,row,now=new Date()){
    const ph=openEndPhase(row,now);if(!signal||!ph)return;
    if(ph.key==='expired'){signal.remove();return}
    signal.classList.remove('now','soon','today','future','muted');signal.classList.add(ph.tone);
    const small=signal.querySelector('small');if(small)small.textContent=kindLabel(row);
    const strong=signal.querySelector('strong');if(strong)strong.textContent=ph.label;
  }

  const baseListCard=listCard;
  listCard=function(p){
    const html=baseListCard(p),row=bestOpenEndedFor(p);if(!row)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const card=shell.firstElementChild;if(!card)return html;
    let signal=card.querySelector('.hoy-current-signal');
    if(!signal){
      const copy=card.querySelector('.decision-copy')||card.querySelector('div:nth-child(2)');
      if(copy){copy.insertAdjacentHTML('beforeend',openSignalMarkup(row,true));signal=card.querySelector('.hoy-current-signal')}
    }
    applySignal(signal,row);
    return card.outerHTML;
  };

  const baseMapView=mapView;
  mapView=function(){
    const html=baseMapView();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.map-decision-card[data-map-card]').forEach(card=>{
      const p=DATA.find(x=>Number(x.id)===Number(card.dataset.mapCard));const row=p?bestOpenEndedFor(p):null;if(!row)return;
      let signal=card.querySelector('.hoy-current-signal');
      if(!signal){
        const signals=card.querySelector('.map-decision-signals');
        if(signals){signals.insertAdjacentHTML('beforebegin',openSignalMarkup(row,true));signal=card.querySelector('.hoy-current-signal')}
      }
      applySignal(signal,row);
    });
    return root.outerHTML;
  };

  function openItemMarkup(row){
    const ph=openEndPhase(row);if(!ph||ph.key==='expired')return '';
    const detail=[row.entry_text,row.price_text,row.reservation_recommended?'Reservierung empfohlen':''].filter(Boolean).join(' · ');
    return `<article class="hoy-current-item" data-open-ended-event="${esc239(rowKey(row))}"><div class="hoy-current-item-top"><span class="hoy-current-kind">${esc239(kindLabel(row))}</span><span class="hoy-current-when ${esc239(ph.tone)}">${esc239(ph.label)}</span></div><h4>${esc239(row.title||'Event')}</h4>${row.description?`<p>${esc239(row.description)}</p>`:''}${detail?`<div class="hoy-current-meta">${esc239(detail)}</div>`:''}<small class="hoy-current-proof">${row.publisher_kind==='operator'?'Vom Betrieb veröffentlicht':'Von HOY geprüft'} · Ende vom Veranstalter nicht angegeben</small></article>`;
  }
  function ensureProfileCurrent(p,d){
    let section=d.querySelector('.hoy-profile-current');
    if(section)return section;
    const flow=d.querySelector('.profile-continuous-flow');const about=flow?.querySelector('#profile-about');if(!flow)return null;
    section=document.createElement('section');section.className='profile-section hoy-profile-current';section.id='profile-current';
    section.innerHTML=`<div class="profile-section-head"><div><small>HEUTE & DEMNÄCHST</small><h3>Aktuell bei ${esc239(p.name)}</h3></div><span class="hoy-current-count">0</span></div><div class="hoy-profile-current-list"></div>`;
    (about||flow.firstElementChild)?.insertAdjacentElement('afterend',section);
    const nav=d.querySelector('.profile-anchor-nav');
    if(nav&&!nav.querySelector('a[href="#profile-current"]')){
      const a=document.createElement('a');a.href='#profile-current';a.textContent='Heute';a.onclick=e=>{e.preventDefault();d.querySelector('#profile-current')?.scrollIntoView({behavior:'smooth',block:'start'})};
      const menuLink=nav.querySelector('a[href="#profile-menu"]');nav.insertBefore(a,menuLink||null);
    }
    return section;
  }
  function patchProfile(p,d){
    if(!p||!d?.open)return;
    const rows=safeRowsFor(p).filter(isOpenEndedEvent);
    for(const row of rows){
      const ph=openEndPhase(row);let item=[...d.querySelectorAll('.hoy-current-item')].find(x=>x.querySelector('h4')?.textContent?.trim()===String(row.title||'').trim());
      if(ph?.key==='expired'){item?.remove();continue}
      if(!item){
        const section=ensureProfileCurrent(p,d);const list=section?.querySelector('.hoy-profile-current-list');if(!list)continue;
        list.insertAdjacentHTML('beforeend',openItemMarkup(row));item=[...list.querySelectorAll('.hoy-current-item')].find(x=>x.dataset.openEndedEvent===rowKey(row));
      }
      if(!item)continue;
      const when=item.querySelector('.hoy-current-when');if(when&&ph){when.textContent=ph.label;when.className=`hoy-current-when ${ph.tone}`}
      const proof=item.querySelector('.hoy-current-proof');if(proof&&!/Ende .*nicht/i.test(proof.textContent||''))proof.textContent=`${proof.textContent} · Ende vom Veranstalter nicht angegeben`;
    }
    const section=d.querySelector('.hoy-profile-current');
    if(section){
      const count=section.querySelectorAll('.hoy-current-item').length;const badge=section.querySelector('.hoy-current-count');if(badge)badge.textContent=String(count);
      if(!count){section.remove();d.querySelector('.profile-anchor-nav a[href="#profile-current"]')?.remove()}
    }
  }

  const baseOpenDetail=openDetail;
  openDetail=function(id){baseOpenDetail(id);const p=DATA.find(x=>Number(x.id)===Number(id));patchProfile(p,document.getElementById('detail'))};

  function soonOpenEnded(now=new Date()){
    const out=[];
    for(const p of DATA||[]){
      for(const row of safeRowsFor(p,now).filter(isOpenEndedEvent)){
        const ph=openEndPhase(row,now);if(ph?.key==='soon')out.push({p,row,ph,start:asDate(row.starts_at)?.getTime()||0});
      }
    }
    return out.sort((a,b)=>a.start-b.start).slice(0,6);
  }

  function addToLiveTimeline(root,now=new Date()){
    const rows=soonOpenEnded(now);if(!rows.length)return;
    const panel=root.querySelector('[data-live239-root] .live239-panel');if(!panel)return;
    let timeline=panel.querySelector('.live239-timeline');
    if(!timeline){panel.querySelector('.live239-empty')?.remove();timeline=document.createElement('div');timeline.className='live239-timeline';panel.appendChild(timeline)}
    for(const {p,row,ph} of rows){
      const key=`${Number(p.id)}|${String(row.title||'')}`;
      if([...timeline.querySelectorAll('[data-open-ended-key]')].some(x=>x.dataset.openEndedKey===key))continue;
      const button=document.createElement('button');button.type='button';button.dataset.live239Open=String(Number(p.id));button.dataset.openEndedKey=key;
      button.innerHTML=`<span class="live239-time soon">${esc239(formatTime(row.starts_at))}</span><div><strong>${esc239(row.title||'Aktuell')}</strong><small>${esc239(p.name||'')} · ${esc239(ph.label)}</small></div><i aria-hidden="true">→</i>`;
      timeline.appendChild(button);
    }
  }

  const baseHome=home;
  home=function(){
    const html=baseHome();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    addToLiveTimeline(root);return root.outerHTML;
  };
})();

/* HOY 2.39 — trust-safe support for verified events whose end time is not published */
(function(){
  if(window.__hoyOpenEndedEvents239)return;
  window.__hoyOpenEndedEvents239=true;

  const TZ='Europe/Madrid';
  const rawRowsFor=window.hoyCurrentContentFor||(()=>[]);
  const rawBestFor=window.hoyBestCurrentFor||(()=>null);
  const esc239=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const asDate=v=>{const d=v instanceof Date?v:new Date(v);return Number.isFinite(d.getTime())?d:null};
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

  const safeRowsFor=(p,now=new Date())=>(rawRowsFor(p)||[]).filter(row=>!isOpenEndedEvent(row)||openEndPhase(row,now)?.key!=='expired');
  window.hoyCurrentContentFor=p=>safeRowsFor(p);
  window.hoyBestCurrentFor=p=>{
    const base=rawBestFor(p);
    if(base&&(!isOpenEndedEvent(base)||openEndPhase(base)?.key!=='expired'))return base;
    return safeRowsFor(p).sort((a,b)=>(asDate(a.starts_at)?.getTime()||0)-(asDate(b.starts_at)?.getTime()||0))[0]||null;
  };
  window.hoyOpenEndEvent239={isOpenEndedEvent,openEndPhase,safeRowsFor};

  function baseBestOpenEnded(p){
    const row=rawBestFor(p);return isOpenEndedEvent(row)?row:null;
  }
  function applySignal(signal,row,now=new Date()){
    const ph=openEndPhase(row,now);if(!signal||!ph)return;
    if(ph.key==='expired'){signal.remove();return}
    signal.classList.remove('now','soon','today','future');signal.classList.add(ph.tone);
    const strong=signal.querySelector('strong');if(strong)strong.textContent=ph.label;
  }

  const baseListCard=listCard;
  listCard=function(p){
    const html=baseListCard(p),row=baseBestOpenEnded(p);if(!row)return html;
    const shell=document.createElement('div');shell.innerHTML=html;const card=shell.firstElementChild;if(!card)return html;
    applySignal(card.querySelector('.hoy-current-signal'),row);
    return card.outerHTML;
  };

  const baseMapView=mapView;
  mapView=function(){
    const html=baseMapView();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.map-decision-card[data-map-card]').forEach(card=>{
      const p=DATA.find(x=>Number(x.id)===Number(card.dataset.mapCard));const row=p?baseBestOpenEnded(p):null;
      if(row)applySignal(card.querySelector('.hoy-current-signal'),row);
    });
    return root.outerHTML;
  };

  function patchProfile(p,d){
    if(!p||!d?.open)return;
    const rows=(rawRowsFor(p)||[]).filter(isOpenEndedEvent);
    for(const row of rows){
      const item=[...d.querySelectorAll('.hoy-current-item')].find(x=>x.querySelector('h4')?.textContent?.trim()===String(row.title||'').trim());
      if(!item)continue;
      const ph=openEndPhase(row);
      if(ph?.key==='expired'){item.remove();continue}
      const when=item.querySelector('.hoy-current-when');if(when&&ph){when.textContent=ph.label;when.className=`hoy-current-when ${ph.tone}`}
      const proof=item.querySelector('.hoy-current-proof');
      if(proof&&!/Ende .*nicht/i.test(proof.textContent||''))proof.textContent=`${proof.textContent} · Ende vom Veranstalter nicht angegeben`;
    }
    const section=d.querySelector('.hoy-profile-current');
    if(section&&!section.querySelector('.hoy-current-item')){
      section.remove();d.querySelector('.profile-anchor-nav a[href="#profile-current"]')?.remove();
    }
  }

  const baseOpenDetail=openDetail;
  openDetail=function(id){baseOpenDetail(id);const p=DATA.find(x=>Number(x.id)===Number(id));patchProfile(p,document.getElementById('detail'))};

  function soonOpenEnded(now=new Date()){
    const out=[];
    for(const p of DATA||[]){
      for(const row of safeRowsFor(p,now)){
        const ph=openEndPhase(row,now);if(ph?.key==='soon')out.push({p,row,ph,start:asDate(row.starts_at)?.getTime()||0});
      }
    }
    return out.sort((a,b)=>a.start-b.start).slice(0,6);
  }

  function addToLiveTimeline(root,now=new Date()){
    const rows=soonOpenEnded(now);if(!rows.length)return;
    const panel=root.querySelector('[data-live239-root] .live239-panel');if(!panel)return;
    let timeline=panel.querySelector('.live239-timeline');
    if(!timeline){
      panel.querySelector('.live239-empty')?.remove();timeline=document.createElement('div');timeline.className='live239-timeline';panel.appendChild(timeline);
    }
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

/* HOY 2.28.1 — canonical guest decision spine: turn trusted live signals into one explainable journey */
(function(){
  if(window.__hoyGuestDecisionCore280)return;
  window.__hoyGuestDecisionCore280=true;
  window.hoyGuestDecisionCoreVersion='2.28.1';

  state.moment=state.moment||'all';
  const TZ='Europe/Madrid';
  const esc280=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nowStatus=p=>window.hoyNowStatus219For?.(p)||null;
  const currentFor=p=>window.hoyBestCurrentFor?.(p)||null;
  const menuState=p=>p&&typeof menuFor==='function'?menuFor(p):null;
  const service=(p,k)=>p&&typeof effectiveServiceState==='function'?effectiveServiceState(p,k):'unknown';

  function madridDay(v=new Date()){
    const d=v instanceof Date?v:new Date(v);if(!Number.isFinite(d.getTime()))return '';
    return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  }
  function currentPhase(row,now=new Date()){
    if(!row)return 'none';
    const start=new Date(row.starts_at),end=new Date(row.ends_at);
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return 'future';
    if(now>=start&&now<end)return 'running';
    if(madridDay(start)===madridDay(now)){
      const mins=(start-now)/60000;
      if(mins>0&&mins<=120)return 'soon';
      if(mins>0)return 'today';
    }
    return 'future';
  }
  function timeFromLabel(label,kind){
    const text=String(label||'');
    if(kind==='open')return text.match(/bis\s+(\d{1,2}:\d{2})/i)?.[1]||'';
    if(kind==='later')return text.match(/öffnet(?:\s+heute)?(?:\s+um)?\s+(\d{1,2}:\d{2})/i)?.[1]||'';
    return '';
  }
  function decisionScore(p){
    if(!p)return -999;
    let score=0;const hours=nowStatus(p),row=currentFor(p),phase=currentPhase(row),menu=menuState(p);
    if(hours?.state==='open')score+=72;
    else if(hours?.state==='later')score+=18;
    else if(hours?.state==='closed')score-=48;
    else score-=6;
    if(phase==='running')score+=34;
    else if(phase==='soon')score+=27;
    else if(phase==='today')score+=16;
    if(menu?.status==='structured')score+=14;
    else if(menu?.status==='partial')score+=9;
    else if(menu?.source)score+=4;
    if(service(p,'reservation')==='available')score+=9;
    if(service(p,'pickup')==='available')score+=3;
    if(typeof isClaimed==='function'&&isClaimed(p))score+=5;
    else if(p?.profile_quality==='premium')score+=2;
    return score;
  }
  function reasonsFor(p,{limit=3}={}){
    const reasons=[];const hours=nowStatus(p),row=currentFor(p),phase=currentPhase(row),menu=menuState(p);
    if(hours?.state==='open'){
      const until=timeFromLabel(hours.label,'open');reasons.push({tone:'good',label:until?`Jetzt geöffnet · bis ${until}`:'Jetzt geöffnet'});
    }else if(hours?.state==='later'){
      const at=timeFromLabel(hours.label,'later');reasons.push({tone:'neutral',label:at?`Öffnet heute · ${at}`:'Öffnet später heute'});
    }else if(hours?.state==='closed')reasons.push({tone:'muted',label:'Heute geschlossen'});
    else reasons.push({tone:'uncertain',label:'Öffnungszeiten bitte prüfen'});
    if(row&&phase==='running')reasons.push({tone:'now',label:`Jetzt · ${row.title}`});
    else if(row&&phase==='soon')reasons.push({tone:'now',label:`Bald · ${row.title}`});
    else if(row&&phase==='today')reasons.push({tone:'today',label:`Heute · ${row.title}`});
    if(menu?.status==='structured'||menu?.status==='partial')reasons.push({tone:'good',label:'Speisekarte verfügbar'});
    if(service(p,'reservation')==='available')reasons.push({tone:'good',label:'Reservierbar'});
    return reasons.slice(0,limit);
  }
  function verdictFor(p){
    const hours=nowStatus(p),row=currentFor(p),phase=currentPhase(row),reasons=reasonsFor(p,{limit:3});
    let title='Für heute interessant';let tone='neutral';
    if(hours?.state==='open'&&(phase==='running'||phase==='soon')){title='Passt gerade besonders gut';tone='strong'}
    else if(hours?.state==='open'){title='Passt jetzt';tone='strong'}
    else if(hours?.state==='later'){title='Für später heute';tone='neutral'}
    else if(hours?.state==='closed'){title='Für jetzt eher nicht';tone='muted'}
    else if(row&&['running','soon','today'].includes(phase)){title='Heute aktuell';tone='neutral'}
    return {title,tone,reasons,score:decisionScore(p)};
  }
  function decisionEligibleNow(p){
    const hours=nowStatus(p);
    return hours?.state==='open'||hours?.state==='later';
  }
  function nowMomentAvailable(){return (DATA||[]).some(p=>nowStatus(p)?.state==='open')}
  function todayMomentAvailable(){return (DATA||[]).some(p=>['running','soon','today'].includes(currentPhase(currentFor(p))))}
  function momentAvailable(key){return key==='now'?nowMomentAvailable():key==='today'?todayMomentAvailable():true}
  function ranked(rows){return [...rows].sort((a,b)=>decisionScore(b)-decisionScore(a)||String(a.name||'').localeCompare(String(b.name||''),'de'))}
  window.hoyDecision280For=p=>({...verdictFor(p)});
  window.hoyDecision280Rank=rows=>ranked(rows||[]);
  window.hoyDecision280MomentAvailable=momentAvailable;

  const baseFiltered280=filtered;
  filtered=function(){
    if(!momentAvailable(state.moment))state.moment='all';
    let rows=baseFiltered280();
    if(state.moment==='now')rows=rows.filter(p=>nowStatus(p)?.state==='open');
    else if(state.moment==='today')rows=rows.filter(p=>['running','soon','today'].includes(currentPhase(currentFor(p))));
    return rows;
  };

  function reasonPills(p,cls='decision280-reasons'){
    return `<div class="${cls}">${reasonsFor(p).map(r=>`<span class="${esc280(r.tone)}">${esc280(r.label)}</span>`).join('')}</div>`;
  }
  function nowCard(p,index){
    const v=verdictFor(p),row=currentFor(p),phase=currentPhase(row);
    const kicker=phase==='running'?'JETZT LOS':phase==='soon'?'GLEICH LOS':v.tone==='strong'?'JETZT PASSEND':'HEUTE PASSEND';
    return `<button type="button" class="decision280-card ${esc280(v.tone)}" data-decision280-open="${Number(p.id)}"><span class="decision280-rank">${index+1}</span><div class="decision280-card-copy"><small>${kicker}</small><strong>${esc280(p.name)}</strong><span>${esc280(p.area||'')}</span>${reasonPills(p)}</div><span class="decision280-arrow" aria-hidden="true">→</span></button>`;
  }
  function momentButtons({map=false}={}){
    const out=[];
    if(nowMomentAvailable())out.push('<button type="button" data-decision280-moment="now">Jetzt geöffnet</button>');
    if(todayMomentAvailable())out.push('<button type="button" data-decision280-moment="today">Heute etwas los</button>');
    if(map)out.push('<button type="button" data-nav="map">Auf der Karte</button>');
    return out.join('');
  }
  function homeDecisionBlock(){
    const candidates=ranked((DATA||[]).filter(decisionEligibleNow)).slice(0,3);
    if(!candidates.length)return '';
    return `<section class="decision280-home" data-decision280-home><div class="decision280-head"><div><span>HOY NOW</span><h2>Was jetzt wirklich passt.</h2><p>Öffnungszeiten, Aktuelles, Speisekarte und Services bereits zusammengedacht.</p></div><button type="button" data-decision280-all>Alle ansehen</button></div><div class="decision280-list">${candidates.map(nowCard).join('')}</div><div class="decision280-moments">${momentButtons({map:true})}</div></section>`;
  }

  const baseHome280=home;
  home=function(){
    const html=baseHome280();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.classList.add('guest-decision-core-280');
    const hero=root.querySelector('.journey-hero')||root.firstElementChild;
    if(hero&&!root.querySelector('[data-decision280-home]'))hero.insertAdjacentHTML('afterend',homeDecisionBlock());
    const title=hero?.querySelector('.hero-copy h1');if(title)title.innerHTML='Was passt<br><em>jetzt?</em>';
    const copy=hero?.querySelector('.hero-copy p');if(copy)copy.innerHTML='HOY verbindet <strong>was offen ist</strong>, was heute passiert und was du dort wirklich machen kannst.';
    return root.outerHTML;
  };

  function momentBar(){
    const defs=[['all','Beste Auswahl']];
    if(nowMomentAvailable())defs.push(['now','Jetzt geöffnet']);
    if(todayMomentAvailable())defs.push(['today','Heute etwas los']);
    if(!momentAvailable(state.moment))state.moment='all';
    return `<div class="decision280-momentbar" aria-label="Zeitbezug">${defs.map(([k,l])=>`<button type="button" class="${state.moment===k?'active':''}" data-decision280-moment="${k}">${l}</button>`).join('')}</div>`;
  }
  function reorderDiscover(root=document){
    const list=root.querySelector?.('[data-journey-results]');if(!list)return;
    const cards=[...list.querySelectorAll('.list-card[data-open]')];
    cards.sort((a,b)=>decisionScore((DATA||[]).find(p=>Number(p.id)===Number(b.dataset.open)))-decisionScore((DATA||[]).find(p=>Number(p.id)===Number(a.dataset.open))));
    cards.forEach(card=>{
      const p=(DATA||[]).find(x=>Number(x.id)===Number(card.dataset.open));if(!p)return;
      list.appendChild(card);
      card.querySelector('.decision280-card-verdict')?.remove();
      const v=verdictFor(p),target=card.querySelector('.decision-copy')||card;
      target.insertAdjacentHTML('beforeend',`<div class="decision280-card-verdict ${esc280(v.tone)}"><b>${esc280(v.title)}</b>${reasonPills(p,'decision280-reasons compact')}</div>`);
    });
    const label=root.querySelector?.('[data-result-label]');if(label)label.textContent=cards.length===1?'Ort · nach Jetzt-Relevanz':'Orte · nach Jetzt-Relevanz';
  }
  const baseDiscover280=discover;
  discover=function(){
    const html=baseDiscover280();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.classList.add('guest-decision-discover-280');
    const filter=root.querySelector('.journey-filter-block');if(filter&&!root.querySelector('.decision280-momentbar'))filter.insertAdjacentHTML('beforebegin',momentBar());
    const p=root.querySelector('.journey-discover-head p');if(p)p.textContent='HOY sortiert zuerst nach dem, was für deinen Moment wirklich nutzbar ist. Danach kannst du weiter eingrenzen.';
    reorderDiscover(root);
    return root.outerHTML;
  };

  function decorateMap(){
    const cards=[...document.querySelectorAll('.map-decision-card[data-map-card]')];if(!cards.length)return;
    cards.forEach(card=>{card.classList.remove('decision280-map-top');card.querySelector('.decision280-map-verdict')?.remove()});
    const rankedCards=cards.filter(card=>decisionEligibleNow((DATA||[]).find(p=>Number(p.id)===Number(card.dataset.mapCard)))).sort((a,b)=>decisionScore((DATA||[]).find(p=>Number(p.id)===Number(b.dataset.mapCard)))-decisionScore((DATA||[]).find(p=>Number(p.id)===Number(a.dataset.mapCard))));
    rankedCards.slice(0,3).forEach((card,i)=>{
      const p=(DATA||[]).find(x=>Number(x.id)===Number(card.dataset.mapCard));if(!p)return;
      card.classList.add('decision280-map-top');card.dataset.decisionRank=String(i+1);
      (card.querySelector('.map-decision-signals')||card).insertAdjacentHTML('beforebegin',`<div class="decision280-map-verdict"><b>#${i+1} · ${esc280(verdictFor(p).title)}</b>${reasonPills(p,'decision280-reasons compact')}</div>`);
    });
  }
  const baseMapView280=mapView;
  mapView=function(){
    const html=baseMapView280();const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.classList.add('guest-decision-map-280');
    const head=root.querySelector('.journey-map-head p');if(head)head.textContent='Karte und Liste folgen denselben Jetzt-Signalen – damit „in der Nähe“ nicht wichtiger wird als „passt gerade“.';
    return root.outerHTML;
  };

  function decorateProfile(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id)),d=document.getElementById('detail');if(!p||!d?.open)return;
    d.classList.add('guest-decision-profile-280');
    d.querySelector('.decision280-profile')?.remove();
    const v=verdictFor(p),identity=d.querySelector('.profile-identity-card')||d.querySelector('.detail-body');if(!identity)return;
    const primary=service(p,'reservation')==='available'?'Reservierung möglich':service(p,'pickup')==='available'?'Abholung möglich':'Direkt zum Betrieb';
    identity.insertAdjacentHTML('afterend',`<section class="decision280-profile ${esc280(v.tone)}"><div><small>WARUM JETZT?</small><h3>${esc280(v.title)}</h3></div>${reasonPills(p,'decision280-reasons profile')}<p>${esc280(primary)} · HOY zeigt nur Signale, die aus vorhandenen Betriebs-, Menü- oder Zeitdaten ableitbar sind.</p></section>`);
  }
  const baseOpenDetail280=openDetail;
  openDetail=function(id){baseOpenDetail280(id);decorateProfile(id);setTimeout(()=>decorateProfile(id),0)};

  function resetMomentAndFilters(){state.moment='all';state.query='';state.service='all';state.decision='all';render()}
  function bind280(){
    document.querySelectorAll('[data-decision280-open]').forEach(b=>b.onclick=()=>openDetail(Number(b.dataset.decision280Open)));
    document.querySelectorAll('[data-decision280-moment]').forEach(b=>b.onclick=()=>{const next=b.dataset.decision280Moment||'all';state.moment=momentAvailable(next)?next:'all';state.view='discover';render()});
    document.querySelectorAll('[data-decision280-all]').forEach(b=>b.onclick=()=>{state.moment='all';state.view='discover';render()});
    document.querySelectorAll('[data-consumer-reset],[data-decision-reset]').forEach(b=>b.onclick=resetMomentAndFilters);
    document.querySelectorAll('[data-home-intent],[data-journey-area]').forEach(b=>b.addEventListener('click',()=>{state.moment='all'},{capture:true}));
    if(state.view==='home')document.querySelectorAll('[data-nav="map"]').forEach(b=>b.addEventListener('click',()=>{state.moment='all'},{capture:true}));
    const q=document.getElementById('q');if(q&&state.view==='discover')q.addEventListener('input',()=>setTimeout(()=>reorderDiscover(document),0));
    if(state.view==='map'){
      setTimeout(decorateMap,60);setTimeout(decorateMap,220);setTimeout(decorateMap,600);
    }
  }
  const baseWire280=wire;
  wire=function(){baseWire280();bind280()};
})();

/* HOY 2.0 — German master consumer decision experience */
(function(){
  state.lang='de';
  state.decision=state.decision||'all';

  const AREA_LABELS={
    'La Manga del Mar Menor':'La Manga',
    'Cabo de Palos':'Cabo de Palos',
    'Los Alcázares / Los Narejos':'Los Alcázares',
    'San Pedro del Pinatar / Lo Pagán':'San Pedro · Lo Pagán',
    'Santiago de la Ribera / San Javier':'Santiago · San Javier',
    'La Manga Club / Atamaría':'La Manga Club',
    'Los Belones':'Los Belones',
    'Mar de Cristal / Islas Menores':'Mar de Cristal',
    'Los Urrutias / Estrella de Mar / Los Nietos':'Los Urrutias · Los Nietos'
  };
  const VENUE_LABELS={restaurant:'Restaurant',bar:'Bar',chiringuito:'Chiringuito',beach_club:'Beach Club',nightlife:'Nightlife',cafe:'Café',ice_cream:'Eisdiele',ice_cream_bar:'Eisdiele & Bar',other:'Ort'};
  const areaLabel=a=>AREA_LABELS[a]||a||'Mar Menor';
  const typeLabel=p=>VENUE_LABELS[p?.venue_type]||'Ort';
  const signatureText=p=>[p?.name,p?.description,p?.signature_title,p?.signature_text,...(Array.isArray(p?.signature_tags)?p.signature_tags:[])].filter(Boolean).join(' ').toLowerCase();

  const INTENTS=[
    {key:'restaurant',label:'Essen',hint:'Restaurants entdecken',types:['restaurant']},
    {key:'water',label:'Am Wasser',hint:'Meer, Hafen & Mar Menor',rx:/am wasser|meerblick|hafenblick|meerterrasse|strandlage|mar menor|marina|playa|beach|cala reona|wasser/i},
    {key:'sunset',label:'Sunset',hint:'Für den Abend am Wasser',rx:/sunset|sonnenuntergang|atardecer/i},
    {key:'seafood',label:'Fisch & Seafood',hint:'Fisch, Mariscos & Meer',rx:/fisch|seafood|meeresfr|marisco|pescad|cod|haddock/i},
    {key:'rice',label:'Arroces',hint:'Reisgerichte & Paella',rx:/arroces|\barroz\b|paella|\breis\b/i},
    {key:'caldero',label:'Caldero',hint:'Mar-Menor-Klassiker',rx:/caldero/i},
    {key:'breakfast',label:'Frühstück & Brunch',hint:'Für den Start in den Tag',rx:/frühstück|breakfast|brunch|all day/i},
    {key:'cocktails',label:'Cocktails & Drinks',hint:'Bar, Lounge & Drinks',rx:/cocktail|drinks|bar-games|bier|guinness/i},
    {key:'live',label:'Live-Musik',hint:'Musik, Quiz & Unterhaltung',rx:/live-musik|live music|live-unterhaltung|musikquiz|karaoke|quiz/i},
    {key:'sport',label:'Sport schauen',hint:'Fußball & TV-Sport',rx:/sport|fußball|football|tv-sport/i},
    {key:'british',label:'British & Irish',hint:'Pubs & britische Küche',rx:/british|irish|scottish|fish & chips|pub-food/i},
    {key:'vegetarian',label:'Vegetarisch',hint:'Vegetarische Optionen',rx:/vegetarisch|vegetarian|vegan/i},
    {key:'chiringuito',label:'Chiringuitos',hint:'Locker direkt am Strand',types:['chiringuito']},
    {key:'beachclub',label:'Beach Clubs',hint:'Strand, Drinks & Atmosphäre',types:['beach_club']},
    {key:'evening',label:'Drinks & Abend',hint:'Bars, Pubs & Nightlife',types:['bar','nightlife','ice_cream_bar'],rx:/abends|late night|drinks|cocktail|live-musik|irish pub|sports bar/i}
  ];
  function intentMatch(p,key){
    if(key==='all')return true;const i=INTENTS.find(x=>x.key===key);if(!i)return true;const t=signatureText(p);return !!((i.types&&i.types.includes(p?.venue_type))||(i.rx&&i.rx.test(t)));
  }
  function availableIntents(){return INTENTS.filter(i=>DATA.some(p=>intentMatch(p,i.key)))}
  function intentLabel(key){return INTENTS.find(x=>x.key===key)?.label||'Alles'}
  function trustLabel(p){if(isClaimed(p)||p?.operator_verified)return 'Betreiber bestätigt';if(p?.profile_quality==='premium')return 'HOY geprüft';return 'Basisprofil'}
  function trustClass(p){return isClaimed(p)||p?.operator_verified||p?.profile_quality==='premium'?'good':''}
  function decisionHint20(p){const tags=(Array.isArray(p?.signature_tags)?p.signature_tags:[]).filter(Boolean);return tags.slice(0,2).join(' · ')||p?.signature_title||serviceText(p)}

  filtered=function(){
    const q=(state.query||'').trim().toLowerCase();
    return DATA.filter(p=>{
      const searchable=[p.name,p.area,p.municipality,typeLabel(p),p.description,p.signature_title,p.signature_text,...(Array.isArray(p.signature_tags)?p.signature_tags:[])].filter(Boolean).join(' ').toLowerCase();
      const queryOk=!q||searchable.includes(q);
      const serviceOk=state.service==='all'||(state.service==='reservation'&&yes(p.reservation))||(state.service==='pickup'&&yes(p.pickup))||(state.service==='delivery'&&yes(p.delivery));
      return queryOk&&serviceOk&&intentMatch(p,state.decision||'all');
    });
  };

  card=function(p){
    const res=effectiveServiceState(p,'reservation');
    return `<article class="card" data-open="${p.id}"><div class="card-art">${mediaMarkup(p)}<button class="heart ${state.favorites.has(p.id)?'active':''}" data-fav="${p.id}" aria-label="Favorit">${icons.heart}</button></div><div class="card-body"><h3>${esc(p.name)}</h3><div class="meta">${esc(typeLabel(p))} · ${esc(areaLabel(p.area))}</div><div class="card-foot"><span class="pill ${trustClass(p)}">${esc(trustLabel(p))}</span>${res==='available'?'<span class="pill good">Reservierbar</span>':`<span class="pill">${esc(areaLabel(p.area))}</span>`}</div></div></article>`;
  };

  listCard=function(p){
    return `<article class="list-card decision-card" data-open="${p.id}"><div class="list-art" style="position:relative;overflow:hidden">${mediaMarkup(p)}</div><div class="decision-copy"><h3>${esc(p.name)}</h3><p>${esc(typeLabel(p))} · ${esc(areaLabel(p.area))}</p><div class="decision-hint">${esc(decisionHint20(p))}</div><span class="profile-state">${esc(trustLabel(p))}</span></div><button class="heart2" data-fav="${p.id}" aria-label="${state.favorites.has(p.id)?'Aus Favoriten entfernen':'Zu Favoriten hinzufügen'}">${icons.heart}</button></article>`;
  };

  function publicCompleteness(p){
    let n=0;if(p.profile_quality==='premium')n+=4;if(p.signature_title)n+=3;if(p.phone)n++;if(p.website)n++;if(p.hours)n++;if(menuFor(p).status==='structured')n+=2;else if(menuFor(p).source)n++;if(p.operator_verified)n+=2;return n;
  }
  function featuredForHome(){
    const pool=[...DATA].filter(p=>p.profile_quality==='premium'&&p.signature_title).sort((a,b)=>publicCompleteness(b)-publicCompleteness(a)||a.id-b.id);
    const picked=[],usedAreas=new Set(),usedTypes=new Set();
    for(const p of pool){const area=p.area||'',type=p.venue_type||'';if(picked.length<3&&(!usedAreas.has(area)||!usedTypes.has(type))){picked.push(p);usedAreas.add(area);usedTypes.add(type)}}
    for(const p of pool){if(picked.length>=3)break;if(!picked.some(x=>x.id===p.id))picked.push(p)}
    return picked.slice(0,3);
  }

  home=function(){
    const featured=featuredForHome();const intents=availableIntents();
    const quick=['water','restaurant','evening','breakfast'].map(k=>intents.find(x=>x.key===k)).filter(Boolean);
    const chips=['sunset','chiringuito','seafood','rice','cocktails','live','sport','british'].map(k=>intents.find(x=>x.key===k)).filter(Boolean);
    return `<section><div class="hero"><div class="hero-top"><div class="brand"><b>H<span>O</span><em>Y</em></b><small>LA MANGA · MAR MENOR</small></div></div><div class="hero-copy"><h1>Was passt<br>heute?</h1><p>Essen, trinken oder ausgehen – ohne zehn Tabs und endloses Suchen.</p></div><div class="intent-panel"><div class="intent-title"><b>Wonach ist dir?</b><small>Echte Filter · keine Demo</small></div><div class="intent-grid">${quick.map((x,i)=>`<button class="${i===0?'primary':''}" data-home-intent="${x.key}"><strong>${esc(x.label)}</strong><span>${esc(x.hint)}</span></button>`).join('')}</div><div class="home-search"><input data-home-search placeholder="Betrieb, Ort, Küche oder Stimmung …" aria-label="HOY durchsuchen"><button data-home-search-go>Suchen</button></div></div></div>${chips.length?`<div class="today-strip"><div class="eyebrow">SCHNELL ENTSCHEIDEN</div><div class="today-chips">${chips.map(x=>`<button data-home-intent="${x.key}">${esc(x.label)}</button>`).join('')}</div></div>`:''}<div class="section"><div class="section-head"><h2>HOY Auswahl</h2><button data-nav="discover">Alle Orte ›</button></div><div class="cards">${featured.map(card).join('')}</div></div><div class="editorial"><div class="eyebrow">HOY NOW</div><h2>Die Region nach Anlass entdecken.</h2><p>Von Caldero und Arroces bis Sunset, Live-Musik und British Pubs. HOY bündelt die Gründe, warum ein Ort heute zu dir passen könnte.</p><button data-nav="discover">Alles entdecken</button></div><div class="source">Premium-Profile sind von HOY vertieft recherchiert. Betreiberbestätigte Angaben werden entsprechend gekennzeichnet; unbekannte Daten bleiben bewusst offen.</div></section>`;
  };

  discover=function(){
    let list=filtered();const intents=availableIntents();
    if(state.decision!=='all'&&!intents.some(x=>x.key===state.decision)){state.decision='all';list=filtered()}
    const active=[];if(state.decision!=='all')active.push(intentLabel(state.decision));if(state.service!=='all')active.push({reservation:'Reservierbar',pickup:'Abholung',delivery:'Lieferung'}[state.service]);if((state.query||'').trim())active.push(`„${state.query.trim()}“`);
    return `<section><div class="head"><div class="head-top"><div class="brand" style="color:var(--navy)"><b>H<span>O</span><em>Y</em></b><small>MAR MENOR</small></div></div><h1>Entdecken.</h1><p>Wähle nach Anlass statt dich durch eine endlose Restaurantliste zu arbeiten.</p><div class="searchline"><input id="q" placeholder="Betrieb, Ort, Küche oder Stimmung …" value="${esc(state.query||'')}"><button>${icons.compass}</button></div></div><div class="consumer-filter-block"><div class="consumer-filter-head"><b>Was passt heute?</b><small>nur Filter mit echten Treffern</small></div><div class="consumer-chips"><button class="${state.decision==='all'?'active':''}" data-decision="all">Alles</button>${intents.map(x=>`<button class="${state.decision===x.key?'active':''}" data-decision="${x.key}">${esc(x.label)}</button>`).join('')}</div></div><div class="filterline">${[['all','Alle Services'],['reservation','Reservierbar'],['pickup','Abholung'],['delivery','Lieferung']].map(([k,l])=>`<button class="${state.service===k?'active':''}" data-filter="${k}">${l}</button>`).join('')}</div>${active.length?`<div class="active-filter"><span>Aktiv: ${esc(active.join(' · '))}</span><button data-consumer-reset>Zurücksetzen</button></div>`:''}<div class="result-count">${list.length} ${list.length===1?'Ort passt':'Orte passen'} zu deiner Auswahl</div><div class="list">${list.map(listCard).join('')||'<div class="empty"><h2>Hier passt gerade nichts.</h2><p>Nimm einen Filter heraus oder suche nach einem anderen Ort.</p><button data-consumer-reset>Filter zurücksetzen</button></div>'}</div></section>`;
  };

  mapView=function(){
    const zoneOrder=['La Manga del Mar Menor','Cabo de Palos','La Manga Club / Atamaría','Los Belones','Mar de Cristal / Islas Menores','Los Urrutias / Estrella de Mar / Los Nietos','Los Alcázares / Los Narejos','Santiago de la Ribera / San Javier','San Pedro del Pinatar / Lo Pagán'];
    const zones=zoneOrder.map(area=>({area,count:DATA.filter(x=>x.area===area).length})).filter(x=>x.count);
    return `<section><div class="head"><div class="head-top"><div class="eyebrow">REGION</div><button class="round" data-nav="discover">${icons.compass}</button></div><h1>Wo bist du heute?</h1><p>Spring direkt in den passenden Teil des Mar Menor. Die Route zum einzelnen Betrieb öffnest du anschließend aus seinem Profil.</p></div><div class="region-hero"><div class="eyebrow" style="color:#ffb184">HOY · MAR MENOR</div><h3>Eine Region, viele Abende.</h3><p>Exakte Kartenpins schalten wir erst frei, wenn die Koordinaten eines Betriebs verifiziert sind. Bis dahin navigiert HOY ehrlich über Orte und die bestätigte Adresse im Profil.</p></div><div class="map-frame"><div class="map-fallback">La Manga · Cabo de Palos · Mar Menor</div><iframe title="Karte Mar Menor" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-0.92%2C37.58%2C-0.65%2C37.88&layer=mapnik"></iframe></div><div class="zones">${zones.map(z=>`<div class="zone consumer-zone"><div><h3>${esc(areaLabel(z.area))}</h3><small>${z.count} ${z.count===1?'Ort':'Orte'} in HOY</small></div><button data-zone="${esc(z.area)}">Entdecken</button></div>`).join('')}</div></section>`;
  };

  const openDetail20=openDetail;
  openDetail=function(id){
    openDetail20(id);const p=DATA.find(x=>Number(x.id)===Number(id)),d=document.getElementById('detail');if(!p||!d)return;
    const pills=[...d.querySelectorAll('.statusrow .pill')];
    const rs=effectiveServiceState(p,'reservation'),m=menuFor(p);
    if(pills[0]){pills[0].className='pill '+(rs==='available'?'good':'neutral');pills[0].textContent=rs==='available'?'Reservierung möglich':rs==='unavailable'?'Keine Reservierung gelistet':'Reservierung nicht bestätigt'}
    if(pills[1]){pills[1].className='pill '+((m.status==='structured'||m.status==='official_link')?'good':'neutral');pills[1].textContent=m.status==='structured'?'Speisekarte verfügbar':m.status==='official_link'?'Offizielle Karte verlinkt':'Speisekarte noch offen'}
    if(pills[2]){pills[2].className='pill '+trustClass(p);pills[2].textContent=trustLabel(p)}
    const summary=d.querySelector('.service-summary p');if(summary)summary.textContent='HOY zeigt nur bestätigte oder klar als offen gekennzeichnete Servicewege. Reservierung, Bestellung und Zahlung erfolgen in dieser Version direkt beim Betrieb.';
    const claim=d.querySelector('.claim');if(claim){const h=claim.querySelector('h3'),pp=claim.querySelector('p');if(h)h.textContent='Gehört dieser Betrieb dir?';if(pp)pp.textContent='Übernimm das kostenlose Profil, bestätige Daten und Services und prüfe anschließend die von HOY vorbereitete Bildauswahl.'}
    const body=d.querySelector('.detail-body');if(body&&!body.querySelector('.detail-trust-note')){const note=document.createElement('div');note.className='detail-trust-note';note.textContent=p.profile_quality==='premium'?'HOY hat dieses Profil vertieft recherchiert. Betreiberbestätigte Angaben sind separat gekennzeichnet.':'Dieses Basisprofil wird schrittweise geprüft oder vom Betreiber übernommen.';const row=d.querySelector('.statusrow');row?.insertAdjacentElement('afterend',note)}
  };

  const wire20=wire;
  wire=function(){
    wire20();
    document.querySelectorAll('[data-home-intent]').forEach(b=>b.onclick=()=>{state.query='';state.service='all';state.decision=b.dataset.homeIntent;nav('discover')});
    const hq=document.querySelector('[data-home-search]'),go=document.querySelector('[data-home-search-go]');
    const runSearch=()=>{const q=hq?.value.trim()||'';state.query=q;state.service='all';state.decision='all';nav('discover')};
    if(go)go.onclick=runSearch;if(hq)hq.onkeydown=e=>{if(e.key==='Enter')runSearch()};
    document.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>{state.decision=b.dataset.decision;render()});
    document.querySelectorAll('[data-consumer-reset]').forEach(b=>b.onclick=()=>{state.query='';state.service='all';state.decision='all';render()});
    document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{state.query=b.dataset.zone;state.service='all';state.decision='all';nav('discover')});
  };
})();

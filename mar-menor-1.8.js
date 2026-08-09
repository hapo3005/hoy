/* HOY 1.8 — Mar Menor venue expansion + privacy-conscious cloud analytics */
(function(){
  const VENUE_LABELS={
    restaurant:'Restaurant',bar:'Bar',chiringuito:'Chiringuito',beach_club:'Beach Club',
    nightlife:'Nightlife',cafe:'Café',ice_cream:'Heladería',ice_cream_bar:'Heladería & Bar',other:'Ort'
  };
  const AREA_SHORT={
    'La Manga del Mar Menor':'La Manga',
    'Cabo de Palos':'Cabo de Palos',
    'Los Alcázares / Los Narejos':'Los Alcázares',
    'San Pedro del Pinatar / Lo Pagán':'San Pedro · Lo Pagán',
    'Santiago de la Ribera / San Javier':'Santiago · San Javier',
    'La Manga Club / Atamaría':'La Manga Club',
    'Los Belones':'Los Belones',
    'Mar de Cristal / Islas Menores':'Mar de Cristal · Islas Menores',
    'Los Urrutias / Estrella de Mar / Los Nietos':'Los Urrutias · Los Nietos'
  };
  function venueLabel(p){return VENUE_LABELS[p?.venue_type]||'Ort'}
  function shortArea(area=''){return AREA_SHORT[area]||area||'Mar Menor'}

  // New Basic profiles must never look as if a La-Manga photo were a venue photo.
  MEDIA_SOURCES.mar_menor={
    kind:'regional',src:HERO,position:'50% 42%',
    label:'Regionales Umgebungsbild · Mar Menor',
    source:'https://commons.wikimedia.org/wiki/File:La_Manga_y_el_Mar_Menor.jpg',
    author:'Alesper33',license:'CC BY-SA 4.0',
    license_url:'https://creativecommons.org/licenses/by-sa/4.0/',
    note:'Freies Regionalbild des Mar Menor; zeigt nicht den konkreten Betrieb.'
  };
  const mediaFor17=mediaFor;
  mediaFor=function(p){
    if(typeof claimDraft!=='undefined'&&claimDraft&&hasLocalVerifiedClaim(p)&&claimDraft.ownerHero)return mediaFor17(p);
    if(PROFILE_MEDIA[p.id])return mediaFor17(p);
    return MEDIA_SOURCES.mar_menor;
  };

  // Load the expanded venue model from Supabase while keeping all existing services/claims intact.
  loadCloudRestaurants=async function(){
    const {data,error}=await sb.from('restaurants').select('id,slug,name,area,municipality,venue_type,profile_quality,description,address,phone,website,hours_text,latitude,longitude,is_published,source_checked_at,restaurant_services(reservation_state,pickup_state,delivery_state),restaurant_entitlements(operator_verified,active_plan)').eq('is_published',true).order('id');
    if(error)throw error;
    DATA=(data||[]).map(row=>{
      const base=LOCAL_DATA.find(x=>Number(x.id)===Number(row.id))||{};
      const svc=Array.isArray(row.restaurant_services)?row.restaurant_services[0]:row.restaurant_services||{};
      const ent=Array.isArray(row.restaurant_entitlements)?row.restaurant_entitlements[0]:row.restaurant_entitlements||{};
      return {...base,id:Number(row.id),slug:row.slug,name:row.name,area:row.area,municipality:row.municipality||'',venue_type:row.venue_type||'restaurant',profile_quality:row.profile_quality||'basic',description:row.description||base.description||'',address:row.address||base.address||'',phone:row.phone||base.phone||'',website:row.website||base.website||'',hours:row.hours_text||base.hours||'',latitude:row.latitude?Number(row.latitude):null,longitude:row.longitude?Number(row.longitude):null,source_checked_at:row.source_checked_at||null,reservation:legacyService(svc.reservation_state),pickup:legacyService(svc.pickup_state),delivery:legacyService(svc.delivery_state),operator_verified:!!ent.operator_verified,active_plan:ent.active_plan||'free',cloud:true};
    });
    cloud.restaurantCount=DATA.length;
  };

  cloudStrip=function(){return `<div class="cloud-strip"><div class="copy"><b>${cloud.status==='online'?'Live-Daten aus Supabase':'Lokaler Sicherheits-Fallback'}</b><small>${cloud.status==='online'?`${cloud.restaurantCount} Orte aus der Cloud · ${cloud.menuItemCount} Menüpositionen synchronisiert`:cloud.error||'Verbindung wird aufgebaut …'}</small></div><span class="cloud-state ${cloud.status==='online'?'online':cloud.status==='error'?'error':''}">${cloudStateLabel()}</span></div>`};

  meta=function(p){
    const legacy=p.meta?.replace((p.area||'')+' · ','')||'';
    return legacy||[venueLabel(p),shortArea(p.area)].filter(Boolean).join(' · ');
  };

  card=function(p){return `<article class="card" data-open="${p.id}"><div class="card-art">${mediaMarkup(p)}<button class="heart ${state.favorites.has(p.id)?'active':''}" data-fav="${p.id}">${icons.heart}</button></div><div class="card-body"><h3>${esc(p.name)}</h3><div class="meta">${esc(meta(p))}</div><div class="card-foot"><span class="pill ${effectiveServiceState(p,'reservation')==='available'?'good':'warn'}">${effectiveServiceState(p,'reservation')==='available'?'Reservierbar':p.profile_quality==='premium'?'Daten prüfen':'Basisprofil'}</span><span class="pill">${esc(shortArea(p.area))}</span></div></div></article>`};

  home=function(){
    const featured=[DATA[1],DATA[8],DATA[16]].filter(Boolean);
    return `<section><div class="hero"><div class="hero-top"><div class="brand"><b>H<span>O</span><em>Y</em></b><small>LA MANGA · MAR MENOR</small></div><button class="bell">${icons.bell}</button></div><div class="hero-copy"><h1>Was heute<br>zählt.</h1><p>Finde deinen Ort zum Essen, Trinken oder Ausgehen rund ums Mar Menor.</p></div><div class="search-box"><div class="search-row">${icons.pin}<div><small>Wo?</small><strong>La Manga · Cabo · Mar Menor</strong></div>${icons.chev}</div><div class="search-row">${icons.calendar}<div><small>Wann?</small><strong>Heute, 19:00</strong></div>${icons.chev}</div><div class="search-row">${icons.people}<div><small>Für wie viele?</small><strong>2 Personen</strong></div>${icons.chev}</div><button class="go" data-go>Jetzt entdecken</button></div></div><div class="quick"><button class="active" data-service="all">${icons.food}Essen & Trinken</button><button data-service="reservation">${icons.calendar}Reservieren</button><button data-service="pickup">${icons.bag}Abholung</button><button data-service="delivery">${icons.truck}Lieferung</button></div><div class="section"><div class="section-head"><h2>Empfohlen für dich</h2><button data-nav="discover">Alle anzeigen ›</button></div><div class="cards">${featured.map(card).join('')}</div></div><div class="editorial"><div class="eyebrow">HOY NOW</div><h2>Heute entscheiden statt lange suchen.</h2><p>Restaurants, Bars, Chiringuitos, Beach Clubs und Nightlife – mit Menüs, Services und klar gekennzeichnetem Datenstatus.</p><button data-nav="discover">Jetzt entdecken</button></div><div class="source">Premium-Profile sind von HOY vertieft recherchiert. Neue Basic-Profile nutzen zunächst öffentlich verfügbare Stammdaten und werden schrittweise geprüft oder vom Betreiber übernommen.</div></section>`;
  };

  const DECISIONS18=[
    {key:'water',label:'Am Wasser',test:/wasser|meer|strand|hafen|küste|beach|mar menor|meerblick|marina|playa|cala reona/i},
    {key:'fish',label:'Fisch & Seafood',test:/fisch|meeresfr|seafood|marisco|pescad/i},
    {key:'rice',label:'Arroces',test:/\breis|arroz|arroces|paella/i},
    {key:'caldero',label:'Caldero',test:/caldero/i},
    {key:'sunset',label:'Sunset',test:/sunset|sonnenuntergang|atardecer/i},
    {key:'chiringuito',label:'Chiringuitos',types:['chiringuito']},
    {key:'bar',label:'Bars & Drinks',types:['bar','ice_cream_bar']},
    {key:'beachclub',label:'Beach Clubs',types:['beach_club']},
    {key:'nightlife',label:'Nightlife',types:['nightlife']},
    {key:'grill',label:'Grill',test:/grill|fleisch|steak|brasa|carne/i},
    {key:'japan',label:'Japanisch',test:/japan|sushi|nikkei/i}
  ];
  function signatureText18(p){const tags=Array.isArray(p?.signature_tags)?p.signature_tags.join(' '):'';return [p?.signature_title,p?.signature_text,tags].filter(Boolean).join(' ').toLowerCase()}
  function decisionKeys18(p){const text=signatureText18(p);return DECISIONS18.filter(x=>(x.types&&x.types.includes(p?.venue_type))||(x.test&&x.test.test(text))).map(x=>x.key)}
  function visibleDecisions18(){return DECISIONS18.filter(x=>DATA.some(p=>decisionKeys18(p).includes(x.key)))}

  filtered=function(){
    const q=state.query.trim().toLowerCase();
    return DATA.filter(p=>{
      const searchable=[p.name,p.area,p.municipality,venueLabel(p),p.description,p.signature_title,p.signature_text,...(Array.isArray(p.signature_tags)?p.signature_tags:[])].filter(Boolean).join(' ').toLowerCase();
      const queryOk=!q||searchable.includes(q);
      const serviceOk=state.service==='all'||(state.service==='reservation'&&yes(p.reservation))||(state.service==='pickup'&&yes(p.pickup))||(state.service==='delivery'&&yes(p.delivery));
      const decisionOk=state.decision==='all'||decisionKeys18(p).includes(state.decision);
      return queryOk&&serviceOk&&decisionOk;
    });
  };

  discover=function(){
    const list=filtered();const decisions=visibleDecisions18();
    if(state.decision!=='all'&&!decisions.some(x=>x.key===state.decision))state.decision='all';
    const decisionRow=decisions.length?`<div class="decision-filter"><div class="decision-filter-label"><span>WOFÜR GEHST DU LOS?</span><small>Nach Stimmung, Küche und Ortstyp</small></div><div class="decisionline"><button class="${state.decision==='all'?'active':''}" data-decision="all">Alles</button>${decisions.map(x=>`<button class="${state.decision===x.key?'active':''}" data-decision="${x.key}">${esc(x.label)}</button>`).join('')}</div></div>`:'';
    return `<section><div class="head"><div class="head-top"><div class="brand" style="color:var(--navy)"><b>H<span>O</span><em>Y</em></b><small>LA MANGA · MAR MENOR</small></div><button class="round" data-lang>${state.lang.toUpperCase()}</button></div><h1>Entdecken.</h1><p>Restaurants, Bars und Chiringuitos von La Manga und Cabo de Palos bis rund ums Mar Menor.</p><div class="searchline"><input id="q" placeholder="Ort, Betrieb, Küche oder Stimmung …" value="${esc(state.query)}"><button>${icons.compass}</button></div></div><div class="filterline">${[['all','Alle'],['reservation','Reservierung'],['pickup','Abholung'],['delivery','Lieferung']].map(([k,l])=>`<button class="${state.service===k?'active':''}" data-filter="${k}">${l}</button>`).join('')}</div>${decisionRow}<div class="result-count">${list.length} ${list.length===1?'Ort':'Orte'} passen zu deiner Auswahl</div><div class="list">${list.map(listCard).join('')||'<div class="empty"><h2>Nichts gefunden.</h2><p>Ändere Suche oder Filter.</p><button data-decision-reset>Filter zurücksetzen</button></div>'}</div></section>`;
  };

  mapView=function(){
    const zoneOrder=['La Manga del Mar Menor','Cabo de Palos','La Manga Club / Atamaría','Los Belones','Mar de Cristal / Islas Menores','Los Urrutias / Estrella de Mar / Los Nietos','Los Alcázares / Los Narejos','Santiago de la Ribera / San Javier','San Pedro del Pinatar / Lo Pagán'];
    const zones=zoneOrder.map(area=>({area,count:DATA.filter(x=>x.area===area).length})).filter(x=>x.count);
    return `<section><div class="head"><div class="head-top"><div class="eyebrow">KARTE</div><button class="round" data-nav="discover">${icons.compass}</button></div><h1>Rund ums Mar Menor.</h1><p>La Manga, Cabo de Palos, La Manga Club und die Orte rund um die Lagune in einer gemeinsamen HOY-Region.</p></div><div class="map-frame"><div class="map-fallback">La Manga · Cabo de Palos · Mar Menor</div><iframe title="Karte Mar Menor" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-0.92%2C37.58%2C-0.65%2C37.88&layer=mapnik"></iframe></div><div class="map-note">Restaurant-Pins werden nur mit verifizierten Koordinaten gesetzt. Die Gebietsauswahl funktioniert bereits mit allen Live-Profilen.</div><div class="zones">${zones.map(z=>`<div class="zone"><div><h3>${esc(shortArea(z.area))}</h3><small>${z.count} ${z.count===1?'Ort':'Orte'}</small></div><button data-zone="${esc(z.area)}">Ansehen</button></div>`).join('')}</div></section>`;
  };

  // Preserve local metrics for instant operator preview and additionally send allowed events to Supabase.
  const ANALYTICS_ANON_KEY='hoy-anonymous-id-v1';
  const ANALYTICS_SESSION_KEY='hoy-session-id-v1';
  function randomId(){return (crypto?.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)}))}
  function storedUuid(storage,key){let v=storage.getItem(key);if(!v){v=randomId();storage.setItem(key,v)}return v}
  function safeMeta(meta={}){
    const out={};const blocked=/email|phone|address|note|message|name/i;
    for(const [k,v] of Object.entries(meta||{})){if(blocked.test(k))continue;if(['string','number','boolean'].includes(typeof v))out[k]=String(v).slice(0,120)}
    out.lang=state.lang;out.view=state.view;out.client_version='1.8';return out;
  }
  trackEvent=function(type,restaurantId,meta={}){
    const rows=readEvents();rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)));
    if(!sb||cloud.status!=='online')return;
    const p=restaurantId?DATA.find(x=>Number(x.id)===Number(restaurantId)):null;
    const metadata={...safeMeta(meta),venue_type:p?.venue_type||undefined,profile_quality:p?.profile_quality||undefined};
    sb.from('analytics_events').insert({restaurant_id:Number(restaurantId)||null,event_type:type,anonymous_id:storedUuid(localStorage,ANALYTICS_ANON_KEY),session_id:storedUuid(sessionStorage,ANALYTICS_SESSION_KEY),metadata}).then(({error})=>{if(error)console.warn('HOY analytics event rejected',error.message)});
  };

  const wire17=wire;
  wire=function(){
    wire17();
    document.querySelectorAll('[data-decision]').forEach(b=>b.addEventListener('click',()=>trackEvent('filter_change',null,{decision:b.dataset.decision})));
    document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>trackEvent('filter_change',null,{service:b.dataset.filter})));
    document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>trackEvent('map_open',null,{zone:b.dataset.zone})));
  };
})();

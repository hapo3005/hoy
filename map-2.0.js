/* HOY 2.0 — verified/address-geocoded Mar Menor venue map */
(function(){
  let locationMeta=new Map();
  let activeMap=null;

  const AREA_MAP_LABELS={
    'La Manga del Mar Menor':'La Manga','Cabo de Palos':'Cabo de Palos','Los Alcázares / Los Narejos':'Los Alcázares',
    'San Pedro del Pinatar / Lo Pagán':'San Pedro · Lo Pagán','Santiago de la Ribera / San Javier':'Santiago · San Javier',
    'La Manga Club / Atamaría':'La Manga Club','Los Belones':'Los Belones','Mar de Cristal / Islas Menores':'Mar de Cristal · Islas Menores',
    'Los Urrutias / Estrella de Mar / Los Nietos':'Los Urrutias · Los Nietos'
  };
  const MAP_VENUE_LABELS={restaurant:'Restaurant',bar:'Bar',chiringuito:'Chiringuito',beach_club:'Beach Club',nightlife:'Nightlife',cafe:'Café',ice_cream:'Eisdiele',ice_cream_bar:'Eisdiele & Bar',other:'Ort'};
  const areaMapLabel=a=>AREA_MAP_LABELS[a]||a||'Mar Menor';
  const mapVenueLabel=p=>MAP_VENUE_LABELS[p?.venue_type]||'Ort';
  const locationLabel=p=>{
    const m=locationMeta.get(Number(p.id));
    if(m?.location_status==='verified')return 'Standort geprüft';
    if(m?.location_precision==='venue_complex')return 'Standort im Komplex';
    return 'Adresslage geprüft';
  };
  async function loadLocationMeta(){
    if(!sb)return;
    const {data,error}=await sb.from('restaurants').select('id,location_status,location_precision,location_checked_at').eq('is_published',true);
    if(error){console.warn('HOY location metadata unavailable',error);return}
    locationMeta=new Map((data||[]).map(x=>[Number(x.id),x]));
  }
  const initCloudMap20=initCloud;
  initCloud=async function(){
    await initCloudMap20();
    if(sb&&cloud.status==='online'){
      await loadLocationMeta();
      render();
    }
  };

  function mapRows(){return filtered().filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
  function groupedPins(rows){
    const groups=new Map();
    for(const p of rows){
      const lat=Number(p.latitude),lon=Number(p.longitude),key=`${lat.toFixed(6)},${lon.toFixed(6)}`;
      if(!groups.has(key))groups.set(key,{lat,lon,venues:[]});groups.get(key).venues.push(p);
    }
    return [...groups.values()];
  }
  function pinIcon(n){
    const html=n>1?`<div class="hoy-map-pin multi"><span>${n}</span></div>`:'<div class="hoy-map-pin"></div>';
    return L.divIcon({className:'hoy-map-icon',html,iconSize:n>1?[34,34]:[28,28],iconAnchor:n>1?[17,31]:[14,26],popupAnchor:[0,-25]});
  }
  function popupHTML(group){
    const title=group.venues.length>1?`${group.venues.length} Orte an diesem Standort`:group.venues[0].name;
    const sub=group.venues.length>1?areaMapLabel(group.venues[0].area):`${mapVenueLabel(group.venues[0])} · ${areaMapLabel(group.venues[0].area)}`;
    return `<div class="map-popup"><div class="map-popup-head"><b>${esc(title)}</b><span>${esc(sub)}</span></div><div class="map-popup-list">${group.venues.map(p=>`<div class="map-popup-venue"><b>${esc(p.name)}</b><small>${esc(mapVenueLabel(p))} · ${esc(p.address||areaMapLabel(p.area))}</small><div class="map-popup-actions"><span>${esc(locationLabel(p))}</span><button data-map-open="${p.id}">Profil ansehen</button></div></div>`).join('')}</div></div>`;
  }
  function mapStats(rows){
    let verified=0,complex=0,approx=0;
    rows.forEach(p=>{const m=locationMeta.get(Number(p.id));if(m?.location_status==='verified')verified++;else if(m?.location_precision==='venue_complex')complex++;else approx++});
    return {verified,complex,approx};
  }
  mapView=function(){
    const rows=mapRows(),stats=mapStats(rows),all=state.decision==='all'&&state.service==='all'&&!(state.query||'').trim();
    const zones=[...new Map(DATA.map(p=>[p.area,p])).keys()].filter(Boolean);
    return `<section><div class="head"><div class="head-top"><div class="eyebrow">KARTE</div><button class="round" data-nav="discover">${icons.compass}</button></div><h1>${all?`${DATA.length} Orte. Eine Karte.`:'Deine Auswahl auf der Karte.'}</h1><p>${all?'Alle veröffentlichten HOY-Betriebe rund ums Mar Menor – mit geprüfter Geschäftsadresse und dokumentierter Georeferenz.':'Die Karte übernimmt deine aktuelle Suche und Filter aus Entdecken.'}</p></div><div class="hoy-map-shell"><div class="hoy-map-summary"><div><div class="eyebrow">HOY · MAR MENOR</div><h2>${rows.length} ${rows.length===1?'Standort':'Standorte'} sichtbar</h2><p>${stats.verified} exakt geprüft · ${stats.complex} in bestätigten Anlagen · ${stats.approx} adressbasiert</p></div><div class="hoy-map-count"><strong>${rows.length}</strong><span>Orte</span></div></div><div id="hoyMap" class="hoy-map" aria-label="Interaktive Karte der HOY-Betriebe"></div><div class="map-legend"><span><i></i> Exakter POI / Portal</span><span><i></i> Hotel, Marina oder Anlage</span><span><i></i> Geprüfte Adresslage</span></div><div class="map-zone-strip">${zones.map(a=>`<button data-map-zone="${esc(a)}">${esc(areaMapLabel(a))}</button>`).join('')}</div></div></section>`;
  };

  function initHoyMap(){
    const el=document.getElementById('hoyMap');if(!el)return;
    if(activeMap){try{activeMap.remove()}catch{}activeMap=null}
    if(typeof L==='undefined'){el.innerHTML='<div class="map-load-error">Die Kartenbibliothek konnte nicht geladen werden. Die geprüften Adressen bleiben in den Profilen verfügbar.</div>';return}
    const rows=mapRows();if(!rows.length){el.innerHTML='<div class="map-load-error">Für diese Auswahl sind keine Kartenpunkte vorhanden.</div>';return}
    const map=L.map(el,{zoomControl:true,scrollWheelZoom:false,preferCanvas:true});activeMap=map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
    const bounds=[];
    for(const group of groupedPins(rows)){
      const marker=L.marker([group.lat,group.lon],{icon:pinIcon(group.venues.length),keyboard:true,title:group.venues.length>1?`${group.venues.length} HOY-Orte`:group.venues[0].name}).addTo(map);
      marker.bindPopup(popupHTML(group),{maxWidth:300});bounds.push([group.lat,group.lon]);
    }
    if(bounds.length===1)map.setView(bounds[0],15);else map.fitBounds(bounds,{padding:[24,24],maxZoom:15});
    el.addEventListener('click',e=>{const b=e.target.closest?.('[data-map-open]');if(!b)return;e.preventDefault();openDetail(Number(b.dataset.mapOpen))});
    setTimeout(()=>map.invalidateSize(),80);
  }

  const wireMap20=wire;
  wire=function(){
    wireMap20();
    document.querySelectorAll('[data-map-zone]').forEach(b=>b.onclick=()=>{state.query=b.dataset.mapZone;state.service='all';state.decision='all';nav('discover')});
    if(document.getElementById('hoyMap'))setTimeout(initHoyMap,0);
  };
})();

/* HOY 2.40.0 — Family / Essen & Spielen decision layer. */
(function(){
  if(window.__hoyFamilyPlaygrounds240)return;
  window.__hoyFamilyPlaygrounds240=true;
  window.hoyFamilyPlaygroundsVersion='2.40.0';

  const familyState={loaded:false,loadError:''};
  const VERIFIED=new Set(['operator_confirmed','source_verified','community_verified','hoy_verified']);
  const PLAY_TYPES=new Set(['play_area','outdoor_playground','indoor_playroom','inflatable','splash','minigolf','amusement_park']);
  const SUPERVISION_TYPES=new Set(['parent','staff','camera']);
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy={
    de:{
      eyebrow:'HOY FAMILIE',title:'Essen & Spielen.',lead:'Finde Orte, an denen Eltern essen und Kinder spielen können – mit geprüften Angaben zu Spielart, Zugang, Nähe und Sicht statt einer vagen „kinderfreundlich“-Angabe.',
      empty:'Noch keine verifizierten Essen-&-Spielen-Treffer.',emptySub:'HOY zeigt hier erst einen Ort, wenn das Familienangebot nachvollziehbar bestätigt wurde. Offene Details bleiben ausdrücklich als ungeprüft markiert.',cta:'Essen & Spielen entdecken',
      family:'Familie',playground:'Spielangebot',direct:'Direkt dabei',visible:'Vom Tisch sichtbar',all:'Alle',verified:'HOY verifiziert',operator:'Vom Betrieb bestätigt',source:'Quelle geprüft',community:'Community bestätigt',
      own:'Spielbereich vor Ort',adjacent:'Spielangebot direkt daneben',nearby:'Spielangebot in der Nähe',visibleBadge:'Vom Sitzplatz einsehbar',indoor:'Indoor-Spielbereich',shade:'Schatten am Spielbereich',fenced:'Eingezäunt',traffic:'Vom Verkehr getrennt',highchairs:'Hochstühle',changing:'Wickelmöglichkeit',kidsMenu:'Kindergerichte',stroller:'Kinderwagen-tauglich',age:'Geeignetes Alter',familyFacts:'Für Familien',unknown:'Noch nicht geprüft',
      playTypes:'Spielangebot',relationship:'Lage zum Restaurant',access:'Zugang',distance:'Entfernung',road:'Weg zum Spielbereich',supervision:'Aufsicht',free:'Kostenlos',customers:'Für Restaurantgäste',paid:'Kostenpflichtig',guests:'Nur Anlagen-/Hotelgäste',onPremises:'Auf dem Gelände',directlyAdjacent:'Direkt daneben',nearbyRel:'In der Nähe',noRoad:'Keine Straßenquerung',pedestrian:'Fußgängerbereich',localRoad:'Nebenstraße zu queren',mainRoad:'Hauptstraße zu queren',distanceSource:'laut Quelle',distanceEstimate:'Karten-Schätzung',distanceMeasured:'HOY gemessen',
      playArea:'Spielbereich',outdoor:'Spielplatz',indoorRoom:'Indoor-Spielraum',inflatable:'Hüpf-/Inflatable-Bereich',splash:'Splash/Wasserspiel',minigolf:'Minigolf',amusement:'Freizeitpark',parent:'Eltern',staff:'Personal',camera:'Kamera'
    },
    en:{
      eyebrow:'HOY FAMILY',title:'Eat & play.',lead:'Find places where parents can eat while children play – with checked facts on play type, access, proximity and visibility rather than a vague “family-friendly” label.',
      empty:'No verified eat & play matches yet.',emptySub:'HOY only lists a match after the family offer has traceable evidence. Open details stay explicitly marked as unverified.',cta:'Explore eat & play',
      family:'Family',playground:'Play option',direct:'Right there',visible:'Visible from table',all:'All',verified:'HOY verified',operator:'Confirmed by venue',source:'Source checked',community:'Community confirmed',
      own:'Play area on site',adjacent:'Play option right next door',nearby:'Play option nearby',visibleBadge:'Visible from seating',indoor:'Indoor play area',shade:'Shade at play area',fenced:'Fenced',traffic:'Separated from traffic',highchairs:'Highchairs',changing:'Changing facility',kidsMenu:'Kids menu',stroller:'Stroller friendly',age:'Suitable age',familyFacts:'For families',unknown:'Not checked yet',
      playTypes:'Play option',relationship:'Location vs venue',access:'Access',distance:'Distance',road:'Route to play area',supervision:'Supervision',free:'Free',customers:'Restaurant guests',paid:'Paid',guests:'Accommodation guests only',onPremises:'On premises',directlyAdjacent:'Right next door',nearbyRel:'Nearby',noRoad:'No road crossing',pedestrian:'Pedestrian area',localRoad:'Local road crossing',mainRoad:'Main road crossing',distanceSource:'source stated',distanceEstimate:'map estimate',distanceMeasured:'HOY measured',
      playArea:'Play area',outdoor:'Playground',indoorRoom:'Indoor playroom',inflatable:'Inflatable play',splash:'Splash/water play',minigolf:'Mini golf',amusement:'Amusement park',parent:'Parents',staff:'Staff',camera:'Camera'
    },
    es:{
      eyebrow:'HOY FAMILIA',title:'Comer y jugar.',lead:'Encuentra sitios donde los adultos puedan comer mientras los niños juegan, con datos comprobados sobre tipo de juego, acceso, cercanía y visibilidad.',
      empty:'Aún no hay resultados verificados de comer y jugar.',emptySub:'HOY solo publica un resultado cuando la oferta familiar tiene una evidencia trazable. Los detalles abiertos se marcan claramente como no comprobados.',cta:'Ver comer y jugar',
      family:'Familia',playground:'Zona de juego',direct:'Justo ahí',visible:'Visible desde la mesa',all:'Todos',verified:'Verificado por HOY',operator:'Confirmado por el local',source:'Fuente verificada',community:'Comunidad verificada',
      own:'Zona de juego en el local',adjacent:'Zona de juego justo al lado',nearby:'Zona de juego cercana',visibleBadge:'Visible desde las mesas',indoor:'Zona de juego interior',shade:'Sombra en la zona de juego',fenced:'Cerrado',traffic:'Separado del tráfico',highchairs:'Tronas',changing:'Cambiador',kidsMenu:'Menú infantil',stroller:'Accesible con carrito',age:'Edad recomendada',familyFacts:'Para familias',unknown:'Aún sin verificar',
      playTypes:'Tipo de juego',relationship:'Ubicación respecto al local',access:'Acceso',distance:'Distancia',road:'Camino a la zona de juego',supervision:'Supervisión',free:'Gratis',customers:'Clientes del restaurante',paid:'De pago',guests:'Solo huéspedes',onPremises:'En el recinto',directlyAdjacent:'Justo al lado',nearbyRel:'Cerca',noRoad:'Sin cruzar carretera',pedestrian:'Zona peatonal',localRoad:'Cruce de calle local',mainRoad:'Cruce de vía principal',distanceSource:'según fuente',distanceEstimate:'estimación de mapa',distanceMeasured:'medido por HOY',
      playArea:'Zona de juego',outdoor:'Parque infantil',indoorRoom:'Sala de juego interior',inflatable:'Hinchables',splash:'Zona splash/agua',minigolf:'Minigolf',amusement:'Parque de atracciones',parent:'Padres',staff:'Personal',camera:'Cámara'
    }
  };

  function t(){return copy[state?.lang]||copy.de}
  function cleanList(value,allowed){
    const list=Array.isArray(value)?value:[];
    return [...new Set(list.map(String).filter(x=>allowed.has(x)))];
  }
  function normalize(row){
    if(!row||!VERIFIED.has(row.verification_status))return null;
    const n={...row,restaurant_id:Number(row.restaurant_id)};
    if(!Number.isFinite(n.restaurant_id))return null;
    n.play_types=cleanList(row.play_types,PLAY_TYPES);
    n.supervision_types=cleanList(row.supervision_types,SUPERVISION_TYPES);
    if(n.indoor_play_area===true&&!n.play_types.includes('indoor_playroom'))n.play_types.push('indoor_playroom');
    n.playground_distance_m=n.playground_distance_m==null?null:Number(n.playground_distance_m);
    if(!Number.isFinite(n.playground_distance_m))n.playground_distance_m=null;
    n.suitable_age_min=n.suitable_age_min==null?null:Number(n.suitable_age_min);
    n.suitable_age_max=n.suitable_age_max==null?null:Number(n.suitable_age_max);
    n.source_count=Number.isFinite(Number(n.source_count))?Number(n.source_count):0;
    return n;
  }
  function familyFor(p){return normalize(p?.family_features||p?.familyFeatures||null)}
  function hasPlay(f){return !!f&&f.play_types.length>0}
  function isDirect(f){return hasPlay(f)&&['on_premises','directly_adjacent'].includes(f.relationship)}
  function isVisible(f){return hasPlay(f)&&f.visible_from_seating===true}
  function isFamilyFriendly(f){return !!f&&(hasPlay(f)||f.highchairs===true||f.changing_facility===true||f.kids_menu===true||f.stroller_friendly===true)}
  function matches(p,mode=state.family||'all'){
    const f=familyFor(p);
    if(mode==='all')return true;
    if(mode==='family')return isFamilyFriendly(f);
    if(mode==='playground')return hasPlay(f);
    if(mode==='direct')return isDirect(f);
    if(mode==='visible')return isVisible(f);
    return true;
  }
  function proofLabel(f){
    if(!f)return '';
    const c=t();
    if(f.verification_status==='hoy_verified')return c.verified;
    if(f.verification_status==='operator_confirmed')return c.operator;
    if(f.verification_status==='community_verified')return c.community;
    return c.source;
  }
  function playTypeLabel(type){
    const c=t();
    return ({play_area:c.playArea,outdoor_playground:c.outdoor,indoor_playroom:c.indoorRoom,inflatable:c.inflatable,splash:c.splash,minigolf:c.minigolf,amusement_park:c.amusement})[type]||c.playArea;
  }
  function playIcon(f){
    if(f?.play_types?.includes('amusement_park'))return '🎡';
    if(f?.play_types?.includes('splash'))return '💦';
    if(f?.play_types?.includes('minigolf'))return '⛳';
    if(f?.play_types?.includes('inflatable'))return '🎈';
    if(f?.play_types?.includes('indoor_playroom'))return '🧸';
    return '🛝';
  }
  function playTypesLabel(f){return f?.play_types?.map(playTypeLabel).join(' + ')||''}
  function relationshipLabel(f){
    if(!f)return '';
    const c=t();
    if(f.relationship==='on_premises')return c.onPremises;
    if(f.relationship==='directly_adjacent')return c.directlyAdjacent;
    if(f.relationship==='nearby')return c.nearbyRel;
    return c.unknown;
  }
  function accessLabel(f){
    if(!f)return '';
    const c=t();
    return ({free:c.free,restaurant_customers:c.customers,paid:c.paid,accommodation_guests:c.guests})[f.access_type]||c.unknown;
  }
  function roadLabel(f){
    if(!f)return '';
    const c=t();
    return ({none:c.noRoad,pedestrian_area:c.pedestrian,local_road:c.localRoad,main_road:c.mainRoad})[f.road_crossing]||c.unknown;
  }
  function supervisionLabel(f){
    if(!f?.supervision_types?.length)return t().unknown;
    const c=t(),labels={parent:c.parent,staff:c.staff,camera:c.camera};
    return f.supervision_types.map(x=>labels[x]).filter(Boolean).join(' + ');
  }
  function distanceLabel(f){
    if(!Number.isFinite(f?.playground_distance_m))return '';
    const c=t(),method=({source:c.distanceSource,map_estimate:c.distanceEstimate,hoy_measured:c.distanceMeasured})[f.distance_method];
    return `${f.playground_distance_m} m${method?` · ${method}`:''}`;
  }
  function contextLabel(f){
    if(!f||!hasPlay(f))return '';
    const c=t(),types=playTypesLabel(f),distance=Number.isFinite(f.playground_distance_m)?` · ${f.playground_distance_m} m`:'';
    if(f.relationship==='on_premises')return `${types||c.own} · ${c.onPremises}`;
    if(f.relationship==='directly_adjacent')return `${types||c.adjacent} · ${c.directlyAdjacent}${distance}`;
    if(f.relationship==='nearby')return `${types||c.nearby} · ${c.nearbyRel}${distance}`;
    return types||c.playground;
  }
  function primaryBadges(p,limit=3){
    const f=familyFor(p);if(!f)return [];
    const rows=[];const context=contextLabel(f);
    if(context)rows.push({label:`${playIcon(f)} ${context}`,tone:'play'});
    if(isVisible(f))rows.push({label:`👀 ${t().visibleBadge}`,tone:'visible'});
    if(f.access_type==='paid')rows.push({label:`💳 ${t().paid}`,tone:'access'});
    else if(f.access_type==='accommodation_guests')rows.push({label:`🔑 ${t().guests}`,tone:'access'});
    return rows.slice(0,limit);
  }
  function rank(p){
    const f=familyFor(p);if(!f)return -1;
    const proof=f.verification_status==='hoy_verified'?24:f.verification_status==='operator_confirmed'?18:f.verification_status==='source_verified'?14:10;
    const road=f.road_crossing==='none'?10:f.road_crossing==='pedestrian_area'?7:f.road_crossing==='main_road'?-8:0;
    return (isDirect(f)?60:hasPlay(f)?30:0)+(isVisible(f)?35:0)+proof+road+(f.traffic_separated===true?8:0)+(f.shade_available===true?4:0)+(f.fenced===true?3:0);
  }
  function situationRows(){return (DATA||[]).filter(p=>hasPlay(familyFor(p))).sort((a,b)=>rank(b)-rank(a)).slice(0,3)}

  async function loadFamilyFeatures(){
    if(!sb){familyState.loaded=true;return []}
    try{
      const {data,error}=await sb.from('restaurant_family_features').select('restaurant_id,play_types,relationship,access_type,playground_distance_m,distance_method,visible_from_seating,road_crossing,fenced,traffic_separated,shade_available,supervision_types,indoor_play_area,highchairs,changing_facility,kids_menu,stroller_friendly,suitable_age_min,suitable_age_max,notes,verification_status,source_count,source_url,source_label,verified_at,updated_at');
      if(error)throw error;
      const byId=new Map((data||[]).map(row=>[Number(row.restaurant_id),normalize(row)]).filter(([,row])=>!!row));
      for(const p of DATA||[])p.family_features=byId.get(Number(p.id))||null;
      familyState.loaded=true;familyState.loadError='';return [...byId.values()];
    }catch(err){
      familyState.loaded=true;familyState.loadError=err?.message||String(err);
      const expectedPreMigration=['PGRST205','42P01','42703'].includes(String(err?.code||''));
      if(!expectedPreMigration)console.warn('HOY family features unavailable:',familyState.loadError);
      return [];
    }
  }

  state.family=state.family||'all';
  const baseFiltered240=filtered;
  filtered=function(){return baseFiltered240().filter(p=>matches(p,state.family))};

  function badgeStrip(p){const rows=primaryBadges(p);return rows.length?`<div class="family240-card-badges">${rows.map(x=>`<span class="${x.tone}">${esc240(x.label)}</span>`).join('')}</div>`:''}
  function injectCardBadges(html,p,selector){
    if(!badgeStrip(p))return html;
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const anchor=root.querySelector(selector);if(anchor)anchor.insertAdjacentHTML('beforebegin',badgeStrip(p));
    return root.outerHTML;
  }
  const baseCard240=card;
  card=function(p){return injectCardBadges(baseCard240(p),p,'.card-foot')};
  const baseListCard240=listCard;
  listCard=function(p){return injectCardBadges(baseListCard240(p),p,'.service')};

  function filterMarkup(){
    const c=t();
    const rows=[['all',c.all],['family',c.family],['playground',c.playground],['direct',c.direct],['visible',c.visible]];
    return `<div class="family240-filter" aria-label="${esc240(c.family)}">${rows.map(([key,label])=>`<button type="button" class="${state.family===key?'active':''}" data-family240-filter="${key}" aria-pressed="${state.family===key?'true':'false'}">${esc240(label)}</button>`).join('')}</div>`;
  }
  const baseDiscover240=discover;
  discover=function(){
    const shell=document.createElement('div');shell.innerHTML=baseDiscover240();const root=shell.firstElementChild;if(!root)return shell.innerHTML;
    const anchor=root.querySelector('.filterline');if(anchor&&!root.querySelector('[data-family240-filter]'))anchor.insertAdjacentHTML('afterend',filterMarkup());
    return root.outerHTML;
  };

  function situationMarkup(){
    const c=t(),rows=situationRows();
    return `<section class="family240-situation" data-family240-home>
      <div class="family240-situation-copy"><span>${esc240(c.eyebrow)}</span><h2>${esc240(c.title)}</h2><p>${esc240(c.lead)}</p></div>
      ${rows.length?`<div class="family240-preview">${rows.map(p=>{const f=familyFor(p);return `<button type="button" data-family240-open="${Number(p.id)}"><strong>${esc240(p.name)}</strong><small>${esc240(contextLabel(f))}${isVisible(f)?` · ${esc240(c.visibleBadge)}`:''}</small><i>${esc240(proofLabel(f))}</i></button>`}).join('')}</div>`:`<div class="family240-empty"><b>${esc240(c.empty)}</b><span>${esc240(c.emptySub)}</span></div>`}
      <button type="button" class="family240-cta" data-family240-situation>${esc240(c.cta)} <span aria-hidden="true">→</span></button>
    </section>`;
  }
  const baseHome240=home;
  home=function(){
    const shell=document.createElement('div');shell.innerHTML=baseHome240();const root=shell.firstElementChild;if(!root)return shell.innerHTML;
    if(root.querySelector('[data-family240-home]'))return root.outerHTML;
    const live=root.querySelector('[data-live239-root]');const editorial=root.querySelector('.editorial');const anchor=live||editorial||root.lastElementChild;
    if(anchor)anchor.insertAdjacentHTML(live?'afterend':'beforebegin',situationMarkup());else root.insertAdjacentHTML('beforeend',situationMarkup());
    return root.outerHTML;
  };

  function yesNo(v){if(v===true)return '✓';if(v===false)return '–';return ''}
  function featureFact(label,value){return value===null||value===undefined||value===''?'':`<div class="family240-fact"><span>${esc240(label)}</span><b class="${value===true?'yes':value===false?'no':''}">${esc240(typeof value==='boolean'?yesNo(value):value)}</b></div>`}
  function profilePanel(p){
    const f=familyFor(p);if(!f)return '';
    const c=t();const age=f.suitable_age_min!=null||f.suitable_age_max!=null?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:null;
    const source=f.source_url&&/^https:\/\//i.test(f.source_url)?`<a href="${esc240(f.source_url)}" target="_blank" rel="noopener">${esc240(f.source_label||c.source)} ↗</a>`:esc240(f.source_label||proofLabel(f));
    return `<section class="family240-profile"><div class="family240-profile-head"><div><span>${esc240(c.familyFacts)}</span><h3>${esc240(contextLabel(f)||c.family)}</h3></div><em>${esc240(proofLabel(f))}</em></div>
      <div class="family240-facts">${featureFact(c.playTypes,playTypesLabel(f))}${featureFact(c.relationship,relationshipLabel(f))}${featureFact(c.access,accessLabel(f))}${featureFact(c.distance,distanceLabel(f))}${featureFact(c.visibleBadge,f.visible_from_seating)}${featureFact(c.road,roadLabel(f))}${featureFact(c.traffic,f.traffic_separated)}${featureFact(c.fenced,f.fenced)}${featureFact(c.shade,f.shade_available)}${featureFact(c.supervision,supervisionLabel(f))}${featureFact(c.highchairs,f.highchairs)}${featureFact(c.changing,f.changing_facility)}${featureFact(c.kidsMenu,f.kids_menu)}${featureFact(c.stroller,f.stroller_friendly)}${featureFact(c.age,age)}</div>
      ${f.notes?`<p>${esc240(f.notes)}</p>`:''}<div class="family240-proof">${source}${f.verified_at?`<small>${esc240(new Intl.DateTimeFormat(state.lang==='es'?'es-ES':state.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(f.verified_at)))}</small>`:''}</div>
    </section>`;
  }
  const baseSetDetailTab240=setDetailTab;
  setDetailTab=function(d,p,tab){
    baseSetDetailTab240(d,p,tab);
    if(tab==='overview'){
      const content=d.querySelector('[data-tab-content]');
      if(content&&familyFor(p)&&!content.querySelector('.family240-profile'))content.insertAdjacentHTML('beforeend',profilePanel(p));
    }
  };
  const baseOpenDetail240=openDetail;
  openDetail=function(id){
    baseOpenDetail240(id);const p=(DATA||[]).find(x=>Number(x.id)===Number(id));const f=familyFor(p);if(!f)return;
    const d=document.getElementById('detail'),row=d?.querySelector('.statusrow');
    if(row&&!row.querySelector('.family240-status')){
      const label=contextLabel(f)||(f.indoor_play_area===true?t().indoor:t().family);
      if(label)row.insertAdjacentHTML('beforeend',`<span class="pill good family240-status">${playIcon(f)} ${esc240(label)}</span>`);
    }
  };

  const baseWire240=wire;
  wire=function(){
    baseWire240();
    document.querySelectorAll('[data-family240-filter]').forEach(btn=>btn.onclick=()=>{state.family=btn.dataset.family240Filter||'all';if(typeof trackEvent==='function')trackEvent('family_filter',null,{filter:state.family});render()});
    document.querySelectorAll('[data-family240-situation]').forEach(btn=>btn.onclick=()=>{state.family='playground';state.query='';state.service='all';if(typeof trackEvent==='function')trackEvent('family_situation_open',null,{surface:'home'});nav('discover')});
    document.querySelectorAll('[data-family240-open]').forEach(btn=>btn.onclick=()=>openDetail(Number(btn.dataset.family240Open)));
    document.querySelectorAll('[data-service]').forEach(btn=>btn.onclick=()=>{state.family='all';state.service=btn.dataset.service;nav('discover')});
    document.querySelectorAll('[data-zone]').forEach(btn=>btn.onclick=()=>{state.family='all';state.query=btn.dataset.zone;state.service='all';nav('discover')});
    const go=document.querySelector('[data-go]');if(go)go.onclick=()=>{state.family='all';nav('discover')};
  };

  const baseInitCloud240=initCloud;
  initCloud=async function(){
    await baseInitCloud240();
    if(sb&&cloud?.status==='online'){
      await loadFamilyFeatures();
      render();
    }else familyState.loaded=true;
  };

  window.hoyFamilyPlaygrounds240={
    state:familyState,normalize,familyFor,hasPlay,hasPlayground:hasPlay,isDirect,isVisible,isFamilyFriendly,matches,rank,primaryBadges,playTypesLabel,relationshipLabel,accessLabel,roadLabel,supervisionLabel,distanceLabel,contextLabel,proofLabel,situationRows,loadFamilyFeatures
  };
})();
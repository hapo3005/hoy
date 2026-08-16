/* HOY 2.40 — native Family integration for the current 2.39 guest shell. */
(function(){
  if(window.__hoyFamilyPlaygroundsHardening240)return;
  window.__hoyFamilyPlaygroundsHardening240=true;

  const api=window.hoyFamilyPlaygrounds240;
  if(!api)return;

  const esc=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={
    de:{context:'Mit Kindern',contextSub:'Familienangebote passend eingrenzen',homeSub:'Familie & Spielangebote',allFamily:'Alle Familienorte',eatPlay:'Essen & Spielen',direct:'Direkt dabei',visible:'Vom Tisch sichtbar',facts:'Für Familien',details:'Alle Familiendetails',profilePlay:'Essen & Spielen',profileFamily:'Familieninfos',play:'Spielangebot',relationship:'Lage zum Restaurant',access:'Zugang',distance:'Entfernung',road:'Weg zum Spielbereich',traffic:'Vom Verkehr getrennt',fenced:'Eingezäunt',shade:'Schatten am Spielbereich',supervision:'Aufsicht',highchairs:'Hochstühle',changing:'Wickelmöglichkeit',kidsMenu:'Kindergerichte',stroller:'Kinderwagen-tauglich',age:'Geeignetes Alter',visibleShort:'Vom Tisch sichtbar',noRoad:'Keine Straßenquerung',familyInfo:'Familieninfo',relOnsite:'vor Ort',relAdjacent:'direkt dabei',relNearby:'in der Nähe',playArea:'Spielbereich',outdoor:'Spielplatz',indoor:'Indoor-Spielraum',inflatable:'Hüpfbereich',splash:'Wasserspiel',minigolf:'Minigolf',amusement:'Freizeitpark'},
    en:{context:'With kids',contextSub:'Refine places for families',homeSub:'Family & play options',allFamily:'All family places',eatPlay:'Eat & play',direct:'Right there',visible:'Visible from table',facts:'For families',details:'All family details',profilePlay:'Eat & play',profileFamily:'Family details',play:'Play option',relationship:'Location vs venue',access:'Access',distance:'Distance',road:'Route to play area',traffic:'Separated from traffic',fenced:'Fenced',shade:'Shade at play area',supervision:'Supervision',highchairs:'Highchairs',changing:'Changing facility',kidsMenu:'Kids menu',stroller:'Stroller friendly',age:'Suitable age',visibleShort:'Visible from table',noRoad:'No road crossing',familyInfo:'Family detail',relOnsite:'on site',relAdjacent:'right there',relNearby:'nearby',playArea:'Play area',outdoor:'Playground',indoor:'Indoor playroom',inflatable:'Inflatable play',splash:'Water play',minigolf:'Mini golf',amusement:'Amusement park'},
    es:{context:'Con niños',contextSub:'Afina las opciones para familias',homeSub:'Familia y zonas de juego',allFamily:'Todos para familias',eatPlay:'Comer y jugar',direct:'Justo al lado',visible:'Visible desde la mesa',facts:'Para familias',details:'Todos los detalles familiares',profilePlay:'Comer y jugar',profileFamily:'Información familiar',play:'Tipo de juego',relationship:'Ubicación respecto al local',access:'Acceso',distance:'Distancia',road:'Camino a la zona de juego',traffic:'Separado del tráfico',fenced:'Cerrado',shade:'Sombra en la zona de juego',supervision:'Supervisión',highchairs:'Tronas',changing:'Cambiador',kidsMenu:'Menú infantil',stroller:'Accesible con carrito',age:'Edad recomendada',visibleShort:'Visible desde la mesa',noRoad:'Sin cruzar carretera',familyInfo:'Dato familiar',relOnsite:'en el local',relAdjacent:'justo al lado',relNearby:'cerca',playArea:'Zona de juego',outdoor:'Parque infantil',indoor:'Sala de juego interior',inflatable:'Hinchables',splash:'Zona de agua',minigolf:'Minigolf',amusement:'Parque de atracciones'}
  };
  const previewLabels={
    de:{badge:'VORSCHAU',toast:'Family Preview · Die angezeigten Family-Merkmale sind Beispieldaten.',proof:'Beispieldaten · keine Live-Angabe'},
    en:{badge:'PREVIEW',toast:'Family Preview · The family attributes shown are sample data.',proof:'Sample data · not a live claim'},
    es:{badge:'VISTA PREVIA',toast:'Vista previa Family · Los atributos familiares mostrados son datos de ejemplo.',proof:'Datos de ejemplo · no es información real'}
  };
  const l=()=>labels[state?.lang]||labels.de;
  const pl=()=>previewLabels[state?.lang]||previewLabels.de;
  const yesNo=v=>v===true?'✓':v===false?'–':'';
  const fact=(label,value)=>value===null||value===undefined||value===''?'':`<div class="family240-fact"><span>${esc(label)}</span><b class="${value===true?'yes':value===false?'no':''}">${esc(typeof value==='boolean'?yesNo(value):value)}</b></div>`;
  const isPreviewEnabled=()=>{try{return new URLSearchParams(window.location.search).get('familyPreview')==='1'}catch{return false}};
  const isPreviewFeature=f=>f?.__family240_preview===true;
  const isFamilyActive=()=>!!state?.family&&state.family!=='all';
  const hasVerifiedPlayData=()=>Array.isArray(DATA)&&(DATA||[]).some(p=>{const f=api.familyFor(p);return !!f&&!isPreviewFeature(f)&&api.hasPlay(f)});
  const hasPreviewPlayData=()=>Array.isArray(DATA)&&(DATA||[]).some(p=>{const f=api.familyFor(p);return !!f&&isPreviewFeature(f)&&api.hasPlay(f)});

  function previewFeature(restaurantId,index){
    const base={restaurant_id:Number(restaurantId),__family240_preview:true,verification_status:'source_verified',source_count:0,source_url:null,source_label:pl().proof,verified_at:null,updated_at:null,suitable_age_min:2,suitable_age_max:10,supervision_types:['parent'],highchairs:true,kids_menu:true,stroller_friendly:true};
    if(index===0)return {...base,play_types:['outdoor_playground'],relationship:'directly_adjacent',access_type:'free',playground_distance_m:18,distance_method:'map_estimate',visible_from_seating:true,road_crossing:'none',fenced:true,traffic_separated:true,shade_available:true,indoor_play_area:false,changing_facility:true,notes:null};
    return {...base,play_types:['indoor_playroom','inflatable'],relationship:'on_premises',access_type:'restaurant_customers',playground_distance_m:12,distance_method:'map_estimate',visible_from_seating:false,road_crossing:'pedestrian_area',fenced:true,traffic_separated:true,shade_available:null,indoor_play_area:true,changing_facility:false,notes:null};
  }

  function ensurePreviewData(){
    if(!isPreviewEnabled()||hasVerifiedPlayData()||hasPreviewPlayData()||!Array.isArray(DATA))return false;
    const candidates=DATA.filter(p=>Number.isFinite(Number(p?.id))).slice(0,2);
    candidates.forEach((p,index)=>{
      if(!Object.prototype.hasOwnProperty.call(p,'__family240_preview_original'))p.__family240_preview_original=p.family_features??null;
      p.family_features=previewFeature(p.id,index);
    });
    return hasPreviewPlayData();
  }

  function playIcon(f){
    if(f?.play_types?.includes('amusement_park'))return '🎡';
    if(f?.play_types?.includes('splash'))return '💦';
    if(f?.play_types?.includes('minigolf'))return '⛳';
    if(f?.play_types?.includes('inflatable'))return '🎈';
    if(f?.play_types?.includes('indoor_playroom'))return '🧸';
    return '🛝';
  }
  function shortPlayLabel(f){
    const c=l(),types=f?.play_types||[];
    if(types.includes('outdoor_playground'))return c.outdoor;
    if(types.includes('indoor_playroom'))return c.indoor;
    if(types.includes('amusement_park'))return c.amusement;
    if(types.includes('inflatable'))return c.inflatable;
    if(types.includes('splash'))return c.splash;
    if(types.includes('minigolf'))return c.minigolf;
    if(types.includes('play_area'))return c.playArea;
    return c.familyInfo;
  }
  function shortRelation(f){
    const c=l();
    if(f?.relationship==='on_premises')return c.relOnsite;
    if(f?.relationship==='directly_adjacent')return c.relAdjacent;
    if(f?.relationship==='nearby')return c.relNearby;
    return '';
  }
  function primaryFamilyBadge(f){
    const c=l();
    if(api.hasPlay(f)){const rel=shortRelation(f);return {tone:'play',label:`${playIcon(f)} ${shortPlayLabel(f)}${rel?` ${rel}`:''}`}}
    if(f?.kids_menu===true)return {tone:'play',label:`🍽 ${c.kidsMenu}`};
    if(f?.highchairs===true)return {tone:'play',label:`🪑 ${c.highchairs}`};
    if(f?.changing_facility===true)return {tone:'play',label:`👶 ${c.changing}`};
    if(f?.stroller_friendly===true)return {tone:'play',label:`👶 ${c.stroller}`};
    return null;
  }
  function familyHighlights(f,{limit=3}={}){
    const c=l(),rows=[],primary=primaryFamilyBadge(f);
    if(primary)rows.push(primary);
    if(api.isVisible(f))rows.push({tone:'visible',label:`👀 ${c.visibleShort}`});
    if(f?.road_crossing==='none')rows.push({tone:'safe',label:`🚸 ${c.noRoad}`});
    return rows.slice(0,limit);
  }
  function badgeMarkup(rows,cls='family240-card-badges'){
    return rows?.length?`<div class="${cls}">${rows.map(x=>`<span class="${esc(x.tone||'')}">${esc(x.label)}</span>`).join('')}</div>`:'';
  }

  function decorateFamilyCards(root){
    root.querySelectorAll('.list-card .family240-card-badges,.card .family240-card-badges').forEach(strip=>{
      if(!isFamilyActive()){strip.remove();return}
      const host=strip.closest('[data-open]'),id=Number(host?.dataset?.open);
      const p=(DATA||[]).find(x=>Number(x.id)===id),f=api.familyFor(p);
      if(!f){strip.remove();return}
      const rows=familyHighlights(f,{limit:2});
      if(!rows.length){strip.remove();return}
      strip.outerHTML=badgeMarkup(rows);
    });
  }

  function homeContextMarkup(preview=false){
    const c=l();
    return `<button type="button" class="family240-home-context" data-family240-home-context><strong>${esc(c.context)}</strong><span>${esc(c.homeSub)}</span>${preview?`<em class="family240-preview-badge" data-family240-preview-badge>${esc(pl().badge)}</em>`:''}</button>`;
  }

  function integrateHome(html,{available,preview}){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('[data-family240-home]').forEach(el=>el.remove());
    decorateFamilyCards(root);
    if(!available)return root.outerHTML;
    const grid=root.querySelector('.journey-intent-grid');
    if(grid&&!grid.querySelector('[data-family240-home-context]'))grid.insertAdjacentHTML('beforeend',homeContextMarkup(preview));
    return root.outerHTML;
  }

  function contextBarMarkup(preview=false){
    const c=l(),defs=[['family',c.allFamily],['playground',c.eatPlay],['direct',c.direct],['visible',c.visible]];
    return `<div class="family240-context" data-family240-context-bar><div class="family240-context-head"><div><b>${esc(c.context)}</b><small>${esc(c.contextSub)}</small></div>${preview?`<span class="family240-preview-badge" data-family240-preview-badge>${esc(pl().badge)}</span>`:''}</div><div class="family240-context-chips">${defs.map(([key,label])=>`<button type="button" class="${state.family===key?'active':''}" data-family240-subfilter="${key}" aria-pressed="${state.family===key?'true':'false'}">${esc(label)}</button>`).join('')}</div></div>`;
  }

  function integrateDiscover(html,{available,preview}){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelectorAll('.family240-filter,[data-family240-preview-notice]').forEach(el=>el.remove());
    if(!available){
      state.family='all';
      root.querySelectorAll('[data-family240-context-main],[data-family240-context-bar]').forEach(el=>el.remove());
      decorateFamilyCards(root);return root.outerHTML;
    }
    const chips=root.querySelector('.consumer-chips');
    if(chips&&!chips.querySelector('[data-family240-context-main]'))chips.insertAdjacentHTML('beforeend',`<button type="button" class="${isFamilyActive()?'active':''}" data-family240-context-main aria-pressed="${isFamilyActive()?'true':'false'}">${esc(l().context)}</button>`);
    if(isFamilyActive()){
      const filterBlock=root.querySelector('.journey-filter-block')||root.querySelector('.consumer-filter-block');
      if(filterBlock&&!root.querySelector('[data-family240-context-bar]'))filterBlock.insertAdjacentHTML('afterend',contextBarMarkup(preview));
      const label=root.querySelector('[data-result-label]'),count=Number(root.querySelector('[data-result-count]')?.textContent||0);
      if(label)label.textContent=`${count===1?'Ort für Familien':'Orte für Familien'} · nach Jetzt-Relevanz`;
    }
    decorateFamilyCards(root);return root.outerHTML;
  }

  const baseHomeGate240=home;
  home=function(){
    if(isPreviewEnabled())ensurePreviewData();
    const live=hasVerifiedPlayData(),preview=hasPreviewPlayData(),available=live||preview;
    if(!available)state.family='all';
    return integrateHome(baseHomeGate240(),{available,preview});
  };

  const baseDiscoverGate240=discover;
  discover=function(){
    if(isPreviewEnabled())ensurePreviewData();
    const live=hasVerifiedPlayData(),preview=hasPreviewPlayData(),available=live||preview;
    if(!available)state.family='all';
    return integrateDiscover(baseDiscoverGate240(),{available,preview});
  };

  function finalProfilePanel(f){
    const c=l(),preview=isPreviewFeature(f),pc=pl();
    const age=f.suitable_age_min!=null||f.suitable_age_max!=null?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:null;
    const source=preview?esc(pc.proof):(f.source_url&&/^https:\/\//i.test(f.source_url)?`<a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.source_label||api.proofLabel(f))} ↗</a>`:esc(f.source_label||api.proofLabel(f)));
    return `<section class="family240-profile" data-family240-final-profile${preview?' data-family240-preview-profile':''}><div class="family240-profile-head"><div><span>${esc(c.facts)}</span><h3>${esc(api.hasPlay(f)?c.profilePlay:c.profileFamily)}</h3></div><em${preview?' data-family240-preview-badge':''}>${esc(preview?pc.badge:api.proofLabel(f))}</em></div>${badgeMarkup(familyHighlights(f,{limit:3}),'family240-profile-highlights')}<details class="family240-details" data-family240-details><summary>${esc(c.details)} <span aria-hidden="true">+</span></summary><div class="family240-facts">${fact(c.play,api.playTypesLabel(f))}${fact(c.relationship,api.relationshipLabel(f))}${fact(c.access,api.accessLabel(f))}${fact(c.distance,api.distanceLabel(f))}${fact(c.visible,f.visible_from_seating)}${fact(c.road,api.roadLabel(f))}${fact(c.traffic,f.traffic_separated)}${fact(c.fenced,f.fenced)}${fact(c.shade,f.shade_available)}${fact(c.supervision,api.supervisionLabel(f))}${fact(c.highchairs,f.highchairs)}${fact(c.changing,f.changing_facility)}${fact(c.kidsMenu,f.kids_menu)}${fact(c.stroller,f.stroller_friendly)}${fact(c.age,age)}</div>${f.notes?`<p>${esc(f.notes)}</p>`:''}<div class="family240-proof">${source}${!preview&&f.verified_at?`<small>${esc(new Intl.DateTimeFormat(state.lang==='es'?'es-ES':state.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(f.verified_at)))}</small>`:''}</div></details></section>`;
  }

  function applyFinalProfile(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id)),f=api.familyFor(p),d=document.getElementById('detail');
    if(!p||!f||!d?.open)return false;
    const preview=isPreviewFeature(f),primary=primaryFamilyBadge(f);
    d.querySelectorAll('.family240-status').forEach((el,index)=>{if(index>0){el.remove();return}if(primary)el.textContent=`${preview?`${pl().badge} · `:''}${primary.label}`});
    const about=d.querySelector('#profile-about')||d.querySelector('[data-tab-content]');
    if(about){about.querySelectorAll('.family240-profile').forEach(el=>el.remove());about.insertAdjacentHTML('beforeend',finalProfilePanel(f))}
    return true;
  }

  const baseOpenDetail240h=openDetail;
  openDetail=function(id){baseOpenDetail240h(id);applyFinalProfile(id)};

  function maybePreviewToast(){
    if(!isPreviewEnabled()||typeof toast!=='function')return;
    try{const key='hoy-family-preview-toast-240';if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1');toast(pl().toast)}catch{toast(pl().toast)}
  }

  const baseWire240h=wire;
  wire=function(){
    baseWire240h();
    document.querySelectorAll('[data-family240-home-context]').forEach(btn=>btn.onclick=()=>{state.family='family';state.decision='all';state.query='';state.service='all';if(typeof trackEvent==='function')trackEvent('family_context_open',null,{surface:'home'});nav('discover')});
    document.querySelectorAll('[data-family240-context-main]').forEach(btn=>btn.onclick=()=>{state.family='family';state.decision='all';if(typeof trackEvent==='function')trackEvent('family_context_open',null,{surface:'discover'});render()});
    document.querySelectorAll('[data-family240-subfilter]').forEach(btn=>btn.onclick=()=>{state.family=btn.dataset.family240Subfilter||'family';if(typeof trackEvent==='function')trackEvent('family_filter',null,{filter:state.family,surface:'discover'});render()});
    document.querySelectorAll('[data-decision]').forEach(el=>el.addEventListener('click',()=>{state.family='all'},{capture:true,once:true}));
    document.querySelectorAll('[data-home-intent],[data-home-search-go],[data-nav="discover"],[data-btm="discover"],[data-consumer-reset],[data-reset-to-discover]').forEach(el=>el.addEventListener('click',()=>{state.family='all'},{capture:true,once:true}));
    document.querySelectorAll('[data-home-search]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')state.family='all'},{capture:true}));
    document.querySelectorAll('[data-service]').forEach(btn=>btn.onclick=()=>{state.service=btn.dataset.service;nav('discover')});
    document.querySelectorAll('[data-zone]').forEach(btn=>btn.onclick=()=>{state.query=btn.dataset.zone;state.service='all';nav('discover')});
    maybePreviewToast();
  };

  window.hoyFamilyPlaygroundsHardening240={applyFinalProfile,hasVerifiedPlayData,hasPreviewPlayData,isPreviewEnabled,ensurePreviewData,isFamilyActive};
})();

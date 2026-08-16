/* HOY 2.40 — Family integration hardening for the current 2.39 guest shell. */
(function(){
  if(window.__hoyFamilyPlaygroundsHardening240)return;
  window.__hoyFamilyPlaygroundsHardening240=true;

  const api=window.hoyFamilyPlaygrounds240;
  if(!api)return;

  const esc=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={
    de:{facts:'Für Familien',play:'Spielangebot',relationship:'Lage zum Restaurant',access:'Zugang',distance:'Entfernung',visible:'Vom Sitzplatz einsehbar',road:'Weg zum Spielbereich',traffic:'Vom Verkehr getrennt',fenced:'Eingezäunt',shade:'Schatten am Spielbereich',supervision:'Aufsicht',highchairs:'Hochstühle',changing:'Wickelmöglichkeit',kidsMenu:'Kindergerichte',stroller:'Kinderwagen-tauglich',age:'Geeignetes Alter'},
    en:{facts:'For families',play:'Play option',relationship:'Location vs venue',access:'Access',distance:'Distance',visible:'Visible from seating',road:'Route to play area',traffic:'Separated from traffic',fenced:'Fenced',shade:'Shade at play area',supervision:'Supervision',highchairs:'Highchairs',changing:'Changing facility',kidsMenu:'Kids menu',stroller:'Stroller friendly',age:'Suitable age'},
    es:{facts:'Para familias',play:'Tipo de juego',relationship:'Ubicación respecto al local',access:'Acceso',distance:'Distancia',visible:'Visible desde las mesas',road:'Camino a la zona de juego',traffic:'Separado del tráfico',fenced:'Cerrado',shade:'Sombra en la zona de juego',supervision:'Supervisión',highchairs:'Tronas',changing:'Cambiador',kidsMenu:'Menú infantil',stroller:'Accesible con carrito',age:'Edad recomendada'}
  };
  const previewLabels={
    de:{badge:'VORSCHAU',title:'Vorschau mit Beispieldaten',body:'Die Family-Angaben in dieser Ansicht sind Demonstrationswerte und gehören nicht zu den gezeigten Betrieben. Es werden keine ungeprüften Angaben als Live-Daten veröffentlicht.',proof:'Beispieldaten · keine Live-Angabe'},
    en:{badge:'PREVIEW',title:'Preview with sample data',body:'The family details in this view are demonstration values and do not belong to the venues shown. No unverified details are published as live data.',proof:'Sample data · not a live claim'},
    es:{badge:'VISTA PREVIA',title:'Vista previa con datos de ejemplo',body:'Los datos familiares de esta vista son valores de demostración y no pertenecen a los locales mostrados. No se publican datos no verificados como información real.',proof:'Datos de ejemplo · no es información real'}
  };
  const l=()=>labels[state?.lang]||labels.de;
  const pl=()=>previewLabels[state?.lang]||previewLabels.de;
  const yesNo=v=>v===true?'✓':v===false?'–':'';
  const fact=(label,value)=>value===null||value===undefined||value===''?'':`<div class="family240-fact"><span>${esc(label)}</span><b class="${value===true?'yes':value===false?'no':''}">${esc(typeof value==='boolean'?yesNo(value):value)}</b></div>`;
  const isPreviewEnabled=()=>{
    try{return new URLSearchParams(window.location.search).get('familyPreview')==='1'}catch{return false}
  };
  const isPreviewFeature=f=>f?.__family240_preview===true;
  const hasVerifiedPlayData=()=>Array.isArray(DATA)&&(DATA||[]).some(p=>{const f=api.familyFor(p);return !!f&&!isPreviewFeature(f)&&api.hasPlay(f)});
  const hasPreviewPlayData=()=>Array.isArray(DATA)&&(DATA||[]).some(p=>{const f=api.familyFor(p);return !!f&&isPreviewFeature(f)&&api.hasPlay(f)});

  function previewFeature(restaurantId,index){
    const base={
      restaurant_id:Number(restaurantId),__family240_preview:true,verification_status:'source_verified',source_count:0,source_url:null,
      source_label:pl().proof,verified_at:null,updated_at:null,suitable_age_min:2,suitable_age_max:10,supervision_types:['parent'],
      highchairs:true,kids_menu:true,stroller_friendly:true
    };
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

  function stripFamilySurface(html,selector){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelector(selector)?.remove();
    return root.outerHTML;
  }

  function previewNoticeMarkup(){
    const c=pl();
    return `<div class="family240-empty family240-preview-notice" data-family240-preview-notice><b>${esc(c.title)}</b><span>${esc(c.body)}</span></div>`;
  }

  function markPreviewHome(html){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const section=root.querySelector('[data-family240-home]');if(!section)return root.outerHTML;
    if(!section.querySelector('[data-family240-preview-notice]')){
      const copy=section.querySelector('.family240-situation-copy');
      if(copy)copy.insertAdjacentHTML('afterend',previewNoticeMarkup());else section.insertAdjacentHTML('afterbegin',previewNoticeMarkup());
    }
    section.querySelectorAll('.family240-preview i').forEach(el=>{el.textContent=pl().badge});
    return root.outerHTML;
  }

  function markPreviewDiscover(html){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const filter=root.querySelector('.family240-filter');
    if(filter&&!root.querySelector('[data-family240-preview-notice]'))filter.insertAdjacentHTML('beforebegin',previewNoticeMarkup());
    return root.outerHTML;
  }

  // GitHub Pages publishes main directly. Normal visitors remain fail-closed until
  // verified play facts are readable. ?familyPreview=1 can opt into clearly marked
  // client-only sample data for visual review without touching production data.
  const baseHomeGate240=home;
  home=function(){
    if(isPreviewEnabled())ensurePreviewData();
    const live=hasVerifiedPlayData(),preview=hasPreviewPlayData(),available=live||preview;
    if(!available)state.family='all';
    const html=baseHomeGate240();
    if(!available)return stripFamilySurface(html,'[data-family240-home]');
    return preview?markPreviewHome(html):html;
  };

  const baseDiscoverGate240=discover;
  discover=function(){
    if(isPreviewEnabled())ensurePreviewData();
    const live=hasVerifiedPlayData(),preview=hasPreviewPlayData(),available=live||preview;
    if(!available)state.family='all';
    const html=baseDiscoverGate240();
    if(!available)return stripFamilySurface(html,'.family240-filter');
    return preview?markPreviewDiscover(html):html;
  };

  function finalProfilePanel(f){
    const c=l(),preview=isPreviewFeature(f),pc=pl();
    const age=f.suitable_age_min!=null||f.suitable_age_max!=null?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:null;
    const source=preview
      ?esc(pc.proof)
      :(f.source_url&&/^https:\/\//i.test(f.source_url)
        ?`<a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.source_label||api.proofLabel(f))} ↗</a>`
        :esc(f.source_label||api.proofLabel(f)));
    return `<section class="family240-profile" data-family240-final-profile${preview?' data-family240-preview-profile':''}><div class="family240-profile-head"><div><span>${esc(c.facts)}</span><h3>${esc(api.contextLabel(f)||c.play)}</h3></div><em>${esc(preview?pc.badge:api.proofLabel(f))}</em></div>
      ${preview?previewNoticeMarkup():''}<div class="family240-facts">${fact(c.play,api.playTypesLabel(f))}${fact(c.relationship,api.relationshipLabel(f))}${fact(c.access,api.accessLabel(f))}${fact(c.distance,api.distanceLabel(f))}${fact(c.visible,f.visible_from_seating)}${fact(c.road,api.roadLabel(f))}${fact(c.traffic,f.traffic_separated)}${fact(c.fenced,f.fenced)}${fact(c.shade,f.shade_available)}${fact(c.supervision,api.supervisionLabel(f))}${fact(c.highchairs,f.highchairs)}${fact(c.changing,f.changing_facility)}${fact(c.kidsMenu,f.kids_menu)}${fact(c.stroller,f.stroller_friendly)}${fact(c.age,age)}</div>
      ${f.notes?`<p>${esc(f.notes)}</p>`:''}<div class="family240-proof">${source}${!preview&&f.verified_at?`<small>${esc(new Intl.DateTimeFormat(state.lang==='es'?'es-ES':state.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(f.verified_at)))}</small>`:''}</div></section>`;
  }

  function applyFinalProfile(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const f=api.familyFor(p);
    const d=document.getElementById('detail');
    if(!p||!f||!d?.open)return false;
    const preview=isPreviewFeature(f);

    const existingStatus=d.querySelector('.family240-status');
    if(preview&&existingStatus)existingStatus.textContent=`${pl().badge} · ${api.contextLabel(f)}`;

    const identity=d.querySelector('.profile-identity-card')||d.querySelector('.detail-body');
    if(identity&&!d.querySelector('.family240-status')){
      const summary=document.createElement('div');
      summary.className='family240-card-badges family240-profile-summary';
      summary.innerHTML=`${preview?`<span class="pill good family240-status">${esc(pl().badge)}</span>`:''}<span class="pill good family240-status">${esc(api.contextLabel(f))}</span>${api.isVisible(f)?`<span class="visible">👀 ${esc(l().visible)}</span>`:''}`;
      const anchor=identity.querySelector('.profile-trust-line')||identity.querySelector('.meta')||identity.querySelector('h2');
      if(anchor)anchor.insertAdjacentElement('afterend',summary);else identity.appendChild(summary);
    }

    const about=d.querySelector('#profile-about')||d.querySelector('[data-tab-content]');
    if(about&&preview)about.querySelectorAll('.family240-profile').forEach(el=>el.remove());
    if(about&&!about.querySelector('[data-family240-final-profile]'))about.insertAdjacentHTML('beforeend',finalProfilePanel(f));
    return true;
  }

  const baseOpenDetail240h=openDetail;
  openDetail=function(id){
    baseOpenDetail240h(id);
    applyFinalProfile(id);
  };

  const baseWire240h=wire;
  wire=function(){
    baseWire240h();
    const clear=()=>{state.family='all'};
    document.querySelectorAll('[data-home-intent],[data-home-search-go],[data-zone],[data-nav="discover"],[data-btm="discover"]').forEach(el=>el.addEventListener('click',clear,{capture:true,once:true}));
    document.querySelectorAll('[data-home-search]').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter')clear()},{capture:true}));
  };

  window.hoyFamilyPlaygroundsHardening240={applyFinalProfile,hasVerifiedPlayData,hasPreviewPlayData,isPreviewEnabled,ensurePreviewData};
})();

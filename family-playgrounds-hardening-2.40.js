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
  const l=()=>labels[state?.lang]||labels.de;
  const yesNo=v=>v===true?'✓':v===false?'–':'';
  const fact=(label,value)=>value===null||value===undefined||value===''?'':`<div class="family240-fact"><span>${esc(label)}</span><b class="${value===true?'yes':value===false?'no':''}">${esc(typeof value==='boolean'?yesNo(value):value)}</b></div>`;
  const hasVerifiedPlayData=()=>Array.isArray(DATA)&&(DATA||[]).some(p=>api.hasPlay(api.familyFor(p)));

  function stripFamilySurface(html,selector){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    root.querySelector(selector)?.remove();
    return root.outerHTML;
  }

  // GitHub Pages publishes main directly. Keep the Family entry points fail-closed
  // until at least one verified play fact is actually readable from the backend.
  const baseHomeGate240=home;
  home=function(){
    const available=hasVerifiedPlayData();
    if(!available)state.family='all';
    const html=baseHomeGate240();
    return available?html:stripFamilySurface(html,'[data-family240-home]');
  };

  const baseDiscoverGate240=discover;
  discover=function(){
    const available=hasVerifiedPlayData();
    if(!available)state.family='all';
    const html=baseDiscoverGate240();
    return available?html:stripFamilySurface(html,'.family240-filter');
  };

  function finalProfilePanel(f){
    const c=l();
    const age=f.suitable_age_min!=null||f.suitable_age_max!=null?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:null;
    const source=f.source_url&&/^https:\/\//i.test(f.source_url)
      ?`<a href="${esc(f.source_url)}" target="_blank" rel="noopener">${esc(f.source_label||api.proofLabel(f))} ↗</a>`
      :esc(f.source_label||api.proofLabel(f));
    return `<section class="family240-profile" data-family240-final-profile><div class="family240-profile-head"><div><span>${esc(c.facts)}</span><h3>${esc(api.contextLabel(f)||c.play)}</h3></div><em>${esc(api.proofLabel(f))}</em></div>
      <div class="family240-facts">${fact(c.play,api.playTypesLabel(f))}${fact(c.relationship,api.relationshipLabel(f))}${fact(c.access,api.accessLabel(f))}${fact(c.distance,api.distanceLabel(f))}${fact(c.visible,f.visible_from_seating)}${fact(c.road,api.roadLabel(f))}${fact(c.traffic,f.traffic_separated)}${fact(c.fenced,f.fenced)}${fact(c.shade,f.shade_available)}${fact(c.supervision,api.supervisionLabel(f))}${fact(c.highchairs,f.highchairs)}${fact(c.changing,f.changing_facility)}${fact(c.kidsMenu,f.kids_menu)}${fact(c.stroller,f.stroller_friendly)}${fact(c.age,age)}</div>
      ${f.notes?`<p>${esc(f.notes)}</p>`:''}<div class="family240-proof">${source}${f.verified_at?`<small>${esc(new Intl.DateTimeFormat(state.lang==='es'?'es-ES':state.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(f.verified_at)))}</small>`:''}</div></section>`;
  }

  function applyFinalProfile(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const f=api.familyFor(p);
    const d=document.getElementById('detail');
    if(!p||!f||!d?.open)return false;

    const identity=d.querySelector('.profile-identity-card')||d.querySelector('.detail-body');
    if(identity&&!d.querySelector('.family240-status')){
      const summary=document.createElement('div');
      summary.className='family240-card-badges family240-profile-summary';
      summary.innerHTML=`<span class="pill good family240-status">${esc(api.contextLabel(f))}</span>${api.isVisible(f)?`<span class="visible">👀 ${esc(l().visible)}</span>`:''}`;
      const anchor=identity.querySelector('.profile-trust-line')||identity.querySelector('.meta')||identity.querySelector('h2');
      if(anchor)anchor.insertAdjacentElement('afterend',summary);else identity.appendChild(summary);
    }

    const about=d.querySelector('#profile-about')||d.querySelector('[data-tab-content]');
    if(about&&!about.querySelector('.family240-profile'))about.insertAdjacentHTML('beforeend',finalProfilePanel(f));
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

  window.hoyFamilyPlaygroundsHardening240={applyFinalProfile,hasVerifiedPlayData};
})();

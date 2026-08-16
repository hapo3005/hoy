/* HOY 2.40.0 — Family / Essen & Spielen decision layer. */
(function(){
  if(window.__hoyFamilyPlaygrounds240)return;
  window.__hoyFamilyPlaygrounds240=true;
  window.hoyFamilyPlaygroundsVersion='2.40.0';

  const familyState={loaded:false,loadError:''};
  const VERIFIED=new Set(['operator_confirmed','source_verified','hoy_verified']);
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy={
    de:{
      eyebrow:'HOY FAMILIE',title:'Essen & Spielen.',lead:'Finde Orte, an denen Eltern essen und Kinder spielen können – mit klar geprüftem Spielplatz-Status statt vager „kinderfreundlich“-Angabe.',
      empty:'Noch keine verifizierten Spielplatz-Treffer.',emptySub:'HOY zeigt hier erst einen Ort, wenn Spielplatz und Lage wirklich geprüft oder vom Betrieb bestätigt wurden.',cta:'Essen & Spielen entdecken',
      family:'Familie',playground:'Spielplatz',direct:'Direkt dabei',visible:'Vom Tisch sichtbar',all:'Alle',verified:'HOY geprüft',operator:'Vom Betrieb bestätigt',source:'Quelle geprüft',
      own:'Eigener Spielplatz',adjacent:'Spielplatz direkt daneben',nearby:'Spielplatz in der Nähe',visibleBadge:'Vom Sitzplatz einsehbar',indoor:'Indoor-Spielecke',shade:'Schatten am Spielbereich',fenced:'Eingezäunt',traffic:'Vom Verkehr getrennt',highchairs:'Hochstühle',changing:'Wickelmöglichkeit',kidsMenu:'Kindergerichte',stroller:'Kinderwagen-tauglich',age:'Geeignetes Alter',familyFacts:'Für Familien',unknown:'Noch nicht geprüft'
    },
    en:{
      eyebrow:'HOY FAMILY',title:'Eat & play.',lead:'Find places where parents can eat while children play – using verified playground facts rather than a vague “family-friendly” label.',
      empty:'No verified playground matches yet.',emptySub:'HOY only lists a match after the playground and its location have been checked or confirmed by the venue.',cta:'Explore eat & play',
      family:'Family',playground:'Playground',direct:'Right next to it',visible:'Visible from table',all:'All',verified:'HOY verified',operator:'Confirmed by venue',source:'Source checked',
      own:'Own playground',adjacent:'Playground right next door',nearby:'Playground nearby',visibleBadge:'Visible from seating',indoor:'Indoor play area',shade:'Shade at play area',fenced:'Fenced',traffic:'Separated from traffic',highchairs:'Highchairs',changing:'Changing facility',kidsMenu:'Kids menu',stroller:'Stroller friendly',age:'Suitable age',familyFacts:'For families',unknown:'Not checked yet'
    },
    es:{
      eyebrow:'HOY FAMILIA',title:'Comer y jugar.',lead:'Encuentra sitios donde los adultos puedan comer mientras los niños juegan, con datos verificados del parque infantil y no solo una etiqueta genérica.',
      empty:'Aún no hay resultados verificados con parque infantil.',emptySub:'HOY solo muestra un sitio cuando el parque y su ubicación han sido comprobados o confirmados por el negocio.',cta:'Ver comer y jugar',
      family:'Familia',playground:'Parque infantil',direct:'Justo al lado',visible:'Visible desde la mesa',all:'Todos',verified:'Verificado por HOY',operator:'Confirmado por el local',source:'Fuente verificada',
      own:'Parque infantil propio',adjacent:'Parque infantil justo al lado',nearby:'Parque infantil cercano',visibleBadge:'Visible desde las mesas',indoor:'Zona de juego interior',shade:'Sombra en la zona de juego',fenced:'Cerrado',traffic:'Separado del tráfico',highchairs:'Tronas',changing:'Cambiador',kidsMenu:'Menú infantil',stroller:'Accesible con carrito',age:'Edad recomendada',familyFacts:'Para familias',unknown:'Aún sin verificar'
    }
  };

  function t(){return copy[state?.lang]||copy.de}
  function normalize(row){
    if(!row||!VERIFIED.has(row.verification_status))return null;
    const n={...row,restaurant_id:Number(row.restaurant_id)};
    if(!Number.isFinite(n.restaurant_id))return null;
    n.playground_distance_m=n.playground_distance_m==null?null:Number(n.playground_distance_m);
    n.suitable_age_min=n.suitable_age_min==null?null:Number(n.suitable_age_min);
    n.suitable_age_max=n.suitable_age_max==null?null:Number(n.suitable_age_max);
    return n;
  }
  function familyFor(p){return normalize(p?.family_features||p?.familyFeatures||null)}
  function hasPlayground(f){return !!f&&['own','adjacent_public','nearby_public'].includes(f.playground_type)}
  function isDirect(f){return !!f&&['own','adjacent_public'].includes(f.playground_type)}
  function isVisible(f){return hasPlayground(f)&&f.visible_from_seating===true}
  function isFamilyFriendly(f){return !!f&&(hasPlayground(f)||f.indoor_play_area===true||f.highchairs===true||f.changing_facility===true||f.kids_menu===true||f.stroller_friendly===true)}
  function matches(p,mode=state.family||'all'){
    const f=familyFor(p);
    if(mode==='all')return true;
    if(mode==='family')return isFamilyFriendly(f);
    if(mode==='playground')return hasPlayground(f);
    if(mode==='direct')return isDirect(f);
    if(mode==='visible')return isVisible(f);
    return true;
  }
  function proofLabel(f){if(!f)return '';const c=t();return f.verification_status==='hoy_verified'?c.verified:f.verification_status==='operator_confirmed'?c.operator:c.source}
  function playgroundLabel(f){
    if(!f)return '';
    const c=t(),distance=Number.isFinite(f.playground_distance_m)?` · ${f.playground_distance_m} m`:'';
    if(f.playground_type==='own')return c.own;
    if(f.playground_type==='adjacent_public')return c.adjacent+distance;
    if(f.playground_type==='nearby_public')return c.nearby+distance;
    return '';
  }
  function primaryBadges(p,limit=2){
    const f=familyFor(p);if(!f)return [];
    const rows=[];const playground=playgroundLabel(f);if(playground)rows.push({label:`🛝 ${playground}`,tone:'play'});
    if(isVisible(f))rows.push({label:`👀 ${t().visibleBadge}`,tone:'visible'});
    else if(f.indoor_play_area===true)rows.push({label:`🧸 ${t().indoor}`,tone:'play'});
    return rows.slice(0,limit);
  }
  function rank(p){
    const f=familyFor(p);if(!f)return -1;
    return (isDirect(f)?60:hasPlayground(f)?30:0)+(isVisible(f)?35:0)+(f.verification_status==='hoy_verified'?20:f.verification_status==='source_verified'?12:8)+(f.traffic_separated===true?8:0)+(f.shade_available===true?4:0)+(f.indoor_play_area===true?4:0);
  }
  function situationRows(){return (DATA||[]).filter(p=>hasPlayground(familyFor(p))).sort((a,b)=>rank(b)-rank(a)).slice(0,3)}

  async function loadFamilyFeatures(){
    if(!sb){familyState.loaded=true;return []}
    try{
      const {data,error}=await sb.from('restaurant_family_features').select('restaurant_id,playground_type,playground_distance_m,visible_from_seating,fenced,traffic_separated,shade_available,indoor_play_area,highchairs,changing_facility,kids_menu,stroller_friendly,suitable_age_min,suitable_age_max,notes,verification_status,source_url,source_label,verified_at,updated_at');
      if(error)throw error;
      const byId=new Map((data||[]).map(row=>[Number(row.restaurant_id),normalize(row)]).filter(([,row])=>!!row));
      for(const p of DATA||[])p.family_features=byId.get(Number(p.id))||null;
      familyState.loaded=true;familyState.loadError='';return [...byId.values()];
    }catch(err){
      familyState.loaded=true;familyState.loadError=err?.message||String(err);
      console.warn('HOY family features unavailable:',familyState.loadError);
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
      ${rows.length?`<div class="family240-preview">${rows.map(p=>{const f=familyFor(p);return `<button type="button" data-family240-open="${Number(p.id)}"><strong>${esc240(p.name)}</strong><small>${esc240(playgroundLabel(f))}${isVisible(f)?` · ${esc240(c.visibleBadge)}`:''}</small><i>${esc240(proofLabel(f))}</i></button>`}).join('')}</div>`:`<div class="family240-empty"><b>${esc240(c.empty)}</b><span>${esc240(c.emptySub)}</span></div>`}
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
  function featureFact(label,value){return value===null||value===undefined?'':`<div class="family240-fact"><span>${esc240(label)}</span><b class="${value===true?'yes':value===false?'no':''}">${esc240(typeof value==='boolean'?yesNo(value):value)}</b></div>`}
  function profilePanel(p){
    const f=familyFor(p);if(!f)return '';
    const c=t();const age=f.suitable_age_min!=null||f.suitable_age_max!=null?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:null;
    const source=f.source_url&&/^https:\/\//i.test(f.source_url)?`<a href="${esc240(f.source_url)}" target="_blank" rel="noopener">${esc240(f.source_label||c.source)} ↗</a>`:esc240(f.source_label||proofLabel(f));
    return `<section class="family240-profile"><div class="family240-profile-head"><div><span>${esc240(c.familyFacts)}</span><h3>${esc240(playgroundLabel(f)||c.family)}</h3></div><em>${esc240(proofLabel(f))}</em></div>
      <div class="family240-facts">${featureFact(c.visibleBadge,f.visible_from_seating)}${featureFact(c.traffic,f.traffic_separated)}${featureFact(c.fenced,f.fenced)}${featureFact(c.shade,f.shade_available)}${featureFact(c.indoor,f.indoor_play_area)}${featureFact(c.highchairs,f.highchairs)}${featureFact(c.changing,f.changing_facility)}${featureFact(c.kidsMenu,f.kids_menu)}${featureFact(c.stroller,f.stroller_friendly)}${featureFact(c.age,age)}</div>
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
      const label=playgroundLabel(f)||(f.indoor_play_area===true?t().indoor:t().family);
      if(label)row.insertAdjacentHTML('beforeend',`<span class="pill good family240-status">🛝 ${esc240(label)}</span>`);
    }
  };

  const baseWire240=wire;
  wire=function(){
    baseWire240();
    document.querySelectorAll('[data-family240-filter]').forEach(btn=>btn.onclick=()=>{state.family=btn.dataset.family240Filter||'all';if(typeof trackEvent==='function')trackEvent('family_filter',null,{filter:state.family});render()});
    document.querySelectorAll('[data-family240-situation]').forEach(btn=>btn.onclick=()=>{state.family='playground';state.query='';state.service='all';if(typeof trackEvent==='function')trackEvent('family_situation_open',null,{surface:'home'});nav('discover')});
    document.querySelectorAll('[data-family240-open]').forEach(btn=>btn.onclick=()=>openDetail(Number(btn.dataset.family240Open)));
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
    state:familyState,normalize,familyFor,hasPlayground,isDirect,isVisible,isFamilyFriendly,matches,rank,primaryBadges,playgroundLabel,proofLabel,situationRows,loadFamilyFeatures
  };
})();

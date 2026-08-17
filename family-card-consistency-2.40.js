/* HOY 2.40.4 — keep Family result cards and research preview profiles structurally and visually consistent. */
(function(){
  if(window.__hoyFamilyCardConsistency240)return;
  window.__hoyFamilyCardConsistency240=true;

  const api=window.hoyFamilyPlaygrounds240;
  if(!api)return;
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const active=()=>!!state?.family&&state.family!=='all';

  function familyBadges(p){
    const rows=api.primaryBadges?.(p,2)||[];
    return rows.length?`<div class="family240-card-badges" data-family240-card-badges>${rows.map(x=>`<span class="${esc240(x.tone||'')}">${esc240(x.label)}</span>`).join('')}</div>`:'';
  }

  function harmonize(root){
    if(!root)return;
    root.querySelectorAll('.list-card[data-open]').forEach(card=>{
      card.querySelectorAll('[data-family240-card-badges],.family240-card-badges').forEach(x=>x.remove());
      if(!active())return;
      const id=Number(card.dataset.open);
      const p=(DATA||[]).find(x=>Number(x.id)===id);
      const f=api.familyFor?.(p);
      if(!f)return;
      const badges=familyBadges(p);
      const copy=card.querySelector('.decision-copy')||card.children[1]||card;
      const verdict=copy.querySelector('.decision280-card-verdict')||card.querySelector(':scope > .decision280-card-verdict');
      if(badges){
        if(verdict&&verdict.parentElement===copy)verdict.insertAdjacentHTML('beforebegin',badges);
        else copy.insertAdjacentHTML('beforeend',badges);
      }
      /* Research drafts keep the normal decision-copy content, while the verdict remains
         its own card grid item. This preserves the established compact shell contract. */
      if(card.classList.contains('family240-research-card')&&verdict&&verdict.parentElement!==card)card.appendChild(verdict);
    });
  }

  const baseListCard2403=listCard;
  listCard=function(p){
    if(p?.__family240_preview_profile!==true)return baseListCard2403(p);
    const venue=typeof meta==='function'?(meta(p)||p.area||''):p.area||'';
    const draft=(state?.lang==='en'?'RESEARCH DRAFT · NOT LIVE':state?.lang==='es'?'BORRADOR · NO PUBLICADO':'RESEARCH-DRAFT · NICHT LIVE');
    const preview=(state?.lang==='en'?'PREVIEW':state?.lang==='es'?'VISTA PREVIA':'VORSCHAU');
    return `<article class="list-card family240-research-card" data-open="${Number(p.id)}">
      <div class="list-art family240-research-art"><span>${esc240(preview)}</span></div>
      <div class="decision-copy"><h3>${esc240(p.name)}</h3><p>${esc240(venue)}</p><span class="family240-research-draft" data-family240-research-draft>${esc240(draft)}</span>${familyBadges(p)}</div>
      <span class="family240-research-lock" hidden aria-hidden="true"></span>
    </article>`;
  };

  const baseDiscover2403=discover;
  discover=function(){
    const html=baseDiscover2403();
    const shell=document.createElement('div');shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    harmonize(root);
    return root.outerHTML;
  };

  window.hoyFamilyCardConsistency240={harmonize};
})();

/* Premium, truthful detail presentation for unpublished audited Family preview profiles. */
(function(){
  if(window.__hoyFamilyPreviewProfile240)return;
  window.__hoyFamilyPreviewProfile240=true;

  const api=window.hoyFamilyPlaygrounds240;
  if(!api)return;
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const lang=()=>state?.lang||'de';
  const copy={
    de:{preview:'VORSCHAU',hero:'HOY FAMILY',heroTitle:'Essen & Spielen',statusEyebrow:'VORSCHAU-STATUS',statusTitle:'Auditiert für HOY Family',statusBody:'Dieser Betrieb ist für den Family-Bereich geprüft. Das vollständige HOY-Profil ist noch nicht live. Aktuell zeigen wir nur bestätigte Family-Informationen.',source:'Quelle ansehen ↗',family:'Für Familien',familyTitle:'Essen & Spielen',details:'Alle Familiendetails',play:'Spiel & Lage',comfort:'Komfort für Familien',proof:'Prüfstatus',playType:'Spielangebot',relationship:'Lage zum Restaurant',access:'Zugang',distance:'Entfernung',visible:'Vom Tisch sichtbar',road:'Weg zum Spielbereich',traffic:'Vom Verkehr getrennt',fenced:'Eingezäunt',shade:'Schatten am Spielbereich',supervision:'Aufsicht',indoor:'Indoor-Spielbereich',highchairs:'Hochstühle',changing:'Wickelmöglichkeit',kidsMenu:'Kindergerichte',stroller:'Kinderwagen-tauglich',age:'Geeignetes Alter',verification:'Bestätigung',sources:'Geprüfte Quellen',yes:'Ja',no:'Nein',back:'Zurück'},
    en:{preview:'PREVIEW',hero:'HOY FAMILY',heroTitle:'Eat & play',statusEyebrow:'PREVIEW STATUS',statusTitle:'Audited for HOY Family',statusBody:'This venue has been checked for the Family section. The full HOY profile is not live yet. For now, we only show confirmed Family information.',source:'View source ↗',family:'For families',familyTitle:'Eat & play',details:'All family details',play:'Play & location',comfort:'Family comfort',proof:'Verification',playType:'Play option',relationship:'Location vs venue',access:'Access',distance:'Distance',visible:'Visible from table',road:'Route to play area',traffic:'Separated from traffic',fenced:'Fenced',shade:'Shade at play area',supervision:'Supervision',indoor:'Indoor play area',highchairs:'Highchairs',changing:'Changing facility',kidsMenu:'Kids menu',stroller:'Stroller friendly',age:'Suitable age',verification:'Verification',sources:'Checked sources',yes:'Yes',no:'No',back:'Back'},
    es:{preview:'VISTA PREVIA',hero:'HOY FAMILIA',heroTitle:'Comer y jugar',statusEyebrow:'ESTADO DE VISTA PREVIA',statusTitle:'Auditado para HOY Familia',statusBody:'Este local ha sido revisado para la sección Familia. El perfil HOY completo aún no está publicado. Por ahora mostramos únicamente información Family confirmada.',source:'Ver fuente ↗',family:'Para familias',familyTitle:'Comer y jugar',details:'Todos los detalles familiares',play:'Juego y ubicación',comfort:'Comodidad familiar',proof:'Verificación',playType:'Zona de juego',relationship:'Ubicación respecto al local',access:'Acceso',distance:'Distancia',visible:'Visible desde la mesa',road:'Camino a la zona de juego',traffic:'Separado del tráfico',fenced:'Cerrado',shade:'Sombra en la zona de juego',supervision:'Supervisión',indoor:'Zona de juego interior',highchairs:'Tronas',changing:'Cambiador',kidsMenu:'Menú infantil',stroller:'Accesible con carrito',age:'Edad recomendada',verification:'Verificación',sources:'Fuentes comprobadas',yes:'Sí',no:'No',back:'Volver'}
  };
  const c=()=>copy[lang()]||copy.de;
  const venueLabel=type=>({
    de:{restaurant:'Restaurant',bar:'Bar',cafe:'Café',chiringuito:'Chiringuito',beach_club:'Beach Club'},
    en:{restaurant:'Restaurant',bar:'Bar',cafe:'Café',chiringuito:'Chiringuito',beach_club:'Beach club'},
    es:{restaurant:'Restaurante',bar:'Bar',cafe:'Cafetería',chiringuito:'Chiringuito',beach_club:'Beach club'}
  })[lang()]?.[type]||type||'';
  const known=v=>v!==null&&v!==undefined&&v!==''&&v!=='unknown';
  const bool=v=>v===true?c().yes:v===false?c().no:'';
  const fact=(label,value)=>known(value)?`<div class="family240-preview-fact"><span>${esc240(label)}</span><b>${esc240(value)}</b></div>`:'';
  const factBool=(label,value)=>value===true||value===false?fact(label,bool(value)):'';
  const group=(title,rows)=>{const body=rows.filter(Boolean).join('');return body?`<section class="family240-preview-fact-group"><h4>${esc240(title)}</h4>${body}</section>`:''};

  function highlightRows(p,f){
    const rows=[];
    const primary=api.primaryBadges?.(p,2)||[];
    primary.forEach(x=>rows.push(x));
    if(f?.road_crossing==='none'&&!rows.some(x=>/Straßen|road|carretera/i.test(String(x.label||'')))){
      rows.push({tone:'safe',label:lang()==='en'?'🚸 No road crossing':lang()==='es'?'🚸 Sin cruzar carretera':'🚸 Keine Straßenquerung'});
    }
    return rows.slice(0,3);
  }
  function highlightMarkup(p,f){
    const rows=highlightRows(p,f);
    return rows.length?`<div class="family240-preview-highlights">${rows.map(x=>`<span class="${esc240(x.tone||'')}">${esc240(x.label)}</span>`).join('')}</div>`:'';
  }

  function detailsMarkup(f){
    const age=(f?.suitable_age_min!=null||f?.suitable_age_max!=null)?`${f.suitable_age_min??'0'}–${f.suitable_age_max??'17'}`:'';
    const playRows=[
      fact(c().playType,api.playTypesLabel?.(f)||''),
      f?.relationship&&f.relationship!=='unknown'?fact(c().relationship,api.relationshipLabel?.(f)||''):'',
      f?.access_type&&f.access_type!=='unknown'?fact(c().access,api.accessLabel?.(f)||''):'',
      Number.isFinite(f?.playground_distance_m)?fact(c().distance,api.distanceLabel?.(f)||`${f.playground_distance_m} m`):'',
      factBool(c().visible,f?.visible_from_seating),
      f?.road_crossing&&f.road_crossing!=='unknown'?fact(c().road,api.roadLabel?.(f)||''):'',
      factBool(c().traffic,f?.traffic_separated),
      factBool(c().fenced,f?.fenced),
      factBool(c().shade,f?.shade_available),
      Array.isArray(f?.supervision_types)&&f.supervision_types.length?fact(c().supervision,api.supervisionLabel?.(f)||f.supervision_types.join(' · ')):''
    ];
    const comfortRows=[
      factBool(c().indoor,f?.indoor_play_area),
      factBool(c().highchairs,f?.highchairs),
      factBool(c().changing,f?.changing_facility),
      factBool(c().kidsMenu,f?.kids_menu),
      factBool(c().stroller,f?.stroller_friendly),
      age?fact(c().age,age):''
    ];
    const proofRows=[
      fact(c().verification,api.proofLabel?.(f)||''),
      Number(f?.source_count)>0?fact(c().sources,String(Number(f.source_count))):''
    ];
    return `${group(c().play,playRows)}${group(c().comfort,comfortRows)}${group(c().proof,proofRows)}`;
  }

  function renderPreviewProfile(p){
    const f=api.familyFor?.(p);
    if(!f)return false;
    const d=document.getElementById('detail');
    if(!d)return false;
    const source=f.source_url&&/^https:\/\//i.test(f.source_url)?`<a class="family240-preview-source" href="${esc240(f.source_url)}" target="_blank" rel="noopener noreferrer">${esc240(c().source)}</a>`:'';
    const proof=api.proofLabel?.(f)||'';
    const heroMark=api.hasPlay?.(f)?'✦':'HOY';
    d.classList.add('family240-premium-preview-dialog');
    d.dataset.restaurantId=String(p.id);
    d.innerHTML=`<article class="family240-premium-preview" data-family240-preview-detail>
      <header class="family240-preview-hero">
        <button class="round family240-preview-back" type="button" data-close aria-label="${esc240(c().back)}">${icons.back}</button>
        <span class="family240-preview-chip">${esc240(c().preview)}</span>
        <div class="family240-preview-hero-copy"><span>${esc240(c().hero)}</span><strong>${esc240(c().heroTitle)}</strong></div>
        <i aria-hidden="true">${esc240(heroMark)}</i>
      </header>
      <div class="family240-preview-body">
        <div class="family240-preview-title"><div class="eyebrow">${esc240(p.area||'Mar Menor')}</div><h2>${esc240(p.name)}</h2><div class="meta">${esc240(venueLabel(p.venue_type))}</div></div>
        <section class="family240-preview-status" data-family240-preview-status>
          <div class="family240-preview-status-icon" aria-hidden="true">✓</div>
          <div><span>${esc240(c().statusEyebrow)}</span><h3>${esc240(c().statusTitle)}</h3><p>${esc240(c().statusBody)}</p>${source}</div>
        </section>
        <section class="family240-preview-family" data-family240-preview-family>
          <div class="family240-preview-family-head"><div><span>${esc240(c().family)}</span><h3>${esc240(c().familyTitle)}</h3></div><em>${esc240(c().preview)}${proof?` · ${esc240(proof)}`:''}</em></div>
          ${highlightMarkup(p,f)}
          <details class="family240-preview-details" data-family240-preview-details><summary>${esc240(c().details)} <span aria-hidden="true">+</span></summary><div class="family240-preview-detail-groups">${detailsMarkup(f)}</div></details>
        </section>
      </div>
    </article>`;
    if(!d.open)d.showModal();
    const close=d.querySelector('[data-close]');
    if(close)close.onclick=()=>d.close();
    return true;
  }

  const baseOpenDetail2404=openDetail;
  openDetail=function(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    if(p?.__family240_preview_profile===true&&renderPreviewProfile(p))return;
    baseOpenDetail2404(id);
  };

  window.hoyFamilyPreviewProfile240={renderPreviewProfile};
})();

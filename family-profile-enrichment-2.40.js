/* HOY 2.40.5 — sourced premium profile enrichment for unpublished Family research venues.
   Preview-only: reads inert audited research data and never writes to Supabase. */
(function(){
  if(window.__hoyFamilyProfileEnrichment240)return;
  window.__hoyFamilyProfileEnrichment240=true;

  const DATA_URL='./data/family-profile-enrichment-2026-08-17.json';
  const familyApi=window.hoyFamilyPlaygrounds240;
  const hard=window.hoyFamilyPlaygroundsHardening240;
  const state240={status:'idle',error:'',profiles:[],bySlug:new Map(),loadedAt:0};
  let loadPromise=null;

  const COPY={
    de:{preview:'VORSCHAU',profile:'HOY PROFILVORSCHAU',prepared:'Premium-Profil vorbereitet',notLive:'Noch nicht live veröffentlicht',preparedBody:'HOY hat die öffentlich belegbaren Basisdaten dieses Betriebs redaktionell vorbereitet. Unklare oder widersprüchliche Angaben bleiben ausdrücklich offen.',verifiedSources:'Profilquellen geprüft',overview:'Überblick',menu:'Speisekarte',family:'Familie',info:'Infos',about:'Über den Betrieb',facts:'Auf einen Blick',hours:'Öffnungszeiten',address:'Adresse',reservation:'Reservierung',pickup:'Abholung',delivery:'Lieferung',available:'Möglich',unavailable:'Nicht ausgewiesen',unknown:'Noch zu prüfen',call:'Anrufen',route:'Route',website:'Website',reserve:'Reservieren',menuSource:'Offizielle Kartenquelle',sourceOnly:'Kartenquelle bekannt',menuNotImported:'Diese Quelle ist geprüft, aber noch nicht als vollständige HOY-Speisekarte importiert.',openSource:'Quelle öffnen ↗',familyTitle:'Essen & Spielen',familySub:'Bestätigte Family-Fakten',allFamily:'Familiendetails',verification:'Bestätigung',contact:'Kontakt',phone:'Telefon',email:'E-Mail',profileStatus:'Profilstatus',checked:'Zuletzt recherchiert',sources:'Quellen & Nachweise',sourceType:'Quellentyp',operator:'Betreiber',operatorLegal:'Betreiber · Rechtliches',host:'Standort-/Center-Verzeichnis',claimed:'Beanspruchtes öffentliches Profil',directory:'Geprüftes öffentliches Verzeichnis',snapshot:'Öffentlicher Snapshot',publicProfile:'Öffentliches Profil',localDirectory:'Lokales Verzeichnis',back:'Zurück',noFakeMedia:'Echtes Betriebsbild noch nicht freigegeben',features:'Merkmale'},
    en:{preview:'PREVIEW',profile:'HOY PROFILE PREVIEW',prepared:'Premium profile prepared',notLive:'Not published live yet',preparedBody:'HOY has editorially prepared the publicly supported base facts for this venue. Unclear or conflicting information stays explicitly open.',verifiedSources:'Profile sources checked',overview:'Overview',menu:'Menu',family:'Family',info:'Info',about:'About the venue',facts:'At a glance',hours:'Opening hours',address:'Address',reservation:'Reservation',pickup:'Pickup',delivery:'Delivery',available:'Available',unavailable:'Not listed',unknown:'To be checked',call:'Call',route:'Route',website:'Website',reserve:'Reserve',menuSource:'Official menu source',sourceOnly:'Menu source known',menuNotImported:'This source is checked but has not yet been imported as a complete HOY menu.',openSource:'Open source ↗',familyTitle:'Eat & play',familySub:'Confirmed Family facts',allFamily:'Family details',verification:'Verification',contact:'Contact',phone:'Phone',email:'Email',profileStatus:'Profile status',checked:'Last researched',sources:'Sources & evidence',sourceType:'Source type',operator:'Operator',operatorLegal:'Operator · legal',host:'Venue/centre directory',claimed:'Claimed public profile',directory:'Checked public directory',snapshot:'Public snapshot',publicProfile:'Public profile',localDirectory:'Local directory',back:'Back',noFakeMedia:'Real venue photo not cleared yet',features:'Features'},
    es:{preview:'VISTA PREVIA',profile:'VISTA PREVIA DEL PERFIL HOY',prepared:'Perfil premium preparado',notLive:'Aún no publicado',preparedBody:'HOY ha preparado editorialmente los datos públicos verificables de este local. Los datos dudosos o contradictorios permanecen expresamente abiertos.',verifiedSources:'Fuentes del perfil comprobadas',overview:'Resumen',menu:'Carta',family:'Familia',info:'Info',about:'Sobre el local',facts:'De un vistazo',hours:'Horario',address:'Dirección',reservation:'Reserva',pickup:'Recogida',delivery:'Entrega',available:'Disponible',unavailable:'No indicado',unknown:'Pendiente de comprobar',call:'Llamar',route:'Ruta',website:'Web',reserve:'Reservar',menuSource:'Fuente oficial de carta',sourceOnly:'Fuente de carta conocida',menuNotImported:'Esta fuente está comprobada, pero todavía no se ha importado como carta HOY completa.',openSource:'Abrir fuente ↗',familyTitle:'Comer y jugar',familySub:'Datos Family confirmados',allFamily:'Detalles familiares',verification:'Verificación',contact:'Contacto',phone:'Teléfono',email:'E-mail',profileStatus:'Estado del perfil',checked:'Última investigación',sources:'Fuentes y evidencias',sourceType:'Tipo de fuente',operator:'Operador',operatorLegal:'Operador · legal',host:'Directorio del centro/ubicación',claimed:'Perfil público reclamado',directory:'Directorio público comprobado',snapshot:'Snapshot público',publicProfile:'Perfil público',localDirectory:'Directorio local',back:'Volver',noFakeMedia:'Foto real del local aún no autorizada',features:'Características'}
  };
  const c=()=>COPY[state?.lang]||COPY.de;
  const enabled=()=>hard?.isPreviewEnabled?.()===true;
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeUrl=v=>/^https:\/\//i.test(String(v||'').trim())?String(v).trim():'';
  const phoneHref=v=>'tel:'+String(v||'').replace(/[^+\d]/g,'');
  const mailHref=v=>'mailto:'+encodeURIComponent(String(v||'').trim());
  const routeHref240=v=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(String(v||'').trim());
  const known=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&String(v).trim()!=='unknown';

  function validate(master){
    if(!master||master.production_import_allowed!==false)throw new Error('Premium Family enrichment must remain non-production');
    const rows=Array.isArray(master.profiles)?master.profiles:[];
    if(rows.length!==13)throw new Error(`Expected 13 premium research profiles, got ${rows.length}`);
    const slugs=rows.map(x=>String(x.slug||'').trim()).filter(Boolean);
    if(slugs.length!==13||new Set(slugs).size!==13)throw new Error('Premium Family profile slugs must be unique and complete');
    for(const row of rows){
      if(!row.name||!row.description||!row.address)throw new Error(`Incomplete premium profile: ${row.slug||'unknown'}`);
      if(!Array.isArray(row.sources)||!row.sources.length)throw new Error(`Missing provenance: ${row.slug}`);
      if(row.sources.some(s=>!safeUrl(s.url)))throw new Error(`Unsafe source URL: ${row.slug}`);
    }
    return rows;
  }

  async function load(){
    if(state240.status==='ready')return true;
    if(loadPromise)return loadPromise;
    state240.status='loading';
    loadPromise=(async()=>{
      try{
        const r=await fetch(DATA_URL,{cache:'no-store'});
        if(!r.ok)throw new Error(`Premium profile research HTTP ${r.status}`);
        const master=await r.json();
        const rows=validate(master);
        state240.profiles=rows;
        state240.bySlug=new Map(rows.map(x=>[x.slug,x]));
        state240.status='ready';state240.error='';state240.loadedAt=Date.now();
        return true;
      }catch(error){
        state240.status='error';state240.error=error?.message||String(error);
        console.warn('HOY Family premium profile enrichment unavailable:',state240.error);
        return false;
      }
    })();
    return loadPromise;
  }

  function profileFor(p){
    if(!p?.__family240_preview_profile||state240.status!=='ready')return null;
    return state240.bySlug.get(p.__family240_research_slug||p.slug)||null;
  }
  function serviceText(v){return v==='available'?c().available:v==='unavailable'?c().unavailable:c().unknown}
  function sourceAuthority(v){
    return ({operator:c().operator,operator_legal:c().operatorLegal,venue_host_directory:c().host,claimed_public_profile:c().claimed,verified_public_directory:c().directory,verified_public_snapshot:c().snapshot,public_profile:c().publicProfile,verified_local_directory:c().localDirectory}[v]||c().directory);
  }
  function venueLabel(type){
    const maps={de:{restaurant:'Restaurant',bar:'Bar & Restaurant',cafe:'Café & Confitería',chiringuito:'Chiringuito'},en:{restaurant:'Restaurant',bar:'Bar & restaurant',cafe:'Café & bakery',chiringuito:'Chiringuito'},es:{restaurant:'Restaurante',bar:'Bar y restaurante',cafe:'Café y confitería',chiringuito:'Chiringuito'}};
    return maps[state?.lang||'de']?.[type]||type||'';
  }

  function actionMarkup(e){
    const out=[];
    if(e.phone)out.push(`<a href="${esc240(phoneHref(e.phone))}"><span>${icons.phone}</span><b>${esc240(c().call)}</b></a>`);
    if(e.address)out.push(`<a href="${esc240(routeHref240(e.address))}" target="_blank" rel="noopener noreferrer"><span>${icons.pin}</span><b>${esc240(c().route)}</b></a>`);
    if(safeUrl(e.website))out.push(`<a href="${esc240(e.website)}" target="_blank" rel="noopener noreferrer"><span>${icons.globe}</span><b>${esc240(c().website)}</b></a>`);
    const reserve=safeUrl(e.reservation_url);
    if(reserve)out.push(`<a href="${esc240(reserve)}" target="_blank" rel="noopener noreferrer"><span>${icons.calendar||icons.phone}</span><b>${esc240(c().reserve)}</b></a>`);
    else if(e.services?.reservation==='available'&&e.phone)out.push(`<a href="${esc240(phoneHref(e.phone))}"><span>${icons.calendar||icons.phone}</span><b>${esc240(c().reserve)}</b></a>`);
    return `<div class="family240-enriched-actions">${out.slice(0,4).join('')}</div>`;
  }

  function featureMarkup(e){
    const rows=Array.isArray(e.features)?e.features.filter(Boolean):[];
    return rows.length?`<div class="family240-enriched-features">${rows.map(x=>`<span>${esc240(x)}</span>`).join('')}</div>`:'';
  }
  function fact(label,value){return known(value)?`<div class="family240-enriched-fact"><span>${esc240(label)}</span><b>${esc240(value)}</b></div>`:''}
  function serviceFacts(e){
    return `<div class="family240-enriched-facts">${fact(c().address,e.address)}${fact(c().hours,e.hours)}${fact(c().reservation,serviceText(e.services?.reservation))}${fact(c().pickup,serviceText(e.services?.pickup))}${fact(c().delivery,serviceText(e.services?.delivery))}</div>`;
  }

  function menuMarkup(e){
    const m=e.menu||{};
    const url=safeUrl(m.url);
    const official=m.status==='official_link';
    return `<section id="family240-enriched-menu" class="family240-enriched-section">
      <div class="family240-enriched-section-head"><small>${esc240(c().menu)}</small><h3>${esc240(official?c().menuSource:c().sourceOnly)}</h3></div>
      <div class="family240-enriched-menu-card"><span class="family240-enriched-source-pill">${esc240(official?'OFFIZIELLE QUELLE':'QUELLENSTATUS')}</span><h4>${esc240(m.label||c().sourceOnly)}</h4><p>${esc240(m.note||c().menuNotImported)}</p><small>${esc240(c().menuNotImported)}</small>${url?`<a href="${esc240(url)}" target="_blank" rel="noopener noreferrer">${esc240(c().openSource)}</a>`:''}</div>
    </section>`;
  }

  function familyValueRows(f){
    if(!f)return '';
    const rows=[];
    const add=(label,value)=>{if(known(value))rows.push(fact(label,value))};
    const addBool=(label,value)=>{if(value===true||value===false)add(label,value?(state?.lang==='es'?'Sí':state?.lang==='en'?'Yes':'Ja'):(state?.lang==='es'?'No':state?.lang==='en'?'No':'Nein'))};
    add(state?.lang==='en'?'Play option':state?.lang==='es'?'Zona de juego':'Spielangebot',familyApi?.playTypesLabel?.(f)||'');
    if(f.relationship&&f.relationship!=='unknown')add(state?.lang==='en'?'Location':state?.lang==='es'?'Ubicación':'Lage zum Restaurant',familyApi?.relationshipLabel?.(f)||'');
    if(f.access_type&&f.access_type!=='unknown')add(state?.lang==='en'?'Access':state?.lang==='es'?'Acceso':'Zugang',familyApi?.accessLabel?.(f)||'');
    if(Number.isFinite(f.playground_distance_m))add(state?.lang==='en'?'Distance':state?.lang==='es'?'Distancia':'Entfernung',familyApi?.distanceLabel?.(f)||`${f.playground_distance_m} m`);
    addBool(state?.lang==='en'?'Visible from table':state?.lang==='es'?'Visible desde la mesa':'Vom Tisch sichtbar',f.visible_from_seating);
    if(f.road_crossing&&f.road_crossing!=='unknown')add(state?.lang==='en'?'Route to play':state?.lang==='es'?'Camino al juego':'Weg zum Spielbereich',familyApi?.roadLabel?.(f)||'');
    addBool(state?.lang==='en'?'Fenced':state?.lang==='es'?'Cerrado':'Eingezäunt',f.fenced);
    addBool(state?.lang==='en'?'Shade':state?.lang==='es'?'Sombra':'Schatten',f.shade_available);
    addBool(state?.lang==='en'?'Highchairs':state?.lang==='es'?'Tronas':'Hochstühle',f.highchairs);
    addBool(state?.lang==='en'?'Changing facility':state?.lang==='es'?'Cambiador':'Wickelmöglichkeit',f.changing_facility);
    addBool(state?.lang==='en'?'Kids menu':state?.lang==='es'?'Menú infantil':'Kindergerichte',f.kids_menu);
    addBool(state?.lang==='en'?'Stroller friendly':state?.lang==='es'?'Apto para carrito':'Kinderwagen-tauglich',f.stroller_friendly);
    add(c().verification,familyApi?.proofLabel?.(f)||'');
    return rows.join('');
  }
  function familyMarkup(p){
    const f=familyApi?.familyFor?.(p);
    if(!f)return '';
    const badges=familyApi?.primaryBadges?.(p,3)||[];
    return `<section id="family240-enriched-family" class="family240-enriched-section family240-enriched-family">
      <div class="family240-enriched-section-head"><small>${esc240(c().familySub)}</small><h3>${esc240(c().familyTitle)}</h3></div>
      ${badges.length?`<div class="family240-enriched-family-badges">${badges.map(x=>`<span class="${esc240(x.tone||'')}">${esc240(x.label)}</span>`).join('')}</div>`:''}
      <details><summary>${esc240(c().allFamily)} <span aria-hidden="true">+</span></summary><div class="family240-enriched-facts">${familyValueRows(f)}</div></details>
    </section>`;
  }

  function sourceMarkup(e){
    const sources=(e.sources||[]).map((s,i)=>`<a class="family240-enriched-source" href="${esc240(s.url)}" target="_blank" rel="noopener noreferrer"><span><b>${esc240(sourceAuthority(s.authority))}</b><small>${esc240((s.supports||[]).join(' · '))}</small></span><i aria-hidden="true">↗</i></a>`).join('');
    return `<section id="family240-enriched-info" class="family240-enriched-section"><div class="family240-enriched-section-head"><small>${esc240(c().info)}</small><h3>${esc240(c().contact)}</h3></div><div class="family240-enriched-facts">${fact(c().phone,e.phone)}${fact(c().email,e.email)}${fact(c().website,e.website)}${fact(c().profileStatus,c().notLive)}${fact(c().checked,e.profile_checked_at)}</div><div class="family240-enriched-sources"><h4>${esc240(c().sources)}</h4>${sources}</div></section>`;
  }

  function renderProfile(p,e){
    const d=document.getElementById('detail');
    if(!d)return false;
    d.classList.add('family240-enriched-dialog');
    d.dataset.restaurantId=String(p.id);
    const familyProof=familyApi?.proofLabel?.(familyApi?.familyFor?.(p))||'';
    d.innerHTML=`<article class="family240-enriched-profile" data-family240-enriched-profile data-family240-enriched-slug="${esc240(e.slug)}">
      <header class="family240-enriched-hero"><button class="round" type="button" data-close aria-label="${esc240(c().back)}">${icons.back}</button><span class="family240-enriched-preview">${esc240(c().preview)}</span><div class="family240-enriched-hero-brand"><small>${esc240(c().profile)}</small><strong>HOY</strong><span>${esc240(c().noFakeMedia)}</span></div></header>
      <div class="family240-enriched-body">
        <section class="family240-enriched-identity"><div class="eyebrow">${esc240(e.area)}</div><h2>${esc240(e.name)}</h2><div class="meta">${esc240(e.meta||venueLabel(e.venue_type))}</div><div class="family240-enriched-trust"><span>${esc240(c().verifiedSources)}</span>${familyProof?`<i>·</i><span>${esc240(familyProof)}</span>`:''}${e.services?.reservation==='available'?`<i>·</i><span>${esc240(c().reservation)} ${esc240(c().available)}</span>`:''}</div></section>
        ${actionMarkup(e)}
        <section class="family240-enriched-status"><span>✓</span><div><small>${esc240(c().notLive)}</small><h3>${esc240(c().prepared)}</h3><p>${esc240(c().preparedBody)}</p></div></section>
        <nav class="family240-enriched-nav" aria-label="Profilbereiche"><a href="#family240-enriched-overview">${esc240(c().overview)}</a><a href="#family240-enriched-menu">${esc240(c().menu)}</a><a href="#family240-enriched-family">${esc240(c().family)}</a><a href="#family240-enriched-info">${esc240(c().info)}</a></nav>
        <section id="family240-enriched-overview" class="family240-enriched-section"><div class="family240-enriched-section-head"><small>${esc240(c().overview)}</small><h3>${esc240(c().about)}</h3></div><p class="family240-enriched-description">${esc240(e.description)}</p>${featureMarkup(e)}<h4>${esc240(c().facts)}</h4>${serviceFacts(e)}</section>
        ${menuMarkup(e)}
        ${familyMarkup(p)}
        ${sourceMarkup(e)}
      </div>
    </article>`;
    if(!d.open)d.showModal();
    d.querySelector('[data-close]')?.addEventListener('click',()=>{d.close();d.classList.remove('family240-enriched-dialog')});
    d.querySelectorAll('.family240-enriched-nav a').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();d.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'})}));
    return true;
  }

  const baseOpenDetail=openDetail;
  openDetail=function(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const enriched=profileFor(p);
    if(enriched&&renderProfile(p,enriched))return;
    document.getElementById('detail')?.classList.remove('family240-enriched-dialog');
    return baseOpenDetail(id);
  };

  if(enabled())void load();
  window.hoyFamilyProfileEnrichment240={state:state240,load,profileFor,renderProfile};
})();

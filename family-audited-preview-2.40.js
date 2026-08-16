/* HOY 2.40.1 — audited Family research preview adapter.
   Preview-only: reads the inert research master and never writes to Supabase. */
(function(){
  if(window.__hoyFamilyAuditedPreview240)return;
  window.__hoyFamilyAuditedPreview240=true;

  const api=window.hoyFamilyPlaygrounds240;
  const hard=window.hoyFamilyPlaygroundsHardening240;
  if(!api||!hard)return;

  const MASTER_URL='./data/family-gastro-master-2026-08-16.json';
  const ALLOWED_STATUS=new Set(['operator_confirmed','source_verified','community_verified']);
  const previewState={status:'idle',mode:'none',error:'',readyCount:0,existingCount:0,virtualCount:0,entries:[],virtualProfiles:[]};
  let loadPromise=null;

  const copy={
    de:{preview:'VORSCHAU',research:'Research-Vorschau',auditedOne:'auditierter Family-Eintrag',auditedMany:'auditierte Family-Einträge',demoOne:'Demo-Beispiel',demoMany:'Demo-Beispiele',loading:'Research-Daten werden geladen …',context:'Auditierte Research-Daten · keine Live-Veröffentlichung',draft:'RESEARCH-DRAFT · NICHT LIVE',draftShort:'RESEARCH',notLive:'NICHT LIVE',draftTitle:'Noch nicht als HOY-Profil veröffentlicht',draftBody:'Dieser Betrieb ist als aktueller Research-Lead vorbereitet, das Basisprofil ist aber noch nicht live veröffentlicht. In dieser Vorschau zeigen wir ausschließlich die auditierten Family-Fakten.',source:'Research-Quelle öffnen ↗',proof:'Auditierte Research-Daten · noch nicht live',toast:'Family Research-Vorschau · 17 auditierte Einträge; 13 davon sind noch unveröffentlichte Profil-Drafts.'},
    en:{preview:'PREVIEW',research:'Research preview',auditedOne:'audited Family entry',auditedMany:'audited Family entries',demoOne:'demo example',demoMany:'demo examples',loading:'Loading research data …',context:'Audited research data · not live publication',draft:'RESEARCH DRAFT · NOT LIVE',draftShort:'RESEARCH',notLive:'NOT LIVE',draftTitle:'Not yet published as a HOY profile',draftBody:'This venue is prepared as a current research lead, but its base profile is not live yet. This preview shows only the audited Family facts.',source:'Open research source ↗',proof:'Audited research data · not live yet',toast:'Family research preview · 17 audited entries; 13 are still unpublished profile drafts.'},
    es:{preview:'VISTA PREVIA',research:'Vista previa de investigación',auditedOne:'entrada Family auditada',auditedMany:'entradas Family auditadas',demoOne:'ejemplo demo',demoMany:'ejemplos demo',loading:'Cargando datos de investigación …',context:'Datos de investigación auditados · no publicados en vivo',draft:'BORRADOR DE INVESTIGACIÓN · NO PUBLICADO',draftShort:'INVESTIGACIÓN',notLive:'NO PUBLICADO',draftTitle:'Aún no publicado como perfil HOY',draftBody:'Este local está preparado como lead actual de investigación, pero su perfil base todavía no está publicado. Esta vista previa muestra solo los datos Family auditados.',source:'Abrir fuente de investigación ↗',proof:'Datos de investigación auditados · aún no publicados',toast:'Vista previa Family · 17 entradas auditadas; 13 siguen siendo borradores de perfil no publicados.'}
  };
  const c=()=>copy[state?.lang]||copy.de;
  const enabled=()=>hard.isPreviewEnabled?.()===true;
  const activeFamily=()=>hard.isFamilyActive?.()===true;
  const escHtml=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const boolOrNull=v=>v===true?true:v===false?false:null;

  function venueLabel(type){
    const lang=state?.lang||'de';
    const map={
      de:{restaurant:'Restaurant',bar:'Bar',cafe:'Café',chiringuito:'Chiringuito',beach_club:'Beach Club'},
      en:{restaurant:'Restaurant',bar:'Bar',cafe:'Café',chiringuito:'Chiringuito',beach_club:'Beach club'},
      es:{restaurant:'Restaurante',bar:'Bar',cafe:'Cafetería',chiringuito:'Chiringuito',beach_club:'Beach club'}
    };
    return map[lang]?.[type]||map.de[type]||'Gastronomie';
  }

  function clearLegacyDemoFeatures(){
    for(const p of DATA||[]){
      const f=p?.family_features;
      if(f?.__family240_preview===true&&f?.__family240_audited!==true){
        p.family_features=Object.prototype.hasOwnProperty.call(p,'__family240_preview_original')?p.__family240_preview_original:null;
        try{delete p.__family240_preview_original}catch{}
      }
    }
  }

  function removeVirtualProfiles(){
    if(!Array.isArray(DATA))return;
    for(let i=DATA.length-1;i>=0;i--)if(DATA[i]?.__family240_preview_profile===true)DATA.splice(i,1);
  }

  function featureFromEntry(entry,restaurantId){
    const f=entry.family||{};
    return {
      restaurant_id:Number(restaurantId),
      __family240_preview:true,
      __family240_audited:true,
      __family240_research_slug:entry.slug,
      play_types:Array.isArray(f.play_types)?f.play_types:[],
      relationship:f.relationship||'unknown',
      access_type:f.access_type||'unknown',
      playground_distance_m:Number.isFinite(Number(f.playground_distance_m))?Number(f.playground_distance_m):null,
      distance_method:f.distance_method||'unknown',
      visible_from_seating:boolOrNull(f.visible_from_seating),
      road_crossing:f.road_crossing||'unknown',
      fenced:boolOrNull(f.fenced),
      traffic_separated:boolOrNull(f.traffic_separated),
      shade_available:boolOrNull(f.shade_available),
      supervision_types:Array.isArray(f.supervision_types)?f.supervision_types:[],
      indoor_play_area:boolOrNull(f.indoor_play_area),
      highchairs:boolOrNull(f.highchairs),
      changing_facility:boolOrNull(f.changing_facility),
      kids_menu:boolOrNull(f.kids_menu),
      stroller_friendly:boolOrNull(f.stroller_friendly),
      suitable_age_min:Number.isFinite(Number(f.suitable_age_min))?Number(f.suitable_age_min):null,
      suitable_age_max:Number.isFinite(Number(f.suitable_age_max))?Number(f.suitable_age_max):null,
      notes:null,
      verification_status:entry.verification,
      source_count:Number(entry.source_count)||0,
      source_url:entry.source_url||null,
      source_label:'HOY Family research · 2026-08-16',
      verified_at:null,
      updated_at:null
    };
  }

  function findExisting(entry){
    const rows=(DATA||[]).filter(p=>p?.__family240_preview_profile!==true);
    if(entry.restaurant_id!=null){
      const byId=rows.find(p=>Number(p.id)===Number(entry.restaurant_id));
      if(byId)return byId;
    }
    const slug=String(entry.slug||'').toLowerCase();
    const name=String(entry.name||'').trim().toLowerCase();
    return rows.find(p=>String(p.slug||'').toLowerCase()===slug)||rows.find(p=>String(p.name||'').trim().toLowerCase()===name)||null;
  }

  function virtualProfile(entry,index){
    const id=-(240001+index);
    return {
      id,slug:entry.slug,name:entry.name,area:entry.area||'Mar Menor',municipality:entry.municipality||'',venue_type:entry.venue_type||'restaurant',
      meta:`${entry.area||'Mar Menor'} · ${venueLabel(entry.venue_type)}`,
      description:'',address:'',phone:'',website:'',hours:'',latitude:null,longitude:null,
      reservation:'Prüfen',pickup:'Prüfen',delivery:'Prüfen',operator_verified:false,active_plan:'free',profile_quality:'draft',is_published:false,
      claim_preview:'',cloud:false,__family240_preview_profile:true,__family240_research_slug:entry.slug,
      family_features:featureFromEntry(entry,id)
    };
  }

  function applyBindings(){
    if(!enabled()||previewState.status!=='ready')return false;
    removeVirtualProfiles();
    clearLegacyDemoFeatures();

    if(hard.hasVerifiedPlayData?.()===true){
      previewState.mode='live';previewState.existingCount=0;previewState.virtualCount=0;previewState.virtualProfiles=[];
      return false;
    }

    let existingCount=0;
    const virtuals=[];
    previewState.entries.forEach((entry,index)=>{
      const p=findExisting(entry);
      if(p){
        if(!Object.prototype.hasOwnProperty.call(p,'__family240_audited_original'))p.__family240_audited_original=p.family_features??null;
        p.family_features=featureFromEntry(entry,p.id);
        p.__family240_audited_entry=entry.slug;
        existingCount++;
      }else virtuals.push(virtualProfile(entry,index));
    });
    previewState.mode='research';
    previewState.existingCount=existingCount;
    previewState.virtualCount=virtuals.length;
    previewState.virtualProfiles=virtuals;
    return true;
  }

  function syncVirtualProfiles(){
    removeVirtualProfiles();
    if(!enabled()||previewState.status!=='ready'||previewState.mode!=='research')return;
    if(activeFamily()&&state?.view==='discover')DATA.push(...previewState.virtualProfiles);
  }

  function validateMaster(master){
    if(!master||master.production_import_allowed!==false)throw new Error('Family research master is not explicitly non-production');
    const ready=(master.entries||[]).filter(x=>x.status==='seed_ready');
    if(ready.length!==17)throw new Error(`Expected 17 seed-ready Family entries, got ${ready.length}`);
    if(!ready.every(x=>ALLOWED_STATUS.has(x.verification)))throw new Error('Unexpected Family verification status in research master');
    if(ready.some(x=>x.verification==='hoy_verified'))throw new Error('Research preview cannot self-award hoy_verified');
    return ready;
  }

  async function loadMaster(){
    if(!enabled())return false;
    if(previewState.status==='ready'){applyBindings();return true}
    if(loadPromise)return loadPromise;
    previewState.status='loading';
    loadPromise=(async()=>{
      try{
        const response=await fetch(MASTER_URL,{cache:'no-store'});
        if(!response.ok)throw new Error(`Family research master HTTP ${response.status}`);
        const master=await response.json();
        const ready=validateMaster(master);
        previewState.entries=ready;
        previewState.readyCount=ready.length;
        previewState.status='ready';previewState.error='';
        applyBindings();
        if(typeof render==='function')render();
        return true;
      }catch(err){
        previewState.status='error';previewState.mode='demo';previewState.error=err?.message||String(err);
        console.warn('HOY audited Family preview unavailable:',previewState.error);
        if(typeof render==='function')render();
        return false;
      }
    })();
    return loadPromise;
  }

  function badgeMarkup(p){
    const rows=api.primaryBadges?.(p,2)||[];
    return rows.length?`<div class="family240-card-badges">${rows.map(x=>`<span class="${escHtml(x.tone||'')}">${escHtml(x.label)}</span>`).join('')}</div>`:'';
  }

  function virtualListCard(p){
    return `<article class="list-card family240-research-card" data-open="${Number(p.id)}">
      <div class="list-art family240-research-art"><span>${escHtml(c().draftShort)}</span><small>${escHtml(c().notLive)}</small></div>
      <div><h3>${escHtml(p.name)}</h3><span class="family240-research-draft" data-family240-research-draft>${escHtml(c().draft)}</span><p>${escHtml(venueLabel(p.venue_type))} · ${escHtml(p.area)}</p>${badgeMarkup(p)}</div>
      <span class="family240-research-lock">${escHtml(c().preview)}</span>
    </article>`;
  }

  const baseListCardAudited=listCard;
  listCard=function(p){return p?.__family240_preview_profile===true?virtualListCard(p):baseListCardAudited(p)};

  function decorateAuditedPanel(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const f=api.familyFor?.(p);
    if(!f?.__family240_audited)return false;
    const panel=document.querySelector('#detail [data-family240-final-profile]');
    if(!panel)return false;
    panel.setAttribute('data-family240-audited-preview','');
    const proofLabel=api.proofLabel?.(f)||'';
    const badge=panel.querySelector('.family240-profile-head em');
    if(badge)badge.textContent=`${c().preview} · ${proofLabel}`;
    const proof=panel.querySelector('.family240-proof');
    if(proof){
      const source=f.source_url&&/^https:\/\//i.test(f.source_url)?`<a href="${escHtml(f.source_url)}" target="_blank" rel="noopener">${escHtml(c().source)}</a>`:escHtml(c().proof);
      proof.innerHTML=`${source}<small>${escHtml(c().proof)}</small>`;
    }
    return true;
  }

  function openResearchDraft(p){
    const d=document.getElementById('detail');
    const f=api.familyFor?.(p);
    const source=f?.source_url&&/^https:\/\//i.test(f.source_url)?`<a href="${escHtml(f.source_url)}" target="_blank" rel="noopener">${escHtml(c().source)}</a>`:'';
    d.innerHTML=`<div class="detail-top"><button class="round" data-close>${icons.back}</button><span class="family240-preview-badge">${escHtml(c().preview)}</span></div>
      <div class="family240-research-detail-art"><span>${escHtml(c().draftShort)}</span><small>${escHtml(c().notLive)}</small></div>
      <div class="detail-body"><div class="eyebrow">${escHtml(p.area)}</div><h2>${escHtml(p.name)}</h2><div class="meta">${escHtml(venueLabel(p.venue_type))}</div>
      <div class="family240-research-warning"><b>${escHtml(c().draftTitle)}</b><p>${escHtml(c().draftBody)}</p>${source}</div><div data-tab-content></div></div>`;
    d.showModal();
    d.querySelector('[data-close]').onclick=()=>d.close();
    hard.applyFinalProfile?.(p.id);
    decorateAuditedPanel(p.id);
  }

  const baseOpenDetailAudited=openDetail;
  openDetail=function(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    if(p?.__family240_preview_profile===true){openResearchDraft(p);return}
    baseOpenDetailAudited(id);
    decorateAuditedPanel(id);
  };

  const baseDiscoverAudited=discover;
  discover=function(){
    const html=baseDiscoverAudited();
    if(!enabled()||!activeFamily())return html;
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    const countNode=root.querySelector('[data-result-count]');
    const label=root.querySelector('[data-result-label]');
    const contextSub=root.querySelector('.family240-context-head small');
    const count=Number(countNode?.textContent||0);
    if(previewState.status==='ready'&&previewState.mode==='research'){
      if(label)label.textContent=`${count===1?c().auditedOne:c().auditedMany} · ${c().research}`;
      if(contextSub)contextSub.textContent=c().context;
    }else if(previewState.status==='loading'||previewState.status==='idle'){
      if(countNode)countNode.textContent='…';
      if(label)label.textContent=c().loading;
    }else if(previewState.status==='error'){
      if(label)label.textContent=`${count===1?c().demoOne:c().demoMany} · UI-${c().preview}`;
    }
    return root.outerHTML;
  };

  const baseRenderAudited=render;
  render=function(){
    if(enabled()){
      if(previewState.status==='ready')applyBindings();
      syncVirtualProfiles();
    }else removeVirtualProfiles();
    return baseRenderAudited();
  };

  function maybeResearchToast(){
    if(!enabled()||previewState.status!=='ready'||previewState.mode!=='research'||typeof toast!=='function')return;
    try{
      const key='hoy-family-audited-preview-toast-2401';
      if(sessionStorage.getItem(key)==='1')return;
      sessionStorage.setItem(key,'1');toast(c().toast);
    }catch{toast(c().toast)}
  }

  const baseWireAudited=wire;
  wire=function(){baseWireAudited();maybeResearchToast()};

  const baseInitCloudAudited=initCloud;
  initCloud=async function(){
    await baseInitCloudAudited();
    if(enabled()){
      await loadMaster();
      if(previewState.status==='ready'){applyBindings();syncVirtualProfiles();render()}
    }
  };

  if(enabled()){
    try{sessionStorage.setItem('hoy-family-preview-toast-240','1')}catch{}
    void loadMaster();
  }

  window.hoyFamilyAuditedPreview240={state:previewState,enabled,loadMaster,applyBindings,syncVirtualProfiles};
})();

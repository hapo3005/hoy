/* HOY 2.41.0 — research profile standard: premium base profile != Family publication permission.
   Preview-only. Reads inert research deltas and never writes to Supabase. */
(function(){
  if(window.__hoyFamilyResearchStandard241)return;
  window.__hoyFamilyResearchStandard241=true;

  const DELTA_URL='./data/family-research-delta-2026-08-17.json';
  const PROFILE_URL='./data/family-profile-batch2-2026-08-17.json';
  const audited=window.hoyFamilyAuditedPreview240;
  const enrichment=window.hoyFamilyProfileEnrichment240;
  const hard=window.hoyFamilyPlaygroundsHardening240;
  if(!audited||!enrichment||!hard)return;

  const standardState={status:'idle',error:'',promotions:[],profiles:[],bySlug:new Map(),applied:false,readyCount:0,virtualCount:0,lockedCount:0};
  let loadPromise=null;
  const enabled=()=>hard.isPreviewEnabled?.()===true;
  const safeUrl=v=>/^https:\/\//i.test(String(v||'').trim());

  function validateDelta(data){
    if(!data||data.production_import_allowed!==false)throw new Error('Family research delta must remain non-production');
    const rows=Array.isArray(data.promotions)?data.promotions:[];
    if(rows.length!==2)throw new Error(`Expected 2 Family promotions, got ${rows.length}`);
    if(new Set(rows.map(x=>x.slug)).size!==rows.length)throw new Error('Family promotion slugs must be unique');
    for(const row of rows){
      if(row.status!=='seed_ready'||row.verification!=='source_verified')throw new Error(`Invalid Family promotion gate: ${row.slug}`);
      if(!safeUrl(row.source_url)||!Array.isArray(row.evidence)||row.evidence.length<2)throw new Error(`Insufficient Family promotion provenance: ${row.slug}`);
      if(row.verification==='hoy_verified')throw new Error('Research delta cannot award hoy_verified');
    }
    return rows;
  }

  function validateProfiles(data,promotions){
    if(!data||data.production_import_allowed!==false)throw new Error('Profile batch must remain non-production');
    const rows=Array.isArray(data.profiles)?data.profiles:[];
    if(rows.length!==5)throw new Error(`Expected 5 batch-2 premium profiles, got ${rows.length}`);
    if(new Set(rows.map(x=>x.slug)).size!==rows.length)throw new Error('Batch-2 profile slugs must be unique');
    const promoted=new Set(promotions.map(x=>x.slug));
    for(const row of rows){
      if(row.profile_publication_allowed!==false)throw new Error(`Research profile cannot be production-published: ${row.slug}`);
      if(!row.name||!row.description||!row.address||!Array.isArray(row.sources)||!row.sources.length)throw new Error(`Incomplete premium base profile: ${row.slug}`);
      if(row.sources.some(s=>!safeUrl(s.url)))throw new Error(`Unsafe profile source URL: ${row.slug}`);
      if(promoted.has(row.slug)!==(row.family_publication_allowed===true))throw new Error(`Family publication gate mismatch: ${row.slug}`);
      if(row.family_publication_allowed!==true&&row.family_status!=='verification_required')throw new Error(`Blocked Family profile lacks verification_required: ${row.slug}`);
    }
    return rows;
  }

  async function fetchJson(url){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`${url} HTTP ${response.status}`);
    return response.json();
  }

  function applyPromotions(){
    if(!enabled()||standardState.status!=='ready'||audited.state?.status!=='ready')return false;
    const existing=new Set((audited.state.entries||[]).map(x=>x.slug));
    for(const row of standardState.promotions)if(!existing.has(row.slug)){audited.state.entries.push(row);existing.add(row.slug)}
    audited.state.readyCount=audited.state.entries.length;
    audited.applyBindings?.();
    audited.syncVirtualProfiles?.();
    standardState.readyCount=audited.state.readyCount;
    standardState.virtualCount=audited.state.virtualCount;
    standardState.lockedCount=standardState.profiles.filter(x=>x.family_publication_allowed!==true).length;
    standardState.applied=true;
    return true;
  }

  function showAccurateToast(){
    if(typeof toast!=='function'||!standardState.applied)return;
    try{
      const key='hoy-family-research-standard-toast-241';
      if(sessionStorage.getItem(key)==='1')return;
      sessionStorage.setItem(key,'1');
      const lang=state?.lang||'de';
      const message=lang==='en'
        ?'Family research preview · 19 audited entries; 15 are unpublished premium profile drafts.'
        :lang==='es'
          ?'Vista previa Family · 19 entradas auditadas; 15 son perfiles premium aún no publicados.'
          :'Family Research-Vorschau · 19 auditierte Einträge; 15 davon sind noch unveröffentlichte Premium-Profile.';
      toast(message);
    }catch{}
  }

  async function loadAndApply(){
    if(!enabled())return false;
    if(loadPromise)return loadPromise;
    standardState.status='loading';
    loadPromise=(async()=>{
      try{
        try{sessionStorage.setItem('hoy-family-audited-preview-toast-2401','1')}catch{}
        const [delta,profiles]=await Promise.all([fetchJson(DELTA_URL),fetchJson(PROFILE_URL)]);
        const promotions=validateDelta(delta);
        const rows=validateProfiles(profiles,promotions);
        standardState.promotions=promotions;
        standardState.profiles=rows;
        standardState.bySlug=new Map(rows.map(x=>[x.slug,x]));
        standardState.status='ready';standardState.error='';
        await audited.loadMaster?.();
        applyPromotions();
        if(typeof render==='function')render();
        showAccurateToast();
        return true;
      }catch(error){
        standardState.status='error';standardState.error=error?.message||String(error);
        console.warn('HOY Family research standard unavailable:',standardState.error);
        return false;
      }
    })();
    return loadPromise;
  }

  function profileFor(p){
    if(!p?.__family240_preview_profile||standardState.status!=='ready')return null;
    return standardState.bySlug.get(p.__family240_research_slug||p.slug)||null;
  }

  const baseOpenDetail=openDetail;
  openDetail=function(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const record=profileFor(p);
    if(record?.family_publication_allowed===true&&enrichment.renderProfile?.(p,record))return;
    return baseOpenDetail(id);
  };

  const baseRender=render;
  render=function(){
    if(enabled()&&standardState.status==='ready')applyPromotions();
    return baseRender();
  };

  const baseInitCloud=initCloud;
  initCloud=async function(){
    await baseInitCloud();
    if(enabled())await loadAndApply();
  };

  if(enabled())void loadAndApply();
  window.hoyFamilyResearchStandard241={state:standardState,loadAndApply,applyPromotions,profileFor};
})();

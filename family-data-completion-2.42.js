/* HOY 2.42.0 — Family data-completion sprint.
   Preview/read-only: closes researched profile gaps without writing to Supabase. */
(function(){
  if(window.__hoyFamilyDataCompletion242)return;
  window.__hoyFamilyDataCompletion242=true;

  const DATA_URL='./data/family-profile-completion-2026-08-17.json';
  const SOURCES_URL='./data/family-profile-completion-sources-2026-08-17.json';
  const hard=window.hoyFamilyPlaygroundsHardening240;
  const enrichment=window.hoyFamilyProfileEnrichment240;
  const standard=window.hoyFamilyResearchStandard241;
  if(!hard||!enrichment||!standard)return;

  const completion={status:'idle',error:'',data:null,provenance:null,liveBySlug:new Map(),patchBySlug:new Map(),sourcesBySlug:new Map(),liveOriginals:new Map(),loadedAt:0};
  let loadPromise=null;
  const enabled=()=>hard.isPreviewEnabled?.()===true;
  const familyContext=()=>enabled()&&state?.family==='family';
  const safeUrl=v=>/^https:\/\//i.test(String(v||'').trim());
  const deepMerge=(base,patch)=>({
    ...(base||{}),...(patch||{}),
    services:{...(base?.services||{}),...(patch?.services||{})},
    data_quality:{...(base?.data_quality||{}),...(patch?.data_quality||{})},
    socials:{...(base?.socials||{}),...(patch?.socials||{})}
  });

  function validate(data,provenance){
    if(!data||data.production_import_allowed!==false)throw new Error('Family completion must remain non-production');
    if(!provenance||provenance.production_import_allowed!==false)throw new Error('Family completion provenance must remain non-production');
    const live=Array.isArray(data.live_profiles)?data.live_profiles:[];
    const patches=Array.isArray(data.profile_patches)?data.profile_patches:[];
    const sourceRows=Array.isArray(provenance.sources)?provenance.sources:[];
    const gate=data.quality_gate||{};
    if(live.length!==4||patches.length!==15)throw new Error(`Expected 4 live + 15 research profile records, got ${live.length}+${patches.length}`);
    const slugs=[...live,...patches].map(x=>String(x.slug||'').trim());
    if(slugs.some(x=>!x)||new Set(slugs).size!==19)throw new Error('Completion slugs must cover exactly 19 unique Family profiles');
    if(gate.visible_family_profiles!==19||gate.release_ready!==13||gate.conditional!==5||gate.blocked!==1)throw new Error('Family completion quality gate mismatch');
    if(sourceRows.length!==15||new Set(sourceRows.map(x=>x.slug)).size!==15)throw new Error('Expected provenance for exactly 15 research profile patches');
    const sourceSlugs=new Set(sourceRows.map(x=>x.slug));
    for(const row of sourceRows){
      if(!Array.isArray(row.completion_sources)||!row.completion_sources.length)throw new Error(`Missing completion provenance: ${row.slug}`);
      if(row.completion_sources.some(s=>!safeUrl(s.url)||!s.authority||!Array.isArray(s.supports)||!s.supports.length))throw new Error(`Invalid completion provenance: ${row.slug}`);
    }
    for(const row of live){
      if(row.publication_state!=='live'||!row.restaurant_id||!row.name||!row.description||!row.address||!row.phone)throw new Error(`Incomplete live completion profile: ${row.slug}`);
      if(!Array.isArray(row.sources)||!row.sources.length||row.sources.some(s=>!safeUrl(s.url)))throw new Error(`Missing live provenance: ${row.slug}`);
    }
    for(const row of patches){
      if(!sourceSlugs.has(row.slug))throw new Error(`Patch has no completion provenance: ${row.slug}`);
      if(!row.data_quality?.profile_status||!row.data_quality?.hours_status)throw new Error(`Missing completion status: ${row.slug}`);
      if(row.data_quality.profile_status==='release_ready'&&Object.values(row.services||{}).includes('unknown'))throw new Error(`Release-ready profile keeps unresolved service truth: ${row.slug}`);
    }
    return {data,provenance,sourceRows};
  }

  function patchResearchStates(){
    const apply=(target)=>{
      if(!target||!Array.isArray(target.profiles))return;
      target.profiles=target.profiles.map(row=>{
        const patch=completion.patchBySlug.get(row.slug);
        return patch?deepMerge(row,patch):row;
      });
      target.bySlug=new Map(target.profiles.map(row=>[row.slug,row]));
    };
    apply(enrichment.state);
    apply(standard.state);
  }

  function patchLiveMemory(){
    if(!familyContext())return;
    for(const row of completion.liveBySlug.values()){
      const p=(DATA||[]).find(x=>String(x.slug||'')===row.slug||Number(x.id)===Number(row.restaurant_id));
      if(!p)continue;
      if(!completion.liveOriginals.has(Number(p.id))){
        completion.liveOriginals.set(Number(p.id),{
          description:p.description,website:p.website,phone:p.phone,hours_text:p.hours_text,
          profile_quality:p.profile_quality,__family242_completion:p.__family242_completion
        });
      }
      p.description=row.description;
      p.website=row.website||p.website;
      p.phone=row.phone||p.phone;
      p.hours_text=row.hours;
      p.profile_quality='premium';
      p.__family242_completion=true;
    }
  }

  function restoreLiveMemory(){
    if(familyContext()||!completion.liveOriginals.size)return;
    for(const [id,original] of completion.liveOriginals){
      const p=(DATA||[]).find(x=>Number(x.id)===id);
      if(!p)continue;
      p.description=original.description;p.website=original.website;p.phone=original.phone;
      p.hours_text=original.hours_text;p.profile_quality=original.profile_quality;
      if(original.__family242_completion===undefined)delete p.__family242_completion;
      else p.__family242_completion=original.__family242_completion;
    }
    completion.liveOriginals.clear();
  }

  const LABELS={
    de:{reservation:'Reservierung',pickup:'Abholung',delivery:'Lieferung',available:'Möglich',unavailable:'Nicht angeboten',not_published:'Nicht öffentlich angegeben',not_applicable:'Nicht relevant',unknown:'Noch ungeklärt',live:'LIVE',profile:'HOY PROFIL',profileStatus:'Profilstatus',livePublished:'Live veröffentlicht',ready:'Kernprofil vollständig geprüft',conditional:'Kernprofil geprüft · Zeitdaten eingeschränkt',blocked:'Direkte Bestätigung erforderlich',liveBody:'Die zentralen Profilangaben sind redaktionell geprüft. Zeitabhängige Angaben werden nur präzise gezeigt, wenn die Quellenlage belastbar ist.',readyBody:'Die zentralen Profilfelder sind geprüft. Nicht veröffentlichte Services werden als solche gekennzeichnet; offene Family-Details bleiben davon getrennt.',conditionalBody:'Ein aktueller Quellenkonflikt verhindert bewusst eine scheinpräzise Zeitangabe. Die übrigen Kerninformationen sind geprüft.',blockedBody:'Mindestens ein materieller Identitäts-, Kontakt- oder Zeitkonflikt muss direkt geklärt werden, bevor dieses Profil veröffentlicht werden sollte.',quality:'Datenqualität'},
    en:{reservation:'Reservation',pickup:'Pickup',delivery:'Delivery',available:'Available',unavailable:'Not offered',not_published:'Not publicly listed',not_applicable:'Not applicable',unknown:'Unresolved',live:'LIVE',profile:'HOY PROFILE',profileStatus:'Profile status',livePublished:'Published live',ready:'Core profile fully checked',conditional:'Core profile checked · time data limited',blocked:'Direct confirmation required',liveBody:'Core profile facts are editorially checked. Time-sensitive information is only shown precisely when the evidence is reliable.',readyBody:'Core profile fields are checked. Services that are not publicly listed are labelled as such; open Family details stay separate.',conditionalBody:'A current source conflict deliberately prevents false time precision. The remaining core information is checked.',blockedBody:'At least one material identity, contact or hours conflict needs direct confirmation before this profile should be published.',quality:'Data quality'},
    es:{reservation:'Reserva',pickup:'Recogida',delivery:'Entrega',available:'Disponible',unavailable:'No ofrecido',not_published:'No publicado',not_applicable:'No aplicable',unknown:'Sin resolver',live:'EN VIVO',profile:'PERFIL HOY',profileStatus:'Estado del perfil',livePublished:'Publicado',ready:'Perfil base completamente revisado',conditional:'Perfil revisado · horario limitado',blocked:'Confirmación directa necesaria',liveBody:'Los datos centrales del perfil están revisados editorialmente. La información temporal solo se muestra con precisión cuando la evidencia es fiable.',readyBody:'Los campos centrales están revisados. Los servicios no publicados se marcan como tales; los detalles Family pendientes permanecen separados.',conditionalBody:'Un conflicto actual entre fuentes evita deliberadamente una falsa precisión horaria. El resto de datos centrales está revisado.',blockedBody:'Debe resolverse directamente al menos un conflicto material de identidad, contacto u horario antes de publicar este perfil.',quality:'Calidad de datos'}
  };
  const copy=()=>LABELS[state?.lang||'de']||LABELS.de;
  const serviceText=v=>copy()[v]||copy().unknown;

  function recordFor(p){
    if(!p)return null;
    const slug=p.__family240_research_slug||p.slug;
    return completion.liveBySlug.get(slug)||standard.state?.bySlug?.get(slug)||enrichment.state?.bySlug?.get(slug)||null;
  }

  function appendFact(container,label,value){
    if(!container||!value)return;
    const row=document.createElement('div');row.className='family240-enriched-fact family242-extra-fact';
    const s=document.createElement('span');s.textContent=label;
    const b=document.createElement('b');b.textContent=value;
    row.append(s,b);container.appendChild(row);
  }

  function polish(record){
    const d=document.getElementById('detail');
    const root=d?.querySelector('[data-family240-enriched-profile]');
    if(!root||!record)return;
    root.dataset.family242Quality=record.data_quality?.profile_status||'';
    const q=record.data_quality?.profile_status||'conditional';
    const status=root.querySelector('.family240-enriched-status');
    const live=record.publication_state==='live';
    const badge=root.querySelector('.family240-enriched-preview');
    const brandSmall=root.querySelector('.family240-enriched-hero-brand small');
    if(live){if(badge)badge.textContent=copy().live;if(brandSmall)brandSmall.textContent=copy().profile;}
    const small=status?.querySelector('small'),title=status?.querySelector('h3'),body=status?.querySelector('p');
    if(small)small.textContent=copy().quality;
    if(title)title.textContent=q==='blocked'?copy().blocked:q==='conditional'?copy().conditional:copy().ready;
    if(body)body.textContent=live?copy().liveBody:q==='blocked'?copy().blockedBody:q==='conditional'?copy().conditionalBody:copy().readyBody;

    const overview=root.querySelector('#family240-enriched-overview .family240-enriched-facts');
    if(overview){
      const serviceMap={reservation:copy().reservation,pickup:copy().pickup,delivery:copy().delivery};
      for(const [key,label] of Object.entries(serviceMap)){
        const row=[...overview.querySelectorAll('.family240-enriched-fact')].find(x=>x.querySelector('span')?.textContent.trim()===label);
        if(row?.querySelector('b'))row.querySelector('b').textContent=serviceText(record.services?.[key]);
      }
    }
    const info=root.querySelector('#family240-enriched-info .family240-enriched-facts');
    if(info){
      if(live){
        const profileStatus=[...info.querySelectorAll('.family240-enriched-fact')].find(x=>x.querySelector('span')?.textContent.trim()===copy().profileStatus);
        if(profileStatus?.querySelector('b'))profileStatus.querySelector('b').textContent=copy().livePublished;
      }
      if(!info.querySelector('.family242-extra-fact')){
        if(record.secondary_phone)appendFact(info,state?.lang==='en'?'Additional phone':state?.lang==='es'?'Teléfono adicional':'Weiteres Telefon',record.secondary_phone);
        if(record.socials?.instagram_handle)appendFact(info,'Instagram',record.socials.instagram_handle);
      }
    }
  }

  async function fetchJson(url){
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`${url} HTTP ${response.status}`);
    return response.json();
  }

  async function loadAndApply(){
    if(!enabled())return false;
    if(loadPromise)return loadPromise;
    completion.status='loading';
    loadPromise=(async()=>{
      try{
        await Promise.all([enrichment.load?.(),standard.loadAndApply?.()]);
        const [dataRaw,provenanceRaw]=await Promise.all([fetchJson(DATA_URL),fetchJson(SOURCES_URL)]);
        const {data,provenance,sourceRows}=validate(dataRaw,provenanceRaw);
        completion.data=data;completion.provenance=provenance;
        completion.liveBySlug=new Map(data.live_profiles.map(x=>[x.slug,x]));
        completion.patchBySlug=new Map(data.profile_patches.map(x=>[x.slug,x]));
        completion.sourcesBySlug=new Map(sourceRows.map(x=>[x.slug,x.completion_sources]));
        patchResearchStates();
        completion.status='ready';completion.error='';completion.loadedAt=Date.now();
        if(typeof render==='function')render();
        return true;
      }catch(error){
        completion.status='error';completion.error=error?.message||String(error);
        console.warn('HOY Family data completion unavailable:',completion.error);
        return false;
      }
    })();
    return loadPromise;
  }

  const baseOpenDetail=openDetail;
  openDetail=function(id){
    if(enabled()&&completion.status==='ready'){
      patchResearchStates();
      if(familyContext())patchLiveMemory();else restoreLiveMemory();
      const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
      const live=familyContext()&&p&&completion.liveBySlug.get(p.slug);
      if(live&&enrichment.renderProfile?.(p,live)){polish(live);return;}
    }
    const result=baseOpenDetail(id);
    if(enabled()&&completion.status==='ready'){
      const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
      if(p?.__family240_preview_profile)polish(recordFor(p));
    }
    return result;
  };

  const baseRender=render;
  render=function(){
    if(enabled()&&completion.status==='ready'){
      patchResearchStates();
      if(familyContext())patchLiveMemory();else restoreLiveMemory();
    }
    return baseRender();
  };

  if(enabled())void loadAndApply();
  window.hoyFamilyDataCompletion242={state:completion,loadAndApply,recordFor,polish,restoreLiveMemory};
})();
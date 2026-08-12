/* HOY 2.34.0 — official menu source truth: embed complete operator menus, never claim "no menu" when an official source exists */
(function(){
  if(window.__hoyMenuSourceTruth2340)return;
  window.__hoyMenuSourceTruth2340=true;
  window.hoyMenuSourceTruthVersion='2.34.0';

  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const clean234=v=>String(v??'').trim();
  const safeHttps234=v=>/^https:\/\//i.test(clean234(v))?clean234(v):'';
  const sourceDate234=s=>clean234(s?.completeness_checked_at||s?.last_checked_at).slice(0,10);
  const scopeWeight234=s=>({full_menu:100,food:90,dinner:70,lunch:70,breakfast:60,tasting:50,day_menu:40}[clean234(s?.coverage_scope)]||0);

  function payload234(source){
    const p=source?.display_payload&&typeof source.display_payload==='object'?source.display_payload:{};
    return {
      mode:clean234(p.mode),
      embedUrl:safeHttps234(p.embed_url),
      fallbackUrl:safeHttps234(p.fallback_url)||safeHttps234(source?.source_url),
      provider:clean234(p.provider),
      title:clean234(p.title)||clean234(source?.source_label)||'Offizielle Speisekarte'
    };
  }

  function officialMenuSource234(rows){
    return [...rows]
      .filter(s=>s?.is_official!==false&&CORE_SCOPES.has(clean234(s.coverage_scope)))
      .sort((a,b)=>scopeWeight234(b)-scopeWeight234(a)||String(sourceDate234(b)).localeCompare(String(sourceDate234(a))))[0]||null;
  }

  async function reconcile234(){
    if(!sb)return;
    const {data,error}=await sb.from('menu_sources').select('id,restaurant_id,source_url,source_label,last_checked_at,is_official,coverage_scope,completeness_status,completeness_checked_at,display_payload,coverage_meta').eq('is_official',true);
    if(error){console.warn('HOY official menu-source truth unavailable',error);return}

    const byRestaurant=new Map();
    for(const source of data||[]){
      const id=Number(source.restaurant_id);
      if(!byRestaurant.has(id))byRestaurant.set(id,[]);
      byRestaurant.get(id).push(source);
    }

    let embedded=0,sourceOnlyFallbacks=0;
    for(const [id,sources] of byRestaurant){
      const primary=officialMenuSource234(sources);
      if(!primary)continue;
      const p=payload234(primary),current=MENUS[id]||{};
      const provenance=[...new Set([...(current.provenanceUrls||[]),safeHttps234(primary.source_url)].filter(Boolean))];
      const completeEmbed=clean234(primary.completeness_status)==='complete'&&p.mode==='official_embed'&&p.embedUrl;

      if(completeEmbed){
        MENUS[id]={...current,status:'structured',integrity:'embed_complete',displayMode:'official_embed',embedUrl:p.embedUrl,fallbackUrl:p.fallbackUrl,provider:p.provider,label:p.title,checked:sourceDate234(primary)||current.checked||'',source:null,provenanceUrls:provenance,cloud:true,localized:false,locale:null,translationStatus:null,languageCoverage:null};
        embedded++;
        continue;
      }

      if(clean234(primary.completeness_status)==='source_only'&&p.fallbackUrl){
        MENUS[id]={...current,status:'source_only',integrity:'source_only',officialMenuUrl:p.fallbackUrl,label:p.title,checked:sourceDate234(primary)||current.checked||'',source:null,provenanceUrls:provenance,cloud:true};
        sourceOnlyFallbacks++;
      }
    }

    window.hoyMenuSourceTruth234={embedded,sourceOnlyFallbacks,loadedAt:Date.now()};
    window.dispatchEvent(new CustomEvent('hoy:menu-source-truth-ready',{detail:{embedded,sourceOnlyFallbacks,at:Date.now()}}));
  }

  const baseLoadCloudMenus234=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus234();
    try{await reconcile234()}catch(error){console.warn('HOY official menu-source reconciliation failed',error)}
  };

  const baseMenuStatusLabel234=menuStatusLabel;
  menuStatusLabel=function(m){
    if(m?.integrity==='embed_complete')return 'Offizielle Speisekarte in HOY';
    if(m?.integrity==='source_only'&&m?.officialMenuUrl)return 'Offizielle Speisekarte verfügbar';
    return baseMenuStatusLabel234(m);
  };

  function embedPanel234(m){
    const label=esc(m.label||'Offizielle Betreiberkarte'),provider=m.provider?` · ${esc(m.provider)}`:'';
    const fallback=m.fallbackUrl?`<a class="menu234-fallback" href="${esc(m.fallbackUrl)}" target="_blank" rel="noopener noreferrer">Offizielle Karte separat öffnen <span aria-hidden="true">↗</span></a>`:'';
    return `<div class="menu-panel menu234-panel"><div class="menu-status"><div class="top"><b>Offizielle Speisekarte in HOY</b><span class="pill good">Vollständig</span></div><small>${label}${provider}${m.checked?' · geprüft '+esc(m.checked):''}</small></div><div class="menu234-trust"><div><small>BETREIBERQUELLE</small><b>Direkt eingebunden, nicht nachgebaut.</b></div><p>HOY zeigt die digitale Originalkarte des Restaurants. Änderungen des Betriebs erscheinen dadurch ohne abgeschriebene Zwischenversion.</p></div><div class="menu234-frame-shell"><iframe class="menu234-frame" src="${esc(m.embedUrl)}" title="${label}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" allow="camera 'none'; microphone 'none'; geolocation 'none'"></iframe></div>${fallback}</div>`;
  }

  function sourceFallbackPanel234(m){
    const checked=m.checked?` · geprüft ${esc(m.checked)}`:'';
    return `<div class="menu-panel menu234-panel"><div class="menu-status"><div class="top"><b>Offizielle Speisekarte verfügbar</b><span class="pill warn">Integration offen</span></div><small>${esc(m.label||'Offizielle Betreiberquelle')}${checked}</small></div><div class="menu234-source-fallback"><small>QUALITÄTS-FALLBACK</small><h4>Die Karte existiert – HOY darf hier nicht „keine Karte“ behaupten.</h4><p>Bis diese Betreiberkarte vollständig innerhalb von HOY dargestellt wird, führt dieser einzige Fallback direkt zur offiziellen Quelle.</p><a href="${esc(m.officialMenuUrl)}" target="_blank" rel="noopener noreferrer">Offizielle Speisekarte öffnen <span aria-hidden="true">↗</span></a></div></div>`;
  }

  const baseMenuPanel234=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.integrity==='embed_complete'&&safeHttps234(m.embedUrl))return embedPanel234(m);
    if(m?.integrity==='source_only'&&safeHttps234(m.officialMenuUrl))return sourceFallbackPanel234(m);
    return baseMenuPanel234(p);
  };

  window.hoyOfficialMenuSource234For=p=>p?menuFor(p):null;
})();

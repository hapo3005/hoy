/* HOY Control 2.25.0 — official menu-source release gate */
(function(){
  if(window.__hoyAdminMenuSourceTruth225)return;
  window.__hoyAdminMenuSourceTruth225=true;
  window.hoyAdminMenuSourceTruthVersion='2.25.0';

  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const clean225=v=>String(v??'').trim();
  const safeHttps225=v=>/^https:\/\//i.test(clean225(v))?clean225(v):'';
  const payload225=s=>s?.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};
  const coreOfficial225=s=>s?.is_official!==false&&CORE_SCOPES.has(clean225(s.coverage_scope));
  const isEmbedded225=s=>clean225(s?.__hoyOriginalCompleteness225||s?.completeness_status)==='complete'&&clean225(payload225(s).mode)==='official_embed'&&!!safeHttps225(payload225(s).embed_url);
  const imagePages225=s=>Array.isArray(payload225(s).pages)?payload225(s).pages.filter(p=>safeHttps225(typeof p==='string'?p:p?.url)):[];
  const sourceItemCount225=s=>(state.menuItems||[]).filter(i=>String(i.source_id||'')===String(s.id)&&i.is_active!==false).length;
  const renderable225=s=>{
    if(s?.__hoyEmbedded225||isEmbedded225(s))return true;
    const status=clean225(s.completeness_status);
    if(status==='image_complete')return imagePages225(s).length>0;
    if(status==='complete')return sourceItemCount225(s)>0;
    return false;
  };

  function normalizeEmbedded225(){
    for(const s of state.menuSources||[]){
      if(!isEmbedded225(s)||s.__hoyEmbedded225)continue;
      s.__hoyEmbedded225=true;
      s.__hoyOriginalCompleteness225=s.completeness_status;
      // The 2.23 integrity engine already treats image_complete as a complete in-app representation.
      // Normalize only in Control's in-memory view; production DB remains semantically `complete` + display_payload.mode=official_embed.
      s.completeness_status='image_complete';
    }
  }

  function sourceCovered225(target,sources){
    const targetScope=clean225(target.coverage_scope);
    return sources.some(s=>{
      if(s===target||!renderable225(s))return false;
      const scope=clean225(s.coverage_scope);
      return scope==='full_menu'||scope===targetScope;
    });
  }

  function unresolved225(sources){
    const out=[];
    for(const s of sources){
      const status=clean225(s.completeness_status);
      if(s.__hoyEmbedded225||isEmbedded225(s))continue;
      if(status==='source_only'&&!sourceCovered225(s,sources))out.push(s);
      if(status==='complete'&&!renderable225(s))out.push(s);
      if(status==='image_complete'&&!renderable225(s))out.push(s);
    }
    return out;
  }

  function blockerRows225(){
    const published=new Set((state.restaurants||[]).filter(r=>r.is_published).map(r=>Number(r.id)));
    const byRestaurant=new Map();
    for(const s of state.menuSources||[]){
      const id=Number(s.restaurant_id);if(!published.has(id)||!coreOfficial225(s))continue;
      if(!byRestaurant.has(id))byRestaurant.set(id,[]);byRestaurant.get(id).push(s);
    }
    const out=[];
    for(const [id,sources] of byRestaurant){
      const r=rById(id);if(!r)continue;
      const open=unresolved225(sources);
      if(!open.length)continue;
      const primary=[...open].sort((a,b)=>{
        const af=clean225(a.coverage_scope)==='full_menu'?1:0,bf=clean225(b.coverage_scope)==='full_menu'?1:0;
        return bf-af||clean225(a.coverage_scope).localeCompare(clean225(b.coverage_scope));
      })[0];
      out.push({r,source:primary,all:open});
    }
    return out.sort((a,b)=>{
      const aCore=['La Manga del Mar Menor','Cabo de Palos'].includes(String(a.r.area||''))?1:0;
      const bCore=['La Manga del Mar Menor','Cabo de Palos'].includes(String(b.r.area||''))?1:0;
      return bCore-aCore||a.r.name.localeCompare(b.r.name,'de');
    });
  }
  window.hoyAdminMenuSourceBlockers225=blockerRows225;

  function refreshGate225(){
    const blockers=blockerRows225();
    window.hoyMenuSourceReleaseGate225={ok:blockers.length===0,count:blockers.length,restaurantIds:blockers.map(x=>Number(x.r.id)),checkedAt:Date.now()};
    return blockers;
  }

  const baseLoadData225=loadData;
  loadData=async function(){
    await baseLoadData225();
    normalizeEmbedded225();
    refreshGate225();
  };

  function decorate225(){
    if(state.view!=='menu_integrity')return;
    const head=root.querySelector('.page-head');if(!head||root.querySelector('[data-ms225-gate]'))return;
    const blockers=refreshGate225();
    const embedded=(state.menuSources||[]).filter(s=>s.__hoyEmbedded225);
    const blockerHtml=blockers.length?`<div class="ms225-gate danger" data-ms225-gate><div><small>RELEASE-BLOCKER</small><strong>${blockers.length} veröffentlichte Betriebe besitzen eine offizielle Menüquelle, die HOY noch nicht vollständig darstellt.</strong><p>Das ist ab sofort kein akzeptierter Endzustand. „Quelle gefunden“ zählt nicht als fertige Speisekarte.</p></div><span>${blockers.length}</span></div><section class="panel ms225-panel"><div class="panel-head"><h2>Offizielle Karte vorhanden · Integration fehlt</h2><small>muss auf 0</small></div><div class="ms225-list">${blockers.slice(0,12).map(x=>`<article><div><b>${esc(x.r.name)}</b><small>${esc(x.r.area)} · ${esc(x.source.source_label||'Offizielle Karte')} · ${esc(x.source.coverage_scope||'full_menu')} · ${esc(x.source.completeness_status||'Quelle')}</small></div>${safeHttps225(x.source.source_url)?`<a href="${esc(x.source.source_url)}" target="_blank" rel="noopener noreferrer">Quelle ↗</a>`:''}<button class="ghost" data-edit="${Number(x.r.id)}">Profil</button></article>`).join('')}</div></section>`:`<div class="ms225-gate good" data-ms225-gate><div><small>RELEASE-GATE</small><strong>Keine veröffentlichte offizielle Vollkartenquelle bleibt nur als Link liegen.</strong><p>Strukturiert, vollständige In-App-Seiten oder verifizierte Betreiber-Einbettung.</p></div><span>✓</span></div>`;
    head.insertAdjacentHTML('afterend',blockerHtml);

    if(embedded.length){
      const names=new Set(embedded.map(s=>clean225(rById(s.restaurant_id)?.name).toLowerCase()).filter(Boolean));
      root.querySelectorAll('[data-mi223-row]').forEach(row=>{
        const search=clean225(row.dataset.search).toLowerCase();
        if(![...names].some(n=>search.includes(n)))return;
        const status=row.querySelector('.mi223-status'),detail=row.querySelector('.mi223-detail');
        if(status)status.textContent='Live-Karte in HOY';
        if(detail)detail.textContent='Offizielle digitale Betreiberkarte vollständig direkt eingebettet';
      });
    }
  }

  const baseRender225=render;
  render=function(){const result=baseRender225();decorate225();return result};

  const baseQualityInfo225=qualityInfo;
  qualityInfo=function(r){
    const q=baseQualityInfo225(r),blocked=blockerRows225().some(x=>Number(x.r.id)===Number(r?.id));
    if(!blocked)return q;
    return {score:Math.max(0,q.score-15),missing:[...new Set([...q.missing,'Offizielle Speisekarte in HOY'])]};
  };
})();

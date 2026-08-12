/* HOY Control 2.31.0 — exact food-menu coverage: completeness + source authority */
(function(){
  if(window.__hoyAdminMenuCoverage231)return;
  window.__hoyAdminMenuCoverage231=true;
  window.hoyAdminMenuCoverageVersion='2.31.0';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const TRUSTED=new Set(['first_party','operator_social','authorized_transactional','verified_public_snapshot']);
  const COMPLETE=new Set(['complete','image_complete']);
  const KNOWN=new Set(['partial','source_only','insufficient']);
  const clean=v=>String(v??'').trim();
  const sourceAuthority=s=>clean(s?.source_authority)||(s?.is_official===false?'unverified_third_party':'first_party');
  const expectsFood=r=>clean(r?.menu_expectation)==='food'||(!clean(r?.menu_expectation)&&['restaurant','chiringuito','beach_club'].includes(clean(r?.venue_type)));
  const sourcesFor=id=>(state.menuSources||[]).filter(s=>Number(s.restaurant_id)===Number(id)&&CORE_SCOPES.has(clean(s.coverage_scope))&&TRUSTED.has(sourceAuthority(s)));
  const usable=id=>sourcesFor(id).find(s=>COMPLETE.has(clean(s.completeness_status)))||null;
  const known=id=>sourcesFor(id).find(s=>KNOWN.has(clean(s.completeness_status)))||null;
  const foodRows=()=> (state.restaurants||[]).filter(r=>r.is_published&&CORE_AREAS.has(clean(r.area))&&expectsFood(r));
  const metrics=()=>{const rows=foodRows(),ready=rows.filter(r=>usable(r.id)).length,sourceKnown=rows.filter(r=>!usable(r.id)&&known(r.id)).length;return{total:rows.length,ready,open:rows.length-ready,sourceKnown,noSource:rows.length-ready-sourceKnown}};
  window.hoyAdminFoodMenuCoverage231=metrics;

  function authorityLabel(s){return({first_party:'Betreiberquelle',operator_social:'Betreiber-Social',authorized_transactional:'Bestellkarte',verified_public_snapshot:'öffentlich verifizierter Snapshot'})[sourceAuthority(s)]||'Quelle'}
  function sourceEvidence(s){if(!s)return'';const a=sourceAuthority(s);if(a==='verified_public_snapshot')return 'vollständige Essenskarte · öffentlich verifizierter Snapshot · nicht Betreiber-bestätigt';if(a==='authorized_transactional')return 'vollständige aktuelle Bestellkarte · Vor-Ort-Angebot kann abweichen';if(a==='operator_social')return 'vollständige Betreiberkarte · offizieller Social-Kanal';return clean(s.source_label)||'vollständige Betreiberkarte'}

  function restaurantForWorkbenchRow(row){
    const name=clean(row.querySelector('td b')?.textContent),areaText=clean(row.querySelector('td small')?.textContent);
    return (state.restaurants||[]).find(r=>clean(r.name)===name&&(!areaText||areaText.includes(clean(r.area))))||(state.restaurants||[]).find(r=>clean(r.name)===name)||null;
  }

  function patchWorkbench(){
    const panel=document.getElementById('mwb230');if(!panel)return;
    const m=metrics(),kpis=panel.querySelector('.mwb230-kpis');
    if(kpis)kpis.innerHTML=`<div><b>${m.ready}/${m.total}</b><span>Essenskarten nutzbar</span></div><div><b>${m.open}</b><span>echte Food-Lücken</span></div><div><b>${m.sourceKnown}</b><span>Quelle bekannt · noch offen</span></div><div><b>${m.noSource}</b><span>ohne vertrauenswürdige Quelle</span></div>`;
    const kicker=panel.querySelector('.mwb230-head small');if(kicker)kicker.textContent='CORE FOOD MENU WORKBENCH · LA MANGA + CABO';
    const intro=panel.querySelector('.mwb230-head p');if(intro)intro.textContent='Zielgröße sind ausschließlich veröffentlichte Betriebe, bei denen eine Essenskarte erwartet wird. HOY trennt Vollständigkeit und Quellenautorität; Bars/Nightlife ohne Food-Erwartung verzerren diese Quote nicht mehr.';

    panel.querySelectorAll('[data-mwb230-row]').forEach(row=>{
      const r=restaurantForWorkbenchRow(row);if(!r)return;
      if(!expectsFood(r)){row.hidden=true;return}
      row.hidden=false;
      const s=usable(r.id);if(!s)return;
      row.dataset.lane='ready';
      const lane=row.querySelector('.mwb230-lane');if(lane){lane.className='mwb230-lane good';lane.textContent='In HOY nutzbar'}
      const evidence=row.querySelector('td:nth-child(3) small');if(evidence)evidence.textContent=sourceEvidence(s);
      const next=row.querySelector('.mwb230-next');if(next)next.textContent=`Quellentyp: ${authorityLabel(s)} · Aktualität weiter überwachen`;
      const action=row.querySelector('td:last-child');if(action)action.innerHTML='<span class="mwb230-done">✓</span>';
    });
  }

  function patchAutoDiscovery(){
    const panel=document.getElementById('mad228Panel');if(!panel)return;const m=metrics(),status=panel.querySelector('.mad228-status');
    if(status)status.innerHTML=`<div class="mad228-stat"><b>${m.ready}/${m.total}</b><span>vollständig nutzbare Essenskarten</span></div><div class="mad228-stat"><b>${m.open}</b><span>echte Food-Lücken</span></div><div class="mad228-stat"><b>${m.sourceKnown}</b><span>Quelle bekannt · Integration offen</span></div><div class="mad228-stat"><b>${m.noSource}</b><span>ohne vertrauenswürdige Quelle</span></div>`;
  }

  function mount(){if(state.view!=='menu_discovery'||!state.user||!state.admin)return;patchAutoDiscovery();patchWorkbench()}
  const baseRender=render;
  render=function(){const out=baseRender();queueMicrotask(mount);return out};
})();

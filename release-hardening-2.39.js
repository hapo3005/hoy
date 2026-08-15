/* HOY 2.39.0 — release hardening for deterministic guest reset behavior and service trust */
(function(){
  if(window.__hoyReleaseHardening239)return;
  window.__hoyReleaseHardening239=true;

  // Search refreshes can replace reset controls after the decision layer has wired them.
  // Capture the reset intent before any older per-node handler runs so the time/moment
  // filter can never survive a user-visible "Zurücksetzen" action.
  document.addEventListener('click',event=>{
    const reset=event.target?.closest?.('[data-consumer-reset],[data-decision-reset],[data-reset-to-discover]');
    if(!reset||typeof state!=='object'||!state)return;
    state.moment='all';
    state.query='';
    state.service='all';
    state.decision='all';
  },true);

  // Seed/service research may know a possible service path without an operator confirmation.
  // Guest surfaces must not turn that into a promise. Only a row with confirmed_at may expose
  // available/unavailable as a definite state; everything else fails closed to "Prüfen".
  // The underlying research state is retained only for discovery candidates so the guest can
  // still reach a venue and verify by phone instead of receiving an empty filter result.
  const trustedServiceValue=(rawState,confirmedAt)=>legacyService(confirmedAt?rawState:'unknown');
  const researchServiceValue=rawState=>legacyService(rawState);
  const researchServiceState=(p,kind)=>serviceState(p?.service_research?.[kind]||'');
  const serviceCandidate=(p,kind)=>effectiveServiceState(p,kind)==='available'||researchServiceState(p,kind)==='available';
  const confirmedServiceExists=kind=>(DATA||[]).some(p=>effectiveServiceState(p,kind)==='available');
  window.hoyServiceTrust239={trustedServiceValue,researchServiceValue,researchServiceState,serviceCandidate,confirmedServiceExists};

  const baseLoadCloudRestaurants239=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurants239();
    if(!sb||!Array.isArray(DATA)||!DATA.length)return;

    let rows=[];
    try{
      const {data,error}=await sb.from('restaurant_services')
        .select('restaurant_id,reservation_state,pickup_state,delivery_state,confirmed_at');
      if(error)throw error;
      rows=data||[];
    }catch(err){
      console.warn('HOY service confirmation unavailable; failing closed',err);
    }

    const byRestaurant=new Map(rows.map(row=>[Number(row.restaurant_id),row]));
    DATA=DATA.map(p=>{
      const svc=byRestaurant.get(Number(p.id))||null;
      const confirmedAt=svc?.confirmed_at||null;
      const research={
        reservation:researchServiceValue(svc?.reservation_state),
        pickup:researchServiceValue(svc?.pickup_state),
        delivery:researchServiceValue(svc?.delivery_state)
      };
      return {
        ...p,
        reservation:trustedServiceValue(svc?.reservation_state,confirmedAt),
        pickup:trustedServiceValue(svc?.pickup_state,confirmedAt),
        delivery:trustedServiceValue(svc?.delivery_state,confirmedAt),
        service_research:research,
        service_confirmed_at:confirmedAt,
        service_trust:confirmedAt?'confirmed':'unconfirmed'
      };
    });
  };

  // Preserve useful discovery without presenting research-only availability as confirmed.
  const baseFiltered239=filtered;
  filtered=function(){
    if(!['reservation','pickup','delivery'].includes(state.service))return baseFiltered239();
    const q=state.query.trim().toLowerCase(),kind=state.service;
    return (DATA||[]).filter(p=>(
      !q||[p.name,p.area,p.meta,p.description].join(' ').toLowerCase().includes(q)
    )&&serviceCandidate(p,kind));
  };

  function patchServiceFilterLabels(html,attribute){
    const root=document.createElement('div');root.innerHTML=html;
    const labels={reservation:'Reservierung prüfen',pickup:'Abholung prüfen',delivery:'Lieferung prüfen'};
    for(const kind of Object.keys(labels)){
      if(confirmedServiceExists(kind))continue;
      const button=root.querySelector(`[${attribute}="${kind}"]`);if(!button)continue;
      const text=[...button.childNodes].reverse().find(node=>node.nodeType===Node.TEXT_NODE);
      if(text)text.textContent=labels[kind];
    }
    return root.firstElementChild?.outerHTML||html;
  }

  const baseHomeService239=home;
  home=function(){return patchServiceFilterLabels(baseHomeService239(),'data-service')};
  const baseDiscoverService239=discover;
  discover=function(){return patchServiceFilterLabels(baseDiscoverService239(),'data-filter')};
})();

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
  const trustedServiceValue=(rawState,confirmedAt)=>legacyService(confirmedAt?rawState:'unknown');
  window.hoyServiceTrust239={trustedServiceValue};

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
      return {
        ...p,
        reservation:trustedServiceValue(svc?.reservation_state,confirmedAt),
        pickup:trustedServiceValue(svc?.pickup_state,confirmedAt),
        delivery:trustedServiceValue(svc?.delivery_state,confirmedAt),
        service_confirmed_at:confirmedAt,
        service_trust:confirmedAt?'confirmed':'unconfirmed'
      };
    });
  };
})();

/* HOY 2.39 — direct profile → map handoff for every geolocated venue */
(function(){
  if(window.__hoyProfileLocation239)return;
  window.__hoyProfileLocation239=true;

  function venue239(id){
    const numeric=Number(id);
    return (DATA||[]).find(p=>Number(p.id)===numeric)||null;
  }
  function hasCoords239(p){
    const lat=Number(p?.latitude),lng=Number(p?.longitude);
    return Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lng)&&lng>=-180&&lng<=180;
  }
  function clickMapFocus239(id,attempt=0){
    const button=document.querySelector(`[data-map-focus="${Number(id)}"]`);
    if(button){button.click();return true}
    if(attempt>=5)return false;
    setTimeout(()=>clickMapFocus239(id,attempt+1),120+attempt*90);
    return false;
  }

  window.hoyOpenVenueOnMap239=function(id){
    const p=venue239(id);
    if(!p||!hasCoords239(p))return false;

    // A profile-to-map jump is an explicit single-place intent. Clear unrelated filters
    // so the requested venue cannot disappear because of an earlier discovery state.
    state.query=String(p.name||'').trim();
    state.service='all';
    state.decision='all';

    const detail=document.getElementById('detail');
    if(detail?.open)detail.close();
    nav('map');

    if(typeof trackEvent==='function')trackEvent('map_focus',p.id,{from:'profile_location'});
    requestAnimationFrame(()=>clickMapFocus239(p.id));
    return true;
  };
})();

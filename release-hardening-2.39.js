/* HOY 2.39.0 — release hardening for deterministic guest reset behavior */
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
})();

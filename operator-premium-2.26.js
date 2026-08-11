/* HOY 2.26.0 — presentation-only premium operator dialog hooks */
(function(){
  if(window.__hoyOperatorPremium260)return;
  window.__hoyOperatorPremium260=true;
  window.hoyOperatorPremiumVersion='2.26.0';

  const DIALOGS={
    operatorServicesFlow:'services',
    liveHoursFlow:'hours',
    menuIntakeFlow:'menu',
    operatorOffersFlow:'offers',
    mediaReview:'media'
  };

  function markDialog(dialog,kind){
    if(!dialog)return;
    dialog.classList.add('op-premium-dialog',`op-premium-${kind}`);
    dialog.dataset.opPremium='2.26.0';
  }

  function enhance(){
    for(const [id,kind] of Object.entries(DIALOGS))markDialog(document.getElementById(id),kind);
  }

  const observer=new MutationObserver(enhance);
  const start=()=>{
    observer.observe(document.body,{childList:true,subtree:true});
    enhance();
  };

  window.hoyEnhanceOperatorPremium=enhance;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

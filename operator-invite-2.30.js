/* HOY 2.30.0 — safe operator invitation deep link into the existing verified claim flow */
(function(){
  if(window.__hoyOperatorInvite2300)return;
  window.__hoyOperatorInvite2300=true;
  window.hoyOperatorInviteVersion='2.30.0';

  const PARAM='claim';
  const source=()=>new URLSearchParams(location.search).get('from')||'';
  const inviteId=()=>{const raw=new URLSearchParams(location.search).get(PARAM);const id=Number(raw);return Number.isInteger(id)&&id>0?id:null};
  const isInvite=()=>inviteId()!=null;

  function inviteContext(){
    const id=inviteId();if(!id)return null;
    const p=Array.isArray(DATA)?DATA.find(x=>Number(x.id)===id):null;
    return p||null;
  }

  const baseRenderClaimFlow2300=renderClaimFlow;
  renderClaimFlow=function(){
    baseRenderClaimFlow2300();
    const p=inviteContext(),d=document.getElementById('claimFlow');
    if(!p||!d?.open||Number(claimDraft?.restaurantId)!==Number(p.id)||Number(claimDraft?.step||1)!==1)return;
    const flow=d.querySelector('.onboarding-flow');if(!flow||flow.querySelector('[data-invite-context]'))return;
    const target=flow.querySelector('.onboarding-copy');if(!target)return;
    target.insertAdjacentHTML('beforebegin',`<div class="operator-invite-context" data-invite-context><span>HOY-EINLADUNG</span><div><b>${esc(p.name)} ist bereits vorbereitet.</b><small>Adresse, Kontakt, Profil und vorhandene Daten sind schon angelegt. Du bestätigst nur, dass du den Betrieb vertreten darfst.</small></div></div>`);
  };

  function openInvite(attempt=0){
    const id=inviteId();if(!id)return;
    const p=inviteContext();
    if(!p){
      if(attempt<30)setTimeout(()=>openInvite(attempt+1),100);
      else if(typeof toast==='function')toast('Dieser HOY-Einladungslink konnte keinem Betrieb zugeordnet werden');
      return;
    }
    if(document.getElementById('claimFlow')?.open)return;
    if(typeof openClaimFlow!=='function'){
      if(attempt<30)setTimeout(()=>openInvite(attempt+1),100);
      return;
    }
    openClaimFlow(id,1);
    if(typeof addAudit==='function')addAudit('operator_invite_opened',id,source()||'invite_link');
  }

  window.hoyOperatorInviteRestaurantId=inviteId;
  window.hoyOperatorInviteURLFor=function(id,base=location.href){
    const url=new URL('./',base);url.search='';url.hash='';url.searchParams.set(PARAM,String(Number(id)));url.searchParams.set('from','operator_invite');return url.toString();
  };

  if(isInvite())setTimeout(()=>openInvite(),0);
})();

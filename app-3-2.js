function auditLabel(a){return ({claim_started:'Claim gestartet',claim_submitted:'Claim zur Prüfung eingereicht',claim_verified_demo:'Verifizierung in Demo bestätigt',owner_media_selected:'Betreiberbild ausgewählt',offer_drafted:'Angebot als Entwurf gespeichert'}[a]||a)}
function formatAuditTime(v){try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return ''}}
function bottom(){let items=[['home',icons.home,'Heute'],['discover',icons.compass,'Entdecken'],['map',icons.map,'Karte'],['favorites',icons.heart,'Favoriten'],['partner',icons.menu,'Mehr']];document.getElementById('bottom').innerHTML=items.map(([v,i,l])=>`<button data-btm="${v}" class="${state.view===v?'active':''}">${i}<small>${l}</small></button>`).join('')}
function render(){document.documentElement.style.setProperty('--region',`url("${HERO}")`);const v=document.getElementById('view');v.innerHTML=state.view==='home'?home():state.view==='discover'?discover():state.view==='map'?mapView():state.view==='favorites'?favorites():partner();if(state.view==='home'){document.querySelector('.hero').style.backgroundImage=`url("${HERO}")`};bottom();wire();v.scrollTop=0}
function nav(v){state.view=v;render()}
function wire(){
  document.querySelectorAll('[data-btm],[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.btm||b.dataset.nav));
  document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();setFav(+b.dataset.fav)});
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=e=>{if(!e.target.closest('[data-fav]'))openDetail(+b.dataset.open)});
  document.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{state.service=b.dataset.service;nav('discover')});
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.service=b.dataset.filter;render()});
  document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{state.query=b.dataset.zone;state.service='all';nav('discover')});
  let q=document.getElementById('q');if(q)q.oninput=e=>{state.query=e.target.value;render()};
  let go=document.querySelector('[data-go]');if(go)go.onclick=()=>nav('discover');
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=async()=>{
    state.lang=state.lang==='de'?'en':state.lang==='en'?'es':'de';
    if(typeof window.hoyRefreshNativeMenus248==='function'&&sb&&cloud.status!=='error')await window.hoyRefreshNativeMenus248();
    render();
  });
  document.querySelectorAll('[data-start-claim]').forEach(b=>b.onclick=()=>openClaimFlow(claimDraft?.restaurantId||null));
  document.querySelectorAll('[data-edit-claim]').forEach(b=>b.onclick=()=>openClaimFlow(claimDraft?.restaurantId||null,claimDraft?.step||2));
  document.querySelectorAll('[data-owner-preview]').forEach(b=>b.onclick=()=>{const p=claimedRestaurant();if(p)openClaimPreview(p,claimDraft.requestedPlan||'free')});
  document.querySelectorAll('[data-plan-demo]').forEach(b=>b.onclick=()=>{const p=claimedRestaurant()||DATA[1]||DATA[0];openClaimPreview(p,b.dataset.planDemo)});
  document.querySelectorAll('[data-reset-claim]').forEach(b=>b.onclick=()=>{if(confirm('Lokalen Claim-Teststand zurücksetzen?')){localStorage.removeItem(CLAIM_KEY);claimDraft=blankClaim();claimSession.thumbs=[];render();toast('Claim-Teststand zurückgesetzt')}})
  document.querySelectorAll('[data-auth-open]').forEach(b=>b.onclick=()=>openAuthFlow('login'));
  document.querySelectorAll('[data-auth-out]').forEach(b=>b.onclick=()=>authLogout().then(()=>toast('Abgemeldet')));
}
function phoneHref(p){return 'tel:'+String(effectiveValue(p,'phone')||'').replace(/[^+\d]/g,'')}

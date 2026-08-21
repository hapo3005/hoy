/* HOY 2.51.0 — hard guest-menu language contract.
 * Guests never see preparation/status placeholders, source-only substitutes,
 * partial cards or mixed-language menus. A menu section is guest-visible only
 * when the complete HOY-native menu for the current page language is ready.
 */
(function(){
  'use strict';
  if(window.__hoyGuestMenuLanguageContract251)return;
  window.__hoyGuestMenuLanguageContract251=true;
  window.hoyGuestMenuLanguageContractVersion='2.51.0';

  const SUPPORTED=new Set(['de','es','en']);
  const locale=()=>SUPPORTED.has(state?.lang)?state.lang:'de';

  function rowsValid(categories){
    if(!Array.isArray(categories)||!categories.length)return false;
    return categories.every(cat=>{
      const name=String(cat?.[0]??'').trim();
      const items=Array.isArray(cat?.[1])?cat[1]:[];
      return !!name&&items.length>0&&items.every(item=>String(item?.[0]??'').trim().length>0);
    });
  }

  function guestReady(m,lang=locale()){
    const coverage=m?.languageCoverage||{};
    const total=Number(coverage.total)||0;
    const ready=Number(coverage.ready)||0;
    return !!(
      m&&m.nativeMenu===true&&m.localized===true&&
      m.guestAvailability==='in_app_native'&&m.locale===lang&&
      coverage.locale===lang&&coverage.complete===true&&total>0&&ready===total&&
      rowsValid(m.categories)
    );
  }

  function currentProfile(){
    const detail=document.getElementById('detail');
    if(!detail?.open)return null;
    const id=Number(detail.dataset.restaurantId||0);
    const restaurant=(DATA||[]).find(x=>Number(x.id)===id)||null;
    return restaurant?{detail,restaurant}:null;
  }

  function enforceProfile(p,detail=document.getElementById('detail')){
    if(!p||!detail)return false;
    const m=menuFor(p);
    const ready=guestReady(m);
    const section=detail.querySelector('#profile-menu');
    const nav=detail.querySelector('.profile-anchor-nav,.profile-premium-nav');
    const link=nav?.querySelector('a[href="#profile-menu"]');

    if(!ready){
      section?.remove();
      link?.remove();
      detail.classList.add('menu251-not-guest-ready');
      detail.querySelectorAll('.menu248-blocked').forEach(node=>node.remove());
      return false;
    }

    detail.classList.remove('menu251-not-guest-ready');
    return true;
  }

  const basePanel251=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    return guestReady(m)?basePanel251(p):'';
  };

  const baseStatus251=menuStatusLabel;
  menuStatusLabel=function(m){
    return guestReady(m)?baseStatus251(m):'';
  };

  const baseOpen251=openDetail;
  openDetail=function(id){
    baseOpen251(id);
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    if(p)enforceProfile(p);
  };

  function enforceCurrent(){
    const current=currentProfile();
    if(!current)return false;
    return enforceProfile(current.restaurant,current.detail);
  }

  ['hoy:menus-ready','hoy:native-menus-ready','hoy:profile-menu-refreshed'].forEach(name=>{
    window.addEventListener(name,()=>queueMicrotask(enforceCurrent));
  });

  window.hoyGuestMenuReady251=guestReady;
  window.hoyEnforceGuestMenu251=enforceCurrent;
})();

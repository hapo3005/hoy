/* HOY 2.13.5 — polished live-data loading states */
(function(){
  const baseHome2135=home;
  function skeletonAreas(){
    return '<span class="journey-load-chip" aria-hidden="true"></span><span class="journey-load-chip" aria-hidden="true"></span><span class="journey-load-chip" aria-hidden="true"></span>';
  }
  function skeletonCards(){
    return '<article class="journey-load-card" aria-hidden="true"><span></span><b></b><i></i></article><article class="journey-load-card" aria-hidden="true"><span></span><b></b><i></i></article>';
  }
  home=function(){
    const html=baseHome2135();
    if(typeof cloud==='undefined'||DATA.length>0)return html;
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    const connecting=cloud.status==='connecting';
    const kicker=root.querySelector('.journey-kicker');
    if(kicker){
      kicker.classList.add(connecting?'is-loading':'is-unavailable');
      kicker.setAttribute('role','status');
      kicker.setAttribute('aria-live','polite');
      kicker.textContent=connecting?'Orte rund ums Mar Menor werden geladen …':'Orte sind gerade nicht erreichbar';
    }
    const areas=root.querySelector('.journey-area-scroll');
    const cards=root.querySelector('.journey-featured .cards');
    if(connecting){
      if(areas&&!areas.children.length){areas.classList.add('journey-loading');areas.innerHTML=skeletonAreas()}
      if(cards&&!cards.children.length){cards.classList.add('journey-loading');cards.innerHTML=skeletonCards()}
    }else{
      const note='<div class="journey-data-note" role="status">Die Live-Daten konnten gerade nicht geladen werden. Bitte prüfe deine Verbindung und versuche es erneut.</div>';
      if(areas&&!areas.children.length)areas.innerHTML=note;
      if(cards&&!cards.children.length)cards.innerHTML=note;
    }
    return root.outerHTML;
  };
})();

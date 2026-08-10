/* HOY 2.4 — guest QA fixes: keyboard access, live-search stability, focus return and map copy */
(function(){
  let searchTimer=null;

  function restaurantFor(el){
    const id=Number(el?.dataset?.open);
    return DATA.find(x=>Number(x.id)===id)||null;
  }

  function enhanceCards(root=document){
    root.querySelectorAll('.card[data-open],.list-card[data-open]').forEach(card=>{
      const p=restaurantFor(card);if(!p)return;
      card.tabIndex=0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label',`Profil von ${p.name} öffnen`);
      card.classList.add('qa-keyboard-card');
      if(card.dataset.qaKeyboard==='1')return;
      card.dataset.qaKeyboard='1';
      card.addEventListener('keydown',e=>{
        if(e.target!==card)return;
        if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(Number(card.dataset.open));}
      });
    });
  }

  function enhanceNavigation(){
    document.querySelectorAll('#bottom [data-btm]').forEach(btn=>{
      const active=btn.classList.contains('active');
      if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
    });
    const resultBlock=document.querySelector('.journey-result-toolbar>div:first-child');
    if(resultBlock){resultBlock.setAttribute('role','status');resultBlock.setAttribute('aria-live','polite');resultBlock.setAttribute('aria-atomic','true');}
  }

  function bindFreshResults(root){
    root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();setFav(Number(b.dataset.fav))});
    root.querySelectorAll('[data-open]').forEach(b=>b.onclick=e=>{if(!e.target.closest('[data-fav]'))openDetail(Number(b.dataset.open))});
    root.querySelectorAll('[data-consumer-reset]').forEach(b=>b.onclick=()=>{state.query='';state.service='all';state.decision='all';render()});
    enhanceCards(root);
  }

  function syncDiscoverFromCurrentState(){
    if(state.view!=='discover')return;
    const current=document.querySelector('[data-journey-results]');if(!current)return;
    const shell=document.createElement('div');shell.innerHTML=discover();
    const fresh=shell.querySelector('[data-journey-results]');if(!fresh)return;
    current.innerHTML=fresh.innerHTML;

    const freshCount=shell.querySelector('[data-result-count]');
    const freshLabel=shell.querySelector('[data-result-label]');
    const count=document.querySelector('[data-result-count]');
    const label=document.querySelector('[data-result-label]');
    if(count&&freshCount)count.textContent=freshCount.textContent;
    if(label&&freshLabel)label.textContent=freshLabel.textContent;

    const currentActive=document.querySelector('.journey-active');
    const freshActive=shell.querySelector('.journey-active');
    if(currentActive&&freshActive)currentActive.replaceWith(freshActive);
    else if(currentActive&&!freshActive)currentActive.remove();
    else if(!currentActive&&freshActive){
      const toolbar=document.querySelector('.journey-result-toolbar');
      toolbar?.insertAdjacentElement('beforebegin',freshActive);
    }
    document.querySelectorAll('.journey-active [data-consumer-reset]').forEach(b=>b.onclick=()=>{state.query='';state.service='all';state.decision='all';render()});
    current.removeAttribute('aria-busy');
    bindFreshResults(current);
    enhanceNavigation();
  }

  function wireStableSearch(){
    const q=document.getElementById('q');if(!q||state.view!=='discover')return;
    const results=document.querySelector('[data-journey-results]');
    const schedule=()=>{
      if(results)results.setAttribute('aria-busy','true');
      clearTimeout(searchTimer);
      searchTimer=setTimeout(syncDiscoverFromCurrentState,90);
    };
    q.oninput=e=>{state.query=e.target.value;schedule()};
    q.onkeydown=e=>{
      if(e.key==='Escape'){
        e.preventDefault();clearTimeout(searchTimer);state.query='';q.value='';syncDiscoverFromCurrentState();
      }else if(e.key==='Enter'){
        e.preventDefault();clearTimeout(searchTimer);syncDiscoverFromCurrentState();
      }
    };
    const clear=document.querySelector('[data-search-clear]');
    if(clear)clear.onclick=()=>{clearTimeout(searchTimer);state.query='';q.value='';q.focus();syncDiscoverFromCurrentState()};
  }

  function correctGroupedMapCopy(root){
    root.querySelectorAll('.map-popup-head b').forEach(x=>{
      if(/\d+ Orte an diesem Standort/.test(x.textContent||''))x.textContent=(x.textContent||'').replace(' Orte an diesem Standort',' Orte auf diesem Kartenpunkt');
    });
  }

  function observeMapCopy(){
    const map=document.getElementById('hoyMap');if(!map||map.dataset.qaMapObserver==='1')return;
    map.dataset.qaMapObserver='1';correctGroupedMapCopy(map);
    new MutationObserver(()=>correctGroupedMapCopy(map)).observe(map,{childList:true,subtree:true});
  }

  const baseWire24=wire;
  wire=function(){
    baseWire24();
    enhanceCards(document);
    enhanceNavigation();
    wireStableSearch();
    observeMapCopy();
  };

  const baseOpenDetail24=openDetail;
  openDetail=function(id){
    const trigger=document.activeElement;
    baseOpenDetail24(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');if(!p||!d)return;
    d.setAttribute('aria-label',`${p.name} auf HOY`);
    const close=d.querySelector('[data-close]');
    close?.setAttribute('aria-label','Profil schließen');
    if(trigger?.matches?.('.qa-keyboard-card,[data-map-open]'))setTimeout(()=>close?.focus(),0);
    d.addEventListener('close',()=>{
      if(trigger&&trigger.isConnected&&typeof trigger.focus==='function')trigger.focus({preventScroll:true});
    },{once:true});
  };
})();

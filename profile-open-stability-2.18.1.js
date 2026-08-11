/* HOY 2.18.1 — delegated fallback for restaurant-card profile opening across async rerenders */
(function(){
  if(window.__hoyProfileOpenStability2181)return;
  window.__hoyProfileOpenStability2181=true;

  const cardFor=target=>target?.closest?.('.card[data-open],.list-card[data-open]')||null;
  const isNestedInteractive=(target,card)=>{
    const nested=target?.closest?.('[data-fav],a,button,input,select,textarea,label,[contenteditable="true"]');
    return !!nested&&nested!==card;
  };
  const openFallback=(card)=>{
    const id=Number(card?.dataset?.open);if(!id)return;
    setTimeout(()=>{
      const detail=document.getElementById('detail');
      if(detail?.open)return;
      if(typeof openDetail==='function')openDetail(id);
    },0);
  };

  document.addEventListener('click',e=>{
    const card=cardFor(e.target);if(!card||isNestedInteractive(e.target,card))return;
    openFallback(card);
  });

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const card=cardFor(e.target);if(!card||e.target!==card)return;
    e.preventDefault();
    openFallback(card);
  });
})();

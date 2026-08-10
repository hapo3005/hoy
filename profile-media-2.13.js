/* HOY 2.13 — profile media hierarchy: approved venue imagery first, clearly labelled regional fallback otherwise */
(function(){
  const AUTHENTIC_KINDS=new Set(['operator','venue']);

  function contextName(m){
    const label=String(m?.label||'').trim();
    const parts=label.split('·').map(x=>x.trim()).filter(Boolean);
    return parts[1]||parts[0]||'Region';
  }

  function enhanceProfileMedia(p,d){
    if(!p||!d?.classList.contains('profile-premium'))return;
    const art=d.querySelector('.detail-art');
    if(!art)return;
    const m=mediaFor(p)||{};
    const authentic=AUTHENTIC_KINDS.has(m.kind);
    d.classList.toggle('profile-hero-authentic',authentic);
    d.classList.toggle('profile-hero-context',!authentic);
    art.dataset.mediaKind=m.kind||'unknown';

    const badge=art.querySelector('.media-badge');
    if(!badge)return;
    badge.classList.add('profile-media-badge');
    if(m.kind==='operator'){
      badge.textContent='BETREIBERBILD · FREIGEGEBEN';
    }else if(m.kind==='venue'){
      badge.textContent='OBJEKTFOTO · FREIE QUELLE';
    }else{
      badge.textContent=`UMGEBUNG · ${contextName(m).toUpperCase()}`;
      badge.setAttribute('title','Dieses frei nutzbare Bild zeigt die Umgebung, nicht zwingend den konkreten Betrieb.');
    }
  }

  const baseOpenDetail213Media=openDetail;
  openDetail=function(id){
    baseOpenDetail213Media(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)enhanceProfileMedia(p,d);
  };
})();

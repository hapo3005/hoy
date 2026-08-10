/* HOY 2.13.1 — profile media hierarchy: approved venue imagery first, clearly labelled regional fallback otherwise */
(function(){
  const AUTHENTIC_KINDS=new Set(['operator','venue']);

  function contextName(p,m){
    const area=String(p?.area||'').trim();
    if(area)return area;
    const label=String(m?.label||'').trim();
    const parts=label.split('·').map(x=>x.trim()).filter(Boolean);
    return parts[1]||parts[0]||'Region';
  }

  function setVisibleMark(art,kicker,label,title=''){
    let mark=art.querySelector('.showcase-mark');
    if(!mark){
      mark=document.createElement('div');
      mark.className='showcase-mark';
      art.appendChild(mark);
    }
    mark.classList.add('profile-media-mark');
    mark.innerHTML=`<span>${esc(kicker)}</span>${esc(label)}`;
    if(title)mark.setAttribute('title',title);else mark.removeAttribute('title');
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
    if(badge){
      badge.classList.add('profile-media-badge');
      badge.setAttribute('aria-hidden','true');
    }

    if(m.kind==='operator'){
      if(badge)badge.textContent='BETREIBERBILD · FREIGEGEBEN';
      setVisibleMark(art,'BETREIBERBILD','FREIGEGEBEN');
    }else if(m.kind==='venue'){
      if(badge)badge.textContent='OBJEKTFOTO · FREIE QUELLE';
      setVisibleMark(art,'OBJEKTFOTO','FREIE QUELLE');
    }else{
      const place=contextName(p,m).toUpperCase();
      const title='Dieses frei nutzbare Bild zeigt die Umgebung, nicht zwingend den konkreten Betrieb.';
      if(badge){badge.textContent=`UMGEBUNG · ${place}`;badge.setAttribute('title',title)}
      setVisibleMark(art,'UMGEBUNG',place,title);
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

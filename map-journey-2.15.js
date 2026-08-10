/* HOY 2.15 — map ↔ decision rail ↔ profile journey */
(function(){
  const baseMapView215=mapView;
  const baseWire215=wire;

  function mapSignals215(p){
    const out=[];
    const menu=menuFor(p);
    if(menu?.localized)out.push('Menü auf Deutsch');
    else if(['structured','partial'].includes(menu?.status))out.push('Speisekarte');
    if(effectiveServiceState(p,'reservation')==='available')out.push('Reservierbar');
    if(isClaimed(p)||p?.operator_verified)out.push('Betreiber bestätigt');
    else if(p?.profile_quality==='premium')out.push('HOY geprüft');
    return out.slice(0,2);
  }

  function cardMedia215(p){
    return String(mediaMarkup(p)||'')
      .replace(/\bmedia-photo\b/g,'map-decision-photo')
      .replace(/\bmedia-video\b/g,'map-decision-video')
      .replace(/\bmedia-fallback\b/g,'map-decision-fallback')
      .replace(/\bmedia-badge\b/g,'map-decision-badge');
  }

  function compactCard215(p){
    const m=meta(p);
    const signals=mapSignals215(p);
    const titleId=`map-card-title-${Number(p.id)}`;
    return `<article class="map-decision-card" data-map-card="${p.id}" data-map-lat="${Number(p.latitude)}" data-map-lng="${Number(p.longitude)}" aria-labelledby="${titleId}"><div class="map-decision-media">${cardMedia215(p)}</div><div class="map-decision-copy"><div><h3 id="${titleId}">${esc(p.name)}</h3>${m?`<p>${esc(m)}</p>`:''}</div><div class="map-decision-signals">${signals.map(s=>`<span>${esc(s)}</span>`).join('')||'<span class="muted">Basisprofil</span>'}</div><div class="map-decision-actions"><button type="button" data-map-focus="${p.id}">Auf Karte zeigen</button><button type="button" data-map-profile="${p.id}">Profil ansehen</button></div></div></article>`;
  }

  function filterContext215(){
    const bits=[];
    if((state.query||'').trim())bits.push(`Suche: ${state.query.trim()}`);
    if(state.service&&state.service!=='all')bits.push(state.service==='reservation'?'Reservierung':state.service==='pickup'?'Abholung':'Lieferung');
    if(state.decision&&state.decision!=='all')bits.push('Auswahl aus Entdecken');
    return bits;
  }

  mapView=function(){
    const html=baseMapView215();
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    root.classList.add('map-journey-signature');

    const rows=filtered().filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));
    const head=root.querySelector('.head');
    const h1=head?.querySelector('h1');
    const intro=head?.querySelector('p');
    if(h1)h1.textContent=rows.length===1?'Dieser Ort. Genau hier.':'Sieh, was hier zu dir passt.';
    if(intro)intro.textContent='Karte und Treffer arbeiten zusammen: Ort auf der Karte zeigen und von dort direkt ins Profil wechseln.';

    const mapShell=root.querySelector('.hoy-map-shell');
    const map=mapShell?.querySelector('#hoyMap');
    const legend=mapShell?.querySelector('.map-legend');
    if(mapShell&&map){
      const context=filterContext215();
      const bar=document.createElement('div');
      bar.className='map-journey-bar';
      bar.innerHTML=`<div><span class="eyebrow">DEINE AUSWAHL</span><strong>${rows.length} ${rows.length===1?'Ort':'Orte'}</strong>${context.length?`<small>${context.map(esc).join(' · ')}</small>`:'<small>Alle aktuell passenden Kartenpunkte</small>'}</div><button type="button" data-map-list>Als Liste ansehen</button>`;
      map.insertAdjacentElement('beforebegin',bar);

      const rail=document.createElement('div');
      rail.className='map-decision-block';
      const shown=rows.slice(0,12);
      rail.innerHTML=`<div class="map-decision-head"><div><span class="eyebrow">SCHNELL ENTSCHEIDEN</span><h2>Orte auf dieser Karte</h2></div><small>${shown.length}${rows.length>shown.length?` von ${rows.length}`:''}</small></div><div class="map-decision-rail" aria-label="Orte auf der Karte">${shown.map(compactCard215).join('')}</div>${rows.length>shown.length?'<button class="map-decision-more" type="button" data-map-list>Alle Treffer als Liste ansehen</button>':''}`;
      (legend||map.nextSibling)?.before?.(rail);
      if(!legend)map.insertAdjacentElement('afterend',rail);
    }
    return root.outerHTML;
  };

  function activeCard215(id,scroll=true){
    document.querySelectorAll('.map-decision-card.active').forEach(el=>el.classList.remove('active'));
    const card=document.querySelector(`.map-decision-card[data-map-card="${Number(id)}"]`);
    if(card){card.classList.add('active');if(scroll)card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}
  }

  function focusMap215(card){
    const lat=Number(card?.dataset.mapLat),lng=Number(card?.dataset.mapLng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
    const map=window.__hoyMapJourney215;
    activeCard215(card.dataset.mapCard,false);
    if(!map)return;
    map.setView([lat,lng],Math.max(map.getZoom(),15),{animate:true});
    let target=null;
    map.eachLayer(layer=>{
      if(target||typeof layer.getLatLng!=='function'||typeof layer.openPopup!=='function')return;
      const ll=layer.getLatLng();
      if(Math.abs(ll.lat-lat)<0.000001&&Math.abs(ll.lng-lng)<0.000001)target=layer;
    });
    if(target)setTimeout(()=>target.openPopup(),160);
  }

  function captureMap215(){
    if(typeof L==='undefined'||L.__hoyJourney215)return;
    const original=L.map;
    L.map=function(...args){
      const instance=original.apply(this,args);
      const target=args[0];
      const id=typeof target==='string'?target:target?.id;
      if(id==='hoyMap')window.__hoyMapJourney215=instance;
      return instance;
    };
    Object.assign(L.map,original);
    L.__hoyJourney215=true;
  }
  captureMap215();

  function bindMap215(){
    const map=window.__hoyMapJourney215;
    if(!map||map.__hoyJourney215Bound)return;
    map.__hoyJourney215Bound=true;
    map.on('popupopen',e=>{
      const ll=e.popup?._source?.getLatLng?.();
      if(!ll)return;
      const card=[...document.querySelectorAll('.map-decision-card')].find(el=>Math.abs(Number(el.dataset.mapLat)-ll.lat)<0.000001&&Math.abs(Number(el.dataset.mapLng)-ll.lng)<0.000001);
      if(card)activeCard215(card.dataset.mapCard,true);
    });
  }

  wire=function(){
    baseWire215();
    document.querySelectorAll('[data-map-list]').forEach(b=>b.onclick=()=>nav('discover'));
    document.querySelectorAll('[data-map-focus]').forEach(b=>b.onclick=()=>focusMap215(b.closest('.map-decision-card')));
    document.querySelectorAll('[data-map-profile]').forEach(b=>b.onclick=()=>openDetail(Number(b.dataset.mapProfile)));
    if(document.getElementById('hoyMap'))setTimeout(bindMap215,180);
  };
})();

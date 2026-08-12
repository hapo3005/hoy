/* HOY 2.31.0 — menus stay inside HOY: structured cards or embedded official menu pages */
(function(){
  if(window.__hoyMenuInApp2310)return;
  window.__hoyMenuInApp2310=true;
  window.hoyMenuInAppVersion='2.31.0';

  const clean231=v=>String(v??'').trim();
  const safePages231=payload=>Array.isArray(payload?.pages)?payload.pages.map((p,i)=>({url:clean231(typeof p==='string'?p:p?.url),section:clean231(p?.section)||'Speisekarte',label:clean231(p?.label)||`Seite ${i+1}`})).filter(p=>/^https:\/\//i.test(p.url)):[];

  const baseLoadCloudMenus231=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus231();
    if(!sb)return;
    const {data,error}=await sb.from('menu_sources').select('restaurant_id,source_url,source_label,last_checked_at,display_payload,is_official').eq('is_official',true);
    if(error){console.warn('HOY in-app menu payload unavailable',error);return}
    for(const source of data||[]){
      const id=Number(source.restaurant_id),current=MENUS[id]||{},pages=safePages231(source.display_payload);
      if(pages.length){
        MENUS[id]={...current,status:'partial',displayMode:'image_pages',pages,source:null,provenanceUrl:source.source_url||current.source||'',checked:(source.last_checked_at||current.checked||'').slice(0,10),label:source.source_label||'Offizielle Speisekarte',cloud:true};
      }else if(current.status==='official_link'){
        MENUS[id]={...current,status:'source_only',source:null,provenanceUrl:source.source_url||current.source||'',label:source.source_label||current.label||'Offizielle Speisekarte',cloud:true};
      }
    }
  };

  const baseMenuStatusLabel231=menuStatusLabel;
  menuStatusLabel=function(m){
    if(m?.displayMode==='image_pages')return 'Speisekarte in HOY';
    if(m?.status==='source_only')return 'Speisekarte wird in HOY aufbereitet';
    return baseMenuStatusLabel231(m);
  };

  function imagePagesHTML231(m){
    const groups=[];
    for(const page of m.pages||[]){let g=groups.find(x=>x.name===page.section);if(!g){g={name:page.section,pages:[]};groups.push(g)}g.pages.push(page)}
    return `<div class="menu231-image-card"><div class="menu231-note"><b>Direkt in HOY.</b><span>Diese offizielle Karte wird hier angezeigt – du musst HOY nicht verlassen.</span></div>${groups.map(g=>`<section class="menu231-section"><div class="menu231-section-head"><h4>${esc(g.name)}</h4><small>${g.pages.length} ${g.pages.length===1?'Seite':'Seiten'} · horizontal wischen</small></div><div class="menu231-pages">${g.pages.map((p,i)=>`<figure class="menu231-page"><img src="${esc(p.url)}" alt="${esc(`${g.name} · ${p.label}`)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"><figcaption>${esc(p.label)} · ${i+1}/${g.pages.length}</figcaption></figure>`).join('')}</div></section>`).join('')}</div>`;
  }

  const baseMenuPanel231=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.displayMode==='image_pages'&&Array.isArray(m.pages)&&m.pages.length){
      return `<div class="menu-panel menu231-panel"><div class="menu-status"><div class="top"><b>Speisekarte in HOY</b><span class="pill good">${m.pages.length} Seiten</span></div><small>${esc(m.label||'Offizielle Betreiberquelle')}${m.checked?' · geprüft '+esc(m.checked):''}</small></div>${imagePagesHTML231(m)}</div>`;
    }
    if(m?.status==='source_only'){
      return `<div class="menu-panel menu231-panel"><div class="menu-status"><div class="top"><b>Speisekarte wird in HOY aufbereitet</b><span class="pill warn">Noch nicht in-app</span></div><small>${esc(m.label||'Offizielle Quelle gefunden')}</small></div><div class="menu-empty"><h4>HOY hat die offizielle Kartenquelle gefunden.</h4><p>Ein externer Menülink gilt nicht mehr als fertige Speisekarte. Erst wenn HOY die Karte selbst darstellen kann, wird sie Gästen als verfügbar angezeigt.</p></div></div>`;
    }
    return baseMenuPanel231(p);
  };
})();

/* HOY 2.32.0 — one menu truth for guest UI, ranking and quality control */
(function(){
  if(window.__hoyMenuIntegrity2320)return;
  window.__hoyMenuIntegrity2320=true;
  window.hoyMenuIntegrityVersion='2.32.0';

  const NON_CORE=new Set(['wine','dessert','drinks','highlights','secondary']);
  const ACTIVE_CONTENT=new Set(['complete','partial','image_complete']);
  const IGNORE=new Set(['superseded','invalid','unknown']);
  const clean232=v=>String(v??'').trim();
  const scope232=s=>clean232(s?.coverage_scope)||'full_menu';
  const status232=s=>clean232(s?.completeness_status)||'unknown';
  const isCore232=s=>!NON_CORE.has(scope232(s));
  const pages232=s=>Array.isArray(s?.display_payload?.pages)?s.display_payload.pages.map((p,i)=>({url:clean232(typeof p==='string'?p:p?.url),section:clean232(p?.section)||'Speisekarte',label:clean232(p?.label)||`Seite ${i+1}`})).filter(p=>/^https:\/\//i.test(p.url)):[];
  const sourceDate232=s=>s?.completeness_checked_at||s?.last_checked_at||'';
  const latest232=rows=>rows.map(sourceDate232).filter(Boolean).sort().at(-1)||'';
  const categoryCount232=cats=>(cats||[]).reduce((n,[,items])=>n+(items?.length||0),0);

  function categories232(rows){
    const cats=new Map();
    for(const row of rows){const cat=clean232(row.category)||'Speisekarte';if(!cats.has(cat))cats.set(cat,[]);cats.get(cat).push([clean232(row.name),clean232(row.price_text)])}
    return [...cats.entries()];
  }

  function coverage232(core,allRows){
    const measured=core.find(s=>Number(s?.coverage_meta?.expected_sections)>0);
    if(measured){const expected=Number(measured.coverage_meta.expected_sections)||0,imported=Number(measured.coverage_meta.imported_sections)||0;return {expected,imported,text:`${imported} von ${expected} Kartenbereichen sind aktuell vollständig in HOY.`}}
    const coreSourceOnly=core.some(s=>status232(s)==='source_only');
    if(coreSourceOnly&&allRows.length)return {expected:null,imported:null,text:`${allRows.length} verifizierte Positionen aus ergänzenden Kartenbereichen sind bereits in HOY; die Hauptkarte fehlt noch.`};
    return {expected:null,imported:null,text:'Diese offizielle Karte ist noch nicht vollständig in HOY abgebildet.'};
  }

  function build232(id,sources,items){
    const invalidSources=sources.filter(s=>status232(s)==='invalid');
    const valid=sources.filter(s=>s?.is_official!==false&&!IGNORE.has(status232(s)));
    const core=valid.filter(isCore232);
    const contentSourceIds=new Set(valid.filter(s=>ACTIVE_CONTENT.has(status232(s))).map(s=>String(s.id)));
    const rows=items.filter(x=>contentSourceIds.has(String(x.source_id)));
    const cats=categories232(rows),checked=latest232(valid.length?valid:sources),provenanceUrls=[...new Set(valid.map(s=>clean232(s.source_url)).filter(Boolean))];
    const coreComplete=core.filter(s=>status232(s)==='complete');
    const coreImages=core.map(s=>({s,pages:pages232(s)})).filter(x=>status232(x.s)==='image_complete'&&x.pages.length).sort((a,b)=>b.pages.length-a.pages.length);
    const corePartial=core.filter(s=>status232(s)==='partial'),coreSourceOnly=core.filter(s=>status232(s)==='source_only'),coreInsufficient=core.filter(s=>status232(s)==='insufficient');
    const primary=coreComplete[0]||coreImages[0]?.s||corePartial[0]||coreSourceOnly[0]||coreInsufficient[0]||valid[0]||invalidSources[0]||null;
    const base={source:null,provenanceUrls,contentSourceIds:[...contentSourceIds],checked:checked?String(checked).slice(0,10):'',label:clean232(primary?.source_label)||'Offizielle Betreiberquelle',cloud:true,sourceCount:sources.length,itemCount:rows.length};

    if(coreComplete.length&&rows.length)return {...base,status:'structured',integrity:'complete',categories:cats,note:'Die aktuelle Hauptkarte ist in HOY vollständig für alle verifizierbaren Positionen abgebildet.'};
    if(coreImages.length){const chosen=coreImages[0];return {...base,status:'structured',integrity:'image_complete',displayMode:'image_pages',pages:chosen.pages,label:clean232(chosen.s.source_label)||base.label,note:'Die offizielle Hauptkarte wird vollständig direkt in HOY angezeigt.'}}
    if(corePartial.length||rows.length){const cov=coverage232(core,rows);return {...base,status:'integrity_partial',integrity:'partial',categories:cats,coverage:cov,note:cov.text}}
    if(coreSourceOnly.length)return {...base,status:'source_only',integrity:'source_only',note:'Die offizielle Hauptkartenquelle ist bekannt, aber noch nicht vollständig in HOY darstellbar.'};
    if(coreInsufficient.length)return {...base,status:'unavailable',integrity:'insufficient',note:'Die offizielle Betreiberquelle enthält derzeit keine vollständige, belastbar bepreiste Speisekarte.'};
    if(valid.some(s=>status232(s)==='source_only'))return {...base,status:'source_only',integrity:'source_only',note:'Eine offizielle Kartenquelle ist bekannt, aber noch nicht vollständig in HOY darstellbar.'};
    if(invalidSources.length)return {...base,status:'unavailable',integrity:'invalid',note:'Die bisher bekannte offizielle Kartenadresse ist derzeit keine belastbare aktuelle Speisekarte.'};
    return {...base,status:'unavailable',integrity:'unavailable',note:'Noch keine belastbare, in HOY darstellbare Speisekarte vorhanden.'};
  }

  function preserveLocalized232(built,existing){
    if(!existing?.localized||!built?.categories?.length)return built;
    if(categoryCount232(existing.categories)!==built.itemCount)return built;
    return {...built,categories:existing.categories,localized:true,locale:existing.locale,translationStatus:existing.translationStatus,originalAvailable:false,label:existing.label||built.label,note:built.note};
  }

  const baseLoadCloudMenus232=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus232();
    if(!sb)return;
    const [sourceRes,itemRes]=await Promise.all([
      sb.from('menu_sources').select('id,restaurant_id,source_url,source_label,last_checked_at,display_payload,is_official,coverage_scope,completeness_status,completeness_checked_at,completeness_note,coverage_meta').eq('is_official',true),
      sb.from('menu_items').select('id,restaurant_id,source_id,category,name,price_text,is_active,source_checked_at').eq('is_active',true).order('category').order('name')
    ]);
    if(sourceRes.error||itemRes.error){console.warn('HOY menu integrity unavailable',sourceRes.error||itemRes.error);return}
    const sources=sourceRes.data||[],items=itemRes.data||[];cloud.menuItemCount=items.length;
    const byRestaurantSources=new Map(),byRestaurantItems=new Map();
    for(const source of sources){const id=Number(source.restaurant_id);if(!byRestaurantSources.has(id))byRestaurantSources.set(id,[]);byRestaurantSources.get(id).push(source)}
    for(const item of items){const id=Number(item.restaurant_id);if(!byRestaurantItems.has(id))byRestaurantItems.set(id,[]);byRestaurantItems.get(id).push(item)}
    for(const [id,venueSources] of byRestaurantSources){const existing=MENUS[id]||null,built=build232(id,venueSources,byRestaurantItems.get(id)||[]);MENUS[id]=preserveLocalized232(built,existing)}
  };

  window.hoyMenuIntegrity232For=p=>p?MENUS[Number(p.id)]||null:null;

  const baseMenuStatusLabel232=menuStatusLabel;
  menuStatusLabel=function(m){
    if(m?.integrity==='complete')return m.localized?(m.locale==='de'?'Speisekarte auf Deutsch':m.locale==='en'?'Menu in English':'Carta en español'):'Vollständig in HOY';
    if(m?.integrity==='image_complete')return 'Offizielle Karte in HOY';
    if(m?.integrity==='partial')return m.localized?(m.locale==='de'?'Auswahl auf Deutsch':m.locale==='en'?'Selection in English':'Selección en español'):'Teilkarte in HOY';
    if(m?.integrity==='source_only')return 'Speisekarte wird in HOY aufbereitet';
    if(m?.integrity==='insufficient')return 'Keine vollständige Karte veröffentlicht';
    if(m?.integrity==='invalid')return 'Kartenquelle derzeit nicht belastbar';
    return baseMenuStatusLabel232(m);
  };

  function partialPanel232(m){
    const detail=m?.coverage?.text||m.note||'Diese Karte ist noch nicht vollständig in HOY abgebildet.';
    const cats=(m.categories||[]).map(([cat,items])=>`<section class="menu-cat"><h4>${esc(cat)}</h4>${items.map(item=>{const n=item?.[0]||'',pr=item?.[1]||'',original=item?.[2]||'',desc=item?.[3]||'',search=(n+' '+cat+' '+desc+' '+original).toLowerCase();return `<div class="menu-item ${m.localized?'localized-menu-item':''}" data-menu-item data-menu-text="${esc(search)}"><strong>${esc(n)}</strong><span>${esc(pr)}</span>${desc?`<small class="menu-item-desc">${esc(desc)}</small>`:''}</div>`}).join('')}</section>`).join('');
    const body=cats?`<input class="menu-search" data-menu-search placeholder="Diese Teilkarte durchsuchen …"><div data-menu-list>${cats}</div>`:`<div class="menu-empty"><h4>Noch keine verifizierten Positionen.</h4></div>`;
    const locale=m.localized?`<div class="menu-language-row"><span class="menu-language-chip">${esc((m.locale||'de').toUpperCase())} · ${m.translationStatus==='curated'?'redaktionell geprüft':'in Prüfung'}</span></div>`:'';
    return `<div class="menu-panel ${m.localized?'localized-menu-panel ':''}menu232-panel"><div class="menu232-integrity partial"><div><small>MENÜ-INTEGRITÄT</small><b>Teilkarte – bewusst gekennzeichnet</b></div><p>${esc(detail)}</p></div><div class="menu-status"><div class="top"><b>${esc(menuStatusLabel(m))}</b>${m.checked?`<span class="pill good">Geprüft ${esc(m.checked)}</span>`:''}</div>${locale}<small>${esc(m.label||'Offizielle Betreiberquelle')}</small>${m.cloud?'<div class="cloud-source-note"><b>Aktuell synchronisiert</b></div>':''}</div>${body}</div>`;
  }

  const baseMenuPanel232=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.integrity==='partial')return partialPanel232(m);
    if(m?.integrity==='source_only')return `<div class="menu-panel menu232-panel"><div class="menu-status"><div class="top"><b>Speisekarte wird in HOY aufbereitet</b><span class="pill warn">Noch nicht in-app</span></div><small>${esc(m.label||'Offizielle Betreiberquelle')}</small></div><div class="menu-empty"><h4>Die offizielle Quelle ist bekannt.</h4><p>HOY zeigt sie erst als Speisekarte, wenn der Inhalt vollständig innerhalb der App nutzbar ist.</p></div></div>`;
    if(m?.integrity==='insufficient')return `<div class="menu-panel menu232-panel"><div class="menu-status"><div class="top"><b>Keine vollständige Karte veröffentlicht</b><span class="pill warn">Betreiberquelle geprüft</span></div><small>${esc(m.label||'Offizielle Betreiberquelle')}</small></div><div class="menu-empty"><h4>HOY zeigt keine erfundene Karte.</h4><p>${esc(m.note||'Die Betreiberquelle enthält aktuell keine vollständige bepreiste Speisekarte.')}</p></div></div>`;
    if(m?.integrity==='invalid')return `<div class="menu-panel menu232-panel"><div class="menu-status"><div class="top"><b>Kartenquelle derzeit nicht belastbar</b><span class="pill warn">HOY geprüft</span></div><small>${esc(m.label||'Offizielle Betreiberquelle')}</small></div><div class="menu-empty"><h4>Diese Quelle wird nicht als Speisekarte verwendet.</h4><p>${esc(m.note||'HOY wartet auf eine belastbare aktuelle Betreiberkarte.')}</p></div></div>`;
    return baseMenuPanel232(p);
  };
})();

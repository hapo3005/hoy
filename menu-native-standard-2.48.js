/* HOY 2.48.0 — final guest-menu authority: native HOY menus only, coupled to page language */
(function(){
  if(window.__hoyNativeMenuStandard248)return;
  window.__hoyNativeMenuStandard248=true;
  window.hoyNativeMenuStandardVersion='2.48.0';

  const PAGE_SIZE=500;
  const SUPPORTED_MENU_LOCALES=new Set(['de','es','en']);
  const PRODUCTION_TRANSLATIONS=new Set(['curated','operator_confirmed']);
  const EXTERNAL_ONLY_INTEGRITIES=new Set([
    'image_complete','embed_complete','source_only','verified_snapshot_complete','verified_snapshot_source',
    'transactional_complete','transactional_partial'
  ]);
  const COPY={
    de:{menu:'Speisekarte',partial:'Teilkarte',search:'Diese Speisekarte durchsuchen …',items:'Positionen',checked:'Geprüft',language:'Deutsch',verified:'redaktionell geprüft',preparing:'Speisekarte wird in HOY aufbereitet',preparingText:'Die offizielle Quelle ist vorhanden. HOY übernimmt Gerichte, Kategorien und Preise strukturiert und zeigt sie anschließend einheitlich auf Deutsch.',languagePending:'Deutsche Speisekarte wird aufbereitet',languagePendingText:'HOY zeigt keine gemischte oder unvollständig übersetzte Karte. Diese Fassung erscheint erst, wenn alle Positionen auf Deutsch geprüft sind.',source:'Offizielle Betreiberquelle'},
    es:{menu:'Carta',partial:'Carta parcial',search:'Buscar en esta carta …',items:'platos',checked:'Revisado',language:'Español',verified:'revisión editorial',preparing:'La carta se está preparando en HOY',preparingText:'La fuente oficial está disponible. HOY estructura platos, categorías y precios y después los muestra de forma uniforme en español.',languagePending:'La carta en español se está preparando',languagePendingText:'HOY no muestra cartas mezcladas ni traducciones incompletas. Esta versión aparecerá cuando todos los platos estén revisados en español.',source:'Fuente oficial del establecimiento'},
    en:{menu:'Menu',partial:'Partial menu',search:'Search this menu …',items:'items',checked:'Checked',language:'English',verified:'editorially verified',preparing:'Menu is being prepared in HOY',preparingText:'The official source is available. HOY structures dishes, categories and prices, then presents them consistently in English.',languagePending:'English menu is being prepared',languagePendingText:'HOY does not show mixed-language or partially translated menus. This version appears only after every item has been verified in English.',source:'Official restaurant source'}
  };

  const cache={items:null,translations:new Map()};
  const clean=v=>String(v??'').trim();
  const locale248=()=>SUPPORTED_MENU_LOCALES.has(state.lang)?state.lang:'de';

  async function fetchAll248(table,select,configure){
    const rows=[];
    for(let from=0;from<10000;from+=PAGE_SIZE){
      let query=sb.from(table).select(select);
      query=configure(query).range(from,from+PAGE_SIZE-1);
      const {data,error}=await query;
      if(error)throw error;
      const page=data||[];
      rows.push(...page);
      if(page.length<PAGE_SIZE)return rows;
    }
    throw new Error(`HOY ${table} pagination safety limit reached`);
  }

  async function itemCatalog248(){
    if(cache.items)return cache.items;
    cache.items=await fetchAll248(
      'menu_items',
      'id,restaurant_id,source_id,category,name,description,price_text,is_active,source_checked_at',
      q=>q.eq('is_active',true).order('restaurant_id').order('category').order('name').order('id')
    );
    return cache.items;
  }

  async function translations248(locale,force=false){
    if(!force&&cache.translations.has(locale))return cache.translations.get(locale);
    const rows=await fetchAll248(
      'menu_item_translations',
      'menu_item_id,locale,category,name,description,translation_status',
      q=>q.eq('locale',locale).order('menu_item_id')
    );
    cache.translations.set(locale,rows);
    return rows;
  }

  function translationReady248(item,t){
    if(!t||!PRODUCTION_TRANSLATIONS.has(clean(t.translation_status)))return false;
    if(!clean(t.name)||!clean(t.category))return false;
    if(clean(item.description)&&!clean(t.description))return false;
    return true;
  }

  function categories248(rows,tr){
    const cats=new Map();
    for(const item of rows){
      const t=tr.get(String(item.id));
      const cat=clean(t?.category);
      const name=clean(t?.name);
      if(!cat||!name)continue;
      if(!cats.has(cat))cats.set(cat,[]);
      cats.get(cat).push([name,clean(item.price_text),clean(item.name),clean(t?.description)]);
    }
    return [...cats.entries()];
  }

  function relevantRows248(m,allRows){
    const allowed=new Set((m?.contentSourceIds||[]).map(String));
    if(!allowed.size)return [];
    return allRows.filter(item=>allowed.has(String(item.source_id)));
  }

  function hasExternalMenuSource248(m){
    const integrity=clean(m?.integrity);
    return EXTERNAL_ONLY_INTEGRITIES.has(integrity)||m?.displayMode==='image_pages'||m?.displayMode==='official_embed'||Array.isArray(m?.pages)&&m.pages.length>0||!!clean(m?.embedUrl)||!!clean(m?.officialMenuUrl)||Array.isArray(m?.provenanceUrls)&&m.provenanceUrls.length>0;
  }

  function stripExternalPresentation248(m){
    return {...m,displayMode:null,pages:null,embedUrl:null,fallbackUrl:null,officialMenuUrl:null,source:null};
  }

  async function reconcileNative248(forceTranslation=false){
    if(!sb)return null;
    const locale=locale248();
    window.hoyNativeMenuState248={state:'loading',locale,at:Date.now()};
    const [items,translations]=await Promise.all([itemCatalog248(),translations248(locale,forceTranslation)]);
    const tr=new Map(translations.map(t=>[String(t.menu_item_id),t]));
    const byRestaurant=new Map();
    for(const item of items){
      const id=Number(item.restaurant_id);
      if(!byRestaurant.has(id))byRestaurant.set(id,[]);
      byRestaurant.get(id).push(item);
    }

    let localizedMenus=0,languageBlocked=0,sourceNeedsStructuring=0,structuredMenus=0;
    for(const p of DATA||[]){
      const id=Number(p.id),current=MENUS[id]||null;
      if(!current)continue;
      const allRows=byRestaurant.get(id)||[];
      const rows=relevantRows248(current,allRows);
      const sourceIntegrity=clean(current.nativeSourceIntegrity||current.integrity);

      if(rows.length){
        structuredMenus++;
        const ready=rows.filter(item=>translationReady248(item,tr.get(String(item.id))));
        const coverage={locale,total:rows.length,ready:ready.length,missing:rows.length-ready.length,complete:ready.length===rows.length};
        if(coverage.complete){
          const sourceComplete=['complete','image_complete','embed_complete'].includes(sourceIntegrity)||clean(current.sourceCompleteness)==='complete';
          MENUS[id]={
            ...stripExternalPresentation248(current),
            status:sourceComplete?'structured':'integrity_partial',
            integrity:sourceComplete?'complete':'partial',
            nativeSourceIntegrity:sourceIntegrity,
            nativeMenu:true,
            guestAvailability:'in_app_native',
            categories:categories248(rows,tr),
            itemCount:rows.length,
            localized:true,
            locale,
            translationStatus:'curated',
            languageCoverage:coverage,
            originalAvailable:false
          };
          localizedMenus++;
        }else{
          MENUS[id]={
            ...stripExternalPresentation248(current),
            status:'unavailable',
            integrity:'native_language_blocked',
            nativeSourceIntegrity:sourceIntegrity,
            nativeMenu:true,
            guestAvailability:'blocked_until_locale_complete',
            categories:[],
            itemCount:rows.length,
            localized:false,
            locale:null,
            translationStatus:null,
            languageCoverage:coverage,
            originalAvailable:false
          };
          languageBlocked++;
        }
        continue;
      }

      if(hasExternalMenuSource248(current)){
        MENUS[id]={
          ...stripExternalPresentation248(current),
          status:'source_only',
          integrity:'native_source_only',
          nativeSourceIntegrity:sourceIntegrity,
          nativeMenu:true,
          guestAvailability:'blocked_until_structured',
          categories:[],
          localized:false,
          locale:null,
          translationStatus:null,
          languageCoverage:{locale,total:0,ready:0,missing:0,complete:false},
          originalAvailable:false
        };
        sourceNeedsStructuring++;
      }
    }

    const snapshot={state:'ready',locale,items:items.length,translations:translations.length,structuredMenus,localizedMenus,languageBlocked,sourceNeedsStructuring,at:Date.now()};
    window.hoyNativeMenuState248=snapshot;
    window.dispatchEvent(new CustomEvent('hoy:native-menus-ready',{detail:snapshot}));
    window.dispatchEvent(new CustomEvent('hoy:menus-ready',{detail:{locale,nativeStandard:true,at:Date.now()}}));
    return snapshot;
  }

  function nativeMenuPanel248(m){
    const locale=locale248(),c=COPY[locale],coverage=m.languageCoverage||{};
    const partial=m.integrity==='partial';
    const title=partial?c.partial:c.menu;
    const categories=(m.categories||[]).map(([cat,items])=>`<section class="menu-cat"><h4>${esc(cat)}</h4>${items.map(item=>{
      const name=item?.[0]||'',price=item?.[1]||'',original=item?.[2]||'',desc=item?.[3]||'';
      const search=(name+' '+cat+' '+desc+' '+original).toLowerCase();
      return `<div class="menu-item localized-menu-item" data-menu-item data-menu-text="${esc(search)}"><strong>${esc(name)}</strong><span>${esc(price)}</span>${desc?`<small class="menu-item-desc">${esc(desc)}</small>`:''}</div>`;
    }).join('')}</section>`).join('');
    return `<div class="menu-panel localized-menu-panel menu248-native"><div class="menu-status"><div class="top"><b>${esc(title)}</b>${m.checked?`<span class="pill good">${esc(c.checked)} ${esc(m.checked)}</span>`:''}</div><div class="menu-language-row"><span class="menu-language-chip">${esc(c.language)} · ${esc(c.verified)}</span></div><small>${esc(m.label||c.source)}</small></div><input class="menu-search" data-menu-search placeholder="${esc(c.search)}"><div class="menu-result-meta inline-menu-result-meta" role="status" aria-live="polite" aria-atomic="true"><span>HOY</span><strong data-menu-visible data-inline-menu-visible>${coverage.total||m.itemCount||0} ${esc(c.items)}</strong></div><div data-menu-list>${categories}</div></div>`;
  }

  function blockedPanel248(m,kind){
    const locale=locale248(),c=COPY[locale],coverage=m.languageCoverage||{};
    const language=kind==='language';
    const heading=language?c.languagePending:c.preparing;
    const text=language?c.languagePendingText:c.preparingText;
    const progress=language&&coverage.total?`<span>${coverage.ready||0}/${coverage.total} · ${esc(c.language)}</span>`:'';
    return `<div class="menu-panel menu248-blocked"><div class="menu-status"><div class="top"><b>${esc(heading)}</b><span class="pill warn">HOY</span></div><small>${esc(m.label||c.source)}</small></div><div class="menu-empty"><h4>${esc(heading)}</h4><p>${esc(text)}</p>${progress}</div></div>`;
  }

  const baseLoad248=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoad248();
    try{await reconcileNative248(false)}catch(error){
      window.hoyNativeMenuState248={state:'blocked',locale:locale248(),message:error?.message||String(error),at:Date.now()};
      console.error('HOY native menu standard blocked unsafe guest menu delivery',error);
    }
  };

  const baseLabel248=menuStatusLabel;
  menuStatusLabel=function(m){
    const c=COPY[locale248()];
    if(m?.integrity==='native_language_blocked')return c.languagePending;
    if(m?.integrity==='native_source_only')return c.preparing;
    if(m?.nativeMenu&&m?.localized)return m.integrity==='partial'?c.partial:c.menu;
    return baseLabel248(m);
  };

  const basePanel248=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.integrity==='native_language_blocked')return blockedPanel248(m,'language');
    if(m?.integrity==='native_source_only')return blockedPanel248(m,'source');
    if(m?.nativeMenu&&m?.localized&&Array.isArray(m.categories)&&m.categories.length)return nativeMenuPanel248(m);
    return basePanel248(p);
  };

  window.hoyRefreshNativeMenus248=async function(){
    try{return await reconcileNative248(true)}catch(error){
      window.hoyNativeMenuState248={state:'blocked',locale:locale248(),message:error?.message||String(error),at:Date.now()};
      console.error('HOY native menu language refresh failed',error);
      return null;
    }
  };
})();

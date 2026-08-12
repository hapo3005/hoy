/* HOY 2.35.0 — full-catalog pagination + fail-closed German menu delivery */
(function(){
  if(window.__hoyMenuLanguageIntegrity2330)return;
  window.__hoyMenuLanguageIntegrity2330=true;
  window.hoyMenuLanguageIntegrityVersion='2.35.0';

  const PAGE_SIZE=500;
  const PRODUCTION_TRANSLATIONS=new Set(['curated','operator_confirmed']);
  const clean233=v=>String(v??'').trim();

  async function fetchAll233(table,select,configure){
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

  function translationReady233(item,t){
    if(!t||!PRODUCTION_TRANSLATIONS.has(clean233(t.translation_status)))return false;
    if(!clean233(t.name)||!clean233(t.category))return false;
    if(clean233(item.description)&&!clean233(t.description))return false;
    return true;
  }

  function categories233(rows,translations=null){
    const cats=new Map();
    for(const item of rows){
      const t=translations?.get(String(item.id))||null;
      const cat=clean233(t?.category)||clean233(item.category)||'Speisekarte';
      const name=clean233(t?.name)||clean233(item.name);
      const desc=t?clean233(t.description):clean233(item.description);
      const original=t?clean233(item.name):'';
      if(!cats.has(cat))cats.set(cat,[]);
      cats.get(cat).push([name,clean233(item.price_text),original,desc]);
    }
    return [...cats.entries()];
  }

  function relevantRows233(m,rows){
    const allowed=new Set((m?.contentSourceIds||[]).map(String));
    if(!allowed.size)return [];
    return rows.filter(item=>allowed.has(String(item.source_id)));
  }

  function blockUnsafeTextMenus233(reason){
    let blocked=0;
    for(const [id,m] of Object.entries(MENUS||{})){
      if(!m)continue;
      if(['image_complete','embed_complete'].includes(clean233(m.integrity))||['image_pages','official_embed'].includes(clean233(m.displayMode)))continue;
      const hasTextMenu=['complete','partial'].includes(clean233(m.integrity))||(clean233(m.status)==='structured'&&Array.isArray(m.categories)&&m.categories.length);
      if(!hasTextMenu)continue;
      MENUS[id]={
        ...m,
        status:'unavailable',
        integrity:'quality_blocked',
        categories:[],
        localized:false,
        locale:null,
        translationStatus:null,
        languageCoverage:null,
        note:reason||'Die vollständige und sprachlich geprüfte Speisekarte konnte nicht sicher geladen werden.'
      };
      blocked++;
    }
    return blocked;
  }

  async function reconcileFullCatalog233(){
    if(!sb)return;
    const [items,translations]=await Promise.all([
      fetchAll233(
        'menu_items',
        'id,restaurant_id,source_id,category,name,description,price_text,is_active,source_checked_at',
        q=>q.eq('is_active',true).order('restaurant_id').order('category').order('name').order('id')
      ),
      fetchAll233(
        'menu_item_translations',
        'menu_item_id,locale,category,name,description,translation_status',
        q=>q.eq('locale','de').order('menu_item_id')
      )
    ]);

    const byRestaurant=new Map();
    for(const item of items){
      const id=Number(item.restaurant_id);
      if(!byRestaurant.has(id))byRestaurant.set(id,[]);
      byRestaurant.get(id).push(item);
    }
    const de=new Map(translations.map(t=>[String(t.menu_item_id),t]));

    for(const [id,allRows] of byRestaurant){
      const m=MENUS[id];
      if(!m||!['complete','partial'].includes(clean233(m.integrity)))continue;
      const rows=relevantRows233(m,allRows);
      if(!rows.length)continue;

      const readyRows=rows.filter(item=>translationReady233(item,de.get(String(item.id))));
      const languageCoverage={
        locale:'de',
        total:rows.length,
        ready:readyRows.length,
        missing:rows.length-readyRows.length,
        complete:readyRows.length===rows.length
      };

      const base={...m,itemCount:rows.length,languageCoverage};
      if(state.lang==='de'&&languageCoverage.complete){
        const localized=categories233(rows,de);
        MENUS[id]={...base,categories:localized,localized:true,locale:'de',translationStatus:'curated',originalAvailable:false};
      }else{
        MENUS[id]={...base,categories:categories233(rows),localized:false,locale:null,translationStatus:null,originalAvailable:false};
      }
    }

    cloud.menuItemCount=items.length;
    window.hoyMenuCatalog233={items:items.length,deTranslations:translations.length,loadedAt:Date.now(),integrity:'ready'};
    window.hoyMenuLanguageIntegrityFailure=null;
    window.hoyMenuLanguageIntegrityState='ready';
    window.dispatchEvent(new CustomEvent('hoy:menu-language-ready',{detail:{locale:state.lang,items:items.length,deTranslations:translations.length,at:Date.now()}}));
    window.dispatchEvent(new CustomEvent('hoy:menus-ready',{detail:{locale:state.lang,fullCatalog:true,items:items.length,at:Date.now()}}));
  }

  const baseLoadCloudMenus233=loadCloudMenus;
  loadCloudMenus=async function(){
    window.hoyMenuLanguageIntegrityState='loading';
    await baseLoadCloudMenus233();
    try{await reconcileFullCatalog233()}
    catch(error){
      const message=error?.message||String(error);
      const blocked=blockUnsafeTextMenus233('HOY konnte die vollständige, sprachlich geprüfte Speisekarte gerade nicht sicher laden. Deshalb wird bewusst kein unvollständiger oder falschsprachiger Zwischenstand angezeigt.');
      window.hoyMenuLanguageIntegrityState='blocked';
      window.hoyMenuLanguageIntegrityFailure={message,blocked,at:Date.now()};
      window.hoyMenuCatalog233={items:null,deTranslations:null,loadedAt:Date.now(),integrity:'blocked'};
      console.error('HOY full menu catalog/language integrity blocked unsafe menu delivery',error);
      window.dispatchEvent(new CustomEvent('hoy:menu-language-blocked',{detail:{message,blocked,at:Date.now()}}));
    }
  };

  window.hoyMenuLanguageCoverage233For=p=>p?menuFor(p)?.languageCoverage||null:null;

  const baseMenuStatusLabel233=menuStatusLabel;
  menuStatusLabel=function(m){
    if(m?.integrity==='quality_blocked')return 'Speisekarte wird sicher synchronisiert';
    return baseMenuStatusLabel233(m);
  };

  const baseMenuPanel233=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.integrity==='quality_blocked'){
      return `<div class="menu-panel menu233-panel"><div class="menu233-quality-block"><div><small>MENÜ-SICHERHEIT</small><b>Kein unsicherer Zwischenstand.</b></div><p>${esc(m.note||'Die vollständige Speisekarte wird gerade sicher synchronisiert.')}</p><span>HOY zeigt lieber vorübergehend keine Karte als eine abgeschnittene oder falschsprachige Version.</span></div></div>`;
    }
    const html=baseMenuPanel233(p),coverage=m?.languageCoverage;
    if(state.lang!=='de'||!coverage||coverage.complete||!m?.categories?.length)return html;
    const notice=`<div class="menu233-language-gap"><div><small>SPRACHE</small><b>Originalsprache</b></div><p>Die deutsche Fassung ist noch nicht vollständig freigegeben. HOY zeigt deshalb bewusst keine gemischte oder scheinbar vollständig übersetzte Karte.</p><span>${coverage.ready}/${coverage.total} Positionen auf Deutsch geprüft</span></div>`;
    return html.replace(/(<div class="menu-panel[^>]*>)/,`$1${notice}`);
  };
})();

/* HOY Control 2.24.0 — paginated menu catalog + German language coverage audit */
(function(){
  if(window.__hoyAdminMenuLanguage224)return;
  window.__hoyAdminMenuLanguage224=true;
  window.hoyAdminMenuLanguageVersion='2.24.0';

  const PAGE_SIZE=500;
  const READY=new Set(['curated','operator_confirmed']);
  const CONTENT=new Set(['complete','partial']);
  const clean224=v=>String(v??'').trim();

  async function fetchAll224(table,select,configure){
    const rows=[];
    for(let from=0;from<10000;from+=PAGE_SIZE){
      let q=sb.from(table).select(select);
      q=configure(q).range(from,from+PAGE_SIZE-1);
      const {data,error}=await q;
      if(error)throw error;
      const page=data||[];rows.push(...page);
      if(page.length<PAGE_SIZE)return rows;
    }
    throw new Error(`HOY Control ${table}: pagination safety limit reached`);
  }

  async function hydrate224(){
    const [items,translations]=await Promise.all([
      fetchAll224('menu_items','id,restaurant_id,source_id,category,name,description,price_text,is_active,source_checked_at',q=>q.eq('is_active',true).order('restaurant_id').order('category').order('name').order('id')),
      fetchAll224('menu_item_translations','menu_item_id,locale,category,name,description,translation_status',q=>q.eq('locale','de').order('menu_item_id'))
    ]);
    state.menuItems=items;
    state.menuTranslations=translations;
    window.hoyAdminMenuCatalog224={items:items.length,deTranslations:translations.length,loadedAt:Date.now()};
  }

  const baseLoadData224=loadData;
  loadData=async function(){await baseLoadData224();await hydrate224()};

  function sourceIds224(r){
    return new Set(menuFor(r.id).filter(s=>s.is_official!==false&&CONTENT.has(clean224(s.completeness_status))).map(s=>String(s.id)));
  }
  function translationMap224(){return new Map((state.menuTranslations||[]).map(t=>[String(t.menu_item_id),t]))}
  function ready224(item,t){
    if(!t||!READY.has(clean224(t.translation_status)))return false;
    if(!clean224(t.name)||!clean224(t.category))return false;
    if(clean224(item.description)&&!clean224(t.description))return false;
    return true;
  }
  function language224(r,map=translationMap224()){
    const ids=sourceIds224(r);
    const rows=itemsFor(r.id).filter(i=>ids.has(String(i.source_id)));
    const ready=rows.filter(i=>ready224(i,map.get(String(i.id)))).length;
    return {total:rows.length,ready,missing:rows.length-ready,complete:rows.length>0&&ready===rows.length};
  }
  window.hoyAdminMenuLanguage224For=language224;

  function rows224(){
    const map=translationMap224();
    return state.restaurants.filter(r=>r.is_published).map(r=>({r,lang:language224(r,map)})).filter(x=>x.lang.total>0).sort((a,b)=>b.lang.missing-a.lang.missing||b.lang.total-a.lang.total||a.r.name.localeCompare(b.r.name));
  }
  window.hoyAdminMenuLanguageRows224=rows224;

  function decorate224(){
    if(state.view!=='menu_integrity')return;
    const kpis=root.querySelector('.mi223-kpis'),focus=root.querySelector('.mi223-focus');
    if(!kpis||!focus||root.querySelector('[data-mi224-language]'))return;
    const rows=rows224(),complete=rows.filter(x=>x.lang.complete).length,affected=rows.filter(x=>x.lang.missing>0),missing=affected.reduce((n,x)=>n+x.lang.missing,0),loaded=state.menuItems.length;
    kpis.insertAdjacentHTML('beforeend',`<div class="mi223-kpi ${affected.length?'warn':'good'}" data-mi224-language><strong>${complete}/${rows.length}</strong><span>Deutsch vollständig</span><small>${missing} offene Positionen · ${loaded} Items vollständig geladen</small></div>`);
    const top=affected.slice(0,10);
    focus.insertAdjacentHTML('afterend',`<section class="panel mi224-panel" data-mi224-language><div class="panel-head"><h2>Sprachvollständigkeit · Deutsch</h2><small>100 % oder nicht als deutsch ausgeben</small></div>${top.length?`<div class="mi224-list">${top.map(x=>`<article><div><b>${esc(x.r.name)}</b><small>${x.lang.ready}/${x.lang.total} Positionen redaktionell auf Deutsch · ${x.lang.missing} offen</small></div><span class="mi224-progress"><i style="width:${x.lang.total?Math.round(x.lang.ready/x.lang.total*100):0}%"></i></span><strong>${x.lang.total?Math.round(x.lang.ready/x.lang.total*100):0}%</strong></article>`).join('')}</div>`:'<div class="alert good"><b>Deutsch vollständig:</b> Für alle strukturierten Gastkarten ist die deutsche Fassung zu 100 % freigegeben.</div>'}<div class="coverage-note">Regel: Eine Karte bekommt die Kennzeichnung „auf Deutsch“ erst, wenn jede freigegebene Position inklusive Kategorie und vorhandener Beschreibung eine geprüfte deutsche Fassung besitzt. Teilübersetzungen werden nicht gemischt.</div></section>`);
  }

  const baseRender224=render;
  render=function(){const result=baseRender224();decorate224();return result};

  const baseQualityInfo224=qualityInfo;
  qualityInfo=function(r){
    const q=baseQualityInfo224(r),lang=language224(r);
    if(!lang.total||lang.complete)return q;
    return {score:Math.max(0,q.score-5),missing:[...new Set([...q.missing,'Speisekarte DE'])]};
  };
})();

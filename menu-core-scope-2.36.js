/* HOY 2.36.0 — one primary main menu owns the normal menu tab; supplements stay separate */
(function(){
  if(window.__hoyMenuCoreScope2360)return;
  window.__hoyMenuCoreScope2360=true;
  window.hoyMenuCoreScopeVersion='2.36.0';

  const NON_CORE=new Set(['wine','dessert','drinks','highlights','secondary']);
  const ACTIVE_CONTENT=new Set(['complete','partial','image_complete']);
  const IGNORE=new Set(['superseded','invalid','unknown']);
  const clean=v=>String(v??'').trim();
  const scope=s=>clean(s?.coverage_scope)||'full_menu';
  const status=s=>clean(s?.completeness_status)||'unknown';
  const isCore=s=>!NON_CORE.has(scope(s));
  const scopeWeight=s=>({full_menu:100,food:90,dinner:70,lunch:70,breakfast:60,tasting:50,day_menu:40}[scope(s)]||0);
  const statusWeight=s=>({complete:500,image_complete:450,partial:300}[status(s)]||0);
  const sourceDate=s=>clean(s?.completeness_checked_at||s?.last_checked_at);

  function primaryCore(sources){
    return [...sources].sort((a,b)=>scopeWeight(b)-scopeWeight(a)||statusWeight(b)-statusWeight(a)||sourceDate(b).localeCompare(sourceDate(a)))[0]||null;
  }

  async function isolateCoreScope(){
    if(!sb)return;
    const {data,error}=await sb.from('menu_sources')
      .select('id,restaurant_id,is_official,coverage_scope,completeness_status,completeness_checked_at,last_checked_at')
      .eq('is_official',true);
    if(error)throw error;

    const byRestaurant=new Map();
    for(const source of data||[]){
      const id=Number(source.restaurant_id);
      if(!byRestaurant.has(id))byRestaurant.set(id,[]);
      byRestaurant.get(id).push(source);
    }

    let isolated=0;
    for(const [id,sources] of byRestaurant){
      const valid=sources.filter(s=>s?.is_official!==false&&!IGNORE.has(status(s)));
      const coreContent=valid.filter(s=>isCore(s)&&ACTIVE_CONTENT.has(status(s)));
      const primary=primaryCore(coreContent);
      if(!primary)continue;
      const otherContent=valid.filter(s=>ACTIVE_CONTENT.has(status(s))&&String(s.id)!==String(primary.id));
      if(!otherContent.length)continue;

      const menu=MENUS[id];
      if(!menu||['image_complete','embed_complete'].includes(clean(menu.integrity)))continue;
      const coreIds=[String(primary.id)];
      const supplementalIds=otherContent.map(s=>String(s.id));
      MENUS[id]={
        ...menu,
        contentSourceIds:coreIds,
        coreSourceIds:coreIds,
        supplementalSourceIds:supplementalIds,
        coreScopeIsolated:true,
        primaryCoreScope:scope(primary)
      };
      isolated++;
    }

    window.hoyMenuCoreScope236={isolated,loadedAt:Date.now()};
    window.dispatchEvent(new CustomEvent('hoy:menu-core-scope-ready',{detail:{isolated,at:Date.now()}}));
  }

  const baseLoadCloudMenus=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus();
    try{await isolateCoreScope()}
    catch(error){
      console.error('HOY core menu scope isolation failed',error);
      throw error;
    }
  };
})();

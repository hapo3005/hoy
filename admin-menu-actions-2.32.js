/* HOY Control 2.32.0 — operational batches follow the exact food-menu target */
(function(){
  if(window.__hoyAdminMenuActions232)return;
  window.__hoyAdminMenuActions232=true;
  window.hoyAdminMenuActionsVersion='2.32.0';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const TRUSTED=new Set(['first_party','operator_social','authorized_transactional','verified_public_snapshot']);
  const COMPLETE=new Set(['complete','image_complete']);
  const SOCIAL=/facebook\.com|instagram\.com|tiktok\.com/i;
  const clean=v=>String(v??'').trim();
  const authority=s=>clean(s?.source_authority)||(s?.is_official===false?'unverified_third_party':'first_party');
  const expectsFood=r=>clean(r?.menu_expectation)==='food'||(!clean(r?.menu_expectation)&&['restaurant','chiringuito','beach_club'].includes(clean(r?.venue_type)));
  const coreFood=()=> (state.restaurants||[]).filter(r=>r.is_published&&CORE_AREAS.has(clean(r.area))&&expectsFood(r));
  const trustedSources=id=>(state.menuSources||[]).filter(s=>Number(s.restaurant_id)===Number(id)&&CORE_SCOPES.has(clean(s.coverage_scope))&&TRUSTED.has(authority(s)));
  const usable=id=>trustedSources(id).some(s=>COMPLETE.has(clean(s.completeness_status)));
  const ownedWebsite=r=>/^https:\/\//i.test(clean(r?.website))&&!SOCIAL.test(clean(r?.website));
  const openFood=()=>coreFood().filter(r=>!usable(r.id));
  const checks=id=>(state.menuDiscoveryChecks||[]).filter(x=>Number(x.restaurant_id)===Number(id));
  const lastWebsiteCheck=id=>checks(id).filter(x=>x.channel==='website').sort((a,b)=>String(b.checked_at||'').localeCompare(String(a.checked_at||'')))[0]||null;
  const due=id=>{const c=lastWebsiteCheck(id);if(!c)return true;const next=c.next_review_at?new Date(c.next_review_at).getTime():0;return !next||next<=Date.now()};
  let busy=false;

  async function discover(ids,onlyMissing=true){
    const {data,error}=await sb.functions.invoke('menu-discovery',{body:{action:'discover',restaurant_ids:ids,only_missing:onlyMissing,limit:ids.length}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data||{};
  }
  async function handoff(ids){
    try{const{data,error}=await sb.functions.invoke('menu-social-handoff',{body:{restaurant_ids:ids}});if(error)throw error;return Number(data?.handed_off||0)}catch(error){console.warn('HOY social handoff skipped',error);return 0}
  }
  async function run(rows,label,onlyMissing=true){
    if(busy)return;if(!rows.length)return toast(`${label}: keine passenden Food-Lücken.`);
    busy=true;let processed=0,found=0,social=0,failed=0;
    try{
      for(let i=0;i<rows.length;i+=4){const batch=rows.slice(i,i+4),ids=batch.map(r=>Number(r.id));const d=await discover(ids,onlyMissing);processed+=Number(d.processed||0);found+=Number(d.found||0);failed+=(d.results||[]).filter(x=>x.status==='failed').length;social+=await handoff(ids)}
      await loadData();render();toast(`${label}: ${found} Menüquelle${found===1?'':'n'} · ${social} Social-Übergabe${social===1?'':'n'} · ${processed} geprüft`);
    }catch(error){console.error('HOY exact food batch failed',error);toast(error?.message||'Food-Menübatch fehlgeschlagen')}
    finally{busy=false}
  }

  function rowRestaurant(btn){const row=btn.closest('[data-mwb230-row]');if(!row)return null;const name=clean(row.querySelector('td b')?.textContent);return coreFood().find(r=>clean(r.name)===name)||null}

  document.addEventListener('click',event=>{
    const t=event.target instanceof Element?event.target.closest('[data-mwb230-batch],[data-mwb230-website],[data-mwb230-recheck]'):null;
    if(!t||state.view!=='menu_discovery')return;
    event.preventDefault();event.stopImmediatePropagation();
    if(t.matches('[data-mwb230-batch="first"]'))return void run(openFood().filter(r=>ownedWebsite(r)&&!lastWebsiteCheck(r.id)).slice(0,12),'Neue Food-Website-Lücken',true);
    if(t.matches('[data-mwb230-batch="due"]'))return void run(openFood().filter(r=>ownedWebsite(r)&&due(r.id)).slice(0,12),'Fällige Food-Rechecks',false);
    const r=rowRestaurant(t);if(!r)return void toast('Betrieb konnte nicht der Food-Zielliste zugeordnet werden.');
    if(usable(r.id))return void toast('Diese Essenskarte ist bereits vollständig nutzbar.');
    if(t.matches('[data-mwb230-website]'))return void run([r],r.name,true);
    if(t.matches('[data-mwb230-recheck]'))return void run([r],r.name,false);
  },true);

  window.hoyExactFoodBatch232={openFood,usable,due};
})();

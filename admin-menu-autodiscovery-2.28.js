/* HOY Control 2.28.1 — authenticated official-site menu auto-discovery */
(function(){
  if(window.__hoyAdminMenuAutoDiscovery228)return;
  window.__hoyAdminMenuAutoDiscovery228=true;
  window.hoyAdminMenuAutoDiscoveryVersion='2.28.1';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const FALLBACK_FOOD_TYPES=new Set(['restaurant','chiringuito','beach_club']);
  const ACTIVE_CORE=new Set(['complete','image_complete','partial','source_only','insufficient']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const SOCIAL=/facebook\.com|instagram\.com|tiktok\.com/i;
  const clean228=v=>String(v??'').trim();
  const runState={busy:false,last:null};

  function expectsFood228(r){const e=clean228(r?.menu_expectation);return e?e==='food':FALLBACK_FOOD_TYPES.has(clean228(r?.venue_type))}
  function ownedWebsite228(r){const u=clean228(r?.website);return /^https:\/\//i.test(u)&&!SOCIAL.test(u)}
  function hasCore228(id){return (state.menuSources||[]).some(s=>Number(s.restaurant_id)===Number(id)&&s.is_official!==false&&CORE_SCOPES.has(clean228(s.coverage_scope))&&ACTIVE_CORE.has(clean228(s.completeness_status)))}
  function coreRows228(area=null){return (state.restaurants||[]).filter(r=>r.is_published&&CORE_AREAS.has(clean228(r.area))&&(!area||r.area===area))}
  function missingRows228(area=null,foodOnly=false){return coreRows228(area).filter(r=>!hasCore228(r.id)&&(!foodOnly||expectsFood228(r)))}
  function runnable228(area=null,foodOnly=false){return missingRows228(area,foodOnly).filter(ownedWebsite228)}
  function metrics228(){
    const all=coreRows228(),food=all.filter(expectsFood228),foodReady=food.filter(r=>hasCore228(r.id)),missing=all.filter(r=>!hasCore228(r.id));
    return {all:all.length,food:food.length,foodReady:foodReady.length,foodMissing:food.length-foodReady.length,missing:missing.length,runnable:missing.filter(ownedWebsite228).length};
  }

  function panel228(){
    const m=metrics228(),last=runState.last;
    const lastText=last?`${last.found} neue Quelle${last.found===1?'':'n'} gefunden · ${last.processed} geprüft${last.failed?` · ${last.failed} technisch offen`:''}`:'Noch kein automatischer Lauf in dieser Sitzung.';
    return `<section class="mad228-panel ${runState.busy?'busy':''}" id="mad228Panel"><div class="mad228-head"><div><small>AUTOMATISCHE MENÜ-DISCOVERY</small><h3>Offizielle Betreiberquellen zuerst.</h3><p>HOY prüft ausschließlich hinterlegte Betreiberwebsites, folgt Carta/Menu/PDF/QR-Hinweisen und legt Treffer zunächst als ungeprüfte offizielle Quelle an. Keine automatisch gefundene Karte wird dadurch als vollständig veröffentlicht.</p></div><div class="mad228-actions"><button class="primary" data-mad228-run="food">Food-Lücken prüfen</button><button class="ghost" data-mad228-run="La Manga del Mar Menor">La Manga prüfen</button><button class="ghost" data-mad228-run="Cabo de Palos">Cabo prüfen</button></div></div><div class="mad228-status"><div class="mad228-stat"><b>${m.foodReady}/${m.food}</b><span>Food-Betriebe mit Kernquelle</span></div><div class="mad228-stat"><b>${m.foodMissing}</b><span>echte Food-Lücken</span></div><div class="mad228-stat"><b>${m.runnable}</b><span>alle Lücken mit eigener Website</span></div><div class="mad228-stat"><b>${m.missing}</b><span>alle Kerngebiets-Lücken</span></div></div><div class="mad228-progress">${runState.busy?'HOY prüft Betreiberwebsites in kleinen sicheren Batches …':lastText}</div></section>`;
  }

  async function invoke228(ids){
    const {data,error}=await sb.functions.invoke('menu-discovery',{body:{action:'discover',restaurant_ids:ids,only_missing:true,limit:ids.length}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data||{};
  }
  async function runRows228(rows,label){
    if(runState.busy)return;
    if(!rows.length){toast('Für diesen Lauf gibt es keine automatisch prüfbare Website-Lücke.');return}
    runState.busy=true;render();
    const summary={processed:0,found:0,failed:0,blocked:0,noMenu:0};
    try{
      for(let i=0;i<rows.length;i+=4){
        const batch=rows.slice(i,i+4),data=await invoke228(batch.map(r=>Number(r.id))),results=data.results||[];
        summary.processed+=Number(data.processed||results.length||0);summary.found+=Number(data.found||0);
        summary.failed+=results.filter(x=>x.status==='failed').length;summary.blocked+=results.filter(x=>x.status==='website_blocked').length;summary.noMenu+=results.filter(x=>x.status==='checked_no_menu').length;
      }
      runState.last=summary;
      await loadData();
      toast(`${label}: ${summary.found} neue offizielle Menüquelle${summary.found===1?'':'n'} gefunden`);
    }catch(error){console.error('HOY automatic menu discovery failed',error);runState.last={...summary,failed:summary.failed+1};toast(error?.message||'Automatische Menüprüfung fehlgeschlagen')}
    finally{runState.busy=false;render()}
  }

  function mount228(){
    if(state.view!=='menu_discovery'||!state.user||!state.admin)return;
    const kpis=document.querySelector('.ms226-kpis');
    if(kpis&&!document.getElementById('mad228Panel'))kpis.insertAdjacentHTML('beforebegin',panel228());
    document.querySelectorAll('[data-mad228-run]').forEach(btn=>btn.addEventListener('click',()=>{
      const mode=btn.dataset.mad228Run;
      if(mode==='food')runRows228(runnable228(null,true),'Food-Lücken');
      else runRows228(runnable228(mode,false),mode==='Cabo de Palos'?'Cabo de Palos':'La Manga');
    }));

    document.querySelectorAll('[data-ms227-row]').forEach(row=>{
      const edit=row.querySelector('[data-edit]'),id=Number(edit?.dataset.edit),r=state.restaurants.find(x=>Number(x.id)===id);
      if(!edit||!r||hasCore228(id)||!ownedWebsite228(r)||row.querySelector('[data-mad228-one]'))return;
      const btn=document.createElement('button');btn.className='ghost';btn.dataset.mad228One=String(id);btn.textContent='Website prüfen';btn.style.marginRight='6px';
      btn.onclick=()=>runRows228([r],r.name);edit.parentElement?.insertBefore(btn,edit);
    });
  }

  const baseRender228=render;
  render=function(){const out=baseRender228();queueMicrotask(mount228);return out};

  window.hoyMenuAutoDiscoveryMetrics228=metrics228;
})();

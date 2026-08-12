/* HOY Control 2.30.0 — one operational menu-coverage workbench for the core region */
(function(){
  if(window.__hoyAdminMenuWorkbench230)return;
  window.__hoyAdminMenuWorkbench230=true;
  window.hoyAdminMenuWorkbenchVersion='2.30.0';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const CLOSED_CHECKS=new Set(['checked_no_menu','blocked','unavailable']);
  const clean230=v=>String(v??'').trim();
  const safeHttps230=v=>/^https:\/\//i.test(clean230(v))?clean230(v):'';
  const SOCIAL=/instagram\.com|facebook\.com|tiktok\.com/i;
  const state230={busy:false,last:null,filter:'open',area:'all'};
  const laneOrder={editorial:100,website_recheck_due:92,website_first:85,social_manual:70,direct_contact_later:55,website_waiting:40,research_route:30,ready:0};
  const laneMeta={
    editorial:{label:'Redaktionell strukturieren',tone:'danger',next:'Offizielle Quelle liegt vor · Entwurf prüfen und Vollständigkeit separat bestätigen'},
    website_recheck_due:{label:'Website erneut prüfen',tone:'warn',next:'Wiedervorlage ist fällig · Betreiberwebsite erneut identitätsgesichert durchsuchen'},
    website_first:{label:'Website erstmals prüfen',tone:'warn',next:'Eigene Betreiberwebsite automatisiert nach Carta/Menu/PDF/QR prüfen'},
    social_manual:{label:'Social manuell verifizieren',tone:'social',next:'Bekannten Social-Kanal öffnen · nur eindeutige Betreiber-Evidenz übernehmen'},
    direct_contact_later:{label:'Betreiberweg vorbereitet',tone:'muted',next:'Digital keine belastbare Karte · Kontaktweg für spätere Aktivierung vorbereitet · kein Versand'},
    website_waiting:{label:'Wiedervorlage geplant',tone:'muted',next:'Website bereits geprüft · vor dem nächsten Prüfdatum nicht erneut crawlen'},
    research_route:{label:'Route recherchieren',tone:'muted',next:'Noch keine belastbare Betreiberwebsite, Social-Verifikation oder direkte Route'},
    ready:{label:'In HOY nutzbar',tone:'good',next:'Kernkarte belastbar · nur Aktualität weiter überwachen'}
  };

  const sales230=id=>(state.sales||[]).find(x=>Number(x.restaurant_id)===Number(id))||{};
  const menuSources230=id=>(state.menuSources||[]).filter(s=>Number(s.restaurant_id)===Number(id)&&s.is_official!==false&&CORE_SCOPES.has(clean230(s.coverage_scope)));
  const sourceItems230=id=>(state.menuItems||[]).filter(x=>String(x.source_id||'')===String(id)&&x.is_active!==false).length;
  const checks230=id=>(state.menuDiscoveryChecks||[]).filter(x=>Number(x.restaurant_id)===Number(id));
  const payload230=s=>s?.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};
  const socialRows230=()=>typeof window.hoyAdminMenuSocialRows227==='function'?window.hoyAdminMenuSocialRows227():[];

  function renderable230(s){
    const status=clean230(s?.completeness_status),p=payload230(s);
    if(status==='image_complete'&&Array.isArray(p.pages)&&p.pages.some(x=>safeHttps230(typeof x==='string'?x:x?.url)))return true;
    if(status==='complete'&&clean230(p.mode)==='official_embed'&&safeHttps230(p.embed_url))return true;
    return status==='complete'&&sourceItems230(s.id)>0;
  }
  function importable230(s){return ['source_only','partial'].includes(clean230(s?.completeness_status))&&safeHttps230(s?.source_url)}
  function latest230(rows){return [...rows].sort((a,b)=>new Date(b.checked_at||0)-new Date(a.checked_at||0))[0]||null}
  function websiteCheck230(id){return latest230(checks230(id).filter(c=>['website','qr'].includes(clean230(c.channel))))}
  function socialCheck230(id){return latest230(checks230(id).filter(c=>['instagram','facebook'].includes(clean230(c.channel))))}
  function due230(check){
    if(!check)return false;
    const next=new Date(check.next_review_at||0).getTime();
    return !Number.isFinite(next)||next<=Date.now();
  }
  function closedFresh230(check){return !!check&&CLOSED_CHECKS.has(clean230(check.status))&&!due230(check)}
  function fmtDate230(value){const d=new Date(value||0);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d):'—'}
  function ownedWebsite230(r){const u=safeHttps230(r?.website);return u&&!SOCIAL.test(u)?u:''}
  function socialRefs230(r){const row=socialRows230().find(x=>Number(x.r?.id)===Number(r.id));return row?.social||[]}
  function direct230(id){const s=sales230(id);return {email:clean230(s.contact_email),phone:clean230(s.contact_phone),channel:clean230(s.preferred_channel),confidence:clean230(s.contact_confidence)}}
  function hasDirect230(id){const d=direct230(id);return !!(d.email||d.phone)}

  function classify230(r){
    const sources=menuSources230(r.id),renderable=sources.find(renderable230),importable=sources.find(importable230),insufficient=sources.find(s=>clean230(s.completeness_status)==='insufficient');
    const website=ownedWebsite230(r),webCheck=websiteCheck230(r.id),socialCheck=socialCheck230(r.id),social=socialRefs230(r),direct=direct230(r.id);
    let lane='research_route';
    if(renderable)lane='ready';
    else if(importable)lane='editorial';
    else if(website&&(insufficient||webCheck)&&due230(webCheck))lane='website_recheck_due';
    else if(website&&!webCheck&&!insufficient)lane='website_first';
    else if(social.length&&!closedFresh230(socialCheck))lane='social_manual';
    else if(hasDirect230(r.id))lane='direct_contact_later';
    else if(website&&(insufficient||closedFresh230(webCheck)))lane='website_waiting';
    else if(website)lane='website_first';
    const meta=laneMeta[lane];
    return {r,lane,...meta,sources,renderable,importable,insufficient,website,webCheck,socialCheck,social,direct,priority:laneOrder[lane]||0};
  }

  function rows230(){
    return (state.restaurants||[]).filter(r=>r.is_published&&CORE_AREAS.has(clean230(r.area))).map(classify230).sort((a,b)=>b.priority-a.priority||a.r.name.localeCompare(b.r.name,'de'));
  }
  window.hoyAdminMenuWorkbenchRows230=rows230;

  function metrics230(rows=rows230()){
    const count=lane=>rows.filter(x=>x.lane===lane).length;
    return {total:rows.length,ready:count('ready'),open:rows.filter(x=>x.lane!=='ready').length,editorial:count('editorial'),websiteFirst:count('website_first'),recheck:count('website_recheck_due'),social:count('social_manual'),direct:count('direct_contact_later'),waiting:count('website_waiting'),research:count('research_route')};
  }
  window.hoyAdminMenuWorkbenchMetrics230=metrics230;

  function evidence230(x){
    if(x.lane==='editorial')return `${clean230(x.importable?.source_label)||'Offizielle Kartenquelle'} · ${clean230(x.importable?.completeness_status)}`;
    if(x.lane==='website_recheck_due')return `letzter Website-Check ${fmtDate230(x.webCheck?.checked_at)} · Wiedervorlage ${fmtDate230(x.webCheck?.next_review_at)}`;
    if(x.lane==='website_first')return x.website?'eigene Betreiberwebsite vorhanden':'Website offen';
    if(x.lane==='social_manual')return `${x.social.length} bekannter Social-Kanal${x.social.length===1?'':'äle'} · noch nicht als Menü-Evidenz freigegeben`;
    if(x.lane==='direct_contact_later')return [x.direct.channel,x.direct.confidence&&`Kontakt ${x.direct.confidence}`].filter(Boolean).join(' · ')||'direkter Kontakt hinterlegt';
    if(x.lane==='website_waiting')return `nächste Prüfung ${fmtDate230(x.webCheck?.next_review_at)}`;
    if(x.lane==='ready')return x.renderable?.completeness_status==='image_complete'?'vollständige Betreiber-Bildkarte':clean230(x.renderable?.source_label)||'vollständige Kernkarte';
    return 'keine belastbare Betreiberroute dokumentiert';
  }

  async function invokeDiscovery230(ids,onlyMissing){
    const {data,error}=await sb.functions.invoke('menu-discovery',{body:{action:'discover',restaurant_ids:ids,only_missing:onlyMissing,limit:ids.length}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data||{};
  }
  async function handoff230(ids){
    try{
      const {data,error}=await sb.functions.invoke('menu-social-handoff',{body:{restaurant_ids:ids}});
      if(error)throw error;if(data?.error)throw new Error(data.error);return Number(data?.handed_off||0);
    }catch(error){console.warn('HOY workbench social handoff unavailable',error);return 0}
  }
  async function runDiscovery230(rows,onlyMissing,label){
    if(state230.busy)return;
    if(!rows.length){toast('Für diese Arbeitsbahn gibt es aktuell nichts zu prüfen.');return}
    state230.busy=true;state230.last=null;render();
    const summary={processed:0,found:0,social:0,failed:0};
    try{
      for(let i=0;i<rows.length;i+=4){
        const batch=rows.slice(i,i+4),ids=batch.map(x=>Number(x.r.id)),data=await invokeDiscovery230(ids,onlyMissing),results=data.results||[];
        summary.processed+=Number(data.processed||results.length||0);summary.found+=Number(data.found||0);summary.failed+=results.filter(x=>x.status==='failed').length;summary.social+=await handoff230(ids);
      }
      state230.last={...summary,label,at:Date.now()};
      await loadData();
      toast(`${label}: ${summary.found} neue offizielle Quelle${summary.found===1?'':'n'} · ${summary.social} Social-Übergabe${summary.social===1?'':'n'}`);
    }catch(error){console.error('HOY core menu workbench discovery failed',error);state230.last={...summary,label,failed:summary.failed+1,error:error?.message||String(error),at:Date.now()};toast(error?.message||'Menüprüfung fehlgeschlagen')}
    finally{state230.busy=false;render()}
  }

  function originalRow230(id){return [...document.querySelectorAll('[data-ms227-row]')].find(row=>Number(row.querySelector('[data-edit]')?.dataset.edit)===Number(id))||null}
  function openProfile230(id){originalRow230(id)?.querySelector('[data-edit]')?.click()}
  function openEditorial230(id){const row=originalRow230(id),btn=row?.querySelector('[data-mei229-action]');if(btn)btn.click();else{row?.scrollIntoView({behavior:'smooth',block:'center'});toast('Die offizielle Quelle ist unten zur redaktionellen Strukturierung markiert.')}}

  function action230(x){
    if(x.lane==='editorial')return `<button class="primary" data-mwb230-editorial="${Number(x.r.id)}">Entwurf prüfen</button>`;
    if(x.lane==='website_first')return `<button class="ghost" data-mwb230-website="${Number(x.r.id)}">Website prüfen</button>`;
    if(x.lane==='website_recheck_due')return `<button class="ghost" data-mwb230-recheck="${Number(x.r.id)}">Erneut prüfen</button>`;
    if(x.lane==='social_manual'&&x.social[0]?.url)return `<a class="ghost mwb230-link" href="${esc(x.social[0].url)}" target="_blank" rel="noopener noreferrer">Social öffnen ↗</a>`;
    if(['direct_contact_later','research_route','website_waiting'].includes(x.lane))return `<button class="ghost" data-mwb230-profile="${Number(x.r.id)}">Profil</button>`;
    return '<span class="mwb230-done">✓</span>';
  }

  function row230(x){
    return `<tr data-mwb230-row data-lane="${esc(x.lane)}" data-area="${esc(x.r.area||'')}"><td><b>${esc(x.r.name)}</b><small>${esc(x.r.area||'')} · ${esc(x.r.venue_type||'')}</small></td><td><span class="mwb230-lane ${esc(x.tone)}">${esc(x.label)}</span></td><td><small>${esc(evidence230(x))}</small><span class="mwb230-next">${esc(x.next)}</span></td><td>${action230(x)}</td></tr>`;
  }

  function panel230(){
    const rows=rows230(),m=metrics230(rows),open=rows.filter(x=>x.lane!=='ready'),last=state230.last;
    const lastText=last?`${esc(last.label)} · ${last.processed} geprüft · ${last.found} Quelle${last.found===1?'':'n'} gefunden${last.social?` · ${last.social} Social-Übergabe${last.social===1?'':'n'}`:''}${last.failed?` · ${last.failed} technisch offen`:''}`:'Bereit. Keine automatische Veröffentlichung und kein Outreach.';
    return `<section class="mwb230" id="mwb230"><div class="mwb230-head"><div><small>CORE MENU WORKBENCH · LA MANGA + CABO</small><h3>Eine Queue. Eine nächste Aktion pro Betrieb.</h3><p>HOY trennt belastbare Betreiberquellen, fällige Rechecks, manuelle Social-Verifikation und spätere Betreiberaktivierung. Automatisierung beschleunigt die Recherche – sie senkt niemals den Vertrauensstandard.</p></div><div class="mwb230-actions"><button class="primary" data-mwb230-batch="first" ${m.websiteFirst?'':'disabled'}>Neue Website-Lücken prüfen · ${m.websiteFirst}</button><button class="ghost" data-mwb230-batch="due" ${m.recheck?'':'disabled'}>Fällige Rechecks · ${m.recheck}</button></div></div><div class="mwb230-kpis"><div><b>${m.ready}/${m.total}</b><span>kernseitig nutzbar</span></div><div><b>${m.open}</b><span>noch offen</span></div><div><b>${m.editorial}</b><span>redaktionell</span></div><div><b>${m.websiteFirst+m.recheck}</b><span>Website-Aktionen</span></div><div><b>${m.social}</b><span>Social manuell</span></div><div><b>${m.direct}</b><span>Betreiberweg später</span></div><div><b>${m.research}</b><span>Route recherchieren</span></div></div><div class="mwb230-guard"><b>Vertrauensregel</b><span>Social-/Sales-Hinweise sind Recherchewege, keine automatische Betreiber-Evidenz. Direkte Kontakte bleiben vorbereitet; es wird nichts versendet.</span></div><div class="mwb230-toolbar"><select id="mwb230Lane"><option value="open">Alle offenen (${m.open})</option><option value="editorial">Redaktionell strukturieren (${m.editorial})</option><option value="website_recheck_due">Fällige Rechecks (${m.recheck})</option><option value="website_first">Website erstmals prüfen (${m.websiteFirst})</option><option value="social_manual">Social manuell (${m.social})</option><option value="direct_contact_later">Betreiberweg später (${m.direct})</option><option value="website_waiting">Wiedervorlage geplant (${m.waiting})</option><option value="research_route">Route recherchieren (${m.research})</option><option value="ready">Fertig (${m.ready})</option></select><select id="mwb230Area"><option value="all">La Manga + Cabo</option><option value="La Manga del Mar Menor">La Manga</option><option value="Cabo de Palos">Cabo de Palos</option></select></div><div class="mwb230-table"><table><thead><tr><th>Betrieb</th><th>Arbeitsbahn</th><th>Evidenz / nächster Schritt</th><th>Aktion</th></tr></thead><tbody>${rows.map(row230).join('')}</tbody></table></div><div class="mwb230-progress ${state230.busy?'busy':''}">${state230.busy?'HOY prüft Betreiberwebsites in sicheren 4er-Batches …':lastText}</div></section>`;
  }

  function applyFilters230(){
    const root=document.getElementById('mwb230'),lane=root?.querySelector('#mwb230Lane')?.value||state230.filter,area=root?.querySelector('#mwb230Area')?.value||state230.area;
    state230.filter=lane;state230.area=area;
    root?.querySelectorAll('[data-mwb230-row]').forEach(row=>{const okLane=lane==='open'?row.dataset.lane!=='ready':row.dataset.lane===lane,okArea=area==='all'||row.dataset.area===area;row.hidden=!(okLane&&okArea)});
  }

  function wire230(){
    const root=document.getElementById('mwb230');if(!root)return;
    const lane=root.querySelector('#mwb230Lane'),area=root.querySelector('#mwb230Area');if(lane)lane.value=state230.filter;if(area)area.value=state230.area;lane?.addEventListener('change',applyFilters230);area?.addEventListener('change',applyFilters230);applyFilters230();
    root.querySelector('[data-mwb230-batch="first"]')?.addEventListener('click',()=>runDiscovery230(rows230().filter(x=>x.lane==='website_first'),true,'Neue Website-Lücken'));
    root.querySelector('[data-mwb230-batch="due"]')?.addEventListener('click',()=>runDiscovery230(rows230().filter(x=>x.lane==='website_recheck_due'),false,'Fällige Website-Rechecks'));
    root.querySelectorAll('[data-mwb230-website]').forEach(btn=>btn.addEventListener('click',()=>{const x=rows230().find(v=>Number(v.r.id)===Number(btn.dataset.mwb230Website));if(x)runDiscovery230([x],true,x.r.name)}));
    root.querySelectorAll('[data-mwb230-recheck]').forEach(btn=>btn.addEventListener('click',()=>{const x=rows230().find(v=>Number(v.r.id)===Number(btn.dataset.mwb230Recheck));if(x)runDiscovery230([x],false,`${x.r.name} · Recheck`)}));
    root.querySelectorAll('[data-mwb230-editorial]').forEach(btn=>btn.addEventListener('click',()=>openEditorial230(btn.dataset.mwb230Editorial)));
    root.querySelectorAll('[data-mwb230-profile]').forEach(btn=>btn.addEventListener('click',()=>openProfile230(btn.dataset.mwb230Profile)));
  }

  function mount230(){
    if(state.view!=='menu_discovery'||!state.user||!state.admin)return;
    const old=document.getElementById('mad228Panel');
    if(old){old.hidden=true;if(!document.getElementById('mwb230'))old.insertAdjacentHTML('beforebegin',panel230())}
    else{const kpis=document.querySelector('.ms226-kpis');if(kpis&&!document.getElementById('mwb230'))kpis.insertAdjacentHTML('beforebegin',panel230())}
    document.querySelectorAll('[data-mad228-one]').forEach(btn=>btn.remove());
    wire230();
  }

  const baseRender230=render;
  render=function(){const out=baseRender230();queueMicrotask(mount230);return out};
})();

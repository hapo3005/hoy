/* HOY Control 2.27.0 — persistent all-venue menu discovery history */
(function(){
  if(window.__hoyAdminMenuSocial227)return;
  window.__hoyAdminMenuSocial227=true;
  window.hoyAdminMenuSocialVersion='2.27.0';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const CLOSED_CHECKS=new Set(['checked_no_menu','blocked','unavailable']);
  const OPEN_SOURCE_STATUSES=new Set(['source_only','partial','complete','image_complete']);
  const clean227=v=>String(v??'').trim();
  const https227=v=>/^https:\/\//i.test(clean227(v))?clean227(v):'';
  const sales227=id=>state.sales.find(x=>Number(x.restaurant_id)===Number(id))||{};
  const sources227=id=>state.menuSources.filter(x=>Number(x.restaurant_id)===Number(id)&&x.is_official!==false);
  const sourceItems227=id=>state.menuItems.filter(x=>String(x.source_id||'')===String(id)&&x.is_active!==false).length;
  const payload227=s=>s?.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};
  const checks227=id=>(state.menuDiscoveryChecks||[]).filter(x=>Number(x.restaurant_id)===Number(id));
  const now227=()=>Date.now();

  function checkFresh227(c){
    if(!c)return false;
    const next=new Date(c.next_review_at||0).getTime();
    if(Number.isFinite(next)&&next>0)return next>now227();
    const checked=new Date(c.checked_at||0).getTime();
    return Number.isFinite(checked)&&checked>now227()-30*864e5;
  }
  function fmtCheck227(c){if(!c)return 'noch nicht geprüft';const d=new Date(c.checked_at);return Number.isFinite(d.getTime())?`geprüft ${new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(d)}`:'geprüft'}

  function renderableSource227(s){
    if(!s||s.is_official===false||!CORE_SCOPES.has(clean227(s.coverage_scope)))return false;
    const status=clean227(s.completeness_status),p=payload227(s);
    if(status==='complete'&&clean227(p.mode)==='official_embed'&&https227(p.embed_url))return true;
    if(status==='image_complete'&&Array.isArray(p.pages)&&p.pages.some(x=>https227(typeof x==='string'?x:x?.url)))return true;
    if(status==='complete'&&sourceItems227(s.id)>0)return true;
    return false;
  }

  function instagram227(value){
    const v=clean227(value);if(!v)return '';
    if(/^https:\/\/(www\.)?instagram\.com\//i.test(v))return v;
    if(/^[A-Za-z0-9._@-]+$/.test(v)){
      const handle=v.replace(/^@/,'');return handle?`https://www.instagram.com/${handle}/`:'';
    }
    return '';
  }
  function facebook227(value){const v=clean227(value);return /^https:\/\/(www\.)?facebook\.com\//i.test(v)?v:''}

  function socialRefs227(r){
    const s=sales227(r.id),urls=[];
    const push=(kind,url,label)=>{if(!url||urls.some(x=>x.url===url))return;urls.push({kind,url,label})};
    push('instagram',instagram227(s.contact_instagram),'Instagram');
    for(const v of [r.website,s.contact_website,s.contact_source_url]){
      push('instagram',instagram227(/^https:\/\/(www\.)?instagram\.com\//i.test(clean227(v))?v:''),'Instagram');
      push('facebook',facebook227(v),'Facebook');
    }
    return urls;
  }

  function websiteRefs227(r){
    const s=sales227(r.id),urls=[];
    for(const v of [r.website,s.contact_website]){
      const u=https227(v);if(!u||/instagram\.com|facebook\.com/i.test(u)||urls.includes(u))continue;urls.push(u);
    }
    return urls;
  }

  function checkResolution227(checks,channels){
    const rows=checks.filter(c=>channels.includes(c.channel));
    const found=rows.filter(c=>c.status==='menu_found'||c.status==='integrated').sort((a,b)=>new Date(b.checked_at||0)-new Date(a.checked_at||0))[0]||null;
    if(found)return {found,closed:false,fresh:true};
    const relevant=rows.sort((a,b)=>new Date(b.checked_at||0)-new Date(a.checked_at||0))[0]||null;
    return {found:null,closed:!!relevant&&CLOSED_CHECKS.has(relevant.status)&&checkFresh227(relevant),fresh:checkFresh227(relevant),latest:relevant};
  }

  function rowState227(r){
    const sources=sources227(r.id),renderable=sources.some(renderableSource227),social=socialRefs227(r),websites=websiteRefs227(r),officialSource=sources.some(s=>CORE_SCOPES.has(clean227(s.coverage_scope))&&OPEN_SOURCE_STATUSES.has(clean227(s.completeness_status))),checks=checks227(r.id);
    const webCheck=checkResolution227(checks,['website','qr']),socialCheck=checkResolution227(checks,['instagram','facebook']);
    let stage='operator_needed',label='Betreiberbestätigung nötig',tone='muted',next='Keine belastbare digitale Vollkarte nachgewiesen; Betreiber/Claim priorisieren';

    if(renderable){stage='ready';label='In HOY nutzbar';tone='good';next='Aktualität nach Prüfintervall überwachen'}
    else if(officialSource||webCheck.found||socialCheck.found){stage='integrate_source';label='Quelle integrieren';tone='danger';next='Gefundene offizielle Kartenquelle vollständig in HOY abbilden'}
    else if(websites.length&&!webCheck.closed){stage='audit_website';label='Website prüfen';tone='warn';next='Website nach Carta/Menu/QR/PDF/Bildkarte vollständig prüfen'}
    else if(social.length&&!socialCheck.closed){stage='audit_social';label='Social prüfen';tone='warn';next='Offizielles Instagram/Facebook auf aktuelle vollständige Karte prüfen'}

    const last=[...checks].sort((a,b)=>new Date(b.checked_at||0)-new Date(a.checked_at||0))[0]||null;
    return {r,sources,renderable,social,websites,checks,webCheck,socialCheck,last,stage,label,tone,next};
  }

  function priority227(x){
    if(x.stage==='ready')return 0;
    let n=20;
    if(CORE_AREAS.has(String(x.r.area||'')))n+=35;
    if(x.stage==='integrate_source')n+=30;
    else if(x.stage==='audit_website')n+=24;
    else if(x.stage==='audit_social')n+=20;
    else n+=10;
    if(x.social.length)n+=4;
    if(x.websites.length)n+=4;
    if(!x.last)n+=4;
    if(x.r.profile_quality==='premium')n+=3;
    return Math.min(100,n);
  }

  function rows227(){return (state.restaurants||[]).filter(r=>r.is_published).map(r=>{const x=rowState227(r);return {...x,priority:priority227(x)}}).sort((a,b)=>b.priority-a.priority||a.r.name.localeCompare(b.r.name,'de'))}
  window.hoyAdminMenuSocialRows227=rows227;

  function summary227(rows=rows227()){
    const count=k=>rows.filter(x=>x.stage===k).length;
    const checked=rows.filter(x=>x.last).length;
    return {published:rows.length,ready:count('ready'),integrate:count('integrate_source'),social:count('audit_social'),website:count('audit_website'),operator:count('operator_needed'),checked};
  }
  window.hoyAdminMenuSocialSummary227=summary227;

  function refs227(x){
    const links=[...x.websites.slice(0,1).map(v=>`<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">Website ↗</a>`),...x.social.map(v=>`<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.label)} ↗</a>`)];
    return links.join('')||'<small>—</small>';
  }

  function history227(x){
    if(!x.last)return '<small class="ms227-history open">Noch ohne dokumentierten Quellencheck</small>';
    const note=clean227(x.last.evidence_note);return `<small class="ms227-history">${esc(fmtCheck227(x.last))} · ${esc(x.last.channel)} · ${esc(x.last.status)}${note?' · '+esc(note.slice(0,120)):''}</small>`;
  }

  function renderRow227(x){
    const search=[x.r.name,x.r.area,x.label,x.stage,x.next,...x.social.map(v=>v.url),...x.websites,...x.checks.map(c=>`${c.channel} ${c.status} ${c.evidence_note||''}`)].join(' ').toLowerCase();
    return `<tr data-ms227-row data-stage="${esc(x.stage)}" data-search="${esc(search)}"><td class="name-cell"><b>${esc(x.r.name)}</b><small>${esc(x.r.area||'')} · ${esc(x.r.venue_type||'')}</small>${history227(x)}</td><td><div class="ms226-score ${x.priority>=70?'hot':x.priority>=45?'warn':''}"><b>${x.priority}</b><span>Priorität</span></div></td><td><span class="ms226-state ${esc(x.tone)}">${esc(x.label)}</span><small class="ms226-detail">${esc(x.next)}</small></td><td><div class="ms226-refs">${refs227(x)}</div></td><td><small>${x.sources.length?`${x.sources.length} offizielle Menüquelle${x.sources.length===1?'':'n'}`:'noch keine Menüquelle'}</small></td><td><button class="ghost" data-edit="${Number(x.r.id)}">Profil</button></td></tr>`;
  }

  function render227(){
    const rows=rows227(),s=summary227(rows),open=rows.filter(x=>x.stage!=='ready');
    return pageHead('Menü-Discovery','Alle Gastroprofile. Kein Quellencheck geht verloren.','HOY prüft zuerst Betreiberwebsite/QR, danach offizielles Instagram/Facebook und erst dann den Betreiber direkt. Jede Prüfung wird mit Ergebnis und Wiedervorlage dokumentiert; Social Media zählt nur bei eindeutig offizieller, belastbarer Menü-Evidenz.')+
      `<div class="ms226-kpis"><div class="ms226-kpi"><strong>${s.published}</strong><span>veröffentlicht</span><small>gesamter Gastro-Bestand</small></div><div class="ms226-kpi good"><strong>${s.ready}</strong><span>in HOY nutzbar</span><small>strukturierte Karte, Bildseiten oder Betreiber-Embed</small></div><div class="ms226-kpi danger"><strong>${s.integrate}</strong><span>Quelle gefunden</span><small>Integration noch offen</small></div><div class="ms226-kpi warn"><strong>${s.website}</strong><span>Website prüfen</span><small>Betreiberquelle zuerst</small></div><div class="ms226-kpi warn"><strong>${s.social}</strong><span>Social prüfen</span><small>Website bereits ausgeschöpft oder nicht vorhanden</small></div><div class="ms226-kpi"><strong>${s.operator}</strong><span>Betreiber nötig</span><small>digitale Kanäle ohne belastbare Vollkarte</small></div><div class="ms226-kpi"><strong>${s.checked}/${s.published}</strong><span>dokumentiert geprüft</span><small>persistente Discovery-Historie</small></div></div>
      <div class="ms226-rules"><article><small>1 · WEBSITE / QR</small><b>Eigene Betreiberquelle zuerst.</b><p>HTML, QR-System, PDF oder Betreiberbilder haben Vorrang.</p></article><article><small>2 · SOCIAL</small><b>Instagram/Facebook schließen Lücken.</b><p>Nur offizielle Profile; keine Nutzeruploads oder Aggregator-Fotos als Betreiberkarte.</p></article><article><small>3 · OPERATOR</small><b>Geprüft ist nicht geraten.</b><p>Wenn digitale Kanäle keine belastbare Vollkarte liefern, wird der Betreiber zur Bestätigung priorisiert.</p></article></div>
      <div class="coverage-toolbar"><input id="ms227Search" placeholder="Betrieb, Ort, Kanal, Ergebnis oder nächster Schritt …"><select id="ms227Stage"><option value="all">Alle Status</option><option value="integrate_source">Quelle integrieren</option><option value="audit_website">Website prüfen</option><option value="audit_social">Social prüfen</option><option value="operator_needed">Betreiber nötig</option><option value="ready">In HOY nutzbar</option></select></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Betrieb / letzte Prüfung</th><th>Score</th><th>Discovery-Status</th><th>Direkt prüfen</th><th>Menübestand</th><th></th></tr></thead><tbody id="ms227Rows">${rows.map(renderRow227).join('')}</tbody></table></div><div class="coverage-note"><b>${open.length} offene Profile.</b> Geprüfte Kanäle werden nicht vor ihrer Wiedervorlage erneut als offen behandelt. Die Queue bleibt read-only: kein Versand, kein Send-Lock, keine Betreiberberechtigung.</div>`;
  }

  const baseLoadData227=loadData;
  loadData=async function(){
    await baseLoadData227();
    const {data,error}=await sb.from('menu_discovery_checks').select('id,restaurant_id,channel,source_url,status,menu_scope,is_official,evidence_note,checked_at,next_review_at').order('checked_at',{ascending:false});
    if(error)throw error;
    state.menuDiscoveryChecks=data||[];
  };

  const baseShell227=shell;
  shell=function(content){
    let html=baseShell227(content),active=state.view==='menu_discovery'?'active':'';
    const anchor='<button data-nav="menu_integrity"';
    if(html.includes(anchor))html=html.replace(anchor,`<button data-nav="menu_discovery" class="${active}">Menü-Discovery<i></i></button>${anchor}`);
    return html;
  };

  const baseRender227=render;
  render=function(){
    if(state.view!=='menu_discovery')return baseRender227();
    if(!state.user||!state.admin)return renderLogin();
    root.innerHTML=shell(render227());wire();
  };

  const baseWire227=wire;
  wire=function(){
    baseWire227();if(state.view!=='menu_discovery')return;
    const q=document.getElementById('ms227Search'),f=document.getElementById('ms227Stage'),body=document.getElementById('ms227Rows');if(!q||!f||!body)return;
    const apply=()=>{const query=clean227(q.value).toLowerCase(),stage=f.value;body.querySelectorAll('[data-ms227-row]').forEach(row=>{const okQ=!query||clean227(row.dataset.search).includes(query),okS=stage==='all'||row.dataset.stage===stage;row.hidden=!(okQ&&okS)})};
    q.addEventListener('input',apply);f.addEventListener('change',apply);
  };
})();

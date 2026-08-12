/* HOY Control 2.26.0 — all-venue menu discovery audit including official social media */
(function(){
  if(window.__hoyAdminMenuSocial226)return;
  window.__hoyAdminMenuSocial226=true;
  window.hoyAdminMenuSocialVersion='2.26.0';

  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const clean226=v=>String(v??'').trim();
  const https226=v=>/^https:\/\//i.test(clean226(v))?clean226(v):'';
  const sales226=id=>state.sales.find(x=>Number(x.restaurant_id)===Number(id))||{};
  const sources226=id=>state.menuSources.filter(x=>Number(x.restaurant_id)===Number(id)&&x.is_official!==false);
  const sourceItems226=id=>state.menuItems.filter(x=>String(x.source_id||'')===String(id)&&x.is_active!==false).length;
  const payload226=s=>s?.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};

  function renderableSource226(s){
    if(!s||s.is_official===false||!CORE_SCOPES.has(clean226(s.coverage_scope)))return false;
    const status=clean226(s.completeness_status),p=payload226(s);
    if(status==='complete'&&clean226(p.mode)==='official_embed'&&https226(p.embed_url))return true;
    if(status==='image_complete'&&Array.isArray(p.pages)&&p.pages.some(x=>https226(typeof x==='string'?x:x?.url)))return true;
    if(status==='complete'&&sourceItems226(s.id)>0)return true;
    return false;
  }

  function instagram226(value){
    const v=clean226(value);if(!v)return '';
    if(/^https:\/\/(www\.)?instagram\.com\//i.test(v))return v;
    const handle=v.replace(/^@/,'').replace(/^.*instagram\.com\//i,'').replace(/[/?#].*$/,'');
    return handle?`https://www.instagram.com/${handle}/`:'';
  }
  function facebook226(value){const v=clean226(value);return /^https:\/\/(www\.)?facebook\.com\//i.test(v)?v:''}

  function socialRefs226(r){
    const s=sales226(r.id),urls=[];
    const push=(kind,url,label)=>{if(!url||urls.some(x=>x.url===url))return;urls.push({kind,url,label})};
    push('instagram',instagram226(s.contact_instagram),'Instagram');
    for(const v of [r.website,s.contact_website,s.contact_source_url]){
      push('instagram',instagram226(/^https:\/\/(www\.)?instagram\.com\//i.test(clean226(v))?v:''),'Instagram');
      push('facebook',facebook226(v),'Facebook');
    }
    return urls;
  }

  function websiteRefs226(r){
    const s=sales226(r.id),urls=[];
    for(const v of [r.website,s.contact_website]){
      const u=https226(v);if(!u||/instagram\.com|facebook\.com/i.test(u)||urls.includes(u))continue;urls.push(u);
    }
    return urls;
  }

  function rowState226(r){
    const sources=sources226(r.id),renderable=sources.some(renderableSource226),social=socialRefs226(r),websites=websiteRefs226(r),officialSource=sources.length>0;
    let stage='operator_needed',label='Digitale Quelle fehlt',tone='muted',next='Betreiber-/Vor-Ort-Bestätigung für die Speisekarte priorisieren';
    if(renderable){stage='ready';label='In HOY nutzbar';tone='good';next='Nur Aktualität weiter überwachen'}
    else if(officialSource){stage='integrate_source';label='Quelle integrieren';tone='danger';next='Bekannte offizielle Kartenquelle vollständig in HOY abbilden'}
    else if(social.length){stage='audit_social';label='Social prüfen';tone='warn';next='Offizielles Instagram/Facebook gezielt auf aktuelle vollständige Karte prüfen'}
    else if(websites.length){stage='audit_website';label='Website prüfen';tone='warn';next='Website vollständig nach Carta/Menu/QR/PDF/Bildkarte durchsuchen'}
    return {r,sources,renderable,social,websites,stage,label,tone,next};
  }

  function priority226(x){
    if(x.stage==='ready')return 0;
    let n=20;
    if(CORE_AREAS.has(String(x.r.area||'')))n+=35;
    if(x.stage==='integrate_source')n+=30;
    else if(x.stage==='audit_social')n+=24;
    else if(x.stage==='audit_website')n+=16;
    if(x.social.length)n+=6;
    if(x.websites.length)n+=4;
    if(x.r.profile_quality==='premium')n+=4;
    return Math.min(100,n);
  }

  function rows226(){return (state.restaurants||[]).filter(r=>r.is_published).map(r=>{const x=rowState226(r);return {...x,priority:priority226(x)}}).sort((a,b)=>b.priority-a.priority||a.r.name.localeCompare(b.r.name,'de'))}
  window.hoyAdminMenuSocialRows226=rows226;

  function summary226(rows=rows226()){
    const count=k=>rows.filter(x=>x.stage===k).length;
    return {published:rows.length,ready:count('ready'),integrate:count('integrate_source'),social:count('audit_social'),website:count('audit_website'),operator:count('operator_needed')};
  }
  window.hoyAdminMenuSocialSummary226=summary226;

  function refs226(x){
    const links=[...x.social.map(v=>`<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.label)} ↗</a>`),...x.websites.slice(0,1).map(v=>`<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">Website ↗</a>`)];
    return links.join('')||'<small>—</small>';
  }

  function renderRow226(x){
    const search=[x.r.name,x.r.area,x.label,x.stage,x.next,...x.social.map(v=>v.url),...x.websites].join(' ').toLowerCase();
    return `<tr data-ms226-row data-stage="${esc(x.stage)}" data-search="${esc(search)}"><td class="name-cell"><b>${esc(x.r.name)}</b><small>${esc(x.r.area||'')} · ${esc(x.r.venue_type||'')}</small></td><td><div class="ms226-score ${x.priority>=70?'hot':x.priority>=45?'warn':''}"><b>${x.priority}</b><span>Priorität</span></div></td><td><span class="ms226-state ${esc(x.tone)}">${esc(x.label)}</span><small class="ms226-detail">${esc(x.next)}</small></td><td><div class="ms226-refs">${refs226(x)}</div></td><td><small>${x.sources.length?`${x.sources.length} offizielle Menüquelle${x.sources.length===1?'':'n'}`:'noch keine Menüquelle'}</small></td><td><button class="ghost" data-edit="${Number(x.r.id)}">Profil</button></td></tr>`;
  }

  function render226(){
    const rows=rows226(),s=summary226(rows),open=rows.filter(x=>x.stage!=='ready');
    return pageHead('Menü-Discovery','Alle Gastroprofile. Alle digitalen Quellen.','Website, Betreiber-QR, Instagram und Facebook werden als gemeinsame Discovery-Kette geprüft. Social Media zählt nur als Menübeleg, wenn die Quelle eindeutig zum Betrieb gehört und die Karte belastbar aktuell und vollständig erkennbar ist.')+
      `<div class="ms226-kpis"><div class="ms226-kpi"><strong>${s.published}</strong><span>veröffentlicht</span><small>gesamter Gastro-Bestand</small></div><div class="ms226-kpi good"><strong>${s.ready}</strong><span>in HOY nutzbar</span><small>strukturierte Karte, Bildseiten oder Betreiber-Embed</small></div><div class="ms226-kpi danger"><strong>${s.integrate}</strong><span>Quelle bekannt</span><small>Integration noch offen</small></div><div class="ms226-kpi warn"><strong>${s.social}</strong><span>Social prüfen</span><small>Instagram/Facebook vorhanden, Karte noch offen</small></div><div class="ms226-kpi warn"><strong>${s.website}</strong><span>Website prüfen</span><small>keine Menüquelle entdeckt</small></div><div class="ms226-kpi"><strong>${s.operator}</strong><span>ohne digitale Spur</span><small>Betreiberbestätigung nötig</small></div></div>
      <div class="ms226-rules"><article><small>1 · WEBSITE</small><b>Eigene Betreiberquelle zuerst.</b><p>HTML, QR-System, PDF oder Betreiberbilder werden vor Social Media bevorzugt.</p></article><article><small>2 · SOCIAL</small><b>Offizielles Profil schließt Lücken.</b><p>Aktuelle Kartenposts, angepinnte Beiträge und Highlights werden als Betreiberquelle geprüft – keine Nutzeruploads.</p></article><article><small>3 · OPERATOR</small><b>Unklar bleibt unklar.</b><p>Wenn keine belastbare digitale Karte existiert, wird nichts erfunden. Dann übernimmt die Betreiberbestätigung.</p></article></div>
      <div class="coverage-toolbar"><input id="ms226Search" placeholder="Betrieb, Ort, Social-Profil oder nächster Schritt …"><select id="ms226Stage"><option value="all">Alle Status</option><option value="integrate_source">Quelle integrieren</option><option value="audit_social">Social prüfen</option><option value="audit_website">Website prüfen</option><option value="operator_needed">Digitale Quelle fehlt</option><option value="ready">In HOY nutzbar</option></select></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Betrieb</th><th>Score</th><th>Discovery-Status</th><th>Direkt prüfen</th><th>Menübestand</th><th></th></tr></thead><tbody id="ms226Rows">${rows.map(renderRow226).join('')}</tbody></table></div><div class="coverage-note"><b>${open.length} offene Profile.</b> Diese Queue ist bewusst read-only: Sie recherchiert und priorisiert; sie versendet nichts und ändert keine Betreiberberechtigung.</div>`;
  }

  const baseShell226=shell;
  shell=function(content){
    let html=baseShell226(content),active=state.view==='menu_discovery'?'active':'';
    const anchor='<button data-nav="menu_integrity"';
    if(html.includes(anchor))html=html.replace(anchor,`<button data-nav="menu_discovery" class="${active}">Menü-Discovery<i></i></button>${anchor}`);
    return html;
  };

  const baseRender226=render;
  render=function(){
    if(state.view!=='menu_discovery')return baseRender226();
    if(!state.user||!state.admin)return renderLogin();
    root.innerHTML=shell(render226());wire();
  };

  const baseWire226=wire;
  wire=function(){
    baseWire226();if(state.view!=='menu_discovery')return;
    const q=document.getElementById('ms226Search'),f=document.getElementById('ms226Stage'),body=document.getElementById('ms226Rows');if(!q||!f||!body)return;
    const apply=()=>{const query=clean226(q.value).toLowerCase(),stage=f.value;body.querySelectorAll('[data-ms226-row]').forEach(row=>{const okQ=!query||clean226(row.dataset.search).includes(query),okS=stage==='all'||row.dataset.stage===stage;row.hidden=!(okQ&&okS)})};
    q.addEventListener('input',apply);f.addEventListener('change',apply);
  };
})();

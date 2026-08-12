/* HOY Control 2.23.0 — global menu-integrity quality queue */
(function(){
  if(window.__hoyAdminMenuIntegrity223)return;
  window.__hoyAdminMenuIntegrity223=true;
  window.hoyAdminMenuIntegrityVersion='2.23.0';

  const NON_CORE=new Set(['wine','dessert','drinks','highlights','secondary']);
  const IGNORE=new Set(['superseded','invalid','unknown']);
  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const clean223=v=>String(v??'').trim();
  const scope223=s=>clean223(s?.coverage_scope)||'full_menu';
  const status223=s=>clean223(s?.completeness_status)||'unknown';
  const isCore223=s=>!NON_CORE.has(scope223(s));

  function sourceRows223(r){return menuFor(r.id).filter(s=>s.is_official!==false)}
  function activeSources223(r){return sourceRows223(r).filter(s=>!IGNORE.has(status223(s)))}
  function coverageMeasured223(core){return core.find(s=>Number(s?.coverage_meta?.expected_sections)>0)||null}

  function integrity223(r){
    const all=sourceRows223(r),valid=activeSources223(r),core=valid.filter(isCore223),items=itemsFor(r.id).length;
    const complete=core.some(s=>status223(s)==='complete'),image=core.some(s=>status223(s)==='image_complete'),partial=core.some(s=>status223(s)==='partial'),sourceOnly=core.some(s=>status223(s)==='source_only'),insufficient=core.some(s=>status223(s)==='insufficient');
    const measured=coverageMeasured223(core);
    if(complete)return {key:'complete',label:'Vollständig',tone:'good',detail:`${items} Positionen · Hauptkarte vollständig geprüft`,sources:all,core,items,measured};
    if(image)return {key:'image_complete',label:'Bildkarte in HOY',tone:'good',detail:'Offizielle Hauptkarte vollständig als In-App-Seiten',sources:all,core,items,measured};
    if(partial)return {key:'partial',label:'Teilkarte',tone:'warn',detail:measured?`${Number(measured.coverage_meta.imported_sections)||0}/${Number(measured.coverage_meta.expected_sections)||0} Bereiche abgedeckt`:`${items} verifizierte Positionen · Hauptkarte unvollständig`,sources:all,core,items,measured};
    if(sourceOnly&&items)return {key:'partial',label:'Nur Ergänzungen',tone:'warn',detail:`${items} ergänzende Positionen · Hauptkarte noch nicht in HOY`,sources:all,core,items,measured};
    if(sourceOnly)return {key:'source_only',label:'Nur Quelle',tone:'danger',detail:'Offizielle Hauptkarte bekannt, aber noch nicht in HOY darstellbar',sources:all,core,items,measured};
    if(insufficient)return {key:'insufficient',label:'Quelle unzureichend',tone:'muted',detail:'Betreiberquelle enthält keine vollständige bepreiste Karte',sources:all,core,items,measured};
    if(!all.length)return {key:'missing',label:'Keine Quelle',tone:'muted',detail:'Noch keine offizielle Kartenquelle hinterlegt',sources:all,core,items,measured};
    if(all.some(s=>status223(s)==='invalid'))return {key:'invalid',label:'Quelle ungültig',tone:'danger',detail:'Offizieller Link ist keine belastbare aktuelle Speisekarte',sources:all,core,items,measured};
    return {key:'review',label:'Prüfung nötig',tone:'warn',detail:'Menüstatus ist noch nicht eindeutig klassifiziert',sources:all,core,items,measured};
  }
  window.hoyAdminMenuIntegrity223For=integrity223;

  function priority223(r,i=integrity223(r)){
    if(['complete','image_complete'].includes(i.key))return 0;
    let n=0;
    if(i.measured){const e=Number(i.measured.coverage_meta.expected_sections)||0,m=Number(i.measured.coverage_meta.imported_sections)||0;n+=e?Math.round((1-Math.min(1,m/e))*45):25}
    if(i.key==='source_only')n+=55;
    else if(i.key==='partial')n+=45;
    else if(i.key==='invalid')n+=35;
    else if(i.key==='insufficient')n+=28;
    else if(i.key==='missing')n+=18;
    else n+=30;
    if(CORE_AREAS.has(String(r.area||'')))n+=12;
    if(r.profile_quality==='premium')n+=5;
    return Math.max(0,Math.min(100,n));
  }

  function rows223(){
    return state.restaurants.filter(r=>r.is_published).map(r=>{const integrity=integrity223(r);return {r,integrity,priority:priority223(r,integrity)}}).sort((a,b)=>b.priority-a.priority||a.r.name.localeCompare(b.r.name));
  }
  window.hoyAdminMenuIntegrityRows223=rows223;

  function summary223(rows=rows223()){
    return {published:rows.length,withOfficial:rows.filter(x=>x.integrity.sources.length).length,complete:rows.filter(x=>x.integrity.key==='complete').length,image:rows.filter(x=>x.integrity.key==='image_complete').length,partial:rows.filter(x=>x.integrity.key==='partial').length,sourceOnly:rows.filter(x=>x.integrity.key==='source_only').length,blocked:rows.filter(x=>['invalid','insufficient','review'].includes(x.integrity.key)).length,missing:rows.filter(x=>x.integrity.key==='missing').length};
  }
  window.hoyAdminMenuIntegritySummary223=summary223;

  function next223(x){
    const i=x.integrity;
    if(i.key==='partial'&&i.measured){const expected=i.measured.coverage_meta.expected_section_names||[],done=new Set(i.measured.coverage_meta.imported_section_names||[]),missing=expected.filter(v=>!done.has(v));return `Fehlende Bereiche übernehmen: ${missing.slice(0,4).join(', ')}${missing.length>4?' …':''}`}
    if(i.key==='partial')return 'Offizielle Hauptkarte gegen HOY vollständig abgleichen';
    if(i.key==='source_only')return 'Offizielle Quelle in eine In-App-Karte überführen';
    if(i.key==='invalid')return 'Neue belastbare Betreiberquelle finden oder Betreiber bestätigen lassen';
    if(i.key==='insufficient')return 'Betreiberkarte anfordern / Betreiberbestätigung priorisieren';
    if(i.key==='missing')return 'Offizielle Menüquelle recherchieren';
    if(i.key==='review')return 'Quelle und Abdeckung manuell klassifizieren';
    return 'Kein Menü-Integritätsproblem';
  }

  function sourceLabel223(i){
    const active=i.sources.filter(s=>!['superseded'].includes(status223(s)));
    if(!active.length)return '<small>—</small>';
    return active.slice(0,2).map(s=>`<div class="mi223-source"><b>${esc(s.source_label||s.source_format||'Quelle')}</b><small>${esc(scope223(s))} · ${esc(status223(s))}</small></div>`).join('');
  }

  function row223(x){
    const i=x.integrity,search=[x.r.name,x.r.area,i.label,i.key,next223(x),...i.sources.map(s=>s.source_label)].join(' ').toLowerCase();
    return `<tr data-mi223-row data-status="${esc(i.key)}" data-search="${esc(search)}"><td class="name-cell"><b>${esc(x.r.name)}</b><small>${esc(x.r.area)} · ${esc(x.r.profile_quality||'')}</small></td><td><div class="mi223-priority ${x.priority>=70?'hot':x.priority>=45?'warn':''}"><b>${x.priority}</b><span>Priorität</span></div></td><td><span class="mi223-status ${esc(i.tone)}">${esc(i.label)}</span><small class="mi223-detail">${esc(i.detail)}</small></td><td>${sourceLabel223(i)}</td><td><div class="mi223-next">${esc(next223(x))}</div></td><td><button class="ghost" data-edit="${Number(x.r.id)}">Profil</button></td></tr>`;
  }

  function render223(){
    const rows=rows223(),s=summary223(rows),top=rows.filter(x=>x.priority>0).slice(0,6);
    return pageHead('Menü-Integrität','Speisekarten: vollständig heißt vollständig.','Globaler Qualitätscheck über alle veröffentlichten Betriebe. Technischer Import, Inhaltsabdeckung und Aktualität werden getrennt bewertet; externe Links gelten nicht als fertige Gastkarte.')+
      `<div class="mi223-kpis"><div class="mi223-kpi"><strong>${s.withOfficial}</strong><span>mit offizieller Quelle</span><small>von ${s.published} veröffentlichten Betrieben</small></div><div class="mi223-kpi good"><strong>${s.complete+s.image}</strong><span>vollständig in HOY</span><small>${s.complete} strukturiert · ${s.image} Bildkarte</small></div><div class="mi223-kpi warn"><strong>${s.partial}</strong><span>Teilkarte</span><small>sichtbar, aber nicht vollständig</small></div><div class="mi223-kpi danger"><strong>${s.sourceOnly}</strong><span>nur Quelle</span><small>noch nicht als In-App-Karte nutzbar</small></div><div class="mi223-kpi"><strong>${s.blocked+s.missing}</strong><span>ohne belastbare Karte</span><small>ungültig, unzureichend oder Quelle fehlt</small></div></div>
      <div class="mi223-focus"><section class="panel"><div class="panel-head"><h2>Größter Menühebel</h2><small>global · Datenlücke zuerst</small></div><div class="mi223-top">${top.map((x,n)=>`<article><span>${n+1}</span><div><b>${esc(x.r.name)}</b><small>${esc(x.integrity.label)} · ${esc(next223(x))}</small></div><strong>${x.priority}</strong></article>`).join('')||'<div class="empty">Keine offenen Menüprobleme.</div>'}</div></section><aside class="panel mi223-rule"><h2>Neue Qualitätsregel</h2><p><b>Positionen zählen reicht nicht.</b> Eine Karte ist erst vollständig, wenn die relevante offizielle Hauptquelle vollständig abgedeckt ist. Ergänzende Wein-, Dessert- oder Getränkekarten dürfen eine fehlende Hauptkarte nicht kaschieren.</p><div class="alert good"><b>Ranking-Schutz:</b> Nur vollständige strukturierte Karten und vollständige In-App-Bildkarten erhalten den Menübonus in HOY NOW.</div></aside></div>
      <div class="coverage-toolbar"><input id="mi223Search" placeholder="Betrieb, Quelle, Problem oder nächster Schritt …"><select id="mi223Status"><option value="all">Alle Status</option><option value="partial">Teilkarte</option><option value="source_only">Nur Quelle</option><option value="invalid">Ungültig</option><option value="insufficient">Unzureichend</option><option value="missing">Keine Quelle</option><option value="complete">Vollständig</option><option value="image_complete">Bildkarte vollständig</option></select></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Betrieb</th><th>Score</th><th>Integrität</th><th>Offizielle Quellen</th><th>Nächster Schritt</th><th></th></tr></thead><tbody id="mi223Rows">${rows.map(row223).join('')}</tbody></table></div><div class="coverage-note">Diese Queue führt keine automatischen Importe oder externen Navigationen aus. Sie macht Lücken sichtbar und verhindert, dass eine Teilkarte durch eine bloße Item-Anzahl als vollständig gilt.</div>`;
  }

  const baseQualityInfo223=qualityInfo;
  qualityInfo=function(r){
    const q=baseQualityInfo223(r),i=integrity223(r),hadSource=menuFor(r.id).length>0,ready=['complete','image_complete'].includes(i.key);
    if(!hadSource||ready)return q;
    const missing=q.missing.filter(x=>x!=='Menüquelle');missing.push(i.key==='partial'?'Speisekarte vollständig':'Speisekarte in HOY');
    return {score:Math.max(0,q.score-10),missing:[...new Set(missing)]};
  };

  const baseShell223=shell;
  shell=function(content){
    let html=baseShell223(content);const active=state.view==='menu_integrity'?'active':'';const anchor='<button data-nav="quality"';
    if(html.includes(anchor))html=html.replace(anchor,`<button data-nav="menu_integrity" class="${active}">Menüs<i></i></button>${anchor}`);
    return html;
  };

  const baseRender223=render;
  render=function(){
    if(state.view!=='menu_integrity')return baseRender223();
    if(!state.user||!state.admin)return renderLogin();
    root.innerHTML=shell(render223());wire();
  };

  const baseWire223=wire;
  wire=function(){
    baseWire223();if(state.view!=='menu_integrity')return;
    const q=document.getElementById('mi223Search'),filter=document.getElementById('mi223Status'),body=document.getElementById('mi223Rows');if(!q||!filter||!body)return;
    const apply=()=>{const query=clean223(q.value).toLowerCase(),status=filter.value;body.querySelectorAll('[data-mi223-row]').forEach(row=>{const okQ=!query||String(row.dataset.search||'').includes(query),okS=status==='all'||row.dataset.status===status;row.hidden=!(okQ&&okS)})};
    q.addEventListener('input',apply);filter.addEventListener('change',apply);
  };
})();

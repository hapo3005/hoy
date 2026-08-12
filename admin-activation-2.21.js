/* HOY Control 2.21 — operator activation queue for the La Manga + Cabo de Palos core */
(function(){
  if(window.__hoyAdminActivation221)return;
  window.__hoyAdminActivation221=true;
  window.hoyAdminActivationVersion221='2.21.0';

  const activation={loaded:false,loading:false,error:'',liveHours:[]};
  const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
  const clean221=v=>String(v??'').trim();
  const entFor221=r=>relOne(r?.restaurant_entitlements);
  const saleFor221=r=>state.sales.find(x=>Number(x.restaurant_id)===Number(r?.id))||{};
  const claimFor221=r=>state.claims.find(x=>Number(x.restaurant_id)===Number(r?.id))||null;
  const liveFor221=r=>activation.liveHours.find(x=>Number(x.restaurant_id)===Number(r?.id))||null;
  const prepared221=r=>!!(r?.hours_weekly&&typeof r.hours_weekly==='object'&&Object.keys(r.hours_weekly).length);
  const hoursGap221=r=>['missing','conflict','needs_review','conditional'].includes(String(r?.hours_status||''));
  const directContact221=(r,s=saleFor221(r))=>!!(clean221(s.contact_email)||clean221(s.contact_phone)||clean221(s.contact_instagram)||clean221(r?.phone));
  const channel221=(r,s=saleFor221(r))=>clean221(s.preferred_channel)||(clean221(s.contact_email)?'E-Mail':'')||(clean221(s.contact_instagram)?'Instagram':'')||(clean221(s.contact_phone||r?.phone)?'Telefon':'')||(clean221(s.contact_website||r?.website)?'Website':'')||'Kontakt recherchieren';
  const language221=s=>clean221(s.preferred_outreach_language)||clean221(s.language_fit)||'ES';
  const firstWave221=s=>['DE','EN'].includes(language221(s))||String(s.international_fit||'').toLowerCase()==='high';

  async function loadActivation221(){
    if(activation.loading)return;
    activation.loading=true;activation.error='';
    try{
      const {data,error}=await sb.from('restaurant_live_hours').select('restaurant_id,confirmed_at,updated_at');
      if(error)throw error;
      activation.liveHours=data||[];activation.loaded=true;
    }catch(err){activation.error=err?.message||String(err);activation.loaded=false;console.warn('HOY activation data unavailable',err)}finally{activation.loading=false}
  }

  const baseLoadData221=loadData;
  loadData=async function(){await baseLoadData221();activation.loaded=false;await loadActivation221()};

  function stage221(r){
    const s=saleFor221(r),claim=claimFor221(r),live=liveFor221(r),operator=!!entFor221(r).operator_verified,contact=directContact221(r,s),prepared=prepared221(r),gap=hoursGap221(r);
    if(live)return {key:'confirmed',label:'Betreiber bestätigt',tone:'good',detail:'Live-Zeiten liegen bereits vor'};
    if(operator)return {key:'operator_action',label:'Betreiber aktiv',tone:'good',detail:'Nur noch Wochenzeiten bestätigen'};
    if(claim?.status==='pending')return {key:'claim_pending',label:'Claim in Prüfung',tone:'warn',detail:'HOY muss zuerst die Berechtigung prüfen'};
    if(contact&&gap)return {key:'resolve_hours',label:'Starker Datenhebel',tone:'hot',detail:prepared?'Kontakt steht · Zeiten sind vorbereitet':'Kontakt steht · Betreiber kann Zeiten direkt eintragen'};
    if(contact&&prepared)return {key:'confirm_hours',label:'Bestätigung bereit',tone:'hot',detail:'Kontakt steht · vorbereiteten Wochenplan bestätigen lassen'};
    if(contact)return {key:'claim_ready',label:'Kontakt bereit',tone:'warn',detail:'Betrieb kann zur kostenlosen Übernahme eingeladen werden'};
    return {key:'contact_missing',label:'Kontakt fehlt',tone:'muted',detail:'Erst direkten Betreiberweg recherchieren'};
  }

  function score221(r){
    const s=saleFor221(r),st=stage221(r);if(st.key==='confirmed')return 0;
    let score=0;
    if(hoursGap221(r))score+=30;else if(prepared221(r))score+=12;
    if(directContact221(r,s))score+=22;
    if(prepared221(r))score+=14;
    if(firstWave221(s))score+=16;
    if(s.priority==='A')score+=12;else if(s.priority==='B')score+=6;
    if(Number.isFinite(Number(s.lead_score)))score+=Math.round(Math.max(0,Math.min(100,Number(s.lead_score)))*0.12);
    if(String(s.send_readiness||'').includes('ready'))score+=6;
    if(st.key==='operator_action')score+=20;
    if(st.key==='claim_pending')score-=8;
    return Math.max(0,Math.min(100,score));
  }

  function rows221(){
    return state.restaurants.filter(r=>r.is_published&&CORE_AREAS.has(String(r.area||''))).map(r=>({r,s:saleFor221(r),stage:stage221(r),score:score221(r)})).sort((a,b)=>b.score-a.score||Number(b.s.lead_score||0)-Number(a.s.lead_score||0)||a.r.name.localeCompare(b.r.name));
  }
  window.hoyActivationRows221=rows221;

  function summary221(rows=rows221()){
    return {total:rows.length,confirmed:rows.filter(x=>x.stage.key==='confirmed').length,direct:rows.filter(x=>directContact221(x.r,x.s)).length,lever:rows.filter(x=>['resolve_hours','confirm_hours','operator_action'].includes(x.stage.key)).length,firstWave:rows.filter(x=>firstWave221(x.s)&&directContact221(x.r,x.s)&&x.stage.key!=='confirmed').length,locked:rows.filter(x=>x.s.send_lock!==false).length};
  }
  window.hoyActivationSummary221=summary221;

  function scoreMarkup221(v){const cl=v>=75?'good':v>=55?'warn':'';return `<div class="activation-score ${cl}"><b>${v}</b><span>Aktivierung</span></div>`}
  function stageBadge221(st){return `<span class="activation-stage ${esc(st.tone)}">${esc(st.label)}</span>`}
  function signalTags221(x){
    const tags=[];const {r,s}=x;
    tags.push(`<span class="activation-tag ${prepared221(r)?'good':''}">${prepared221(r)?'Wochenplan vorbereitet':'Zeiten offen'}</span>`);
    if(firstWave221(s))tags.push(`<span class="activation-tag good">${esc(language221(s))} · First Wave</span>`);
    if(directContact221(r,s))tags.push('<span class="activation-tag good">Direktkontakt</span>');
    if(s.priority)tags.push(`<span class="activation-tag">Lead ${esc(s.priority)}</span>`);
    return tags.join('');
  }
  function contactMarkup221(r,s){
    const bits=[];
    if(clean221(s.contact_email))bits.push(esc(s.contact_email));
    if(clean221(s.contact_phone||r.phone))bits.push(esc(s.contact_phone||r.phone));
    if(clean221(s.contact_instagram))bits.push(esc(s.contact_instagram));
    return `<div class="activation-contact"><b>${esc(channel221(r,s))}</b><small>${bits.slice(0,2).join(' · ')||'Kein direkter Kontakt hinterlegt'}</small></div>`;
  }
  function row221(x){
    const {r,s,stage,score}=x;const search=[r.name,r.area,stage.label,channel221(r,s),language221(s),s.priority].join(' ').toLowerCase();
    return `<tr data-activation-row data-stage="${esc(stage.key)}" data-search="${esc(search)}"><td class="name-cell"><b>${esc(r.name)}</b><small>${esc(r.area)}${r.hours_status?' · Zeiten '+esc(r.hours_status):''}</small></td><td>${scoreMarkup221(score)}</td><td><div class="activation-next">${stageBadge221(stage)}<small>${esc(stage.detail)}</small></div></td><td>${contactMarkup221(r,s)}</td><td><div class="activation-tags">${signalTags221(x)}</div></td><td>${s.send_lock===false?badge('LOCK FEHLT','danger'):badge('GESPERRT','good')}</td><td><button class="ghost" data-edit="${Number(r.id)}">Profil</button></td></tr>`;
  }

  function renderActivation221(){
    if(!activation.loaded&&!activation.loading)loadActivation221().then(()=>{if(state.view==='activation')render()});
    if(activation.loading&&!activation.loaded)return pageHead('Operator Activation','Kernregion aktivieren.','Die Betriebe mit dem größten Datenhebel zuerst – ohne Versandfunktion.')+'<section class="panel"><div class="empty">Aktivierungsdaten werden geladen …</div></section>';
    if(activation.error&&!activation.loaded)return pageHead('Operator Activation','Kernregion aktivieren.','Aktivierungsdaten konnten nicht geladen werden.')+`<div class="alert">${esc(activation.error)}</div>`;
    const rows=rows221(),s=summary221(rows),top=rows.filter(x=>x.stage.key!=='confirmed').slice(0,5);
    return pageHead('Operator Activation','Wer bringt HOY NOW jetzt am weitesten?','Interne Arbeitsqueue für La Manga + Cabo de Palos. Sie verbindet Datenlücke, Kontaktierbarkeit, First-Wave-Fit und vorhandene Sales-Vorbereitung. Versand bleibt technisch gesperrt.')+
      `<div class="activation-kpis"><div class="activation-kpi"><strong>${s.total}</strong><span>Kernbetriebe</span><small>La Manga + Cabo de Palos</small></div><div class="activation-kpi attn"><strong>${s.lever}</strong><span>starker Datenhebel</span><small>Bestätigung oder Zeiten direkt lösbar</small></div><div class="activation-kpi"><strong>${s.direct}</strong><span>mit Direktkontakt</span><small>E-Mail, Telefon oder Instagram</small></div><div class="activation-kpi good"><strong>${s.firstWave}</strong><span>DE/EN First Wave</span><small>internationaler Einstieg zuerst</small></div><div class="activation-kpi safe"><strong>${s.locked}/${s.total}</strong><span>Versand gesperrt</span><small>Queue ist read-only für Outreach</small></div></div>
      <div class="activation-focus"><section class="panel"><div class="panel-head"><h2>Die nächsten fünf</h2><small>nach Aktivierungshebel</small></div><div class="activation-top">${top.map((x,i)=>`<article><span>${i+1}</span><div><b>${esc(x.r.name)}</b><small>${esc(x.stage.label)} · ${esc(channel221(x.r,x.s))}${firstWave221(x.s)?' · '+esc(language221(x.s)):''}</small></div><strong>${x.score}</strong></article>`).join('')||'<div class="empty">Keine offene Aktivierung.</div>'}</div></section><aside class="panel activation-rule"><h2>Prioritätsregel</h2><p><b>Datenlücke + erreichbarer Betrieb</b> schlägt einen bereits ausreichend verifizierten Wochenplan. DE/EN gibt für die erste Welle einen Bonus, ersetzt aber nie Daten- oder Kontaktqualität.</p><div class="alert good"><b>Keine Versandaktion.</b> Die Queue zeigt nur, welcher Betrieb als Nächstes vorbereitet oder persönlich angesprochen werden sollte.</div></aside></div>
      <div class="coverage-toolbar"><input id="activationSearch" placeholder="Betrieb, Kanal, Sprache oder Status …"><select id="activationStage"><option value="all">Alle offenen Stufen</option><option value="resolve_hours">Starker Datenhebel</option><option value="confirm_hours">Bestätigung bereit</option><option value="operator_action">Betreiber aktiv</option><option value="claim_pending">Claim in Prüfung</option><option value="claim_ready">Kontakt bereit</option><option value="contact_missing">Kontakt fehlt</option><option value="confirmed">Betreiber bestätigt</option></select></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Betrieb</th><th>Score</th><th>Nächster Schritt</th><th>Kontaktweg</th><th>Signale</th><th>Versand</th><th></th></tr></thead><tbody id="activationRows">${rows.map(row221).join('')}</tbody></table></div><div class="coverage-note">Aktivierungsscore ist rein intern: Datenlücke 30 · Direktkontakt 22 · vorbereiteter Wochenplan 14 · DE/EN/International 16 · Sales-Priorität/Leadscore bis 24 · vorhandene Versandvorbereitung 6. Bereits Betreiber-bestätigte Zeiten werden nicht erneut priorisiert.</div>`;
  }

  const baseShell221=shell;
  shell=function(content){
    let html=baseShell221(content);const active=state.view==='activation'?'active':'';const anchor='<button data-nav="sales"';
    if(html.includes(anchor))html=html.replace(anchor,`<button data-nav="activation" class="${active}">Aktivierung<i></i></button>${anchor}`);
    return html;
  };

  const baseRender221=render;
  render=function(){
    if(state.view!=='activation')return baseRender221();
    if(!state.user||!state.admin)return renderLogin();
    root.innerHTML=shell(renderActivation221());wire();
  };

  const baseWire221=wire;
  wire=function(){
    baseWire221();if(state.view!=='activation')return;
    const q=document.getElementById('activationSearch'),stage=document.getElementById('activationStage'),body=document.getElementById('activationRows');if(!q||!stage||!body)return;
    const apply=()=>{const query=clean221(q.value).toLowerCase(),st=stage.value;body.querySelectorAll('[data-activation-row]').forEach(row=>{const okQ=!query||String(row.dataset.search||'').includes(query),okS=st==='all'||row.dataset.stage===st;row.hidden=!(okQ&&okS)})};
    q.addEventListener('input',apply);stage.addEventListener('change',apply);
  };
})();

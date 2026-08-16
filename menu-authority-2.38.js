/* HOY 2.38.1 — menu provenance is independent from guest menu availability */
(function(){
  if(window.__hoyMenuAuthority238)return;
  window.__hoyMenuAuthority238=true;
  window.hoyMenuAuthorityVersion='2.38.1';

  const TRUSTED=new Set(['first_party','operator_social','authorized_transactional','verified_public_snapshot']);
  const CORE=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const COMPLETE=new Set(['complete','image_complete']);
  const clean=v=>String(v??'').trim();
  const safeHttps=v=>/^https:\/\//i.test(clean(v))?clean(v):'';
  const guestLink=v=>{const url=safeHttps(v);return url&&!/\.pdf(?:$|[?#])/i.test(url)?url:''};
  const authority=s=>clean(s?.source_authority)||(s?.is_official===false?'unverified_third_party':'first_party');
  const payload=s=>s?.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};
  const checked=s=>clean(s?.completeness_checked_at||s?.authority_checked_at||s?.last_checked_at).slice(0,10);
  const fallback=s=>safeHttps(payload(s).fallback_url)||safeHttps(payload(s).source_page)||safeHttps(s?.source_url);
  const weight=s=>({complete:500,image_complete:470,partial:300,source_only:200,insufficient:100}[clean(s?.completeness_status)]||0);
  const authWeight=s=>({first_party:500,operator_social:450,authorized_transactional:400,verified_public_snapshot:350}[authority(s)]||0);
  const categoryCount=m=>(m?.categories||[]).reduce((n,row)=>n+(Array.isArray(row?.[1])?row[1].length:0),0);

  /* Guest availability is deliberately stricter than source completeness.
     A source is a real HOY menu only when its content is usable inside HOY. */
  function inAppComplete(m){
    const integrity=clean(m?.integrity);
    if(integrity==='complete')return categoryCount(m)>0;
    if(integrity==='image_complete')return m?.displayMode==='image_pages'&&Array.isArray(m?.pages)&&m.pages.length>0;
    if(integrity==='embed_complete')return m?.displayMode==='official_embed'&&!!safeHttps(m?.embedUrl);
    return false;
  }
  function currentStrong(m){return inAppComplete(m)}
  function trustedSources(rows){return (rows||[]).filter(s=>TRUSTED.has(authority(s))&&CORE.has(clean(s.coverage_scope))&&!['invalid','superseded','unknown'].includes(clean(s.completeness_status))).sort((a,b)=>weight(b)-weight(a)||authWeight(b)-authWeight(a)||String(checked(b)).localeCompare(String(checked(a))))}

  async function fetchTrusted(){
    const rows=[];
    for(let from=0;from<10000;from+=500){
      const {data,error}=await sb.from('menu_sources').select('id,restaurant_id,source_url,source_label,last_checked_at,is_official,source_format,coverage_scope,completeness_status,completeness_checked_at,display_payload,coverage_meta,source_authority,authority_checked_at,authority_note').in('source_authority',[...TRUSTED]).order('restaurant_id').order('id').range(from,from+499);
      if(error)throw error;
      const page=data||[];rows.push(...page);if(page.length<500)break;
    }
    return rows;
  }

  async function reconcile(){
    if(!sb)return;
    const sources=await fetchTrusted(),by=new Map();
    for(const s of sources){const id=Number(s.restaurant_id);if(!by.has(id))by.set(id,[]);by.get(id).push(s)}
    let snapshots=0,transactional=0;
    for(const [id,rows] of by){
      const trusted=trustedSources(rows),primary=trusted[0];if(!primary)continue;
      const a=authority(primary),status=clean(primary.completeness_status),url=fallback(primary),current=MENUS[id]||{};

      /* A complete public snapshot may be a useful evidence source, but it is not an
         in-app HOY menu and must never gain `structured` status or a menu bonus. */
      if(a==='verified_public_snapshot'&&COMPLETE.has(status)&&url&&!currentStrong(current)){
        MENUS[id]={...current,status:'source_only',integrity:'verified_snapshot_complete',sourceCompleteness:'complete',guestAvailability:'external_reference',officialMenuUrl:url,label:clean(primary.source_label)||'Aktuelle Kartenaufnahme',checked:checked(primary),sourceAuthority:a,provider:clean(payload(primary).provider)||'Öffentliche Quelle',cloud:true,localized:false,locale:null,translationStatus:null,languageCoverage:null,note:'HOY hat Betrieb und Kartenquelle abgeglichen. Die Aufnahme ist eine Quellenreferenz, keine innerhalb von HOY vollständig nutzbare oder vom Betreiber bestätigte Speisekarte.'};
        snapshots++;continue;
      }

      /* An authorized ordering channel remains a separate ordering source. Even if its
         own catalog is complete, it may differ from the dine-in menu and therefore may
         never masquerade as HOY's complete restaurant menu. */
      if(a==='authorized_transactional'&&url&&!currentStrong(current)){
        const complete=COMPLETE.has(status);
        MENUS[id]={...current,status:'integrity_partial',integrity:complete?'transactional_complete':'transactional_partial',sourceCompleteness:complete?'complete':'partial',guestAvailability:'external_reference',officialMenuUrl:url,label:clean(primary.source_label)||'Aktuelle Bestellkarte',checked:checked(primary),sourceAuthority:a,provider:clean(payload(primary).provider)||'Bestellplattform',cloud:true,localized:false,locale:null,translationStatus:null,languageCoverage:null,note:complete?'Die Bestellquelle ist vollständig erfasst, kann aber vom Vor-Ort-Angebot abweichen und gilt deshalb nicht als vollständige HOY-Speisekarte.':'Aktuelle bestellbare Auswahl. Die vollständige Vor-Ort-Karte ist noch nicht bestätigt.'};
        transactional++;continue;
      }

      if(a==='verified_public_snapshot'&&url&&!currentStrong(current)&&['source_only','partial'].includes(status)&&['unavailable','invalid','insufficient','source_only',''].includes(clean(current.integrity))){
        MENUS[id]={...current,status:'source_only',integrity:'verified_snapshot_source',sourceCompleteness:status,guestAvailability:'external_reference',officialMenuUrl:url,label:clean(primary.source_label)||'Öffentliche Kartenaufnahme',checked:checked(primary),sourceAuthority:a,cloud:true,localized:false,locale:null,translationStatus:null,languageCoverage:null,note:'Eine identitätsgeprüfte öffentliche Kartenaufnahme ist bekannt, aber noch nicht als vollständige HOY-Speisekarte freigegeben.'};
      }
    }
    window.hoyMenuAuthority238={sourceCount:sources.length,snapshots,transactional,loadedAt:Date.now(),inAppComplete};
    window.dispatchEvent(new CustomEvent('hoy:menu-authority-ready',{detail:window.hoyMenuAuthority238}));
  }

  const baseLoad=loadCloudMenus;
  loadCloudMenus=async function(){await baseLoad();try{await reconcile()}catch(error){console.warn('HOY menu authority reconciliation failed',error)}};

  const baseLabel=menuStatusLabel;
  menuStatusLabel=function(m){
    if(m?.integrity==='verified_snapshot_complete')return 'Kartenaufnahme als Quelle';
    if(m?.integrity==='verified_snapshot_source')return 'Kartenaufnahme wird geprüft';
    if(m?.integrity==='transactional_complete')return 'Bestellkarte als separate Quelle';
    if(m?.integrity==='transactional_partial')return 'Bestellauswahl als separate Quelle';
    return baseLabel(m);
  };

  function snapshotPanel(m,complete){
    const date=m.checked?` · geprüft ${esc(m.checked)}`:'';
    const link=guestLink(m.officialMenuUrl);
    return `<div class="menu-panel menu238-panel"><div class="menu-status"><div class="top"><b>${complete?'Aktuelle Kartenaufnahme als Quelle':'Kartenaufnahme wird geprüft'}</b><span class="pill ${complete?'good':'warn'}">${complete?'Quelle vollständig':'Vollständigkeit offen'}</span></div><small>${esc(m.label||'Öffentliche Kartenaufnahme')}${date}</small></div><div class="menu238-trust"><small>QUELLENTYP · ÖFFENTLICH VERIFIZIERTER SNAPSHOT</small><h4>${complete?'Quellenbeleg – nicht als vollständige HOY-Speisekarte ausgegeben.':'Identität geprüft, Inhalt noch nicht vollständig freigegeben.'}</h4><p>${esc(m.note||'HOY trennt Quellenvertrauen, Vollständigkeit und tatsächliche In-App-Verfügbarkeit.')}</p></div>${link?`<a class="menu238-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Quellenansicht öffnen <span aria-hidden="true">↗</span></a>`:''}</div>`;
  }
  function transactionalPanel(m,complete){
    const date=m.checked?` · geprüft ${esc(m.checked)}`:'';
    const link=guestLink(m.officialMenuUrl);
    return `<div class="menu-panel menu238-panel"><div class="menu-status"><div class="top"><b>${complete?'Aktuelle Bestellkarte als Quelle':'Aktuelle Bestellauswahl als Quelle'}</b><span class="pill warn">${complete?'Bestellquelle vollständig':'Teilquelle'}</span></div><small>${esc(m.label||'Bestellplattform')}${date}</small></div><div class="menu238-trust transactional"><small>QUELLENTYP · AUTORISIERTER TRANSAKTIONSKANAL</small><h4>Bestellangebot und Vor-Ort-Speisekarte bleiben getrennte Wahrheiten.</h4><p>${esc(m.note||'HOY kennzeichnet Bestell- und Restaurantkarte getrennt.')}</p></div>${link?`<a class="menu238-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Bestellquelle öffnen <span aria-hidden="true">↗</span></a>`:''}</div>`;
  }

  const basePanel=menuPanel;
  menuPanel=function(p){
    const m=menuFor(p);
    if(m?.integrity==='verified_snapshot_complete')return snapshotPanel(m,true);
    if(m?.integrity==='verified_snapshot_source')return snapshotPanel(m,false);
    if(m?.integrity==='transactional_complete')return transactionalPanel(m,true);
    if(m?.integrity==='transactional_partial')return transactionalPanel(m,false);
    return basePanel(p);
  };

  window.hoyMenuInAppComplete238=inAppComplete;
})();

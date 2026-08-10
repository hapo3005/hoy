/* HOY 2.10 — unified verified-operator cockpit, profile review, services, offers and upgrade intent */
(function(){
  const PLAN={
    free:{label:'FREE',price:'0 €',tone:'free'},
    pro:{label:'PRO',price:'49 € / Monat',tone:'pro'},
    business:{label:'BUSINESS',price:'89 € / Monat',tone:'business'}
  };
  const hub={restaurantId:null,workspace:null,offers:[],loading:false,error:'',editOfferId:null};

  const currentRestaurant=()=>{const p=claimedRestaurant();return p&&isClaimed(p)?p:null};
  const planFor=p=>String(hub.workspace?.entitlement?.active_plan||p?.active_plan||'free');
  const paid=p=>['pro','business'].includes(planFor(p));
  const fmtDate=v=>{try{return v?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v)):''}catch{return ''}};
  const offerDate=v=>v?String(v).slice(0,10):'';
  const dateStart=v=>v?`${v}T00:00:00Z`:null;
  const dateEnd=v=>v?`${v}T23:59:59Z`:null;
  const safeState=v=>['available','unavailable','unknown'].includes(String(v))?String(v):'unknown';
  const stateLabel=v=>v==='available'?'Ja':v==='unavailable'?'Nein':'Noch prüfen';
  const menuPublic=p=>Array.isArray(MENUS?.[p.id]?.categories)&&MENUS[p.id].categories.length>0;
  const ws=()=>hub.workspace||{};

  async function loadWorkspace(p,force=false){
    if(!sb||!cloud.user||!p)return;
    if(hub.loading)return;
    if(!force&&hub.restaurantId===Number(p.id)&&hub.workspace)return;
    hub.loading=true;hub.error='';
    try{
      const [{data:workspace,error:we},{data:offers,error:oe}]=await Promise.all([
        sb.rpc('get_operator_workspace',{p_restaurant_id:Number(p.id)}),
        sb.from('offers').select('id,restaurant_id,offer_type,title,description,price_text,starts_at,ends_at,daily_time_text,status,published_at,updated_at').eq('restaurant_id',Number(p.id)).order('updated_at',{ascending:false}).limit(20)
      ]);
      if(we)throw we;if(oe)throw oe;
      hub.restaurantId=Number(p.id);hub.workspace=workspace||{};hub.offers=offers||[];
    }catch(err){hub.error=err?.message||String(err);console.warn('HOY operator workspace unavailable',err)}
    finally{hub.loading=false}
  }
  window.hoyLoadOperatorWorkspace=loadWorkspace;

  const baseLoadOwnClaims210=loadOwnClaims;
  loadOwnClaims=async function(){
    await baseLoadOwnClaims210();
    const p=currentRestaurant();
    if(p&&cloud.user)await loadWorkspace(p,true);else{hub.restaurantId=null;hub.workspace=null;hub.offers=[];hub.error=''}
  };

  function readiness(p){
    const w=ws();const services=w.services||{};const menu=w.menu||{};const media=w.media||{};const live=w.live_hours||null;
    const basics=!!(p.address&&p.phone&&p.description);
    const hours=!!(live?.display_text||p.hours);
    const serviceReady=['reservation','pickup','delivery'].every(k=>safeState(services[k]||effectiveServiceState(p,k))!=='unknown');
    const menuReady=menuPublic(p)||Number(menu.count||0)>0;
    const mediaReady=Number(media.public_count||0)>0||Number(media.approved_count||0)>0||Number(media.candidate_count||0)>0;
    const checks=[basics,hours,serviceReady,menuReady,mediaReady];
    return {basics,hours,serviceReady,menuReady,mediaReady,done:checks.filter(Boolean).length,total:checks.length,percent:Math.round(checks.filter(Boolean).length/checks.length*100)};
  }

  function profileStatus(){
    const r=ws().profile_change;
    if(!r)return {label:'HOY geprüft',tone:'neutral',text:'Keine offene Betreiber-Korrektur.'};
    if(r.status==='pending')return {label:'IN PRÜFUNG',tone:'warn',text:`Korrektur eingereicht ${fmtDate(r.submitted_at)}.`};
    if(r.status==='approved')return {label:'ÜBERNOMMEN',tone:'good',text:'Letzte Korrektur wurde von HOY übernommen.'};
    if(r.status==='rejected')return {label:'RÜCKFRAGE',tone:'bad',text:r.rejection_reason||'Letzte Korrektur konnte nicht übernommen werden.'};
    return {label:String(r.status||'').toUpperCase(),tone:'neutral',text:'Letzte Korrektur ist abgeschlossen.'};
  }
  function menuStatus(p){
    const m=ws().menu||{};
    if(menuPublic(p))return {label:'AKTIV',tone:'good',text:'Strukturierte HOY-Speisekarte ist im Profil verfügbar.'};
    if(Number(m.count||0)>0)return {label:'IN ARBEIT',tone:'warn',text:`Letzte Einreichung: ${m.latest_status||m.latest_processor_state||'Entwurf'}.`};
    return {label:'OFFEN',tone:'neutral',text:'Noch keine Betreiber-Einreichung vorhanden.'};
  }
  function mediaStatus(){
    const m=ws().media||{};
    if(Number(m.public_count||0)>0)return {label:`${m.public_count} LIVE`,tone:'good',text:'Freigegebene Betreiberbilder werden verwendet.'};
    if(Number(m.approved_count||0)>0)return {label:'FREIGEGEBEN',tone:'good',text:'Freigaben liegen vor; Veröffentlichung wird verarbeitet.'};
    if(Number(m.candidate_count||0)>0)return {label:'VORAUSWAHL',tone:'warn',text:`${m.candidate_count} offizielle Bildquelle${Number(m.candidate_count)===1?'':'n'} vorbereitet.`};
    return {label:'OFFEN',tone:'neutral',text:'HOY hat noch keine Bildauswahl vorbereitet.'};
  }
  function serviceStatus(p){
    const s=ws().services||{};const vals=['reservation','pickup','delivery'].map(k=>safeState(s[k]||effectiveServiceState(p,k)));
    const known=vals.filter(x=>x!=='unknown').length;
    return known===3?{label:'BESTÄTIGT',tone:'good',text:'Reservierung, Abholung und Lieferung sind bestätigt.'}:{label:`${known}/3`,tone:'warn',text:'Unklare Services können direkt vom Betreiber bestätigt werden.'};
  }
  function hoursStatus(p){
    const live=ws().live_hours;
    if(live?.display_text)return {label:'LIVE',tone:'good',text:`Vom Betrieb bestätigt${live.updated_at?' · '+fmtDate(live.updated_at):''}.`};
    if(p.hours)return {label:'HOY-BASIS',tone:'neutral',text:paid(p)?'Noch keine Betreiber-Livezeiten gespeichert.':'Basiszeiten sind vorhanden; Live-Pflege ist Pro/Business.'};
    return {label:'OFFEN',tone:'warn',text:'Öffnungszeiten sollten geprüft werden.'};
  }
  function offerStatus(p){
    const o=ws().offers||{};
    if(Number(o.active_count||0)>0)return {label:`${o.active_count} AKTIV`,tone:'good',text:'Aktuelle Inhalte sind für Gäste veröffentlicht.'};
    if(Number(o.draft_count||0)>0)return {label:`${o.draft_count} ENTWURF`,tone:'warn',text:paid(p)?'Entwurf kann veröffentlicht werden.':'Entwurf bleibt kostenlos sichtbar in der Betreiber-Vorschau.'};
    return {label:paid(p)?'BEREIT':'PRO',tone:paid(p)?'neutral':'locked',text:'Angebote, Events und Tagesgerichte vorbereiten.'};
  }

  function statusPill(s){return `<span class="hub-status ${esc(s.tone||'neutral')}">${esc(s.label)}</span>`}
  function moduleCard(num,title,copy,status,action,label,extra=''){
    return `<article class="hub-module"><div class="hub-module-top"><span class="hub-num">${num}</span>${statusPill(status)}</div><h3>${esc(title)}</h3><p>${esc(copy)}</p><small>${esc(status.text||'')}</small>${extra}<button type="button" data-hub-action="${esc(action)}">${esc(label)}</button></article>`;
  }
  function nextAction(p,r){
    if(!r.basics)return ['profile','Basisdaten vervollständigen'];
    if(!r.hours)return [paid(p)?'hours':'profile','Öffnungszeiten prüfen'];
    if(!r.serviceReady)return ['services','Services bestätigen'];
    if(!r.menuReady)return ['menu','Speisekarte einreichen'];
    if(!r.mediaReady)return ['media','Bilder prüfen'];
    return ['preview','Gastansicht ansehen'];
  }
  function planStrip(p){
    const plan=planFor(p);const req=ws().upgrade_request;
    const pending=req?.status==='pending'?`<span class="hub-upgrade-pending">${esc(String(req.requested_plan||'').toUpperCase())} vorgemerkt</span>`:'';
    return `<div class="hub-plan-strip"><div><small>AKTUELLER TARIF</small><b>${esc(PLAN[plan]?.label||plan.toUpperCase())}</b><span>${esc(PLAN[plan]?.price||'')}</span>${pending}</div><button type="button" data-hub-action="plans">Tarife & Funktionen</button></div>`;
  }
  function commandCenterHTML(p){
    const r=readiness(p);const next=nextAction(p,r);const profile=profileStatus();const hours=hoursStatus(p);const menu=menuStatus(p);const media=mediaStatus();const services=serviceStatus(p);const offers=offerStatus(p);const plan=planFor(p);
    return `<section class="operator-command-center">
      <div class="hub-hero"><div><div class="eyebrow">BETREIBER-COCKPIT</div><h2>${esc(p.name)}</h2><p>Verifiziertes Profil · ${esc(PLAN[plan]?.label||plan.toUpperCase())}</p></div><span class="hub-verified">✓ Verifiziert</span></div>
      <div class="hub-readiness"><div class="hub-readiness-copy"><strong>${r.percent}%</strong><div><b>Profilbereitschaft</b><span>${r.done} von ${r.total} Kernbereichen sind vorbereitet.</span></div></div><div class="hub-progress"><span style="width:${r.percent}%"></span></div><button type="button" class="hub-next" data-hub-action="${next[0]}">${esc(next[1])} →</button></div>
      ${hub.error?`<div class="hub-alert">Workspace konnte nicht vollständig geladen werden: ${esc(hub.error)}</div>`:''}
      <div class="hub-grid">
        ${moduleCard('01','Basisdaten','Adresse, Telefon, Website und Beschreibung.',profile,'profile',profile.label==='IN PRÜFUNG'?'Korrektur ansehen':'Daten korrigieren')}
        ${moduleCard('02','Öffnungszeiten',paid(p)?'Wochenzeiten, Sondertage und kurzfristige Hinweise direkt live pflegen.':'HOY-Basiszeiten bleiben kostenlos; exakte Live-Pflege ist Pro/Business.',hours,paid(p)?'hours':'profile',paid(p)?'Live-Zeiten verwalten':'Zeiten zur Prüfung senden')}
        ${moduleCard('03','Speisekarte','PDF, Foto, offizieller Link oder direkte Eingabe – strukturiert und lokalisierbar.',menu,'menu',paid(p)?'Speisekarte verwalten':'Speisekarte einreichen')}
        ${moduleCard('04','Bilder','HOY bereitet offizielle Quellen vor; der Betreiber entscheidet über die Nutzung.',media,'media','Bilder prüfen & freigeben')}
        ${moduleCard('05','Services','Reservierung, Abholung und Lieferung ohne Vermutungen bestätigen.',services,'services','Services verwalten')}
        ${moduleCard('06','Aktuelles','Angebote, Events und Tagesgerichte als echte Gastvorschau vorbereiten.',offers,'offers',paid(p)?'Aktuelles verwalten':'Pro-Vorschau erstellen')}
      </div>
      <div class="hub-bottom-actions"><button type="button" class="primary" data-hub-action="preview">So sehen Gäste mein Profil</button><button type="button" data-hub-action="plans">Tarif vergleichen</button></div>
      ${planStrip(p)}
    </section>`;
  }

  const basePartner210=partner;
  partner=function(){
    let html=basePartner210();const p=currentRestaurant();
    if(!p)return html;
    html=html.replace('<section>','<section class="operator-hub-view">');
    return html.replace('<div class="partner-hero">',commandCenterHTML(p)+'<div class="partner-hero">');
  };

  function ensureDialog(id,cls='dialog'){let d=document.getElementById(id);if(!d){d=document.createElement('dialog');d.id=id;d.className=cls;document.body.appendChild(d)}return d}
  function closeButtons(d,sel){d.querySelectorAll(sel).forEach(x=>x.onclick=()=>d.close())}

  function openProfileDialog(p,focusHours=false){
    const d=ensureDialog('operatorProfileFlow');const pending=ws().profile_change?.status==='pending';
    d.innerHTML=`<div class="operator-flow"><div class="claim-head"><button class="round" data-op-close>${icons.back}</button><span class="claim-step">FREE · BASISDATEN</span></div><h2>Profilangaben prüfen.</h2><p class="claim-lead">Änderungen an Basisdaten werden von HOY geprüft, bevor sie das öffentliche Profil ersetzen. Damit bleiben auch kostenlose Profile verlässlich.</p>${pending?'<div class="hub-flow-note warn"><b>Es liegt bereits eine Korrektur in Prüfung.</b><span>Eine neue Einreichung ersetzt den bisherigen offenen Entwurf.</span></div>':''}<div class="claim-form"><div class="claim-field"><label>Adresse</label><input data-op-address value="${esc(p.address||'')}"></div><div class="claim-field"><label>Telefon</label><input data-op-phone value="${esc(p.phone||'')}"></div><div class="claim-field"><label>Offizielle Website</label><input data-op-website value="${esc(p.website||'')}" placeholder="https://…"></div><div class="claim-field"><label>HOY-Basisöffnungszeiten</label><textarea data-op-hours>${esc(p.hours||'')}</textarea><small>${paid(p)?'Diese Angabe bleibt der Fallback. Deine Live-Zeiten werden separat und sofort gepflegt.':'Free: HOY prüft die Korrektur. Pro/Business: exakte Wochen- und Sonderzeiten können zusätzlich live gepflegt werden.'}</small></div><div class="claim-field"><label>Kurzbeschreibung</label><textarea data-op-description>${esc(p.description||'')}</textarea></div><div class="claim-field"><label>Hinweis an HOY · optional</label><textarea data-op-note placeholder="Was hat sich geändert?"></textarea></div></div><div class="operator-flow-actions"><button data-op-close>Abbrechen</button><button class="primary" data-op-profile-save>Korrektur zur Prüfung senden</button></div></div>`;
    d.showModal();closeButtons(d,'[data-op-close]');
    if(focusHours)setTimeout(()=>d.querySelector('[data-op-hours]')?.focus(),30);
    d.querySelector('[data-op-profile-save]').onclick=()=>submitProfileChange(p,d);
  }
  async function submitProfileChange(p,d){
    const fields={address:'[data-op-address]',phone:'[data-op-phone]',website:'[data-op-website]',hours_text:'[data-op-hours]',description:'[data-op-description]'};
    const current={address:p.address||'',phone:p.phone||'',website:p.website||'',hours_text:p.hours||'',description:p.description||''};const changes={};
    for(const [key,sel] of Object.entries(fields)){const val=d.querySelector(sel)?.value.trim()??'';if(val!==current[key])changes[key]=val}
    if(!Object.keys(changes).length){toast('Keine Änderung erkannt');return}
    const btn=d.querySelector('[data-op-profile-save]');btn.disabled=true;btn.textContent='Wird sicher eingereicht …';
    try{
      const {data,error}=await sb.rpc('operator_submit_profile_change',{p_restaurant_id:Number(p.id),p_changes:changes,p_note:d.querySelector('[data-op-note]')?.value.trim()||null});if(error)throw error;
      addAudit('operator_profile_change_submitted',p.id,Object.keys(changes).join(', '));await loadWorkspace(p,true);d.close();render();toast('Korrektur liegt bei HOY zur Prüfung');return data;
    }catch(err){btn.disabled=false;btn.textContent='Korrektur zur Prüfung senden';toast(err?.message||'Korrektur konnte nicht eingereicht werden')}
  }

  function serviceValues(p){const s=ws().services||{};return {reservation:safeState(s.reservation||effectiveServiceState(p,'reservation')),pickup:safeState(s.pickup||effectiveServiceState(p,'pickup')),delivery:safeState(s.delivery||effectiveServiceState(p,'delivery'))}}
  function serviceSelect(kind,label,value){return `<label class="hub-service-row"><span><b>${esc(label)}</b><small>Vom Betrieb bestätigt</small></span><select data-hub-service="${kind}">${[['available','Ja'],['unavailable','Nein'],['unknown','Noch prüfen']].map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('')}</select></label>`}
  function openServicesDialog(p){
    const d=ensureDialog('operatorServicesFlow');const s=serviceValues(p);
    d.innerHTML=`<div class="operator-flow"><div class="claim-head"><button class="round" data-op-close>${icons.back}</button><span class="claim-step">FREE · SERVICES</span></div><h2>Was können Gäste wirklich nutzen?</h2><p class="claim-lead">Diese drei Angaben darf ein verifizierter Betrieb kostenlos selbst bestätigen. Unbekannt bleibt unbekannt – HOY verspricht nichts, was nicht bestätigt wurde.</p><div class="hub-services-edit">${serviceSelect('reservation','Reservierung',s.reservation)}${serviceSelect('pickup','Abholung',s.pickup)}${serviceSelect('delivery','Lieferung',s.delivery)}</div><div class="operator-flow-actions"><button data-op-close>Abbrechen</button><button class="primary" data-op-services-save>Bestätigen & speichern</button></div></div>`;
    d.showModal();closeButtons(d,'[data-op-close]');d.querySelector('[data-op-services-save]').onclick=()=>saveServices(p,d);
  }
  async function saveServices(p,d){
    const btn=d.querySelector('[data-op-services-save]');btn.disabled=true;btn.textContent='Speichert …';const now=new Date().toISOString();
    const payload={restaurant_id:Number(p.id),reservation_state:safeState(d.querySelector('[data-hub-service="reservation"]')?.value),pickup_state:safeState(d.querySelector('[data-hub-service="pickup"]')?.value),delivery_state:safeState(d.querySelector('[data-hub-service="delivery"]')?.value),confirmed_by:cloud.user.id,confirmed_at:now};
    try{const {error}=await sb.from('restaurant_services').upsert(payload,{onConflict:'restaurant_id'});if(error)throw error;await loadCloudRestaurants();const fresh=currentRestaurant()||p;await loadWorkspace(fresh,true);addAudit('operator_services_confirmed',p.id,'Services bestätigt');d.close();render();toast('Services vom Betrieb bestätigt')}
    catch(err){btn.disabled=false;btn.textContent='Bestätigen & speichern';toast(err?.message||'Services konnten nicht gespeichert werden')}
  }

  function offerForm(p){
    const edit=hub.editOfferId?hub.offers.find(x=>x.id===hub.editOfferId):null;const o=edit||{};
    return `<div class="hub-offer-form"><div class="claim-field"><label>Typ</label><select data-hub-offer-type>${['Angebot','Event','Tagesgericht'].map(x=>`<option ${o.offer_type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="claim-field"><label>Titel</label><input data-hub-offer-title value="${esc(o.title||'')}" placeholder="z. B. Sunset Paella Weekend"></div><div class="claim-field"><label>Beschreibung</label><textarea data-hub-offer-description>${esc(o.description||'')}</textarea></div><div class="claim-field"><label>Preis / Hinweis</label><input data-hub-offer-price value="${esc(o.price_text||'')}" placeholder="z. B. 24,90 € p. P."></div><div class="hub-offer-dates"><div class="claim-field"><label>Von</label><input type="date" data-hub-offer-start value="${esc(offerDate(o.starts_at)||todayISO())}"></div><div class="claim-field"><label>Bis</label><input type="date" data-hub-offer-end value="${esc(offerDate(o.ends_at)||todayISO())}"></div></div><div class="claim-field"><label>Zeitfenster</label><input data-hub-offer-time value="${esc(o.daily_time_text||'')}" placeholder="z. B. 18:00–22:00"></div><div class="hub-offer-form-actions">${edit?'<button data-hub-offer-cancel>Bearbeitung abbrechen</button>':''}<button class="primary" data-hub-offer-save>${edit?'Entwurf aktualisieren':'Entwurf speichern'}</button></div></div>`;
  }
  function offerRows(p){
    if(!hub.offers.length)return '<div class="menu-intake-empty">Noch kein Angebot oder Event vorbereitet.</div>';
    return `<div class="hub-offer-list">${hub.offers.map(o=>`<article><div><small>${esc(o.offer_type||'Angebot')} · ${esc(String(o.status||'draft').toUpperCase())}</small><b>${esc(o.title)}</b><span>${esc([offerDate(o.starts_at),offerDate(o.ends_at)].filter(Boolean).join(' – '))}</span></div><div class="hub-offer-row-actions">${o.status==='draft'?`<button data-hub-offer-edit="${o.id}">Bearbeiten</button>${paid(p)?`<button class="primary" data-hub-offer-publish="${o.id}">Veröffentlichen</button>`:'<button data-hub-action="plans">Pro ansehen</button>'}`:''}${o.status==='published'?`<button data-hub-offer-archive="${o.id}">Archivieren</button>`:''}</div></article>`).join('')}</div>`;
  }
  function openOffersDialog(p){
    const d=ensureDialog('operatorOffersFlow');
    d.innerHTML=`<div class="operator-flow wide"><div class="claim-head"><button class="round" data-op-close>${icons.back}</button><span class="claim-step">${paid(p)?esc(planFor(p).toUpperCase())+' · AKTUELLES':'FREE · PRO-VORSCHAU'}</span></div><h2>Aktuelles von ${esc(p.name)}</h2><p class="claim-lead">Erstellen und die echte Gastansicht vorbereiten ist kostenlos. Erst das Veröffentlichen von Angeboten, Events und Tagesgerichten benötigt Pro oder Business.</p>${offerForm(p)}<div class="hub-offer-existing"><h3>Vorhandene Inhalte</h3>${offerRows(p)}</div>${!paid(p)?'<div class="hub-flow-note"><b>Keine Paywall vor der Vorschau.</b><span>Der Betrieb kann das Feature vollständig ausprobieren, bevor er sich für Pro entscheidet.</span></div>':''}</div>`;
    d.showModal();closeButtons(d,'[data-op-close]');wireOfferDialog(p,d);
  }
  function wireOfferDialog(p,d){
    d.querySelector('[data-hub-offer-save]')?.addEventListener('click',()=>saveOffer(p,d));
    d.querySelector('[data-hub-offer-cancel]')?.addEventListener('click',()=>{hub.editOfferId=null;openOffersDialog(p)});
    d.querySelectorAll('[data-hub-offer-edit]').forEach(x=>x.onclick=()=>{hub.editOfferId=x.dataset.hubOfferEdit;openOffersDialog(p)});
    d.querySelectorAll('[data-hub-offer-publish]').forEach(x=>x.onclick=()=>publishOffer(p,x.dataset.hubOfferPublish));
    d.querySelectorAll('[data-hub-offer-archive]').forEach(x=>x.onclick=()=>archiveOffer(p,x.dataset.hubOfferArchive));
    d.querySelectorAll('[data-hub-action="plans"]').forEach(x=>x.onclick=()=>openPlansDialog(p));
  }
  async function saveOffer(p,d){
    const title=d.querySelector('[data-hub-offer-title]')?.value.trim()||'';if(!title){toast('Bitte einen Titel eintragen');return}
    const payload={restaurant_id:Number(p.id),offer_type:d.querySelector('[data-hub-offer-type]')?.value||'Angebot',title,description:d.querySelector('[data-hub-offer-description]')?.value.trim()||null,price_text:d.querySelector('[data-hub-offer-price]')?.value.trim()||null,starts_at:dateStart(d.querySelector('[data-hub-offer-start]')?.value),ends_at:dateEnd(d.querySelector('[data-hub-offer-end]')?.value),daily_time_text:d.querySelector('[data-hub-offer-time]')?.value.trim()||null,status:'draft',updated_at:new Date().toISOString()};
    const btn=d.querySelector('[data-hub-offer-save]');btn.disabled=true;btn.textContent='Speichert …';
    try{
      let error;if(hub.editOfferId){({error}=await sb.from('offers').update(payload).eq('id',hub.editOfferId))}else{({error}=await sb.from('offers').insert({...payload,created_by:cloud.user.id}))}if(error)throw error;
      hub.editOfferId=null;await loadWorkspace(p,true);addAudit('offer_drafted',p.id,title);toast(paid(p)?'Entwurf gespeichert':'Pro-Vorschau als Entwurf gespeichert');openOffersDialog(p);render();
    }catch(err){btn.disabled=false;btn.textContent='Entwurf speichern';toast(err?.message||'Entwurf konnte nicht gespeichert werden')}
  }
  async function publishOffer(p,id){
    try{const {error}=await sb.rpc('operator_publish_offer',{p_offer_id:id});if(error)throw error;await loadWorkspace(p,true);addAudit('operator_offer_published',p.id,id);toast('Angebot ist jetzt veröffentlicht');openOffersDialog(p);render()}catch(err){toast(err?.message||'Veröffentlichung nicht möglich')}
  }
  async function archiveOffer(p,id){
    try{const {error}=await sb.rpc('operator_archive_offer',{p_offer_id:id});if(error)throw error;await loadWorkspace(p,true);toast('Inhalt archiviert');openOffersDialog(p);render()}catch(err){toast(err?.message||'Archivieren nicht möglich')}
  }

  function featureRow(label,free,pro,business){return `<div class="hub-feature-row"><b>${esc(label)}</b><span>${free?'✓':'—'}</span><span>${pro?'✓':'—'}</span><span>${business?'✓':'—'}</span></div>`}
  function openPlansDialog(p){
    const d=ensureDialog('operatorPlansFlow');const current=planFor(p);const req=ws().upgrade_request;
    d.innerHTML=`<div class="operator-flow wide"><div class="claim-head"><button class="round" data-op-close>${icons.back}</button><span class="claim-step">HOY · TARIFE</span></div><h2>Mehr Kontrolle, nicht weniger Basisqualität.</h2><p class="claim-lead">Free bleibt ein gutes, bestätigtes Profil. Pro monetarisiert laufende Aktualität und Self-Service. Business ergänzt später gezielte Reichweitenprodukte.</p><div class="hub-plan-cards">${['free','pro','business'].map(k=>`<article class="${current===k?'active':''}"><small>${PLAN[k].label}</small><strong>${PLAN[k].price}</strong><p>${k==='free'?'Bestätigtes Profil, Services, Medienfreigabe und Menüeinreichung.':k==='pro'?'Live-Zeiten, laufende Menü-Selbstpflege, Angebote/Events und Analytics.':'Alles aus Pro plus Featured- und Kampagnenfunktionen nach Freischaltung.'}</p>${current===k?'<span>Aktiv</span>':k==='free'?'':`<button data-hub-upgrade="${k}">${req?.status==='pending'&&req?.requested_plan===k?'Vorgemerkt':'Upgrade vormerken'}</button>`}</article>`).join('')}</div><div class="hub-feature-table"><div class="hub-feature-head"><b>Funktion</b><span>Free</span><span>Pro</span><span>Business</span></div>${featureRow('Verifiziertes Basisprofil',1,1,1)}${featureRow('Services selbst bestätigen',1,1,1)}${featureRow('Eigene Bilder freigeben',1,1,1)}${featureRow('Lokalisierte HOY-Speisekarte',1,1,1)}${featureRow('Live-Öffnungszeiten & Sondertage',0,1,1)}${featureRow('Laufende Menü-Selbstpflege',0,1,1)}${featureRow('Angebote & Events veröffentlichen',0,1,1)}${featureRow('Betreiber-Analytics',0,1,1)}${featureRow('Featured / Kampagnen',0,0,1)}</div><div class="hub-flow-note"><b>Noch keine Zahlung.</b><span>„Upgrade vormerken“ speichert nur den Wunsch intern. Es wird nichts abgebucht und keine automatische Nachricht versendet.</span></div></div>`;
    d.showModal();closeButtons(d,'[data-op-close]');d.querySelectorAll('[data-hub-upgrade]').forEach(x=>x.onclick=()=>requestUpgrade(p,x.dataset.hubUpgrade,d));
  }
  async function requestUpgrade(p,plan,d){
    const btn=d.querySelector(`[data-hub-upgrade="${plan}"]`);btn.disabled=true;btn.textContent='Wird vorgemerkt …';
    try{const {error}=await sb.rpc('operator_request_upgrade',{p_restaurant_id:Number(p.id),p_plan:plan,p_note:'Über HOY Betreiber-Cockpit vorgemerkt'});if(error)throw error;await loadWorkspace(p,true);addAudit('operator_upgrade_requested',p.id,plan);toast(`${plan.toUpperCase()} intern vorgemerkt · keine Abbuchung`);openPlansDialog(p);render()}catch(err){btn.disabled=false;btn.textContent='Upgrade vormerken';toast(err?.message||'Upgrade konnte nicht vorgemerkt werden')}
  }

  function proxy(selector){const el=document.querySelector(selector);if(el){el.click();return true}return false}
  function handleAction(p,action){
    if(action==='profile')return openProfileDialog(p,false);
    if(action==='hours'){
      if(paid(p)){if(typeof window.openLiveHoursEditor==='function')return window.openLiveHoursEditor(p);if(proxy('[data-live-hours-open]'))return}
      return openProfileDialog(p,true);
    }
    if(action==='menu'){if(proxy('[data-menu-intake-open]'))return;return toast('Speisekartenmodul wird geladen')}
    if(action==='media'){if(proxy(`[data-media-review="${p.id}"]`))return;return toast('Bildauswahl wird geladen')}
    if(action==='services')return openServicesDialog(p);
    if(action==='offers')return openOffersDialog(p);
    if(action==='preview'){if(typeof openClaimPreview==='function')return openClaimPreview(p,planFor(p));if(proxy('[data-owner-preview]'))return}
    if(action==='plans')return openPlansDialog(p);
  }

  const baseWire210=wire;
  wire=function(){
    baseWire210();const p=currentRestaurant();if(!p)return;
    document.querySelectorAll('.operator-command-center [data-hub-action]').forEach(btn=>btn.onclick=()=>handleAction(p,btn.dataset.hubAction));
  };
})();
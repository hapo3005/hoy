/* HOY 1.9 — curated operator media review, approval and publication */
(function(){
  const ROLE_LABELS={hero:'Titelbild',food:'Essen',terrace:'Terrasse',interior:'Innenraum',drinks:'Drinks',event:'Event / Atmosphäre',team:'Team',menu:'Speisekarte',other:'Weiteres Bild',gallery:'Galerie'};
  const SOURCE_LABELS={official_website:'Eigene Website',official_instagram:'Offizielles Instagram',official_facebook:'Offizielles Facebook',official_menu:'Eigene Speisekarte',operator_upload:'Eigener Upload',other_official:'Bestätigter Unternehmensauftritt'};
  let publishedVenueMedia=new Map();
  let reviewState={restaurantId:null,canApprove:false,claimStatus:'none',candidates:[],decisions:new Map(),replacementUploaded:new Set(),rightsConfirmed:false,loading:false};

  function mediaRoleLabel(v){return ROLE_LABELS[v]||'Bild'}
  function mediaSourceLabel(v){return SOURCE_LABELS[v]||'Offizielle Quelle'}
  function publicMediaUrl(row){
    if(!sb)return '';
    return sb.storage.from(row.storage_bucket||'venue-media').getPublicUrl(row.storage_path).data.publicUrl||'';
  }
  async function loadPublishedVenueMedia(){
    if(!sb)return;
    const {data,error}=await sb.from('published_venue_media').select('id,restaurant_id,storage_bucket,storage_path,display_role,sort_order,source_url').order('sort_order').order('id');
    if(error){console.warn('HOY published media could not be loaded',error);return;}
    const next=new Map();
    for(const row of data||[]){
      const rid=Number(row.restaurant_id);const item={...row,public_url:publicMediaUrl(row)};
      if(!next.has(rid))next.set(rid,[]);next.get(rid).push(item);
    }
    publishedVenueMedia=next;
  }

  const mediaForBefore19=mediaFor;
  mediaFor=function(p){
    if(typeof claimDraft!=='undefined'&&claimDraft&&hasLocalVerifiedClaim(p)&&claimDraft.ownerHero)return mediaForBefore19(p);
    const rows=publishedVenueMedia.get(Number(p?.id))||[];
    const hero=rows.find(x=>x.display_role==='hero')||rows[0];
    if(hero?.public_url){
      return {kind:'operator',src:hero.public_url,position:'50% 50%',label:'Betreiberbild · freigegeben',source:hero.source_url||'',author:'Betreiber',license:'HOY-Nutzungsfreigabe',license_url:'',note:'Vom verifizierten Betreiber für das HOY-Profil freigegeben.'};
    }
    return mediaForBefore19(p);
  };

  const cardBefore19=card;
  card=function(p){
    let html=cardBefore19(p);
    if(p?.profile_quality==='premium'&&effectiveServiceState(p,'reservation')!=='available')html=html.replace('Daten prüfen','HOY geprüft');
    return html;
  };

  const openDetailBefore19=openDetail;
  openDetail=function(id){
    openDetailBefore19(id);
    const rows=publishedVenueMedia.get(Number(id))||[];
    if(rows.length<2)return;
    const d=document.getElementById('detail');const tabs=d?.querySelector('.tabs');if(!d||!tabs)return;
    const gallery=document.createElement('section');gallery.className='venue-gallery';
    gallery.innerHTML=`<div class="venue-gallery-head"><span class="eyebrow">BETREIBERFOTOS</span><b>${rows.length} freigegebene Bilder</b></div><div class="venue-gallery-grid">${rows.slice(0,6).map((x,i)=>`<figure class="venue-gallery-item ${i===0?'wide':''}"><img src="${esc(x.public_url)}" alt="Freigegebenes Bild" loading="lazy" onerror="this.onerror=null;this.src=HERO"><figcaption>${esc(mediaRoleLabel(x.display_role))}</figcaption></figure>`).join('')}</div>`;
    tabs.parentNode.insertBefore(gallery,tabs);
  };

  function ownClaimFor(p){
    if(!p||!cloud?.user)return null;
    return (cloud.claims||[]).find(x=>Number(x.restaurant_id)===Number(p.id)&&['pending','verified'].includes(x.status))||null;
  }
  function mediaPartnerPanel(p,claim){
    const verified=claim?.status==='verified';
    return `<div class="owner-media-panel"><div class="owner-media-copy"><div class="eyebrow">BILDER · HOY BEREITET VOR</div><h3>Deine Bildauswahl ist vorbereitet.</h3><p>${verified?'Prüfe unsere Vorauswahl, gib alles mit einem Klick frei oder ersetze einzelne Motive.':'Du kannst die vorausgewählten Quellen bereits ansehen. Die eigentliche Freigabe wird nach der HOY-Verifizierung deines Betreiberkontos aktiviert.'}</p></div><button class="${verified?'primary':''}" data-media-review="${p.id}">${verified?'Bilder prüfen & freigeben':'Vorauswahl ansehen'}</button></div>`;
  }
  const partnerBefore19=partner;
  partner=function(){
    let html=partnerBefore19();const p=claimedRestaurant();const claim=ownClaimFor(p);
    if(!p||!claim)return html;
    return html.replace('<div class="partner-hero">',mediaPartnerPanel(p,claim)+'<div class="partner-hero">');
  };

  // HOY does the curation work first. Uploading photos is no longer a required claim step.
  claimStepThree=function(p){
    return `<h2>Bilder ohne Extraarbeit.</h2><p class="claim-lead">HOY bereitet für dein Profil bereits eine passende Bildauswahl aus deinen offiziellen Unternehmenskanälen vor. Du musst jetzt nichts hochladen.</p>${claimRestaurantCard(p)}<div class="claim-card good"><h3>Nach der Verifizierung</h3><p>Du siehst unsere Vorauswahl direkt im Partnerbereich: Titelbild, Essen, Terrasse, Drinks oder Event. Dann kannst du alles freigeben, einzelne Motive ablehnen oder mit einem eigenen Bild ersetzen.</p></div><div class="claim-card notice"><h3>Bis zur Freigabe bleibt alles privat.</h3><p>Kein vorausgewähltes Unternehmensbild wird öffentlich in HOY verwendet, bevor ein verifizierter Betreiber es bestätigt hat. Die bisherigen Regionalbilder bleiben nur der Fallback.</p></div>`;
  };

  function ensureMediaDialog(){
    let d=document.getElementById('mediaReview');
    if(!d){d=document.createElement('dialog');d.id='mediaReview';d.className='dialog media-review-dialog';document.body.appendChild(d)}
    return d;
  }
  function decisionFor(c){return reviewState.decisions.get(Number(c.id))||c.operator_decision||'pending'}
  function candidatePreview(c){
    if(c.asset_url)return `<div class="media-review-photo"><img src="${esc(c.asset_url)}" alt="Vorausgewähltes Bild für ${esc(mediaRoleLabel(c.intended_role))}" loading="lazy"><span>${esc(mediaRoleLabel(c.intended_role))}</span></div>`;
    return `<div class="media-source-placeholder"><div class="media-source-icon">HOY</div><b>${esc(mediaRoleLabel(c.intended_role))}</b><span>Quelle vorbereitet</span></div>`;
  }
  function mediaCandidateCard(c){
    const decision=decisionFor(c);const direct=!!c.asset_url;
    return `<article class="media-review-card" data-candidate="${c.id}">${candidatePreview(c)}<div class="media-review-body"><div class="media-review-meta"><span>${esc(mediaSourceLabel(c.source_type))}</span>${c.is_public?'<span class="live">LIVE</span>':''}</div><p>${esc(c.curation_note||'HOY hat diese Quelle für dein Profil vorbereitet.')}</p><a href="${esc(c.source_page_url)}" target="_blank" rel="noopener noreferrer">Offizielle Quelle öffnen ↗</a>${reviewState.canApprove?`<div class="media-decisions"><button data-media-decision="approved" data-candidate-id="${c.id}" class="${decision==='approved'?'active':''}">${direct?'Freigeben':'Quelle freigeben'}</button><button data-media-decision="rejected" data-candidate-id="${c.id}" class="${decision==='rejected'?'active':''}">Nicht verwenden</button><button data-media-decision="replace_requested" data-candidate-id="${c.id}" class="${decision==='replace_requested'?'active':''}">Ersetzen</button></div>${decision==='replace_requested'?`<label class="media-replace"><input type="file" accept="image/jpeg,image/png,image/webp" data-media-replace-file="${c.id}"><b>${reviewState.replacementUploaded.has(Number(c.id))?'Ersatzbild gespeichert ✓':'Eigenes Ersatzbild auswählen'}</b><small>Max. 10 MB · bleibt bis zum Speichern privat.</small></label>`:''}`:''}</div></article>`;
  }
  function renderMediaReview(){
    const d=ensureMediaDialog();
    if(reviewState.loading){d.innerHTML='<div class="media-review-flow"><div class="claim-head"><button class="round" data-media-close>←</button><span class="claim-step">HOY MEDIEN</span></div><div class="media-loading"><span class="spinner"></span>Bildauswahl wird geladen …</div></div>';d.querySelector('[data-media-close]').onclick=()=>d.close();return;}
    const p=DATA.find(x=>Number(x.id)===Number(reviewState.restaurantId));
    const can=reviewState.canApprove;const candidates=reviewState.candidates||[];
    d.innerHTML=`<div class="media-review-flow"><div class="claim-head"><button class="round" data-media-close>${icons.back}</button><span class="claim-step">HOY · BILDER FREIGEBEN</span></div><div class="media-review-title"><div class="eyebrow">${can?'BETREIBER VERIFIZIERT':'VORSCHAU · CLAIM IN PRÜFUNG'}</div><h2>${esc(p?.name||'Dein Profil')}</h2><p>${can?'Wir haben die Bildwelt vorbereitet. Du entscheidest nur noch, was HOY verwenden darf.':'Die Vorauswahl ist schon sichtbar. Nach der HOY-Verifizierung kannst du sie mit wenigen Klicks freigeben.'}</p></div>${candidates.length?`<div class="media-review-grid">${candidates.map(mediaCandidateCard).join('')}</div>`:'<div class="claim-card notice"><h3>Noch keine Medienauswahl.</h3><p>HOY recherchiert gerade die offiziellen Bildquellen dieses Betriebs.</p></div>'}${can&&candidates.length?`<label class="media-rights"><input type="checkbox" data-media-rights ${reviewState.rightsConfirmed?'checked':''}><span>Ich bestätige, dass mein Unternehmen die erforderlichen Rechte an den freigegebenen Bildern bzw. den von mir freigegebenen Unternehmensquellen besitzt oder HOY deren Nutzung ausdrücklich gestatten darf.</span></label><div class="media-review-actions"><button data-media-all>Alle freigeben</button><button class="primary" data-media-save>Auswahl speichern</button></div><p class="media-review-note">Direkt ausgewählte Website-Bilder werden nach deiner Freigabe in den HOY-Medienspeicher übernommen. Bei Social-/Verzeichnisquellen speichert HOY zunächst deine Quellenfreigabe; das konkrete Bild wird erst danach aus dem bestätigten Betreiberkanal ausgewählt.</p>`:''}</div>`;
    d.querySelector('[data-media-close]').onclick=()=>d.close();
    d.querySelector('[data-media-rights]')?.addEventListener('change',e=>{reviewState.rightsConfirmed=!!e.target.checked});
    d.querySelectorAll('[data-media-decision]').forEach(btn=>btn.onclick=()=>{reviewState.decisions.set(Number(btn.dataset.candidateId),btn.dataset.mediaDecision);renderMediaReview()});
    d.querySelector('[data-media-all]')?.addEventListener('click',()=>{for(const c of candidates)reviewState.decisions.set(Number(c.id),'approved');renderMediaReview()});
    d.querySelector('[data-media-save]')?.addEventListener('click',submitMediaReview);
    d.querySelectorAll('[data-media-replace-file]').forEach(input=>input.onchange=async()=>{const id=Number(input.dataset.mediaReplaceFile);const c=candidates.find(x=>Number(x.id)===id);const file=input.files?.[0];if(c&&file)await uploadReplacement(c,file)});
  }
  async function fetchMediaReview(restaurantId){
    if(!sb||!cloud.user)throw new Error('Bitte zuerst anmelden');
    reviewState.loading=true;reviewState.restaurantId=Number(restaurantId);renderMediaReview();
    const {data,error}=await sb.rpc('get_venue_media_review',{p_restaurant_id:Number(restaurantId)});
    if(error)throw error;
    reviewState.canApprove=!!data?.can_approve;reviewState.claimStatus=data?.claim_status||'none';reviewState.candidates=data?.candidates||[];reviewState.decisions=new Map(reviewState.candidates.map(c=>[Number(c.id),c.operator_decision||'pending']));reviewState.loading=false;renderMediaReview();
  }
  async function openMediaReview(restaurantId){
    const d=ensureMediaDialog();reviewState.rightsConfirmed=false;reviewState.replacementUploaded=new Set();d.showModal();
    try{await fetchMediaReview(restaurantId)}catch(err){reviewState.loading=false;d.innerHTML=`<div class="media-review-flow"><div class="claim-head"><button class="round" data-media-close>${icons.back}</button><span class="claim-step">HOY MEDIEN</span></div><div class="claim-card notice"><h3>Medienauswahl noch nicht verfügbar.</h3><p>${esc(err?.message||'Bitte Claim und Anmeldung prüfen.')}</p></div></div>`;d.querySelector('[data-media-close]').onclick=()=>d.close()}
  }
  async function submitMediaReview(){
    const d=ensureMediaDialog();if(!reviewState.canApprove)return;
    if(!reviewState.rightsConfirmed){toast('Bitte Nutzungsfreigabe bestätigen');return;}
    const approved=[],rejected=[],replace=[];
    for(const c of reviewState.candidates){const v=decisionFor(c);if(v==='approved')approved.push(Number(c.id));else if(v==='rejected')rejected.push(Number(c.id));else if(v==='replace_requested')replace.push(Number(c.id));}
    const btn=d.querySelector('[data-media-save]');if(btn){btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Freigabe wird gespeichert';}
    const {data,error}=await sb.functions.invoke('venue-media-approve',{body:{restaurant_id:Number(reviewState.restaurantId),approved_ids:approved,rejected_ids:rejected,replace_ids:replace}});
    if(error||data?.error){if(btn){btn.disabled=false;btn.textContent='Auswahl speichern'};toast(data?.error||error?.message||'Freigabe konnte nicht gespeichert werden');return;}
    await loadPublishedVenueMedia();
    const published=(data?.published||[]).length;const pending=(data?.skipped||[]).filter(x=>x.reason==='source_approved_asset_selection_pending').length;
    addAudit('owner_media_approved',reviewState.restaurantId,`${approved.length} freigegeben · ${published} direkt veröffentlicht`);
    toast(published?`${published} Bild${published===1?'':'er'} freigegeben und aktiviert`:pending?'Quellenfreigabe gespeichert':'Bildauswahl gespeichert');
    reviewState.rightsConfirmed=false;await fetchMediaReview(reviewState.restaurantId);render();
  }
  async function uploadReplacement(candidate,file){
    if(!reviewState.canApprove||!cloud.user)return;
    if(!reviewState.rightsConfirmed){toast('Bitte zuerst Nutzungsrechte bestätigen');return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){toast('Bitte JPG, PNG oder WebP bis 10 MB wählen');return;}
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const uuid=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36);const path=`${reviewState.restaurantId}/${cloud.user.id}/${uuid}.${ext}`;
    toast('Ersatzbild wird privat gespeichert …');
    const {error:uploadError}=await sb.storage.from('owner-media').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(uploadError){toast(uploadError.message);return;}
    const {error:rowError}=await sb.from('media_assets').insert({restaurant_id:Number(reviewState.restaurantId),uploaded_by:cloud.user.id,storage_bucket:'owner-media',storage_path:path,kind:'restaurant',display_role:candidate.intended_role||'gallery',sort_order:Number(candidate.candidate_rank)||100,rights_basis:'operator_upload_confirmed',rights_confirmed:true,source_url:null,status:'pending',candidate_id:Number(candidate.id)});
    if(rowError){await sb.storage.from('owner-media').remove([path]);toast(rowError.message);return;}
    reviewState.replacementUploaded.add(Number(candidate.id));reviewState.decisions.set(Number(candidate.id),'replace_requested');addAudit('owner_media_selected',reviewState.restaurantId,`Ersatz für ${mediaRoleLabel(candidate.intended_role)}`);renderMediaReview();toast('Ersatzbild privat gespeichert');
  }

  const auditLabelBefore19=auditLabel;
  auditLabel=function(a){return a==='owner_media_approved'?'Betreiberbilder freigegeben':auditLabelBefore19(a)};

  const wireBefore19=wire;
  wire=function(){
    wireBefore19();
    document.querySelectorAll('[data-media-review]').forEach(b=>b.onclick=()=>openMediaReview(Number(b.dataset.mediaReview)));
  };

  const initCloudBefore19=initCloud;
  initCloud=async function(){
    await initCloudBefore19();
    if(sb&&cloud.status==='online'){await loadPublishedVenueMedia();render();}
  };
})();

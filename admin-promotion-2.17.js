/* HOY Control 2.17 — manual review, billing confirmation and metrics for sponsored event highlights */
(function(){
  state.eventPromotions=[];

  const baseLoadData217=loadData;
  loadData=async function(){
    await baseLoadData217();
    const promotions=await sb.from('event_promotions')
      .select('id,offer_id,restaurant_id,requested_by,placement,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,approved_by,approved_at,rejection_reason,created_at,updated_at,offers(title,event_kind,starts_at,ends_at)')
      .order('created_at',{ascending:false})
      .limit(150);
    if(promotions.error)throw promotions.error;
    state.eventPromotions=promotions.data||[];
  };

  const kindLabels={live_music:'Live-Musik',dj:'DJ',sports:'Sportübertragung',tasting:'Verkostung',themed_evening:'Themenabend',party:'Party',other:'Event'};
  const fmtPromoDate=v=>v?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(v)):'—';
  const fmtMoney=cents=>Number.isInteger(Number(cents))?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(cents)/100):'—';
  const offerFor=p=>relOne(p?.offers);
  function metadata(e){if(e?.metadata&&typeof e.metadata==='object')return e.metadata;try{return JSON.parse(e?.metadata||'{}')}catch(_){return {}}}
  function promoMetrics(id){
    const rows=(state.events||[]).filter(e=>String(metadata(e).promotion_id||'')===String(id));
    return {impressions:rows.filter(e=>e.event_type==='promotion_impression').length,opens:rows.filter(e=>e.event_type==='promotion_open').length};
  }
  function billingLabel(p){
    if(p.billing_status==='paid')return `bezahlt · ${fmtMoney(p.quoted_price_cents)}`;
    if(p.billing_status==='comped')return 'kostenfrei freigegeben';
    if(p.billing_status==='cancelled')return 'nicht abgerechnet';
    return 'Preis offen';
  }
  function promotionCard(p){
    const r=rById(p.restaurant_id),offer=offerFor(p),m=promoMetrics(p.id),pending=p.status==='requested',active=p.status==='active';
    const kind=kindLabels[offer?.event_kind]||'Event';
    return `<article class="promo-admin-card ${pending?'pending':active?'active':'closed'}"><div class="promo-admin-top"><div><span>${esc(kind)} · ${esc(r?.name||'Betrieb #'+p.restaurant_id)}</span><h3>${esc(offer?.title||'Event-Hervorhebung')}</h3><p>${fmtPromoDate(p.starts_at)} – ${fmtPromoDate(p.ends_at)} · ${esc(billingLabel(p))}</p></div>${badge(String(p.status||'').toUpperCase(),pending?'warn':active?'good':'')}</div>${active?`<div class="promo-admin-metrics"><div><b>${m.impressions}</b><span>Einblendungen</span></div><div><b>${m.opens}</b><span>Profilöffnungen</span></div></div>`:''}${p.rejection_reason?`<div class="promo-admin-reason">${esc(p.rejection_reason)}</div>`:''}<div class="claim-actions">${pending?`<button class="primary" data-promo-admin="activate_paid" data-promo-id="${p.id}">Als bezahlt aktivieren</button><button class="ghost" data-promo-admin="activate_comped" data-promo-id="${p.id}">Kostenfrei aktivieren</button><button class="danger" data-promo-admin="rejected" data-promo-id="${p.id}">Ablehnen</button>`:active?`<button class="danger" data-promo-admin="cancelled" data-promo-id="${p.id}">Hervorhebung beenden</button>`:''}</div></article>`;
  }
  function promotionsMarkup(){
    const rows=state.eventPromotions||[],pending=rows.filter(x=>x.status==='requested'),active=rows.filter(x=>x.status==='active'&&new Date(x.ends_at)>new Date());
    return `<section class="panel promo-admin-panel"><div class="panel-head"><div><h2>Event-Hervorhebungen</h2><p>Gesponserte Platzierungen werden nur nach manueller Freigabe aktiv. Organisches Ranking bleibt getrennt.</p></div><small>${pending.length} offen · ${active.length} aktiv</small></div>${pending.length||active.length?`<div class="promo-admin-list">${[...pending,...active].slice(0,16).map(promotionCard).join('')}</div>`:'<div class="empty">Keine offenen oder aktiven Hervorhebungen.</div>'}<div class="alert good promo-admin-rule"><b>Abrechnungssicherung:</b> „Als bezahlt aktivieren“ dokumentiert eine bereits außerhalb der App bestätigte Zahlung. HOY führt hier keine automatische Abbuchung aus.</div></section>`;
  }

  const baseOverview217=renderOverview;
  renderOverview=function(){return baseOverview217()+promotionsMarkup()};

  async function reviewPromotion(id,decision){
    let priceCents=null,rejectionReason=null;
    if(decision==='activate_paid'){
      const raw=prompt('Manuell bestätigter Preis in Euro (z. B. 29):','')?.trim();if(!raw)return;
      const euros=Number(raw.replace(',','.'));if(!Number.isFinite(euros)||euros<=0)return toast('Bitte einen gültigen Preis größer 0 eingeben');
      priceCents=Math.round(euros*100);
    }
    if(decision==='activate_comped'&&!confirm('Diese Hervorhebung wirklich kostenfrei freigeben?'))return;
    if(decision==='rejected'){
      rejectionReason=prompt('Kurzer Grund für die Ablehnung:')?.trim()||'';if(!rejectionReason)return;
    }
    if(decision==='cancelled'&&!confirm('Aktive Hervorhebung wirklich beenden?'))return;
    try{
      await adminOp('review_event_promotion',{promotion_id:id,decision,quoted_price_cents:priceCents,rejection_reason:rejectionReason});
      toast(decision==='activate_paid'||decision==='activate_comped'?'Hervorhebung freigegeben':decision==='rejected'?'Hervorhebung abgelehnt':'Hervorhebung beendet');
      await loadData();render();
    }catch(err){toast(err?.message||'Hervorhebung konnte nicht geprüft werden')}
  }

  const baseWire217=wire;
  wire=function(){
    baseWire217();
    document.querySelectorAll('[data-promo-admin]').forEach(btn=>btn.onclick=()=>reviewPromotion(btn.dataset.promoId,btn.dataset.promoAdmin));
  };
})();
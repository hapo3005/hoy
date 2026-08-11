/* HOY Control 2.18 — launch pricing, unique-session outcomes and recent campaign proof */
(function(){
  state.eventPromotions=[];state.promotionEvents=[];
  const ACTION_TYPES=new Set(['route_start','service_open','website_open','reservation_start','reservation_submit','call_start','menu_open']);
  const LAUNCH_PRICE_EUR='29';

  const baseLoadData218=loadData;
  loadData=async function(){
    await baseLoadData218();
    const since=new Date(Date.now()-60*864e5).toISOString();
    const [promotions,events]=await Promise.all([
      sb.from('event_promotions')
        .select('id,offer_id,restaurant_id,requested_by,placement,status,billing_status,starts_at,ends_at,quoted_price_cents,currency,approved_by,approved_at,rejection_reason,created_at,updated_at,offers(title,event_kind,starts_at,ends_at)')
        .order('created_at',{ascending:false}).limit(150),
      sb.from('analytics_events')
        .select('id,restaurant_id,event_type,session_id,occurred_at,metadata')
        .gte('occurred_at',since)
        .in('event_type',['promotion_impression','promotion_open','profile_view','route_start','service_open','website_open','reservation_start','reservation_submit','call_start','menu_open'])
        .order('occurred_at',{ascending:false}).limit(10000),
    ]);
    if(promotions.error)throw promotions.error;if(events.error)throw events.error;
    state.eventPromotions=promotions.data||[];state.promotionEvents=events.data||[];
  };

  const kindLabels={live_music:'Live-Musik',dj:'DJ',sports:'Sportübertragung',tasting:'Verkostung',themed_evening:'Themenabend',party:'Party',other:'Event'};
  const fmtPromoDate=v=>v?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(v)):'—';
  const fmtMoney=cents=>Number.isInteger(Number(cents))?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(cents)/100):'—';
  const offerFor=p=>relOne(p?.offers);
  function metadata(e){if(e?.metadata&&typeof e.metadata==='object')return e.metadata;try{return JSON.parse(e?.metadata||'{}')}catch(_){return {}}}
  const sessionKey=e=>e?.session_id?String(e.session_id):`event:${e?.id}`;
  const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
  function promoMetrics(id){
    const rows=(state.promotionEvents||[]).filter(e=>String(metadata(e).promotion_id||'')===String(id));
    const impressions=rows.filter(e=>e.event_type==='promotion_impression');
    const opens=rows.filter(e=>e.event_type==='promotion_open');
    const actions=rows.filter(e=>ACTION_TYPES.has(String(e.event_type)));
    const reach=new Set(impressions.map(sessionKey)).size,openSessions=new Set(opens.map(sessionKey)).size,actionSessions=new Set(actions.map(sessionKey)).size;
    return {reach,opens:openSessions,actions:actionSessions,ctr:pct(openSessions,reach),actionRate:pct(actionSessions,reach)};
  }
  function costPer(price,count){const p=Number(price);return Number.isFinite(p)&&p>0&&count>0?Math.round(p/count):null}
  function billingLabel(p){
    if(p.billing_status==='paid')return `bezahlt · ${fmtMoney(p.quoted_price_cents)}`;
    if(p.billing_status==='comped')return 'kostenfrei freigegeben';
    if(p.status==='cancelled'&&Number(p.quoted_price_cents)>0)return `beendet · ${fmtMoney(p.quoted_price_cents)} dokumentiert`;
    if(p.status==='cancelled'&&Number(p.quoted_price_cents)===0)return 'beendet · kostenfrei';
    if(p.billing_status==='cancelled')return 'nicht abgerechnet';
    return 'Preis offen';
  }
  function metric(label,value,sub=''){return `<div><b>${esc(value)}</b><span>${esc(label)}</span>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
  function promotionCard(p){
    const r=rById(p.restaurant_id),offer=offerFor(p),m=promoMetrics(p.id),pending=p.status==='requested',active=p.status==='active',closed=p.status==='cancelled'||new Date(p.ends_at)<=new Date();
    const kind=kindLabels[offer?.event_kind]||'Event';const price=Number(p.quoted_price_cents);const cpo=costPer(price,m.opens),cpa=costPer(price,m.actions);
    const tone=pending?'pending':active?'active':'closed';
    return `<article class="promo-admin-card ${tone}"><div class="promo-admin-top"><div><span>${esc(kind)} · ${esc(r?.name||'Betrieb #'+p.restaurant_id)}</span><h3>${esc(offer?.title||'Event-Hervorhebung')}</h3><p>${fmtPromoDate(p.starts_at)} – ${fmtPromoDate(p.ends_at)} · ${esc(billingLabel(p))}</p></div>${badge(String(p.status||'').toUpperCase(),pending?'warn':active?'good':'')}</div>${!pending?`<div class="promo-admin-metrics">${metric('erreichte Sitzungen',m.reach)}${metric('Profilöffnungen',m.opens,`${m.ctr}% Rate`)}${metric('qualifizierte Aktionen',m.actions,`${m.actionRate}% Rate`)}${metric('Kosten / Öffnung',cpo==null?'—':fmtMoney(cpo))}${metric('Kosten / Aktion',cpa==null?'—':fmtMoney(cpa))}</div>`:''}${p.rejection_reason?`<div class="promo-admin-reason">${esc(p.rejection_reason)}</div>`:''}<div class="claim-actions">${pending?`<button class="primary" data-promo-admin="activate_paid" data-promo-id="${p.id}">Als bezahlt aktivieren</button><button class="ghost" data-promo-admin="activate_comped" data-promo-id="${p.id}">Kostenfrei aktivieren</button><button class="danger" data-promo-admin="rejected" data-promo-id="${p.id}">Ablehnen</button>`:active?`<button class="danger" data-promo-admin="cancelled" data-promo-id="${p.id}">Hervorhebung beenden</button>`:''}</div>${closed?'<div class="promo-admin-proof">Ergebniswerte bleiben als Kampagnennachweis erhalten.</div>':''}</article>`;
  }
  function promotionsMarkup(){
    const rows=state.eventPromotions||[],pending=rows.filter(x=>x.status==='requested'),active=rows.filter(x=>x.status==='active'&&new Date(x.ends_at)>new Date());
    const recent=rows.filter(x=>x.status==='cancelled'||new Date(x.ends_at)<=new Date()).filter(x=>x.approved_at||x.quoted_price_cents!=null).filter(x=>Date.now()-new Date(x.updated_at||x.ends_at).getTime()<14*864e5).slice(0,6);
    const shown=[...pending,...active,...recent].slice(0,20);
    return `<section class="panel promo-admin-panel"><div class="panel-head"><div><h2>Event-Hervorhebungen</h2><p>Launchmodell: <b>29 € pro Event</b> als empfohlener Startpreis. Jede bezahlte Aktivierung bleibt manuell bestätigbar; organisches Ranking und Werbung bleiben strikt getrennt.</p></div><small>${pending.length} offen · ${active.length} aktiv · ${recent.length} zuletzt beendet</small></div>${shown.length?`<div class="promo-admin-list">${shown.map(promotionCard).join('')}</div>`:'<div class="empty">Keine offenen, aktiven oder kürzlich beendeten Hervorhebungen.</div>'}<div class="alert good promo-admin-rule"><b>Abrechnungssicherung:</b> „Als bezahlt aktivieren“ dokumentiert nur eine bereits außerhalb der App bestätigte Zahlung. Keine automatische Abbuchung. Ergebnisraten basieren auf eindeutigen Sitzungen nach dem expliziten Sponsored-Klick.</div></section>`;
  }

  const baseOverview218=renderOverview;
  renderOverview=function(){return baseOverview218()+promotionsMarkup()};

  async function reviewPromotion(id,decision){
    let priceCents=null,rejectionReason=null;
    if(decision==='activate_paid'){
      const raw=prompt('Manuell bestätigter Preis in Euro: ',LAUNCH_PRICE_EUR)?.trim();if(!raw)return;
      const euros=Number(raw.replace(',','.'));if(!Number.isFinite(euros)||euros<=0)return toast('Bitte einen gültigen Preis größer 0 eingeben');
      priceCents=Math.round(euros*100);
    }
    if(decision==='activate_comped'&&!confirm('Diese Hervorhebung wirklich kostenfrei freigeben?'))return;
    if(decision==='rejected'){rejectionReason=prompt('Kurzer Grund für die Ablehnung:')?.trim()||'';if(!rejectionReason)return}
    if(decision==='cancelled'&&!confirm('Aktive Hervorhebung wirklich beenden? Die dokumentierte Zahlung bleibt historisch erhalten.'))return;
    try{
      await adminOp('review_event_promotion',{promotion_id:id,decision,quoted_price_cents:priceCents,rejection_reason:rejectionReason});
      toast(decision==='activate_paid'||decision==='activate_comped'?'Hervorhebung freigegeben':decision==='rejected'?'Hervorhebung abgelehnt':'Hervorhebung beendet');
      await loadData();render();
    }catch(err){toast(err?.message||'Hervorhebung konnte nicht geprüft werden')}
  }

  const baseWire218=wire;
  wire=function(){baseWire218();document.querySelectorAll('[data-promo-admin]').forEach(btn=>btn.onclick=()=>reviewPromotion(btn.dataset.promoId,btn.dataset.promoAdmin))};
})();

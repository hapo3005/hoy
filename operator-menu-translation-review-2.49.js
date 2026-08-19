/* HOY 2.49.0 — verified operators confirm or correct machine menu translations */
(function(){
  if(window.__hoyOperatorMenuTranslationReview249)return;
  window.__hoyOperatorMenuTranslationReview249=true;
  window.hoyOperatorMenuTranslationReviewVersion='2.49.0';

  const ui={restaurantId:null,rows:[],loaded:false,loading:false,busy:false,error:''};
  const clean=v=>String(v??'').trim();
  const localeLabel=v=>({de:'Deutsch',es:'Spanisch',en:'Englisch'}[clean(v)]||clean(v).toUpperCase());
  const errorText=e=>clean(e?.message||e)||'Bestätigung nicht möglich';
  function currentRestaurant(){const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;return p&&typeof isClaimed==='function'&&isClaimed(p)?p:null}
  function current(){return ui.rows[0]||null}

  async function loadQueue(p,force=false){
    const id=Number(p?.id);if(!id||!p?.operator_verified)return;
    if(ui.loading||(!force&&ui.loaded&&ui.restaurantId===id))return;
    ui.loading=true;ui.error='';ui.restaurantId=id;
    try{
      const {data,error}=await sb.rpc('get_menu_translation_review_queue',{p_restaurant_id:id,p_limit:50,p_offset:0});
      if(error)throw error;
      ui.rows=Array.isArray(data?.rows)?data.rows:[];ui.loaded=true;
    }catch(error){ui.error=errorText(error);ui.loaded=true;ui.rows=[]}
    finally{ui.loading=false}
  }

  function card(p){
    if(!p?.operator_verified)return '';
    if(ui.restaurantId!==Number(p.id)||!ui.loaded){
      return `<section class="operator-menu-review-249" data-operator-menu-review><div class="operator-menu-review-mark">文</div><div><div class="eyebrow">SPEISEKARTE · ÜBERSETZUNGSPRÜFUNG</div><h2>Übersetzungen kurz gegenlesen.</h2><p>HOY lädt die vorbereiteten DE/ES/EN-Fassungen. Erst deine echte Prüfung macht eine maschinelle Fassung zur Betreiberbestätigung.</p><small>${ui.loading?'Lädt …':'Bereit zum Laden …'}</small></div></section>`;
    }
    if(ui.error)return `<section class="operator-menu-review-249" data-operator-menu-review><div class="operator-menu-review-mark">!</div><div><div class="eyebrow">SPEISEKARTE · ÜBERSETZUNGSPRÜFUNG</div><h2>Prüfung gerade nicht verfügbar.</h2><p>${esc(ui.error)}</p><button type="button" data-operator-menu-review-retry>Erneut laden</button></div></section>`;
    const row=current();if(!row)return '';
    const hasDescription=!!clean(row.source_description);
    return `<section class="operator-menu-review-249" data-operator-menu-review>
      <div class="operator-menu-review-mark">文</div>
      <div class="operator-menu-review-copy">
        <div class="eyebrow">SPEISEKARTE · ${esc(localeLabel(row.locale).toUpperCase())} · FREE</div>
        <h2>Stimmt diese Übersetzung?</h2>
        <p>Einzeln bestätigen oder korrigieren. Keine Sammelfreigabe – jede Position bleibt nachvollziehbar.</p>
        <div class="operator-menu-review-compare"><div><small>QUELLE</small><b>${esc(row.source_name)}</b>${hasDescription?`<span>${esc(row.source_description)}</span>`:''}</div><div><small>${esc(localeLabel(row.locale).toUpperCase())} · MASCHINELL</small><b>${esc(row.item_name)}</b>${hasDescription?`<span>${esc(row.description||'')}</span>`:''}</div></div>
        <div class="operator-menu-review-actions"><button type="button" class="primary" data-operator-menu-review-confirm ${ui.busy?'disabled':''}>Ja, stimmt</button><button type="button" data-operator-menu-review-correct ${ui.busy?'disabled':''}>Korrigieren</button><small>${ui.rows.length} offen in diesem Batch</small></div>
        <small class="operator-menu-review-boundary">Nur Text-/Faktenbestätigung. Keine Rechte-, Lizenz- oder Vertragsfreigabe.</small>
      </div>
    </section>`;
  }

  const basePartner249=partner;
  partner=function(){
    const html=basePartner249(),p=currentRestaurant();if(!p?.operator_verified)return html;
    const block=card(p);if(!block)return html;
    if(html.includes('<section class="operator-command-center">'))return html.replace('<section class="operator-command-center">',block+'<section class="operator-command-center">');
    return html.replace('<div class="partner-hero">',block+'<div class="partner-hero">');
  };

  function ensureDialog(){
    let d=document.getElementById('operatorMenuTranslationReview249');
    if(!d){d=document.createElement('dialog');d.id='operatorMenuTranslationReview249';d.className='dialog operator-menu-review-dialog-249';document.body.appendChild(d)}
    return d;
  }

  function openCorrection(){
    const row=current();if(!row)return;
    const d=ensureDialog(),hasDescription=!!clean(row.source_description);
    d.innerHTML=`<div class="operator-menu-review-flow-249"><div class="claim-head"><button type="button" class="round" data-omr249-close>${icons?.back||'←'}</button><span class="claim-step">${esc(localeLabel(row.locale).toUpperCase())} · KORREKTUR</span></div><h2>So soll es in HOY stehen.</h2><div class="operator-menu-review-source-249"><small>Quelle</small><b>${esc(row.source_category)} · ${esc(row.source_name)}</b>${hasDescription?`<p>${esc(row.source_description)}</p>`:''}</div><label>Kategorie<input data-omr249-category value="${esc(clean(row.category))}"></label><label>Name<input data-omr249-name value="${esc(clean(row.item_name))}"></label><label>Beschreibung<textarea data-omr249-description ${hasDescription?'':'disabled'}>${hasDescription?esc(row.description||''):''}</textarea></label><div class="operator-flow-actions"><button type="button" data-omr249-close>Abbrechen</button><button type="button" class="primary" data-omr249-save>Korrigiert bestätigen</button></div><div class="prototype-note"><b>Scope:</b> Du bestätigst nur den sichtbaren Textinhalt dieser Speisekartenposition. Daraus entstehen keine Rechte- oder Vertragsaussagen.</div></div>`;
    d.showModal();d.querySelectorAll('[data-omr249-close]').forEach(b=>b.onclick=()=>d.close());d.querySelector('[data-omr249-save]').onclick=()=>review('corrected',d);
  }

  async function review(decision,d=null){
    const row=current(),p=currentRestaurant();if(!row||!p||ui.busy)return;
    const params={p_menu_item_id:row.menu_item_id,p_locale:row.locale,p_expected_updated_at:row.updated_at,p_decision:decision,p_category:null,p_name:null,p_description:null};
    if(decision==='corrected'){
      params.p_category=clean(d?.querySelector('[data-omr249-category]')?.value);
      params.p_name=clean(d?.querySelector('[data-omr249-name]')?.value);
      params.p_description=clean(d?.querySelector('[data-omr249-description]')?.value)||null;
      if(!params.p_category||!params.p_name){toast('Kategorie und Name dürfen nicht leer sein');return}
    }
    ui.busy=true;render();
    try{
      const {data,error}=await sb.rpc('operator_review_menu_translation',params);if(error)throw error;if(!data?.ok)throw new Error('review_not_applied');
      if(d?.open)d.close();ui.rows.shift();
      toast('Übersetzung vom Betrieb bestätigt');
      if(!ui.rows.length){ui.loaded=false;await loadQueue(p,true)}
    }catch(error){
      const msg=errorText(error);toast(msg.includes('stale_translation')?'Die Übersetzung wurde inzwischen geändert – neu laden':msg);
      if(msg.includes('stale_translation')){ui.loaded=false;await loadQueue(p,true);if(d?.open)d.close()}
    }finally{
      ui.busy=false;
      render();
    }
  }

  const baseWire249=wire;
  wire=function(){
    baseWire249();const p=currentRestaurant();if(!p?.operator_verified)return;
    if((!ui.loaded||ui.restaurantId!==Number(p.id))&&!ui.loading){loadQueue(p).then(()=>render())}
    document.querySelectorAll('[data-operator-menu-review-confirm]').forEach(b=>b.onclick=()=>review('confirmed'));
    document.querySelectorAll('[data-operator-menu-review-correct]').forEach(b=>b.onclick=openCorrection);
    document.querySelectorAll('[data-operator-menu-review-retry]').forEach(b=>b.onclick=async()=>{ui.loaded=false;await loadQueue(p,true);render()});
  };

  window.hoyOperatorMenuTranslationReview249={loadQueue,state:ui};
})();

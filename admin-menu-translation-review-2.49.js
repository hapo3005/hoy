/* HOY Control 2.49.0 — genuine human review for machine menu translations */
(function(){
  if(window.__hoyAdminMenuTranslationReview249)return;
  window.__hoyAdminMenuTranslationReview249=true;
  window.hoyAdminMenuTranslationReviewVersion='2.49.0';

  const ui={summary:null,loadingSummary:false,queue:[],restaurantId:null,index:0,busy:false,error:''};
  const clean=v=>String(v??'').trim();
  const localeLabel=v=>({de:'DE',es:'ES',en:'EN'}[clean(v)]||clean(v).toUpperCase());
  const errText=e=>clean(e?.message||e)||'Unbekannter Fehler';

  async function loadSummary(force=false){
    if(ui.loadingSummary||(!force&&ui.summary))return ui.summary;
    ui.loadingSummary=true;ui.error='';
    try{
      const {data,error}=await sb.rpc('get_menu_translation_review_summary',{p_limit:100});
      if(error)throw error;
      ui.summary=data||{restaurants:[]};
      return ui.summary;
    }catch(error){ui.error=errText(error);throw error}
    finally{ui.loadingSummary=false}
  }

  async function loadQueue(restaurantId){
    const id=Number(restaurantId);if(!id)return;
    ui.busy=true;ui.error='';ui.restaurantId=id;ui.index=0;
    try{
      const {data,error}=await sb.rpc('get_menu_translation_review_queue',{p_restaurant_id:id,p_limit:100,p_offset:0});
      if(error)throw error;
      ui.queue=Array.isArray(data?.rows)?data.rows:[];
    }finally{ui.busy=false}
  }

  function metrics(){
    const rows=ui.summary?.restaurants||[];
    return {
      restaurants:rows.length,
      machine:rows.reduce((n,x)=>n+Number(x.machine_rows||0),0),
      descriptions:rows.reduce((n,x)=>n+Number(x.machine_descriptions||0),0),
      human:rows.reduce((n,x)=>n+Number(x.human_verified_rows||0),0)
    };
  }

  function panel(){
    if(ui.loadingSummary&&!ui.summary)return `<section class="panel mtr249" data-mtr249><div class="panel-head"><h2>Übersetzungen · Human Review</h2><small>lädt …</small></div></section>`;
    if(ui.error&&!ui.summary)return `<section class="panel mtr249" data-mtr249><div class="panel-head"><h2>Übersetzungen · Human Review</h2></div><div class="alert warn">${esc(ui.error)}</div></section>`;
    const rows=(ui.summary?.restaurants||[]).slice(0,12),m=metrics();
    return `<section class="panel mtr249" data-mtr249>
      <div class="panel-head"><div><h2>Übersetzungen · Human Review</h2><small>Maschine bleibt Maschine, bis ein Mensch wirklich prüft.</small></div><button type="button" class="ghost" data-mtr249-refresh>Aktualisieren</button></div>
      <div class="mtr249-kpis"><div><b>${m.machine}</b><span>machine offen</span></div><div><b>${m.descriptions}</b><span>mit Beschreibung</span></div><div><b>${m.human}</b><span>human verifiziert</span></div><div><b>${m.restaurants}</b><span>Betriebe offen</span></div></div>
      ${rows.length?`<div class="mtr249-list">${rows.map(x=>`<article><div><b>${esc(x.restaurant_name)}</b><small>${Number(x.machine_rows||0)} offen · ${Number(x.machine_descriptions||0)} mit Beschreibung · ${Number(x.human_verified_rows||0)} geprüft</small></div><button type="button" class="primary" data-mtr249-open="${Number(x.restaurant_id)}">Prüfen</button></article>`).join('')}</div>`:'<div class="alert good"><b>Keine machine-Zeilen offen.</b> Jede aktuell erfasste Übersetzung ist menschlich verifiziert.</div>'}
      <div class="coverage-note"><b>Priorität:</b> Positionen mit Beschreibung zuerst, danach Umfang. HOY-Redaktion setzt ausschließlich <code>curated</code>; ein verifizierter Betrieb ausschließlich <code>operator_confirmed</code>. Diese Bestätigung betrifft nur den Textinhalt und erzeugt keine Rechte-, Lizenz- oder Vertragsfreigabe.</div>
    </section>`;
  }

  function decorate(){
    if(state.view!=='menu_integrity'||root.querySelector('[data-mtr249]'))return;
    const anchor=root.querySelector('.mi224-panel')||root.querySelector('.mi223-focus')||root.querySelector('.panel');
    if(anchor)anchor.insertAdjacentHTML('afterend',panel());
    if(!ui.summary&&!ui.loadingSummary){loadSummary().then(()=>render()).catch(()=>render())}
  }

  function ensureDialog(){
    let d=document.getElementById('menuTranslationReview249');
    if(!d){d=document.createElement('dialog');d.id='menuTranslationReview249';d.className='dialog mtr249-dialog';document.body.appendChild(d)}
    return d;
  }

  function current(){return ui.queue[ui.index]||null}
  function inputValue(v){return esc(clean(v))}

  function renderDialog(){
    const d=ensureDialog(),row=current();
    if(!row){d.innerHTML=`<div class="mtr249-flow"><div class="claim-head"><button type="button" class="round" data-mtr249-close>←</button><span class="claim-step">HUMAN REVIEW</span></div><h2>Queue erledigt.</h2><p>Für diesen Betrieb sind in diesem Batch keine maschinellen Übersetzungen mehr offen.</p></div>`;wireDialog();return}
    const sourceHasDescription=!!clean(row.source_description);
    d.innerHTML=`<div class="mtr249-flow">
      <div class="claim-head"><button type="button" class="round" data-mtr249-close>←</button><span class="claim-step">${esc(row.restaurant_name)} · ${localeLabel(row.locale)} · ${ui.index+1}/${ui.queue.length}</span></div>
      <div class="mtr249-trust"><span>machine</span><b>Bitte tatsächlich lesen – kein Bulk-Freigeben.</b></div>
      <div class="mtr249-compare">
        <section><small>QUELLE</small><b>${esc(row.source_category)}</b><h3>${esc(row.source_name)}</h3>${sourceHasDescription?`<p>${esc(row.source_description)}</p>`:'<p class="muted">Keine Beschreibung in der Quelle.</p>'}${clean(row.price_text)?`<em>${esc(row.price_text)}</em>`:''}</section>
        <section><small>${localeLabel(row.locale)} · MASCHINELL</small><label>Kategorie<input data-mtr249-category value="${inputValue(row.category)}"></label><label>Name<input data-mtr249-name value="${inputValue(row.item_name)}"></label><label>Beschreibung<textarea data-mtr249-description ${sourceHasDescription?'':'disabled'}>${sourceHasDescription?esc(row.description||''):''}</textarea></label></section>
      </div>
      <div class="mtr249-actions"><button type="button" data-mtr249-confirm ${ui.busy?'disabled':''}>Stimmt unverändert</button><button type="button" class="primary" data-mtr249-correct ${ui.busy?'disabled':''}>Korrigiert speichern</button></div>
      <small class="mtr249-boundary">Bestätigung = factual translation review only. Keine Rechte-/Lizenz-/Business-Terms-Freigabe.</small>
    </div>`;
    wireDialog();
  }

  function wireDialog(){
    const d=ensureDialog();
    d.querySelectorAll('[data-mtr249-close]').forEach(b=>b.onclick=()=>d.close());
    const c=d.querySelector('[data-mtr249-confirm]');if(c)c.onclick=()=>reviewCurrent('confirmed');
    const x=d.querySelector('[data-mtr249-correct]');if(x)x.onclick=()=>reviewCurrent('corrected');
  }

  async function reviewCurrent(decision){
    const row=current(),d=ensureDialog();if(!row||ui.busy)return;
    const params={p_menu_item_id:row.menu_item_id,p_locale:row.locale,p_expected_updated_at:row.updated_at,p_decision:decision,p_category:null,p_name:null,p_description:null};
    if(decision==='corrected'){
      params.p_category=clean(d.querySelector('[data-mtr249-category]')?.value);
      params.p_name=clean(d.querySelector('[data-mtr249-name]')?.value);
      params.p_description=clean(d.querySelector('[data-mtr249-description]')?.value)||null;
      if(!params.p_category||!params.p_name){toast('Kategorie und Name dürfen nicht leer sein');return}
    }
    ui.busy=true;renderDialog();
    try{
      const {data,error}=await sb.rpc('admin_review_menu_translation',params);if(error)throw error;if(!data?.ok)throw new Error('review_not_applied');
      ui.queue.splice(ui.index,1);if(ui.index>=ui.queue.length)ui.index=Math.max(0,ui.queue.length-1);
      ui.summary=null;await loadSummary(true);
      toast(data.translation_status==='curated'?'Als redaktionell geprüft gespeichert':'Prüfung gespeichert');
      if(!ui.queue.length){d.close();render()}else renderDialog();
    }catch(error){
      const msg=errText(error);toast(msg.includes('stale_translation')?'Text wurde inzwischen geändert – Queue wird neu geladen':msg);
      if(msg.includes('stale_translation')){await loadQueue(row.restaurant_id);renderDialog()}
    }finally{
      ui.busy=false;
      if(d.open&&current())renderDialog();
    }
  }

  async function openReview(id){
    try{await loadQueue(id);renderDialog();ensureDialog().showModal()}
    catch(error){toast(errText(error))}
  }

  const baseRender249=render;
  render=function(){const result=baseRender249();decorate();return result};

  const baseWire249=wire;
  wire=function(){
    baseWire249();
    document.querySelectorAll('[data-mtr249-open]').forEach(b=>b.onclick=()=>openReview(b.dataset.mtr249Open));
    document.querySelectorAll('[data-mtr249-refresh]').forEach(b=>b.onclick=async()=>{ui.summary=null;try{await loadSummary(true)}catch{}render()});
  };

  window.hoyAdminMenuTranslationReview249={loadSummary,loadQueue,state:ui};
})();

/* HOY Control 2.29.0 — official source -> internal draft -> explicit review -> atomic publish */
(function(){
  if(window.__hoyAdminMenuEditorial229)return;
  window.__hoyAdminMenuEditorial229=true;
  window.hoyAdminMenuEditorialVersion='2.29.0';

  const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
  const IMPORTABLE=new Set(['source_only','partial']);
  const clean229=v=>String(v??'').trim();
  let loading229=false,pollTimer229=null;
  state.menuEditorialImports=state.menuEditorialImports||[];

  async function edge229(action,payload={}){
    const {data,error}=await sb.functions.invoke('menu-editorial-import',{body:{action,...payload}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data||{};
  }
  async function loadImports229(){
    if(!state.user||!state.admin)return;
    const data=await edge229('list');state.menuEditorialImports=data.imports||[];
  }
  const baseLoadData229=loadData;
  loadData=async function(){await baseLoadData229();try{await loadImports229()}catch(error){console.warn('HOY editorial menu queue unavailable',error);state.menuEditorialImports=[]}};

  function sources229(id){return (state.menuSources||[]).filter(s=>Number(s.restaurant_id)===Number(id)&&s.is_official!==false&&CORE_SCOPES.has(clean229(s.coverage_scope)))}
  function importableSource229(id){return sources229(id).filter(s=>IMPORTABLE.has(clean229(s.completeness_status))&&/^https:\/\//i.test(clean229(s.source_url))).sort((a,b)=>String(b.completeness_checked_at||b.last_checked_at||'').localeCompare(String(a.completeness_checked_at||a.last_checked_at||'')))[0]||null}
  function importForSource229(sourceId){return (state.menuEditorialImports||[]).find(x=>String(x.source_id)===String(sourceId))||null}
  function importCounts229(){const rows=state.menuEditorialImports||[],count=s=>rows.filter(x=>x.status===s).length;return{processing:count('processing')+count('queued'),review:count('review_required'),approved:count('approved'),published:count('published'),failed:count('failed')}}

  function ensureDialog229(){let d=document.getElementById('menuEditorialReview');if(!d){d=document.createElement('dialog');d.id='menuEditorialReview';d.className='mei229-review';document.body.appendChild(d)}return d}
  function stopPoll229(){if(pollTimer229){clearTimeout(pollTimer229);pollTimer229=null}}

  async function refreshQueue229(rerender=true){await loadImports229();if(rerender)render()}
  async function start229(source,r){
    if(loading229)return;loading229=true;toast(`Strukturierung für ${r.name} wird gestartet …`);
    try{const data=await edge229('start',{source_id:source.id});await refreshQueue229(false);const imp=data.import||data.existing?.import;if(imp?.id){await open229(imp.id)}else render()}
    catch(error){console.error(error);toast(error?.message||'Redaktioneller Import konnte nicht gestartet werden')}
    finally{loading229=false}
  }

  async function poll229(id){
    stopPoll229();
    try{const data=await edge229('poll',{import_id:id});await refreshQueue229(false);if(data.import?.status==='processing'){pollTimer229=setTimeout(()=>poll229(id),3500);await open229(id,false)}else await open229(id,false)}
    catch(error){console.error(error);toast(error?.message||'Importstatus konnte nicht geladen werden')}
  }

  function statusText229(v){return({queued:'wartet',processing:'wird strukturiert',review_required:'Prüfung erforderlich',approved:'Vollständigkeit bestätigt',published:'veröffentlicht',failed:'fehlgeschlagen',rejected:'abgelehnt'})[v]||v||'—'}
  function item229(x){const confidence=Number(x.confidence||0),cls=`mei229-item${confidence<.8?' low':''}${x.review_status==='rejected'?' rejected':''}`;return `<div class="${cls}" data-mei229-item="${esc(x.id)}"><input data-f="category" value="${esc(x.category||'')}" aria-label="Kategorie"><input data-f="name" value="${esc(x.name||'')}" aria-label="Gericht"><input data-f="price_text" value="${esc(x.price_text||'')}" aria-label="Preis"><textarea data-f="description" aria-label="Beschreibung">${esc(x.description||'')}</textarea><div class="mei229-item-actions"><small>${Math.round(confidence*100)}% · ${esc(x.review_status)}</small><button class="ghost" data-mei229-save="${esc(x.id)}">Speichern</button>${x.review_status!=='confirmed'?`<button class="ghost" data-mei229-confirm="${esc(x.id)}">Bestätigen</button>`:''}${x.review_status!=='rejected'?`<button class="danger" data-mei229-reject="${esc(x.id)}">Verwerfen</button>`:''}</div></div>`}

  async function open229(id,show=true){
    const data=await edge229('get',{import_id:id}),j=data.import,items=data.items||[],d=ensureDialog229(),r=state.restaurants.find(x=>Number(x.id)===Number(j.restaurant_id)),source=state.menuSources.find(x=>String(x.id)===String(j.source_id));
    const extracted=items.filter(x=>x.review_status==='extracted').length,accepted=items.filter(x=>['confirmed','edited'].includes(x.review_status)).length,rejected=items.filter(x=>x.review_status==='rejected').length;
    d.innerHTML=`<div class="mei229-shell"><div class="mei229-top"><div><small class="mei229-state">${esc(statusText229(j.status))}</small><h2>${esc(r?.name||'Speisekarten-Entwurf')}</h2><p>${esc(j.processor_note||'Interner HOY-Entwurf')}</p><div class="mei229-source">${esc(source?.source_url||'')}</div></div><button class="ghost" data-mei229-close>Schließen</button></div><div class="mei229-summary"><span class="mei229-chip"><b>${items.length}</b> erkannt</span><span class="mei229-chip"><b>${accepted}</b> bestätigt</span><span class="mei229-chip"><b>${extracted}</b> ungeprüft</span><span class="mei229-chip"><b>${rejected}</b> verworfen</span>${j.low_confidence_count?`<span class="mei229-chip"><b>${j.low_confidence_count}</b> &lt;80%</span>`:''}</div>${j.status==='processing'||j.status==='queued'?`<div class="panel"><b>HOY strukturiert die offizielle Quelle.</b><p>Der Entwurf wird asynchron erstellt. Nichts davon ist bereits Gastinhalt.</p><button class="ghost" data-mei229-poll="${esc(j.id)}">Status jetzt prüfen</button></div>`:`<div class="mei229-items">${items.map(item229).join('')||'<div class="empty">Keine belastbaren Positionen extrahiert.</div>'}</div><div class="mei229-gate"><label><input type="checkbox" data-mei229-coverage ${j.coverage_confirmed?'checked disabled':''}><span><b>Vollständigkeit separat bestätigen</b><br>Ich habe die offizielle Hauptkartenquelle gegen den gesamten Entwurf geprüft und bestätige, dass alle relevanten Kartenbereiche erfasst sind.</span></label><textarea data-mei229-coverage-note rows="2" placeholder="Optional: Prüfhinweis …">${esc(j.coverage_note||'')}</textarea></div><div class="mei229-footer">${extracted?`<button class="ghost" data-mei229-confirm-all="${esc(j.id)}">Alle Positionen nach Sichtprüfung bestätigen</button>`:''}${!j.coverage_confirmed?`<button class="ghost" data-mei229-confirm-coverage="${esc(j.id)}">Vollständigkeit bestätigen</button>`:''}${j.status==='approved'?`<button class="primary" data-mei229-publish="${esc(j.id)}">Geprüfte Karte veröffentlichen</button>`:''}</div>`}</div>`;
    wireDialog229(d,j);
    if(show&&!d.open)d.showModal();
    if(j.status==='processing'&&d.open){stopPoll229();pollTimer229=setTimeout(()=>poll229(j.id),3500)}
  }

  function values229(row){const get=f=>clean229(row.querySelector(`[data-f="${f}"]`)?.value);return{category:get('category'),name:get('name'),price_text:get('price_text'),description:get('description')}}
  function wireDialog229(d,j){
    d.querySelector('[data-mei229-close]')?.addEventListener('click',()=>{stopPoll229();d.close();render()});
    d.querySelector('[data-mei229-poll]')?.addEventListener('click',()=>poll229(j.id));
    d.querySelectorAll('[data-mei229-save]').forEach(btn=>btn.addEventListener('click',async()=>{try{const row=btn.closest('[data-mei229-item]');await edge229('update_item',{item_id:btn.dataset.mei229Save,review_status:'edited',...values229(row)});toast('Position gespeichert');await open229(j.id,false)}catch(e){toast(e?.message||'Speichern fehlgeschlagen')}}));
    d.querySelectorAll('[data-mei229-confirm]').forEach(btn=>btn.addEventListener('click',async()=>{try{const row=btn.closest('[data-mei229-item]');await edge229('update_item',{item_id:btn.dataset.mei229Confirm,review_status:'confirmed',...values229(row)});await open229(j.id,false)}catch(e){toast(e?.message||'Bestätigung fehlgeschlagen')}}));
    d.querySelectorAll('[data-mei229-reject]').forEach(btn=>btn.addEventListener('click',async()=>{try{await edge229('update_item',{item_id:btn.dataset.mei229Reject,review_status:'rejected'});await open229(j.id,false)}catch(e){toast(e?.message||'Verwerfen fehlgeschlagen')}}));
    d.querySelector('[data-mei229-confirm-all]')?.addEventListener('click',async()=>{if(!confirm('Hast du alle extrahierten Positionen gegen die offizielle Quelle geprüft?'))return;try{await edge229('confirm_all',{import_id:j.id});await open229(j.id,false)}catch(e){toast(e?.message||'Bestätigung fehlgeschlagen')}});
    d.querySelector('[data-mei229-confirm-coverage]')?.addEventListener('click',async()=>{const checked=d.querySelector('[data-mei229-coverage]')?.checked;if(!checked)return toast('Bitte die Vollständigkeitsprüfung ausdrücklich bestätigen.');try{await edge229('confirm_coverage',{import_id:j.id,confirmed:true,note:d.querySelector('[data-mei229-coverage-note]')?.value||''});toast('Vollständigkeit bestätigt');await refreshQueue229(false);await open229(j.id,false)}catch(e){toast(e?.message||'Vollständigkeit konnte nicht bestätigt werden')}});
    d.querySelector('[data-mei229-publish]')?.addEventListener('click',async()=>{if(!confirm('Diese geprüfte Karte jetzt als vollständige HOY-Hauptkarte veröffentlichen?'))return;try{const data=await edge229('publish',{import_id:j.id});toast(`${data.published_items||0} geprüfte Positionen veröffentlicht`);await loadData();d.close();render()}catch(e){toast(e?.message||'Veröffentlichung fehlgeschlagen')}});
  }

  function mount229(){
    if(state.view!=='menu_discovery'||!state.user||!state.admin)return;
    const counts=importCounts229(),panel=document.getElementById('mad228Panel');
    if(panel&&!document.getElementById('mei229Summary'))panel.insertAdjacentHTML('afterend',`<div class="mei229-summary" id="mei229Summary"><span class="mei229-chip"><b>${counts.processing}</b> Strukturierung</span><span class="mei229-chip"><b>${counts.review}</b> zur Prüfung</span><span class="mei229-chip"><b>${counts.approved}</b> freigabebereit</span><span class="mei229-chip"><b>${counts.published}</b> redaktionell veröffentlicht</span>${counts.failed?`<span class="mei229-chip"><b>${counts.failed}</b> fehlgeschlagen</span>`:''}</div>`);
    document.querySelectorAll('[data-ms227-row]').forEach(row=>{
      const edit=row.querySelector('[data-edit]'),id=Number(edit?.dataset.edit),r=state.restaurants.find(x=>Number(x.id)===id),source=importableSource229(id);if(!edit||!r||!source||row.querySelector('[data-mei229-action]'))return;
      const imp=importForSource229(source.id),btn=document.createElement('button');btn.className=imp?.status==='review_required'||imp?.status==='approved'?'primary':'ghost';btn.dataset.mei229Action=String(source.id);btn.style.marginRight='6px';
      if(!imp)btn.textContent='Strukturieren';else if(['queued','processing'].includes(imp.status))btn.textContent='Import läuft';else if(['review_required','approved'].includes(imp.status))btn.textContent='Entwurf prüfen';else if(imp.status==='failed')btn.textContent='Import prüfen';else return;
      btn.onclick=()=>imp?(['queued','processing'].includes(imp.status)?poll229(imp.id):open229(imp.id)):start229(source,r);edit.parentElement?.insertBefore(btn,edit);
    });
  }

  const baseRender229=render;
  render=function(){const out=baseRender229();queueMicrotask(mount229);return out};
})();

/* HOY 2.9.1 — private operator menu intake + API-native high-precision async extraction polling */
(function(){
  const MAX_BYTES=25*1024*1024;
  const MIME_OK=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
  const intakeState={restaurantId:null,rows:[],loading:false,polling:false,pollTimer:null,pollDelay:2500};

  function paidPlan(p){return ['pro','business'].includes(String(p?.active_plan||''))}
  function publicationMode(p){return paidPlan(p)?'operator_live':'hoy_review'}
  function statusText(v){return ({uploaded:'Sicher hochgeladen',queued:'Zur Strukturierung vorgemerkt',processing:'Wird hochpräzise strukturiert',review_required:'HOY-Prüfung nötig',operator_review:'Zur Betreiberprüfung bereit',approved:'Freigegeben',rejected:'Abgelehnt',published:'Veröffentlicht',failed:'Verarbeitung fehlgeschlagen'})[v]||v||'Neu'}
  function processorText(v){return ({not_started:'Noch nicht gestartet',queued:'In Warteschlange',extracting:'Hochpräzisionsmodus arbeitet',structured:'Strukturierter Entwurf',needs_review:'Prüfung erforderlich',failed:'Fehlgeschlagen'})[v]||v||''}
  function sourceText(v){return v==='upload'?'Datei':v==='official_url'?'Offizieller Link':'Direkteingabe'}
  function dateText(v){try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return ''}}
  function safeName(name){
    const cleaned=String(name||'menu').normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return cleaned.slice(-120)||'menu';
  }
  function currentRestaurant(){const p=claimedRestaurant();return p&&isClaimed(p)?p:null}
  function isPending(x){return Boolean(x&&(x.status==='processing'||x.processor_state==='extracting'||['queued','in_progress'].includes(String(x.openai_response_status||''))))}
  function pendingRow(){return intakeState.rows.find(isPending)||null}
  function stopPoll(){if(intakeState.pollTimer){clearTimeout(intakeState.pollTimer);intakeState.pollTimer=null}}

  async function loadRows(p,force=false){
    if(!sb||!cloud.user||!p)return;
    if(!force&&intakeState.restaurantId===Number(p.id))return;
    if(intakeState.loading)return;
    intakeState.loading=true;
    const {data,error}=await sb.from('menu_intake_submissions')
      .select('id,restaurant_id,source_kind,publication_mode,original_filename,source_url,status,processor_state,processor_note,submitted_at,processed_at,operator_confirmed_at,published_at,openai_response_status,openai_started_at,openai_last_polled_at,extractor_version')
      .eq('restaurant_id',Number(p.id)).order('submitted_at',{ascending:false}).limit(8);
    intakeState.loading=false;
    if(error){console.warn('HOY menu intake unavailable',error);return}
    intakeState.restaurantId=Number(p.id);intakeState.rows=data||[];
    if(pendingRow())schedulePoll(p);else{stopPoll();intakeState.pollDelay=2500}
    if(state.view==='partner')render();
  }

  function historyHTML(){
    if(!intakeState.rows.length)return '<div class="menu-intake-empty">Noch keine Speisekarte über HOY eingereicht.</div>';
    return `<div class="menu-intake-history">${intakeState.rows.slice(0,4).map(x=>`<div class="menu-intake-history-row"><div><b>${esc(sourceText(x.source_kind))}</b><span>${esc(x.original_filename||x.source_url||'Speisekarten-Entwurf')}</span><small>${esc(dateText(x.submitted_at))}</small></div><div class="menu-intake-state"><strong>${esc(statusText(x.status))}</strong><small>${esc(x.processor_note||processorText(x.processor_state))}</small></div></div>`).join('')}</div>`;
  }

  function cardHTML(p){
    const paid=paidPlan(p);const latest=intakeState.restaurantId===Number(p.id)?intakeState.rows[0]:null;
    return `<section class="menu-intake-owner-card ${paid?'paid':'free'}">
      <div class="menu-intake-owner-head"><div><small>SPEISEKARTE</small><h3>Aus Bild, PDF oder Link wird eine HOY-Karte.</h3></div><span>${paid?esc(String(p.active_plan).toUpperCase()):'FREE'}</span></div>
      <p>${paid?'Du kannst neue Karten selbst einreichen. Der HOY-Hochpräzisionsmodus erzeugt daraus einen strukturierten Entwurf; veröffentlicht wird erst nach Prüfung und Bestätigung.':'Du kannst deine Karte kostenlos zur HOY-Prüfung einreichen. Der HOY-Hochpräzisionsmodus strukturiert die Quelle; Pro/Business ergänzt den laufenden Self-Service.'}</p>
      ${latest?`<div class="menu-intake-latest"><b>${esc(statusText(latest.status))}</b><small>${esc(latest.processor_note||processorText(latest.processor_state))}</small></div>`:''}
      <button class="primary" type="button" data-menu-intake-open>${paid?'Speisekarte verwalten':'Speisekarte einreichen'}</button>
    </section>`;
  }

  const basePartner29=partner;
  partner=function(){
    const html=basePartner29();const p=currentRestaurant();if(!p)return html;
    return html.replace('<div class="system-card">',cardHTML(p)+'<div class="system-card">');
  };

  function ensureDialog(){
    let d=document.getElementById('menuIntakeFlow');
    if(!d){d=document.createElement('dialog');d.id='menuIntakeFlow';d.className='dialog';document.body.appendChild(d)}
    return d;
  }

  function openDialog(p){
    const d=ensureDialog();const mode=publicationMode(p);const paid=paidPlan(p);const pending=pendingRow();
    d.innerHTML=`<div class="menu-intake-flow">
      <div class="claim-head"><button class="round" data-menu-intake-close>${icons.back}</button><span class="claim-step">${paid?'PRO · LIVE-KARTE':'FREE · HOY-PRÜFUNG'}</span></div>
      <h2>Speisekarte von ${esc(p.name)}</h2>
      <p class="claim-lead">Originalquelle sichern → HOY strukturiert asynchron im Hochpräzisionsmodus → Entwurf prüfen → erst dann veröffentlichen. HOY übernimmt niemals ungeprüfte Modellresultate direkt in die Gastkarte.</p>
      ${pending?`<div class="menu-intake-latest"><b>HOY strukturiert im Hintergrund</b><small>${esc(pending.processor_note||'Die Karte wird strukturiert. Du kannst diese Ansicht schließen; beim nächsten Öffnen wird der aktuelle Stand geladen.')}</small></div>`:''}
      <div class="menu-intake-methods">
        <section><small>PDF / FOTO</small><h3>Datei hochladen</h3><p>PDF, JPG, PNG oder WebP · maximal 25 MB. Die Datei bleibt privat; für die Verarbeitung wird nur ein kurzlebiger Zugriff erzeugt.</p><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" data-menu-file><button data-menu-upload>Datei sicher einreichen</button></section>
        <section><small>BETREIBERQUELLE</small><h3>Offiziellen Link einreichen</h3><p>Für eine aktuelle Karte auf deiner eigenen Website oder deinem offiziellen Menüsystem.</p><input type="url" data-menu-url placeholder="https://…"><button data-menu-url-submit>Link prüfen lassen</button></section>
        <section><small>SOFORT STRUKTURIERT</small><h3>Gerichte direkt erfassen</h3><p>Eine Zeile pro Gericht: <b>Kategorie | Gericht | Preis | Beschreibung</b>. Beschreibung ist optional.</p><textarea data-menu-lines rows="7" placeholder="Vorspeisen | Patatas bravas | 8,50 € | Kartoffeln mit Salsa brava\nReisgerichte | Caldero del Mar Menor | 22,00 € | Preis pro Person"></textarea><button data-menu-direct>Als Entwurf anlegen</button></section>
      </div>
      <div class="menu-intake-options"><label>Originalsprache<select data-menu-locale><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option><option value="unknown">Nicht sicher</option></select></label><label class="menu-intake-rights"><input type="checkbox" data-menu-rights><span>Ich bestätige, dass diese Speisekarte zu meinem Betrieb gehört und HOY sie zur Erstellung und Darstellung der Restaurantkarte verarbeiten darf.</span></label></div>
      <div class="menu-intake-mode"><b>${mode==='operator_live'?'Self-Service aktiviert':'HOY-Prüfung'}</b><span>${mode==='operator_live'?'Pro/Business: Änderungen können nach Prüfung als Betreiberkarte veröffentlicht werden.':'Free: Die Einreichung landet bei HOY zur Prüfung; nichts wird automatisch öffentlich.'}</span></div>
      <div class="menu-intake-dialog-history"><h3>Letzte Einreichungen</h3>${historyHTML()}</div>
    </div>`;
    if(!d.open)d.showModal();
    d.querySelector('[data-menu-intake-close]').onclick=()=>d.close();
    d.querySelector('[data-menu-upload]').onclick=()=>submitFile(p,d);
    d.querySelector('[data-menu-url-submit]').onclick=()=>submitUrl(p,d);
    d.querySelector('[data-menu-direct]').onclick=()=>submitDirect(p,d);
    if(pending)schedulePoll(p,true);
  }

  function commonInput(p,d){
    if(!cloud.user)throw new Error('Bitte zuerst mit dem Betreiberkonto anmelden.');
    if(!d.querySelector('[data-menu-rights]')?.checked)throw new Error('Bitte die Rechte-/Betriebsbestätigung aktivieren.');
    return {restaurant_id:Number(p.id),submitted_by:cloud.user.id,publication_mode:publicationMode(p),original_locale:d.querySelector('[data-menu-locale]')?.value||'es',rights_confirmed:true};
  }

  async function invokeProcessor(id){
    const {data,error}=await sb.functions.invoke('menu-intake-process',{body:{submission_id:id}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  }

  function schedulePoll(p,immediate=false){
    stopPoll();
    if(!p||!cloud.user||!pendingRow())return;
    const delay=immediate?700:intakeState.pollDelay;
    intakeState.pollTimer=setTimeout(()=>pollPending(p),delay);
    if(!immediate)intakeState.pollDelay=Math.min(15000,Math.round(intakeState.pollDelay*1.45));
  }

  async function pollPending(p){
    if(intakeState.polling)return schedulePoll(p);
    const row=pendingRow();if(!row)return;
    intakeState.polling=true;
    try{
      await invokeProcessor(row.id);
      await loadRows(p,true);
      const d=document.getElementById('menuIntakeFlow');
      if(d?.open)openDialog(p);
    }catch(err){
      console.warn('HOY menu background sync',err);
      schedulePoll(p);
    }finally{intakeState.polling=false}
  }

  async function submitFile(p,d){
    const btn=d.querySelector('[data-menu-upload]');
    try{
      const base=commonInput(p,d);const file=d.querySelector('[data-menu-file]')?.files?.[0];
      if(!file)throw new Error('Bitte zuerst eine PDF- oder Bilddatei auswählen.');
      if(!MIME_OK.has(file.type))throw new Error('Erlaubt sind PDF, JPG, PNG und WebP.');
      if(file.size>MAX_BYTES)throw new Error('Die Datei ist größer als 25 MB.');
      btn.disabled=true;btn.textContent='Lädt sicher hoch …';
      const token=crypto.randomUUID();const storagePath=`${p.id}/${token}/${safeName(file.name)}`;
      const {error:uploadError}=await sb.storage.from('menu-intake').upload(storagePath,file,{contentType:file.type,upsert:false});
      if(uploadError)throw uploadError;
      const {data:row,error:insertError}=await sb.from('menu_intake_submissions').insert({...base,source_kind:'upload',storage_bucket:'menu-intake',storage_path:storagePath,original_filename:file.name,mime_type:file.type,byte_size:file.size,status:'uploaded',processor_state:'not_started'}).select('id').single();
      if(insertError)throw insertError;
      await invokeProcessor(row.id);intakeState.pollDelay=2500;await loadRows(p,true);toast('Speisekarte sicher eingereicht · Hochpräzisionsmodus gestartet');openDialog(p);
    }catch(err){console.error(err);toast(err?.message||'Upload fehlgeschlagen');btn.disabled=false;btn.textContent='Datei sicher einreichen'}
  }

  async function submitUrl(p,d){
    const btn=d.querySelector('[data-menu-url-submit]');
    try{
      const base=commonInput(p,d);const url=d.querySelector('[data-menu-url]')?.value.trim()||'';
      if(!/^https:\/\//i.test(url))throw new Error('Bitte einen vollständigen https-Link eintragen.');
      btn.disabled=true;btn.textContent='Wird eingereicht …';
      const {data:row,error}=await sb.from('menu_intake_submissions').insert({...base,source_kind:'official_url',source_url:url,status:'uploaded',processor_state:'not_started'}).select('id').single();
      if(error)throw error;await invokeProcessor(row.id);intakeState.pollDelay=2500;await loadRows(p,true);toast('Menülink eingereicht · Hochpräzisionsmodus gestartet');openDialog(p);
    }catch(err){console.error(err);toast(err?.message||'Einreichung fehlgeschlagen');btn.disabled=false;btn.textContent='Link prüfen lassen'}
  }

  function parseLines(raw){
    return String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,i)=>{
      const parts=line.split('|').map(x=>x.trim());
      if(parts.length===1)return {position:i,category_original:'Speisekarte',name_original:parts[0],price_text:'',description_original:''};
      return {position:i,category_original:parts[0]||'Speisekarte',name_original:parts[1]||'',price_text:parts[2]||'',description_original:parts.slice(3).join(' | ')};
    }).filter(x=>x.name_original);
  }

  async function submitDirect(p,d){
    const btn=d.querySelector('[data-menu-direct]');
    try{
      const base=commonInput(p,d);const items=parseLines(d.querySelector('[data-menu-lines]')?.value);
      if(!items.length)throw new Error('Bitte mindestens ein Gericht eintragen.');
      btn.disabled=true;btn.textContent='Entwurf wird angelegt …';
      const {data:row,error}=await sb.from('menu_intake_submissions').insert({...base,source_kind:'direct_entry',status:'uploaded',processor_state:'not_started'}).select('id').single();
      if(error)throw error;
      const locale=base.original_locale;
      const {error:itemError}=await sb.from('menu_intake_items').insert(items.map(x=>({...x,submission_id:row.id,locale_original:locale,review_status:'confirmed'})));
      if(itemError)throw itemError;
      await invokeProcessor(row.id);await loadRows(p,true);toast(`${items.length} Positionen als Entwurf gespeichert`);openDialog(p);
    }catch(err){console.error(err);toast(err?.message||'Entwurf konnte nicht angelegt werden');btn.disabled=false;btn.textContent='Als Entwurf anlegen'}
  }

  const baseWire29=wire;
  wire=function(){
    baseWire29();
    const p=currentRestaurant();
    document.querySelectorAll('[data-menu-intake-open]').forEach(btn=>btn.onclick=()=>openDialog(p));
    if(state.view==='partner'&&p&&cloud.user){
      if(intakeState.restaurantId!==Number(p.id))loadRows(p);
      else if(pendingRow())schedulePoll(p);
    }else stopPoll();
  };

  const baseAuthLogout29=authLogout;
  authLogout=async function(){stopPoll();intakeState.restaurantId=null;intakeState.rows=[];intakeState.pollDelay=2500;await baseAuthLogout29()};
})();

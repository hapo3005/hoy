/* HOY 2.43.0 — granular accessibility facts, consumer disclosure and free operator verification */
(function(){
  if(window.__hoyAccessibility243)return;
  window.__hoyAccessibility243=true;
  window.hoyAccessibilityVersion='2.43.0';

  const coreKeys=['wheelchair_entrance_state','wheelchair_seating_state','wheelchair_toilet_state'];
  const labels={
    wheelchair_entrance_state:'Rollstuhlgerechter Eingang',
    wheelchair_seating_state:'Rollstuhlgerechte Sitzplätze',
    wheelchair_toilet_state:'Rollstuhlgerechtes WC',
    accessible_parking_state:'Barrierefreier Parkplatz',
    hearing_loop_state:'Induktive Höranlage'
  };
  const stateLabel=v=>v==='yes'?'Bestätigt':v==='no'?'Einschränkung':'Noch nicht bestätigt';
  const stateMark=v=>v==='yes'?'✓':v==='no'?'!':'?';
  const fmtDate=v=>{try{return v?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v)):''}catch{return ''}};
  const accOf=p=>p?.accessibility||null;

  function statusMeta(a){
    if(!a)return {label:'Barrierefreiheit noch nicht bestätigt',cls:'unknown',lead:'Für diesen Betrieb liegen noch keine belastbaren Detailangaben vor.'};
    if(a.overall_status==='A')return {label:a.verification_source==='operator'?'Vom Betrieb als rollstuhlgerecht bestätigt':'Rollstuhl-Kernmerkmale bestätigt',cls:'good',lead:'Eingang, Sitzplätze und WC sind als rollstuhlgerecht bestätigt.'};
    if(a.overall_status==='B')return {label:'Barrierefreiheit teilweise bestätigt',cls:'partial',lead:'Einige Merkmale sind bestätigt, andere noch offen.'};
    if(a.overall_status==='C')return {label:'Konkrete Barriere dokumentiert',cls:'barrier',lead:'Mindestens ein Kernmerkmal ist ausdrücklich nicht rollstuhlgerecht dokumentiert.'};
    return {label:'Barrierefreiheit noch nicht bestätigt',cls:'unknown',lead:'Fehlende Angaben bedeuten nicht, dass der Betrieb nicht barrierefrei ist.'};
  }

  function miniBadge(p){
    const a=accOf(p);if(!a||a.overall_status==='D')return '';
    const m=statusMeta(a);
    return `<span class="access-mini ${m.cls}" title="${esc(m.label)}"><span aria-hidden="true">♿</span>${a.overall_status==='A'?'Rollstuhl':a.overall_status==='B'?'Teilweise geprüft':'Barrierehinweis'}</span>`;
  }

  function featureRows(a){
    return Object.keys(labels).map(k=>{
      const v=a?.[k]||'unknown';
      return `<div class="access-feature ${v}"><span class="access-state" aria-hidden="true">${stateMark(v)}</span><div><b>${esc(labels[k])}</b><small>${esc(stateLabel(v))}</small></div></div>`;
    }).join('');
  }

  function accessibilityPanel(p){
    const a=accOf(p);
    const m=statusMeta(a);
    const checked=fmtDate(a?.checked_at);
    const source=a?.verification_source==='operator'?'Vom verifizierten Betrieb bestätigt':a?.source_label||'HOY-Prüfung öffentlicher Angaben';
    return `<section class="access-panel ${m.cls}" data-accessibility-panel>
      <div class="access-head">
        <div>
          <div class="eyebrow">BARRIEREFREIHEIT & ZUGANG</div>
          <h3><span aria-hidden="true">♿</span> ${esc(m.label)}</h3>
          <p>${esc(m.lead)}</p>
        </div>
        <span class="access-status ${m.cls}">${a?.overall_status||'D'}</span>
      </div>
      <div class="access-features">${featureRows(a)}</div>
      ${a?.accessibility_note?`<div class="access-note">${esc(a.accessibility_note)}</div>`:''}
      <div class="access-source"><b>${esc(source)}</b>${checked?` · geprüft ${esc(checked)}`:''}<br><span>Aktueller Schwerpunkt: Mobilität/Rollstuhlnutzung. „Nicht bestätigt“ ist kein Negativurteil.</span></div>
    </section>`;
  }

  async function loadAccessibility(){
    if(!sb)return;
    const {data,error}=await sb.from('restaurant_accessibility').select('restaurant_id,wheelchair_entrance_state,wheelchair_seating_state,wheelchair_toilet_state,accessible_parking_state,hearing_loop_state,overall_status,verification_source,source_label,evidence_type,secondary_note,accessibility_note,checked_at,operator_confirmed_at,updated_at');
    if(error){console.warn('HOY accessibility load failed',error);return}
    const byId=new Map((data||[]).map(x=>[Number(x.restaurant_id),x]));
    DATA.forEach(p=>{p.accessibility=byId.get(Number(p.id))||null});
  }

  if(typeof loadCloudRestaurants==='function'){
    const baseLoad243=loadCloudRestaurants;
    loadCloudRestaurants=async function(){
      await baseLoad243();
      await loadAccessibility();
    };
  }

  if(typeof card==='function'){
    const baseCard243=card;
    card=function(p){
      const html=baseCard243(p),badge=miniBadge(p);if(!badge)return html;
      return html.replace('<div class="card-foot">',`<div class="access-card-line">${badge}</div><div class="card-foot">`);
    };
  }

  if(typeof listCard==='function'){
    const baseListCard243=listCard;
    listCard=function(p){
      const html=baseListCard243(p),badge=miniBadge(p);if(!badge)return html;
      return html.replace('<div class="service">',`<div class="access-card-line">${badge}</div><div class="service">`);
    };
  }

  if(typeof setDetailTab==='function'){
    const baseTab243=setDetailTab;
    setDetailTab=function(d,p,tab){
      baseTab243(d,p,tab);
      if(tab!=='overview')return;
      const c=d.querySelector('[data-tab-content]');
      if(c&&!c.querySelector('[data-accessibility-panel]'))c.insertAdjacentHTML('beforeend',accessibilityPanel(p));
    };
  }

  function operatorCard(p){
    const a=accOf(p);if(!p?.operator_verified)return '';
    const m=statusMeta(a),confirmed=a?.verification_source==='operator';
    const coreComplete=!!a&&coreKeys.every(k=>['yes','no'].includes(a[k]));
    return `<section class="operator-access-card" data-operator-accessibility>
      <div class="operator-access-icon">♿</div>
      <div>
        <div class="eyebrow">${confirmed?'VOM BETRIEB BESTÄTIGT':'EINMAL KURZ BESTÄTIGEN · FREE'}</div>
        <h2>${confirmed?'Barrierefreiheit aktuell halten.':'Stimmen diese Angaben zur Barrierefreiheit?'}</h2>
        <p>${confirmed?'Deine Angaben werden Gästen als direkte Betreiberbestätigung angezeigt.':'HOY hat öffentliche Angaben vorbereitet. Bestätige oder korrigiere Eingang, Sitzplätze, WC und weitere Merkmale.'}</p>
        <div class="operator-access-current"><b>${esc(m.label)}</b><small>${a?.checked_at?'Stand '+esc(fmtDate(a.checked_at)):'Noch ohne bestätigten Stand'}</small></div>
        <div class="operator-access-actions">
          ${!confirmed&&coreComplete?'<button type="button" class="primary" data-access-confirm>Ja, stimmt so</button>':''}
          <button type="button" ${confirmed?'':'class="primary"'} data-access-edit>${confirmed?'Angaben bearbeiten':'Prüfen & vervollständigen'}</button>
        </div>
        <small class="operator-confirmation-plan-note">Die Bestätigung der Basis-Barrierefreiheitsdaten ist kostenlos.</small>
      </div>
    </section>`;
  }

  if(typeof partner==='function'){
    const basePartner243=partner;
    partner=function(){
      const html=basePartner243();
      const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;
      const cardHtml=operatorCard(p);if(!cardHtml)return html;
      if(html.includes('<section class="operator-command-center">'))return html.replace('<section class="operator-command-center">',cardHtml+'<section class="operator-command-center">');
      return html.replace('<div class="partner-hero">',cardHtml+'<div class="partner-hero">');
    };
  }

  function selectOptions(current,allowUnknown){
    const opts=[['','Bitte wählen …'],['yes','Ja'],['no','Nein']];
    if(allowUnknown)opts.push(['unknown','Nicht sicher / nicht geklärt']);
    return opts.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${esc(l)}</option>`).join('');
  }

  function ensureDialog(){
    let d=document.getElementById('operatorAccessibilityFlow');
    if(!d){d=document.createElement('dialog');d.id='operatorAccessibilityFlow';d.className='dialog';document.body.appendChild(d)}
    return d;
  }

  function openAccessibilityEditor(p){
    const a=accOf(p)||{};
    const d=ensureDialog();
    const rows=[
      ['wheelchair_entrance_state','Ist der Eingang rollstuhlgerecht erreichbar?',false],
      ['wheelchair_seating_state','Sind geeignete Sitzplätze/Tische rollstuhlgerecht erreichbar?',false],
      ['wheelchair_toilet_state','Gibt es ein rollstuhlgerechtes WC?',false],
      ['accessible_parking_state','Gibt es einen barrierefreien Parkplatz?',true],
      ['hearing_loop_state','Gibt es eine induktive Höranlage?',true],
    ];
    d.innerHTML=`<div class="operator-access-flow">
      <div class="claim-head"><button type="button" class="round" data-access-close>${icons.back}</button><span class="claim-step">FREE · BARRIEREFREIHEIT</span></div>
      <h2>Barrierefreiheit bestätigen.</h2>
      <p class="claim-lead">Bitte nur den tatsächlichen Zustand deines Betriebs angeben. Gäste sehen anschließend die einzelnen Merkmale – nicht nur ein pauschales Ja/Nein.</p>
      <div class="operator-access-fields">${rows.map(([key,label,allowUnknown])=>`<label class="operator-access-field"><span>${esc(label)}</span><select data-access-field="${key}">${selectOptions(a[key]||'',allowUnknown)}</select></label>`).join('')}</div>
      <label class="operator-access-note"><span>Optionaler Hinweis</span><textarea rows="3" data-access-note placeholder="z. B. Rampe am Seiteneingang, WC-Schlüssel an der Bar …">${esc(a.accessibility_note||'')}</textarea></label>
      <div class="prototype-note"><b>Wichtig:</b> Diese Angaben werden als vom verifizierten Betrieb bestätigt gekennzeichnet.</div>
      <div class="operator-flow-actions"><button type="button" data-access-close>Abbrechen</button><button type="button" class="primary" data-access-save>Bestätigen & speichern</button></div>
    </div>`;
    d.showModal();
    d.querySelectorAll('[data-access-close]').forEach(x=>x.onclick=()=>d.close());
    d.querySelector('[data-access-save]').onclick=()=>saveAccessibility(p,d);
  }

  async function invokeAccessibility(p,action,extra={}){
    if(!sb||!cloud.user)throw new Error('Bitte zuerst anmelden');
    const {data,error}=await sb.functions.invoke('operator-accessibility-confirm',{body:{action,restaurant_id:Number(p.id),...extra}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  }

  async function refreshAccessibility(p,row){
    if(row)p.accessibility=row;
    await loadAccessibility();
    render();
  }

  async function confirmAccessibility(p,button){
    button.disabled=true;button.textContent='Bestätigt …';
    try{
      const data=await invokeAccessibility(p,'confirm');
      await refreshAccessibility(p,data.accessibility);
      toast('Barrierefreiheit vom Betrieb bestätigt');
    }catch(err){
      button.disabled=false;button.textContent='Ja, stimmt so';
      if(err?.message==='accessibility_completion_required'){openAccessibilityEditor(p);return}
      toast(err?.message||'Bestätigung nicht möglich');
    }
  }

  async function saveAccessibility(p,d){
    const states={};
    for(const key of Object.keys(labels)){
      const field=d.querySelector(`[data-access-field="${key}"]`);
      states[key]=field?.value||'';
    }
    if(coreKeys.some(k=>!['yes','no'].includes(states[k]))){
      toast('Bitte Eingang, Sitzplätze und WC mit Ja oder Nein beantworten');return;
    }
    for(const k of ['accessible_parking_state','hearing_loop_state'])if(!['yes','no','unknown'].includes(states[k]))states[k]='unknown';
    const btn=d.querySelector('[data-access-save]');btn.disabled=true;btn.textContent='Speichert …';
    try{
      const data=await invokeAccessibility(p,'correct',{states,note:d.querySelector('[data-access-note]')?.value||''});
      d.close();await refreshAccessibility(p,data.accessibility);toast('Barrierefreiheit bestätigt');
    }catch(err){
      btn.disabled=false;btn.textContent='Bestätigen & speichern';toast(err?.message||'Angaben konnten nicht gespeichert werden');
    }
  }

  if(typeof wire==='function'){
    const baseWire243=wire;
    wire=function(){
      baseWire243();
      const p=typeof claimedRestaurant==='function'?claimedRestaurant():null;
      if(!p||!p.operator_verified)return;
      document.querySelectorAll('[data-access-confirm]').forEach(b=>b.onclick=()=>confirmAccessibility(p,b));
      document.querySelectorAll('[data-access-edit]').forEach(b=>b.onclick=()=>openAccessibilityEditor(p));
    };
  }

  window.hoyLoadAccessibility=loadAccessibility;
  window.hoyAccessibilityPanel=accessibilityPanel;
})();

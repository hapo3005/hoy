/* HOY Control 2.10 — operator correction review and upgrade-intent visibility */
(function(){
  state.profileChanges=[];state.upgradeRequests=[];

  const baseLoadData210=loadData;
  loadData=async function(){
    await baseLoadData210();
    const [changes,upgrades]=await Promise.all([
      sb.from('restaurant_profile_change_requests').select('id,restaurant_id,submitted_by,changes,note,status,submitted_at,reviewed_at,rejection_reason').order('submitted_at',{ascending:false}).limit(100),
      sb.from('operator_upgrade_requests').select('id,restaurant_id,requested_by,requested_plan,status,note,created_at,updated_at').order('created_at',{ascending:false}).limit(100)
    ]);
    if(changes.error)throw changes.error;if(upgrades.error)throw upgrades.error;
    state.profileChanges=changes.data||[];state.upgradeRequests=upgrades.data||[];
  };

  const changeLabel={address:'Adresse',phone:'Telefon',website:'Website',description:'Beschreibung',hours_text:'Basisöffnungszeiten'};
  function changeRows(changes){
    return Object.entries(changes||{}).map(([k,v])=>`<div class="operator-change-row"><b>${esc(changeLabel[k]||k)}</b><span>${esc(v||'—')}</span></div>`).join('');
  }
  function operatorOpsMarkup(){
    const pending=(state.profileChanges||[]).filter(x=>x.status==='pending');
    const upgrades=(state.upgradeRequests||[]).filter(x=>x.status==='pending');
    return `<div class="operator-admin-block"><div class="grid2"><section class="panel"><div class="panel-head"><h2>Betreiber-Korrekturen</h2><small>${pending.length} offen</small></div>${pending.length?`<div class="operator-admin-list">${pending.slice(0,12).map(x=>{const r=rById(x.restaurant_id);return `<article class="operator-admin-card"><div class="operator-admin-top"><div><h3>${esc(r?.name||'Betrieb #'+x.restaurant_id)}</h3><p>eingereicht ${fmtDate(x.submitted_at)}${x.note?' · '+esc(x.note):''}</p></div>${badge('PRÜFEN','warn')}</div><div class="operator-change-list">${changeRows(x.changes)}</div><div class="claim-actions"><button class="primary" data-profile-change-approve="${x.id}">Übernehmen</button><button class="danger" data-profile-change-reject="${x.id}">Ablehnen</button></div></article>`}).join('')}</div>`:'<div class="empty">Keine offenen Betreiber-Korrekturen.</div>'}</section><section class="panel"><div class="panel-head"><h2>Upgrade-Wünsche</h2><small>${upgrades.length} vorgemerkt</small></div>${upgrades.length?`<div class="operator-admin-list">${upgrades.slice(0,12).map(x=>{const r=rById(x.restaurant_id);return `<article class="operator-upgrade-row"><div><h3>${esc(r?.name||'Betrieb #'+x.restaurant_id)}</h3><p>${fmtDate(x.created_at)} · keine automatische Nachricht / Abbuchung</p></div>${badge(String(x.requested_plan||'').toUpperCase(),x.requested_plan==='business'?'dark':'good')}</article>`}).join('')}</div>`:'<div class="empty">Noch keine Upgrade-Wünsche.</div>'}</section></div></div>`;
  }

  const baseOverview210=renderOverview;
  renderOverview=function(){return baseOverview210()+operatorOpsMarkup()};

  async function reviewProfileChange(id,decision){
    let reason=null;if(decision==='rejected'){reason=prompt('Kurzer Grund für die Ablehnung:')?.trim()||'';if(!reason)return}
    try{await adminOp('review_profile_change',{request_id:id,decision,rejection_reason:reason});toast(decision==='approved'?'Korrektur übernommen':'Korrektur abgelehnt');await loadData();render()}catch(err){toast(err?.message||'Korrektur konnte nicht geprüft werden')}
  }

  const baseWire210=wire;
  wire=function(){
    baseWire210();
    document.querySelectorAll('[data-profile-change-approve]').forEach(x=>x.onclick=()=>reviewProfileChange(x.dataset.profileChangeApprove,'approved'));
    document.querySelectorAll('[data-profile-change-reject]').forEach(x=>x.onclick=()=>reviewProfileChange(x.dataset.profileChangeReject,'rejected'));
  };
})();
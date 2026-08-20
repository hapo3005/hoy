/* HOY 2.50.0 — merchant-truth freshness: dated operator proof, stale downgrade and verified-base fallback */
(function(){
  if(window.__hoyMerchantTruthFreshness250)return;
  window.__hoyMerchantTruthFreshness250=true;
  window.hoyMerchantTruthFreshnessVersion='2.50.0';

  const TZ='Europe/Madrid';
  const STALE_AFTER_DAYS=30;
  const baseNow=window.hoyNowStatus219For;
  if(typeof baseNow!=='function')return;

  const esc250=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function validDate(value){
    const d=value instanceof Date?value:new Date(value);
    return Number.isFinite(d.getTime())?d:null;
  }
  function madridDate(value=new Date()){
    const d=validDate(value);if(!d)return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function madridTime(value){
    const d=validDate(value);if(!d)return '';
    return new Intl.DateTimeFormat('de-DE',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}).format(d);
  }
  function prettyDate(value){
    const d=validDate(value);if(!d)return '';
    return new Intl.DateTimeFormat('de-DE',{timeZone:TZ,day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
  }
  function sourceStamp(p,source){
    if(source==='operator-special')return p?.operator_special_hours?.updated_at||'';
    return p?.operator_hours?.confirmed_at||p?.operator_hours?.updated_at||'';
  }
  function freshnessFor(p,now=new Date(),source='operator'){
    const current=validDate(now)||new Date();
    const raw=sourceStamp(p,source);
    const stamp=validDate(raw);
    if(!stamp)return {key:'unknown',valid:false,isToday:false,stale:true,days:null,label:'ohne belastbaren Bestätigungszeitpunkt',stamp:''};
    const ageMs=current.getTime()-stamp.getTime();
    if(ageMs<0)return {key:'future-invalid',valid:false,isToday:false,stale:true,days:null,label:'mit ungültigem zukünftigen Bestätigungszeitpunkt',stamp:raw};
    const isToday=madridDate(stamp)===madridDate(current);
    const days=Math.floor(ageMs/86400000);
    if(isToday)return {key:'today',valid:true,isToday:true,stale:false,days:0,label:`heute ${madridTime(stamp)}`,stamp:raw};
    if(days<=STALE_AFTER_DAYS){
      const safeDays=Math.max(1,days);
      return {key:'recent',valid:true,isToday:false,stale:false,days:safeDays,label:`vor ${safeDays} ${safeDays===1?'Tag':'Tagen'}`,stamp:raw};
    }
    return {key:'stale',valid:true,isToday:false,stale:true,days,label:`am ${prettyDate(stamp)}`,stamp:raw};
  }
  window.hoyMerchantTruthFreshness250For=freshnessFor;

  function neutralOperatorLabel(status){
    if(!status)return status;
    const out={...status};
    if(out.state==='open')out.label=String(out.label||'').replace(/^Jetzt geöffnet\s*·\s*bis\s*/i,'Laut Betreiberzeiten · offen bis ');
    else if(out.state==='later')out.label=String(out.label||'').replace(/^Öffnet heute\s*/i,'Laut Betreiberzeiten · öffnet ');
    else if(out.state==='closed')out.label='Laut Betreiberzeiten · heute geschlossen';
    return out;
  }
  function fallbackFromStaleOperator(p,now,freshness){
    const safe={...p,operator_hours:null};
    const fallback=baseNow(safe,now);
    if(!fallback)return null;
    return {...fallback,staleOperatorIgnored:true,operatorFreshness:freshness};
  }

  window.hoyNowStatus219For=function(p,now=new Date()){
    const status=baseNow(p,now);if(!status)return null;
    if(status.source==='operator-special'){
      const fresh=freshnessFor(p,now,'operator-special');
      return {...status,operatorConfirmed:true,operatorManaged:true,operatorFreshness:fresh,proof:`Sonderzeit vom Betrieb · ${fresh.valid?fresh.label:'für heute hinterlegt'}`};
    }
    if(status.source!=='operator')return status;

    const fresh=freshnessFor(p,now,'operator');
    if(!fresh.valid||fresh.stale)return fallbackFromStaleOperator(p,now,fresh);
    if(fresh.isToday)return {...status,operatorConfirmed:true,operatorManaged:true,operatorFreshness:fresh,proof:`Vom Betrieb bestätigt · ${fresh.label}`};

    const dated=neutralOperatorLabel(status);
    return {...dated,operatorConfirmed:false,operatorManaged:true,operatorFreshness:fresh,proof:`Vom Betrieb bestätigt · ${fresh.label}`};
  };

  function operatorProofForStatus(status){
    if(!status)return '';
    if(status.staleOperatorIgnored){
      const f=status.operatorFreshness;
      return f?.key==='stale'?`Betreiberzeiten zuletzt bestätigt ${f.label} · HOY nutzt verifizierte Basiszeiten`:'Betreiberzeiten ohne belastbare Aktualität · HOY nutzt verifizierte Basiszeiten';
    }
    return status.operatorManaged?String(status.proof||''):'';
  }
  function restaurantForNowNode(node){
    const card=node.closest('.list-card[data-open],.card[data-open],.map-decision-card[data-map-card]');
    if(!card)return null;
    const id=Number(card.dataset.open||card.dataset.mapCard||0);
    return (DATA||[]).find(x=>Number(x.id)===id)||null;
  }
  function decorateCompactTruth(){
    document.querySelectorAll('[data-hoy-now-status]').forEach(node=>{
      if(node.querySelector('[data-merchant-truth-freshness]'))return;
      const p=restaurantForNowNode(node);if(!p)return;
      const status=window.hoyNowStatus219For?.(p,new Date())||null;
      const proof=operatorProofForStatus(status);if(!proof)return;
      node.querySelector('div')?.insertAdjacentHTML('beforeend',`<small class="merchant-truth-freshness" data-merchant-truth-freshness>${esc250(proof)}</small>`);
    });
  }

  function currentSourceForProfile(p){
    const special=p?.operator_special_hours;
    return special&&String(special.service_date||'')===madridDate()?'operator-special':'operator';
  }
  function enhanceProfileFreshness(id){
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const block=document.querySelector('#detail[open] .profile-hours');
    if(!p||!block||(!p.operator_hours&&!p.operator_special_hours))return;
    const source=currentSourceForProfile(p);
    const fresh=freshnessFor(p,new Date(),source);
    block.setAttribute('data-merchant-freshness',fresh.key);
    const badge=block.querySelector('.hours-trust-badge');
    const title=block.querySelector('.hours-trust-head h4');
    const proof=block.querySelector('.hours-trust-proof');
    if(source==='operator-special'){
      if(proof)proof.textContent=`Sonderzeit vom Betrieb · ${fresh.valid?fresh.label:'für heute hinterlegt'}.`;
      return;
    }
    if(fresh.isToday){
      if(badge)badge.textContent='HEUTE BESTÄTIGT';
      if(title)title.textContent='Heute vom Betrieb bestätigt';
      if(proof)proof.textContent=`Der Betrieb hat diese Zeiten ${fresh.label} bestätigt.`;
      return;
    }
    if(fresh.valid&&!fresh.stale){
      if(badge)badge.textContent='BETREIBER';
      if(title)title.textContent='Vom Betrieb gepflegte Öffnungszeiten';
      if(proof)proof.textContent=`Vom Betrieb zuletzt ${fresh.label} bestätigt. HOY wertet das nicht als heutige Live-Bestätigung.`;
      return;
    }
    if(badge)badge.textContent='AKTUALITÄT PRÜFEN';
    if(title)title.textContent='Betreiberzeiten nicht mehr frisch bestätigt';
    if(proof)proof.textContent=`${fresh.valid?`Zuletzt ${fresh.label} bestätigt`:'Kein belastbarer Bestätigungszeitpunkt'}. HOY nutzt diese Angabe nicht für einen Betreiber-NOW-Vorrang.`;
  }

  if(typeof openDetail==='function'){
    const baseOpen250=openDetail;
    openDetail=function(id){baseOpen250(id);enhanceProfileFreshness(id)};
  }
  if(typeof loadCloudRestaurants==='function'){
    const baseLoad250=loadCloudRestaurants;
    loadCloudRestaurants=async function(){
      await baseLoad250();
      const d=document.getElementById('detail');
      if(d?.open&&Number(d.dataset.restaurantId||0))enhanceProfileFreshness(Number(d.dataset.restaurantId));
    };
  }
  if(typeof wire==='function'){
    const baseWire250=wire;
    wire=function(){baseWire250();decorateCompactTruth()};
  }
})();

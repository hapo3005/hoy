/* HOY 2.23.0 — simple by default: fewer guest decisions, plain-language hours, complexity stays under the hood */
(function(){
  if(window.__hoySimplicity230)return;
  window.__hoySimplicity230=true;
  window.hoySimplicityVersion='2.23.0';

  const TZ='Europe/Madrid';
  const escSimple=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUrl=v=>/^https?:\/\//i.test(String(v||''));

  function madridDate(value=new Date()){
    const d=value instanceof Date?value:new Date(value);
    if(!Number.isFinite(d.getTime()))return '';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function prettyDate(value){
    if(!value)return '';
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
    try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)}catch{return ''}
  }
  function todayOperatorProof(p,now){
    const today=madridDate();
    const special=p?.operator_special_hours;
    if(special&&String(special.service_date||'')===today)return 'Heute vom Betrieb aktualisiert';
    const confirmed=p?.operator_hours?.confirmed_at||'';
    if(confirmed&&madridDate(confirmed)===today)return 'Heute vom Betrieb bestätigt';
    if(now?.source&&now.source!=='base')return 'Vom Betrieb gepflegt';
    return 'HOY geprüft';
  }
  function nowTime(label,kind){
    const text=String(label||'');
    if(kind==='open')return text.match(/bis\s+(\d{1,2}:\d{2})/i)?.[1]||'';
    if(kind==='later')return text.match(/öffnet(?:\s+heute)?\s+(\d{1,2}:\d{2})/i)?.[1]||'';
    return '';
  }
  function simpleHoursState(p){
    const now=window.hoyNowStatus219For?.(p)||null;
    if(now){
      if(now.state==='open'){
        const until=nowTime(now.label,'open');
        return {safe:true,tone:'open',title:until?`Geöffnet · bis ${until}`:'Geöffnet',meta:todayOperatorProof(p,now),now};
      }
      if(now.state==='later'){
        const at=nowTime(now.label,'later');
        return {safe:true,tone:'closed',title:at?`Geschlossen · öffnet um ${at}`:'Geschlossen',meta:todayOperatorProof(p,now),now};
      }
      return {safe:true,tone:'closed',title:'Geschlossen',meta:todayOperatorProof(p,now),now};
    }
    return {safe:false,tone:'uncertain',title:'Öffnungszeiten aktuell nicht sicher',meta:'Bitte vor dem Besuch direkt beim Betrieb prüfen.',now:null};
  }
  function sourceDetails(p){
    const status=String(p?.hours_status||'missing');
    const note=String(p?.hours_note||'').trim();
    const raw=String(p?.hours_raw_text||p?.hours||'').trim();
    const label=String(p?.hours_source_label||'').trim();
    const url=String(p?.hours_source_url||'').trim();
    const date=prettyDate(p?.hours_checked_at);
    const explanations={
      conflict:'Mehrere aktuelle Angaben widersprechen sich.',
      needs_review:'Aktuelle Angaben sind vorhanden, aber noch nicht sicher genug bestätigt.',
      conditional:'Die Zeiten können saisonal, wetterbedingt oder aus anderen Gründen abweichen.',
      missing:'Aktuell liegt kein ausreichend sicherer Wochenplan vor.'
    };
    const explanation=explanations[status]||'';
    const source=label?(validUrl(url)?`<a href="${escSimple(url)}" target="_blank" rel="noopener">${escSimple(label)} ↗</a>`:`<span>${escSimple(label)}</span>`):'';
    const checked=date?`<span>Geprüft ${escSimple(date)}</span>`:'';
    const evidence=[explanation,note,raw].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(' ');
    if(!evidence&&!source&&!checked)return '';
    return `<details class="hours-simple-details"><summary>Warum?</summary>${evidence?`<p>${escSimple(evidence)}</p>`:''}${source||checked?`<div class="hours-simple-source">${source}${source&&checked?'<i aria-hidden="true">·</i>':''}${checked}</div>`:''}</details>`;
  }
  function renderSimpleHours(p,d){
    const block=d?.querySelector('.profile-hours');
    if(!p||!block)return;
    const state=simpleHoursState(p);
    const underlying=state.now?.source&&state.now.source!=='base'?state.now.source:String(p?.hours_status||'missing');
    block.className=`profile-hours hours-simple-card hours-simple-${state.tone}`;
    block.setAttribute('data-hours-trust',underlying);
    block.setAttribute('data-hours-simple',state.safe?'safe':'uncertain');
    block.innerHTML=`<small class="hours-simple-kicker">ÖFFNUNGSZEITEN</small><div class="hours-simple-main"><span class="hours-simple-dot" aria-hidden="true"></span><strong>${escSimple(state.title)}</strong></div><span class="hours-simple-meta">${escSimple(state.meta)}</span>${state.safe?sourceDetails({...p,hours_note:'',hours_raw_text:''}):sourceDetails(p)}`;

    const minis=d.querySelectorAll('.profile-quick-snapshot .showcase-mini');
    const hoursMini=minis?.[1];
    if(hoursMini){
      const strong=hoursMini.querySelector('strong');
      const span=hoursMini.querySelector('span');
      if(state.safe&&state.now?.state==='open'){
        if(strong)strong.textContent='Geöffnet';
        const until=nowTime(state.now.label,'open');
        if(span)span.textContent=[until?`bis ${until}`:'',state.meta].filter(Boolean).join(' · ');
      }else if(state.safe&&state.now?.state==='later'){
        if(strong)strong.textContent='Geschlossen';
        const at=nowTime(state.now.label,'later');
        if(span)span.textContent=at?`öffnet um ${at}`:state.meta;
      }else if(state.safe){
        if(strong)strong.textContent='Geschlossen';
        if(span)span.textContent=state.meta;
      }else{
        if(strong)strong.textContent='Nicht sicher';
        if(span)span.textContent='Bitte direkt prüfen';
      }
    }
  }
  function simplifyProfile(p,d){
    if(!p||!d?.open)return;
    d.classList.add('hoy-simple-profile');
    d.querySelector('.profile-trust-line')?.remove();
    d.querySelector('.showcase-warning')?.remove();
    d.querySelector('.showcase-proof')?.remove();

    const actions=d.querySelector('.profile-quick-actions');
    if(actions){
      [...actions.children].forEach(action=>{
        if(/teilen/i.test(String(action.textContent||'')))action.classList.add('hoy-secondary-action-hidden');
      });
      const visible=[...actions.children].filter(x=>!x.classList.contains('hoy-secondary-action-hidden')&&!x.classList.contains('profile-action-duplicate'));
      actions.classList.toggle('hoy-actions-two',visible.length===2);
    }

    d.querySelectorAll('.profile-info-section .fact').forEach(fact=>{
      const b=fact.querySelector('b');
      if(String(b?.textContent||'').trim()==='Datenstatus'){
        b.textContent='Aktualität';
        const span=fact.querySelector('span');
        if(span)span.textContent=isClaimed(p)?'Vom Betrieb bestätigt':'Von HOY geprüft';
      }
    });
    renderSimpleHours(p,d);
  }

  function simplifyNowLabels(root=document){
    root.querySelectorAll('[data-hoy-now-status] strong').forEach(strong=>{
      const old=String(strong.textContent||'').trim();
      let next=old;
      const open=old.match(/(?:Laut Öffnungszeiten · |Jetzt )?geöffnet · bis\s+(\d{1,2}:\d{2})/i)||old.match(/Laut Öffnungszeiten · offen bis\s+(\d{1,2}:\d{2})/i);
      const later=old.match(/(?:Laut Öffnungszeiten · )?öffnet(?: heute)?\s+(\d{1,2}:\d{2})/i);
      if(open)next=`Geöffnet · bis ${open[1]}`;
      else if(later)next=`Geschlossen · öffnet um ${later[1]}`;
      else if(/heute geschlossen/i.test(old))next='Geschlossen';
      if(next!==old)strong.textContent=next;
    });
  }

  function simplifyHome(root){
    const hero=root?.querySelector('.journey-hero');
    const copy=hero?.querySelector('.hero-copy p');
    if(copy)copy.innerHTML='Finde schnell, was jetzt zu dir passt – mit <strong>aktuellen Öffnungszeiten und Speisekarten</strong>.';
    const small=hero?.querySelector('.intent-title small');
    if(small)small.textContent='Mit einem Tipp starten';
    const searchButton=hero?.querySelector('[data-home-search-go]');
    if(searchButton)searchButton.textContent='Suchen';
    const trust=hero?.querySelector('.journey-trust-strip');
    if(trust)trust.innerHTML='<span>Aktuelle Öffnungszeiten</span><i aria-hidden="true">·</i><span>Speisekarten</span><i aria-hidden="true">·</i><span>Direkt zum Betrieb</span>';
  }
  function simplifyDiscover(root){
    const head=root?.querySelector('.journey-discover-head');
    const p=head?.querySelector('p');
    if(p)p.textContent='Suche direkt oder wähle, worauf du gerade Lust hast.';
    const filterHead=root?.querySelector('.journey-filter-block .consumer-filter-head');
    const small=filterHead?.querySelector('small');
    if(small)small.remove();
    const service=root?.querySelector('.journey-service-filter');
    if(service){
      service.id='hoySecondaryFilters';
      service.classList.add('hoy-secondary-filters');
      const expanded=!!state?.service&&state.service!=='all';
      service.hidden=!expanded;
      if(filterHead&&!filterHead.querySelector('[data-simple-filter-toggle]')){
        const toggle=document.createElement('button');
        toggle.type='button';
        toggle.className='hoy-filter-toggle';
        toggle.dataset.simpleFilterToggle='1';
        toggle.setAttribute('aria-controls','hoySecondaryFilters');
        toggle.setAttribute('aria-expanded',String(expanded));
        toggle.textContent=expanded?'Weniger Filter':'Weitere Filter';
        filterHead.appendChild(toggle);
      }
    }
  }
  function bindSimpleFilterToggle(){
    const toggle=document.querySelector('[data-simple-filter-toggle]');
    const service=document.getElementById('hoySecondaryFilters');
    if(!toggle||!service)return;
    toggle.onclick=()=>{
      const expanded=toggle.getAttribute('aria-expanded')==='true';
      service.hidden=expanded;
      toggle.setAttribute('aria-expanded',String(!expanded));
      toggle.textContent=expanded?'Weitere Filter':'Weniger Filter';
    };
  }

  const baseHome230=home;
  home=function(){
    const html=baseHome230();
    const shell=document.createElement('div');shell.innerHTML=html;
    const root=shell.firstElementChild;if(!root)return html;
    root.classList.add('hoy-simple-home');
    simplifyHome(root);
    return root.outerHTML;
  };

  const baseDiscover230=discover;
  discover=function(){
    const html=baseDiscover230();
    const shell=document.createElement('div');shell.innerHTML=html;
    const root=shell.firstElementChild;if(!root)return html;
    root.classList.add('hoy-simple-discover');
    simplifyDiscover(root);
    return root.outerHTML;
  };

  const baseOpenDetail230=openDetail;
  openDetail=function(id){
    baseOpenDetail230(id);
    const p=(DATA||[]).find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p&&d)simplifyProfile(p,d);
  };

  const baseLoadCloudRestaurants230=loadCloudRestaurants;
  loadCloudRestaurants=async function(){
    await baseLoadCloudRestaurants230();
    const d=document.getElementById('detail');
    if(!d?.open)return;
    const p=(DATA||[]).find(x=>Number(x.id)===Number(d.dataset.restaurantId||0));
    if(p)simplifyProfile(p,d);
  };

  const baseWire230=wire;
  wire=function(){
    baseWire230();
    simplifyNowLabels(document);
    bindSimpleFilterToggle();
  };
})();

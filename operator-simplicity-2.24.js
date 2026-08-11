/* HOY 2.24.0 — operator cockpit simplified: one next step, calm management list, commercial depth stays secondary */
(function(){
  if(window.__hoyOperatorSimplicity240)return;
  window.__hoyOperatorSimplicity240=true;
  window.hoyOperatorSimplicityVersion='2.24.0';

  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();

  function toneFor(module){
    const pill=module?.querySelector('.hub-status');
    if(!pill)return 'neutral';
    if(pill.classList.contains('bad'))return 'bad';
    if(pill.classList.contains('warn'))return 'warn';
    if(pill.classList.contains('good'))return 'good';
    if(pill.classList.contains('locked'))return 'locked';
    return 'neutral';
  }
  function plainState(module,tone){
    const raw=clean(module?.querySelector('.hub-status')?.textContent).toLowerCase();
    if(tone==='good')return /live|aktiv|bestätigt|übernommen|freigegeben/.test(raw)?'Aktuell':'Erledigt';
    if(tone==='bad')return 'Rückfrage';
    if(tone==='warn')return /prüfung/.test(raw)?'In Prüfung':'Prüfen';
    if(tone==='locked')return 'Optional';
    if(/basis|bereit/.test(raw))return 'Vorhanden';
    if(/offen/.test(raw))return 'Offen';
    return raw?raw.replace(/^./,m=>m.toUpperCase()):'Bereit';
  }
  function moduleInfo(module){
    const title=clean(module?.querySelector('h3')?.textContent)||'Bereich';
    const note=clean(module?.querySelector(':scope > small')?.textContent)||clean(module?.querySelector('p')?.textContent);
    const button=module?.querySelector('[data-hub-action]');
    const tone=toneFor(module);
    return {
      title,
      note,
      action:button?.dataset.hubAction||'',
      actionLabel:clean(button?.textContent)||`${title} öffnen`,
      tone,
      state:plainState(module,tone)
    };
  }
  function planName(root){
    const hero=clean(root?.querySelector('.hub-hero p')?.textContent);
    const parts=hero.split('·').map(clean).filter(Boolean);
    return parts[parts.length-1]||'FREE';
  }
  function focusCopy(items){
    const bad=items.filter(x=>x.tone==='bad').length;
    const warn=items.filter(x=>x.tone==='warn').length;
    if(bad)return {title:bad===1?'Eine Rückfrage ist offen.':`${bad} Rückfragen sind offen.`,copy:'Klär zuerst diesen Punkt. Danach ist dein Profil wieder auf einem sauberen Stand.'};
    if(warn)return {title:warn===1?'Ein Punkt braucht deine Aufmerksamkeit.':`${warn} Punkte brauchen deine Aufmerksamkeit.`,copy:'HOY zeigt dir zuerst nur das, was du tatsächlich prüfen oder ergänzen solltest.'};
    return {title:'Alles Wesentliche ist aktuell.',copy:'Du musst nichts pflegen, solange sich bei deinem Betrieb nichts ändert.'};
  }
  function rowMarkup(item){
    if(!item.action)return '';
    return `<button type="button" class="operator-simple-row tone-${esc240(item.tone)}" data-hub-action="${esc240(item.action)}" aria-label="${esc240(item.title+': '+item.actionLabel)}"><span class="operator-simple-row-copy"><b>${esc240(item.title)}</b>${item.note?`<small>${esc240(item.note)}</small>`:''}</span><span class="operator-simple-row-state">${esc240(item.state)}</span><span class="operator-simple-chevron" aria-hidden="true">›</span></button>`;
  }

  function simplifyCenter(root){
    if(!root||root.dataset.operatorSimple==='1')return root;
    const modules=[...root.querySelectorAll('.hub-grid .hub-module')].map(moduleInfo).filter(x=>x.action);
    if(!modules.length)return root;

    const heroName=clean(root.querySelector('.hub-hero h2')?.textContent)||'Dein Betrieb';
    const verified=clean(root.querySelector('.hub-verified')?.textContent)||'✓ Verifiziert';
    const plan=planName(root);
    const next=root.querySelector('.hub-next[data-hub-action]');
    const nextAction=next?.dataset.hubAction||modules.find(x=>x.tone==='bad'||x.tone==='warn')?.action||'preview';
    const nextLabel=clean(next?.textContent).replace(/\s*[→›]\s*$/,'')||'Gastansicht öffnen';
    const focus=focusCopy(modules);
    const ready=modules.filter(x=>x.tone==='good').length;
    const alert=root.querySelector('.hub-alert')?.outerHTML||'';

    root.dataset.operatorSimple='1';
    root.classList.add('operator-simple-center');
    root.innerHTML=`
      <header class="operator-simple-hero">
        <div><div class="eyebrow">DEIN HOY PROFIL</div><h2>${esc240(heroName)}</h2><p>Pflege nur, was sich geändert hat. HOY hält den Rest übersichtlich.</p></div>
        <span class="operator-simple-verified">${esc240(verified)}</span>
      </header>
      <section class="operator-simple-focus" aria-label="Nächster sinnvoller Schritt">
        <small>JETZT WICHTIG</small>
        <h3>${esc240(focus.title)}</h3>
        <p>${esc240(focus.copy)}</p>
        <button type="button" data-hub-action="${esc240(nextAction)}">${esc240(nextLabel)}</button>
      </section>
      ${alert}
      <section class="operator-simple-manage">
        <div class="operator-simple-section-head"><div><small>VERWALTEN</small><h3>Dein Profil</h3></div><span>${ready?`${ready} aktuell`:'Alles an einem Ort'}</span></div>
        <div class="operator-simple-list">${modules.map(rowMarkup).join('')}</div>
      </section>
      <div class="operator-simple-actions">
        <button type="button" class="primary" data-hub-action="preview">Gastansicht öffnen</button>
        <button type="button" data-hub-action="plans">${esc240(plan)} · Tarif & Funktionen</button>
      </div>
      <p class="operator-simple-footnote">Änderungen an öffentlichen Angaben werden weiterhin sauber geprüft. Live-Funktionen bleiben dort direkt pflegbar, wo dein Tarif sie freischaltet.</p>`;
    return root;
  }

  function simplifyHTML(html){
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const root=shell.querySelector('.operator-command-center');
    if(root)simplifyCenter(root);
    return shell.innerHTML;
  }

  const basePartner240=partner;
  partner=function(){return simplifyHTML(basePartner240())};

  window.hoySimplifyOperatorCockpit=simplifyCenter;
})();

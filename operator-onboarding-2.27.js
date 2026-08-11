/* HOY 2.27.0 — three-step operator onboarding: claim first, manage after verification */
(function(){
  if(window.__hoyOperatorOnboarding270)return;
  window.__hoyOperatorOnboarding270=true;
  window.hoyOperatorOnboardingVersion='2.27.0';

  const clampStep=v=>Math.max(1,Math.min(3,Number(v)||1));
  const clean=v=>String(v??'').trim();
  const currentRestaurant=()=>claimDraft?.restaurantId?DATA.find(x=>Number(x.id)===Number(claimDraft.restaurantId)):null;
  const statusNow=()=>typeof claimVerificationStatus==='function'?claimVerificationStatus():(claimDraft?.verification?.status||'draft');

  function stepLabel(step){return ['Betrieb bestätigen','Kerndaten prüfen','Zur Prüfung senden'][step-1]||'Betrieb übernehmen'}
  function progressHTML(step){
    return `<div class="onboarding-progress" aria-label="Schritt ${step} von 3">${[1,2,3].map((n,i)=>`<div class="${n<step?'done':n===step?'active':''}"><span>${n<step?'✓':n}</span><small>${['Betrieb','Daten','Prüfung'][i]}</small></div>`).join('')}</div>`;
  }
  function trustHTML(){
    return `<div class="onboarding-trust"><span>✓ Kostenlos starten</span><span>✓ Keine Vertragsbindung</span><span>✓ Veröffentlichung erst nach Prüfung</span></div>`;
  }
  function restaurantSelector(p){
    return `<label class="onboarding-select-label"><span>Welcher Betrieb gehört zu dir?</span><select class="claim-selector" data-claim-restaurant><option value="">Restaurant wählen …</option>${DATA.map(x=>`<option value="${x.id}" ${p?.id===x.id?'selected':''}>${esc(x.name)} · ${esc(x.area)}</option>`).join('')}</select></label>`;
  }

  function onboardingStepOne(p){
    return `<section class="onboarding-copy"><div class="eyebrow">DEIN BETRIEB AUF HOY</div><h2>Ist das dein Restaurant?</h2><p class="claim-lead">Übernimm das bestehende Profil kostenlos. Wir prüfen nur, ob du den Betrieb wirklich vertreten darfst – alles Weitere kannst du später in Ruhe pflegen.</p>${trustHTML()}</section>${cloudAuthMarkup()}${restaurantSelector(p)}${p?claimRestaurantCard(p):''}<div class="claim-form onboarding-contact"><div class="claim-field"><label>Verantwortliche Person</label><input data-c-name autocomplete="name" value="${esc(claimDraft.contact?.name||'')}" placeholder="Vor- und Nachname"></div><div class="claim-field"><label>Geschäftliche E-Mail</label><input type="email" autocomplete="email" data-c-email value="${esc(claimDraft.contact?.email||cloud.user?.email||'')}" placeholder="name@restaurant.es"><small>Darüber können wir Rückfragen zur Verifizierung klären.</small></div><div class="claim-field"><label>Deine Rolle</label><select data-c-role>${['Inhaber/in','Geschäftsführung','Marketing / Verwaltung','Bevollmächtigte Person'].map(x=>`<option ${claimDraft.contact?.role===x?'selected':''}>${x}</option>`).join('')}</select></div><label class="claim-check onboarding-authorized"><input type="checkbox" data-c-authorized ${claimDraft.verified?'checked':''}><span>Ich bin berechtigt, diesen Betrieb auf HOY zu verwalten.</span></label></div><div class="onboarding-quiet-note">Die Bestätigung hier ist noch keine öffentliche Verifizierung. HOY prüft die Geschäftsberechtigung erst nach dem Absenden.</div>`;
  }

  function onboardingStepTwo(p){
    return `<section class="onboarding-copy"><div class="eyebrow">FAST GESCHAFFT</div><h2>Stimmen die wichtigsten Angaben?</h2><p class="claim-lead">Wir haben das Profil bereits vorbereitet. Ändere nur etwas, wenn es eindeutig falsch oder veraltet ist. Services, Bilder, Speisekarte und Specials kommen später.</p></section>${claimRestaurantCard(p)}<div class="onboarding-prefill"><div><b>HOY hat vorgearbeitet.</b><span>Du musst das Profil nicht neu anlegen.</span></div><span class="onboarding-prefill-badge">VORBEFÜLLT</span></div><div class="claim-form onboarding-core"><div class="claim-field"><label>Adresse</label><input data-p-address autocomplete="street-address" value="${esc(profileValue(p,'address'))}"></div><div class="onboarding-two"><div class="claim-field"><label>Telefon</label><input data-p-phone inputmode="tel" value="${esc(profileValue(p,'phone'))}"></div><div class="claim-field"><label>Offizielle Website</label><input data-p-website inputmode="url" value="${esc(profileValue(p,'website'))}"></div></div><details class="onboarding-optional" ${!profileValue(p,'hours')||!profileValue(p,'description')?'open':''}><summary>Weitere Basisangaben prüfen</summary><div class="onboarding-optional-body"><div class="claim-field"><label>Öffnungszeiten · Basisangabe</label><textarea data-p-hours>${esc(profileValue(p,'hours'))}</textarea><small>Nach der Verifizierung kannst du Live-Zeiten und Sondertage komfortabler pflegen.</small></div><div class="claim-field"><label>Kurzbeschreibung</label><textarea data-p-description>${esc(profileValue(p,'description'))}</textarea></div></div></details></div><div class="onboarding-quiet-note">Noch nicht nötig: Bilder freigeben, Services bestätigen, Speisekarte einreichen oder ein Angebot bauen. Das führt HOY dich nach der Verifizierung Schritt für Schritt durch.</div>`;
  }

  function valueOrDash(v){return clean(v)||'Noch nicht angegeben'}
  function onboardingStepThree(p){
    const c=claimDraft.contact||{};const profile=claimDraft.profile||{};
    return `<section class="onboarding-copy"><div class="eyebrow">BEREIT ZUR PRÜFUNG</div><h2>Das war’s schon.</h2><p class="claim-lead">Mit dem Absenden beantragst du nur die kostenlose Übernahme des Profils. Es wird kein Abo abgeschlossen und nichts kostenpflichtig aktiviert.</p>${trustHTML()}</section>${claimRestaurantCard(p)}<div class="onboarding-review"><div class="onboarding-review-row"><span>Verantwortlich</span><b>${esc(valueOrDash(c.name))}</b></div><div class="onboarding-review-row"><span>E-Mail</span><b>${esc(valueOrDash(c.email))}</b></div><div class="onboarding-review-row"><span>Adresse</span><b>${esc(valueOrDash(profile.address||p.address))}</b></div><div class="onboarding-review-row"><span>Telefon</span><b>${esc(valueOrDash(profile.phone||p.phone))}</b></div></div><div class="onboarding-after"><small>DANACH PASSIERT</small><div><span>1</span><p><b>HOY prüft die Berechtigung.</b><br>Bis dahin musst du nichts weiter tun.</p></div><div><span>2</span><p><b>Das Profil erhält den Betreiberstatus.</b><br>Gäste erkennen bestätigte Angaben klar.</p></div><div><span>3</span><p><b>HOY zeigt dir genau einen nächsten Schritt.</b><br>Zum Beispiel Öffnungszeiten prüfen – nicht zehn Aufgaben auf einmal.</p></div></div>${cloud.user?'':'<div class="onboarding-login-needed"><b>Zum Absenden noch anmelden.</b><span>Dein Entwurf bleibt erhalten.</span><button type="button" data-auth-open>Anmelden</button></div>'}`;
  }

  function pendingScreen(p){
    return `<div class="onboarding-state"><div class="onboarding-state-icon pending">✓</div><div class="eyebrow">ERFOLGREICH EINGEREICHT</div><h2>HOY ist jetzt am Zug.</h2><p>Der Antrag für <b>${esc(p.name)}</b> ist angekommen. Wir prüfen die Geschäftsberechtigung. Bis dahin musst du nichts weiter einrichten.</p><div class="onboarding-status-card"><span class="pulse"></span><div><b>Verifizierung läuft</b><small>Wir melden uns bei Rückfragen über ${esc(claimDraft.contact?.email||cloud.user?.email||'deine geschäftliche E-Mail')}.</small></div></div><div class="onboarding-after compact"><small>WENN BESTÄTIGT</small><div><span>1</span><p>Dein Profil wird als Betreiberprofil gekennzeichnet.</p></div><div><span>2</span><p>HOY zeigt dir nur den wichtigsten nächsten Schritt.</p></div><div><span>3</span><p>PRO/BUSINESS entscheidest du später – erst wenn du den Nutzen kennst.</p></div></div><div class="claim-actions onboarding-state-actions"><button class="next" data-onboarding-partner>Zum Partnerbereich</button></div></div>`;
  }

  function verifiedScreen(p){
    return `<div class="onboarding-state"><div class="onboarding-state-icon verified">✓</div><div class="eyebrow">BETREIBER BESTÄTIGT</div><h2>Dein HOY-Profil gehört jetzt dir.</h2><p><b>${esc(p.name)}</b> ist als Betreiberprofil bestätigt. Ab jetzt führt dich HOY im Partnerbereich immer zum sinnvollsten nächsten Schritt.</p><div class="onboarding-success-card"><small>ERSTER SCHRITT</small><b>Öffnungszeiten und Gastansicht prüfen.</b><span>Alles andere kann warten.</span></div><div class="claim-actions onboarding-state-actions"><button class="next" data-onboarding-partner>Zum HOY-Profil</button></div></div>`;
  }

  function wireExit(d){
    d.querySelectorAll('[data-onboarding-partner],[data-claim-close]').forEach(x=>x.onclick=()=>{d.close();state.view='partner';render()});
  }

  renderClaimFlow=function(){
    const d=document.getElementById('claimFlow');if(!d?.open)return;
    d.classList.add('operator-onboarding-dialog');
    const p=currentRestaurant();
    if(p&&typeof isClaimed==='function'&&isClaimed(p)){d.innerHTML=verifiedScreen(p);wireExit(d);return}
    if(p&&statusNow()==='pending'){d.innerHTML=pendingScreen(p);wireExit(d);return}

    const step=clampStep(claimDraft.step);
    if(claimDraft.step!==step){claimDraft.step=step;saveClaim()}
    const content=step===1?onboardingStepOne(p):!p?onboardingStepOne(null):step===2?onboardingStepTwo(p):onboardingStepThree(p);
    const final=step===3;
    d.innerHTML=`<div class="claim-flow onboarding-flow"><div class="claim-head"><button class="round" data-claim-close aria-label="Schließen">${icons.back}</button><span class="claim-step">${esc(stepLabel(step))}</span><span class="onboarding-step-count">${step}/3</span></div>${progressHTML(step)}${content}<div class="claim-actions onboarding-actions">${step>1?'<button class="back" data-claim-back>Zurück</button>':'<button class="back" data-claim-close>Abbrechen</button>'}<button class="next ${final?'orange':''}" data-claim-next>${final?'Kostenlos zur Prüfung senden':'Weiter'}</button></div></div>`;

    d.querySelectorAll('[data-claim-close]').forEach(x=>x.onclick=()=>{if(step<=2)captureClaimStep(step,p||{});d.close();render()});
    d.querySelector('[data-claim-back]')?.addEventListener('click',()=>{if(step<=2)captureClaimStep(step,p||{});claimDraft.step=step-1;saveClaim();renderClaimFlow()});
    d.querySelector('[data-claim-restaurant]')?.addEventListener('change',e=>{
      const id=Number(e.target.value);if(!id){claimDraft.restaurantId=null;saveClaim();renderClaimFlow();return}
      const np=DATA.find(x=>Number(x.id)===id);if(!np)return;
      claimDraft.restaurantId=id;
      if(!readAudit().some(x=>x.action==='claim_started'&&Number(x.restaurantId)===id))addAudit('claim_started',id);
      claimDraft.profile={name:np.name,address:np.address,phone:np.phone,website:cleanSite(np)||'',hours:np.hours,description:np.description};
      claimDraft.services={reservation:serviceState(np.reservation),pickup:serviceState(np.pickup),delivery:serviceState(np.delivery)};
      claimDraft.plan='free';claimDraft.requestedPlan='free';
      saveClaim();renderClaimFlow();
    });
    d.querySelectorAll('[data-auth-open]').forEach(x=>x.onclick=()=>openAuthFlow('login'));
    d.querySelectorAll('[data-auth-out]').forEach(x=>x.onclick=authLogout);

    d.querySelector('[data-claim-next]').onclick=async()=>{
      if(step<=2)captureClaimStep(step,p||{});
      if(step===1){
        if(!claimDraft.restaurantId){toast('Bitte zuerst deinen Betrieb wählen');return}
        if(!clean(claimDraft.contact?.name)||!clean(claimDraft.contact?.email)||!claimDraft.verified){toast('Bitte Kontakt und Berechtigung bestätigen');return}
      }
      if(step===2){
        if(!clean(claimDraft.profile?.address)){toast('Bitte die Adresse prüfen');return}
      }
      if(step<3){claimDraft.step=step+1;saveClaim();renderClaimFlow();return}
      if(!cloud.user){saveClaim();toast('Zum Absenden bitte anmelden');openAuthFlow('login');return}

      const btn=d.querySelector('[data-claim-next]');btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Wird sicher eingereicht';
      try{
        claimDraft.plan='free';claimDraft.requestedPlan='free';
        const result=await submitClaimCloud();
        claimDraft.claimed=false;
        claimDraft.verified=false;
        claimDraft.activePlan='free';
        claimDraft.requestedPlan='free';
        claimDraft.step=3;
        claimDraft.verification={...(claimDraft.verification||{}),status:result?.status||'pending',submittedAt:result?.claim?.submitted_at||new Date().toISOString(),verifiedAt:null,claimId:result?.claim?.id||null};
        addAudit('claim_submitted',claimDraft.restaurantId,result?.reused?'Bestehender Antrag geladen':'Zur HOY-Prüfung gesendet');
        saveClaim();
        toast(result?.reused?'Offener Antrag bereits vorhanden':'Erfolgreich zur Prüfung gesendet');
        renderClaimFlow();
      }catch(err){
        btn.disabled=false;btn.textContent='Kostenlos zur Prüfung senden';toast(err?.message||'Antrag konnte nicht gesendet werden');
      }
    };
  };

  setClaimStep=function(step){claimDraft.step=clampStep(step);saveClaim();renderClaimFlow()};
})();

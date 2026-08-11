/* HOY 2.27.0 — align claim entry, partner landing and first verified success */
(function(){
  if(window.__hoyOperatorOnboardingEntry270)return;
  window.__hoyOperatorOnboardingEntry270=true;

  const welcomeKey=p=>`hoy-onboarding-welcome-${Number(p?.id)||0}`;
  const isVerified=p=>!!(p&&typeof isClaimed==='function'&&isClaimed(p));

  const baseOpenDetail270=openDetail;
  openDetail=function(id){
    baseOpenDetail270(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');const claim=d?.querySelector('.claim');
    if(!p||!claim)return;
    if(isVerified(p)){claim.remove();return}
    claim.classList.add('onboarding-claim-entry');
    const h=claim.querySelector('h3');const copy=claim.querySelector('p');const button=claim.querySelector('[data-claim]');
    if(h)h.textContent='Betreibst du dieses Restaurant?';
    if(copy)copy.textContent='Übernimm das bereits vorbereitete HOY-Profil kostenlos. Drei kurze Schritte, keine Vertragsbindung.';
    if(button)button.textContent='Kostenlos in 3 Schritten übernehmen';
  };

  function preclaimSteps(){
    return `<div class="onboarding-partner-steps"><div><span>1</span><b>Betrieb bestätigen</b><small>Kontakt und Berechtigung</small></div><div><span>2</span><b>Kerndaten prüfen</b><small>HOY hat vorbefüllt</small></div><div><span>3</span><b>Zur Prüfung senden</b><small>Kein Abo, keine Zahlung</small></div></div>`;
  }
  function verifiedWelcome(p){
    return `<section class="onboarding-verified-welcome"><div class="onboarding-welcome-mark">✓</div><div class="eyebrow">GESCHAFFT</div><h2>Dein Profil ist bestätigt.</h2><p>${esc(p.name)} gehört jetzt zu deinem HOY-Betreiberkonto. Schau zuerst kurz durch die Gastansicht – danach zeigt dir HOY nur den wichtigsten nächsten Schritt.</p><div class="onboarding-welcome-actions"><button type="button" class="primary" data-hub-action="preview">Gastansicht ansehen</button><button type="button" data-hub-action="profile">Profil prüfen</button></div><button type="button" class="onboarding-welcome-dismiss" data-onboarding-welcome-dismiss>Später</button></section>`;
  }

  const basePartner270=partner;
  partner=function(){
    let html=basePartner270();const p=claimedRestaurant();const verified=isVerified(p);
    if(verified){
      if(!sessionStorage.getItem(welcomeKey(p))){
        html=html.replace('<section class="operator-command-center',verifiedWelcome(p)+'<section class="operator-command-center');
      }
      return html;
    }
    html=html
      .replace('Free bleibt nützlich. Pro und Business verkaufen Aktualität, Reichweite und Marketingfunktionen.','Übernimm dein bestehendes Restaurantprofil kostenlos. HOY prüft die Berechtigung; Ausbau und Tarife kommen erst danach.')
      .replace('Erst sehen. Dann investieren.','Erst übernehmen. Dann verbessern.')
      .replace('Baue dein Profil fertig auf und sieh Free, Pro und Business direkt mit deinem eigenen Restaurant.','Drei kurze Schritte bis zur Prüfung. Keine Zahlung, kein Abo und kein mühsames Neu-Anlegen des Profils.')
      .replace('Übernimm das kostenlose Profil, bestätige Daten, Services und Bildrechte – Angebote kannst du anschließend als Pro-Vorschau bauen.','Übernimm das kostenlose Profil. Nach der Verifizierung führt HOY dich Schritt für Schritt durch Öffnungszeiten, Bilder, Speisekarte und Services.')
      .replace('<div class="real-metrics">',preclaimSteps()+'<div class="real-metrics onboarding-preclaim-hidden">')
      .replace('<div class="metric-note">','<div class="metric-note onboarding-preclaim-hidden">')
      .replace('<div class="plans">','<div class="plans onboarding-preclaim-hidden">')
      .replace('<div class="system-card">','<div class="system-card onboarding-preclaim-hidden">')
      .replace('<div class="audit-card">','<div class="audit-card onboarding-preclaim-hidden">');
    return html;
  };

  const baseWire270=wire;
  wire=function(){
    baseWire270();
    const p=claimedRestaurant();if(!isVerified(p))return;
    const key=welcomeKey(p);
    document.querySelectorAll('.onboarding-verified-welcome [data-hub-action]').forEach(b=>b.addEventListener('click',()=>sessionStorage.setItem(key,'1'),{once:true}));
    document.querySelectorAll('[data-onboarding-welcome-dismiss]').forEach(b=>b.onclick=()=>{sessionStorage.setItem(key,'1');b.closest('.onboarding-verified-welcome')?.remove()});
  };
})();

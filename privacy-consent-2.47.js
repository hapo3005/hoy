/* HOY 2.47.1 — canonical explicit analytics consent, withdrawal and layered privacy notice */
(function(){
  const CONSENT_KEY='hoy-privacy-analytics-consent-v1';
  const PREF_KEY='hoy-privacy-preference-v1';
  const cfg=window.HOY_PRIVACY_CONFIG||{};
  const productionHost=()=>typeof window.hoyPrivacyProductionHost247==='function'?window.hoyPrivacyProductionHost247():false;
  const productionReady=()=>typeof window.hoyPrivacyProductionReady247==='function'?window.hoyPrivacyProductionReady247():false;
  const qaPreview=()=>!productionHost()&&new URLSearchParams(location.search).get('privacy_qa')==='1';
  const noticeReady=()=>productionReady()||qaPreview();

  const COPY={
    de:{launcher:'Datenschutz',kicker:'DATENSCHUTZ',title:'Du entscheidest über Analytics.',lead:'HOY nutzt optionale Nutzungsanalyse nur nach deiner ausdrücklichen Zustimmung. Ablehnen ist genauso einfach wie zustimmen.',accept:'Analytics zustimmen',reject:'Analytics ablehnen',more:'Mehr erfahren & Einstellungen',details:'Datenschutz & Analytics',close:'Schließen',current:'Aktuelle Einstellung',granted:'Analytics zugestimmt',rejected:'Analytics abgelehnt',unknown:'Noch keine Auswahl',purpose:'Zweck',purposeText:'Verstehen, welche HOY-Funktionen genutzt werden, damit Produktqualität und regionale Relevanz verbessert werden können.',data:'Daten',dataText:'Pseudonyme Browser-/Sitzungskennung, Ereignistyp, Zeitpunkt, Ansicht/Sprache und begrenzte technische Kontextdaten. Freitext, Name, E-Mail, Telefon und Adresse werden aus Analytics-Metadaten herausgefiltert.',recipient:'Empfänger / Infrastruktur',recipientText:'HOY verarbeitet die Ereignisse in der HOY-Supabase-Infrastruktur. Weitere Empfänger und Transfers werden vor Freigabe in der vollständigen Datenschutzerklärung dokumentiert.',retention:'Speicherdauer',rights:'Deine Wahl',rightsText:'Du kannst Analytics jederzeit hier ablehnen. Die Ablehnung stoppt neue Analytics-Ereignisse und entfernt lokale Analytics-Kennungen/Verläufe auf diesem Gerät.',draftTitle:'Analytics bleibt deaktiviert.',draftText:'Die technische Consent-Lösung ist vorbereitet. Analytics wird in Production erst freigeschaltet, wenn Verantwortlicher, Datenschutzkontakt und Aufbewahrungsfrist final dokumentiert und freigegeben sind.',saveReject:'Ablehnen / widerrufen',saveAccept:'Zustimmen',noticeVersion:'Hinweisversion'},
    en:{launcher:'Privacy',kicker:'PRIVACY',title:'You control analytics.',lead:'HOY uses optional usage analytics only after your explicit consent. Rejecting is as easy as accepting.',accept:'Accept analytics',reject:'Reject analytics',more:'Learn more & settings',details:'Privacy & analytics',close:'Close',current:'Current setting',granted:'Analytics accepted',rejected:'Analytics rejected',unknown:'No choice yet',purpose:'Purpose',purposeText:'Understand which HOY features are used so product quality and regional relevance can be improved.',data:'Data',dataText:'Pseudonymous browser/session identifier, event type, timestamp, view/language and limited technical context. Free text, name, email, phone and address are filtered from analytics metadata.',recipient:'Recipients / infrastructure',recipientText:'HOY processes events in the HOY Supabase infrastructure. Further recipients and transfers will be documented before release.',retention:'Retention',rights:'Your choice',rightsText:'You can reject analytics here at any time. Rejection stops new analytics events and removes local analytics identifiers/history on this device.',draftTitle:'Analytics remains disabled.',draftText:'The consent system is technically prepared. Production analytics stays disabled until controller, privacy contact and retention period are finalized and approved.',saveReject:'Reject / withdraw',saveAccept:'Accept',noticeVersion:'Notice version'},
    es:{launcher:'Privacidad',kicker:'PRIVACIDAD',title:'Tú decides sobre Analytics.',lead:'HOY utiliza analítica opcional solo después de tu consentimiento expreso. Rechazar es tan fácil como aceptar.',accept:'Aceptar Analytics',reject:'Rechazar Analytics',more:'Más información y ajustes',details:'Privacidad y Analytics',close:'Cerrar',current:'Configuración actual',granted:'Analytics aceptado',rejected:'Analytics rechazado',unknown:'Sin elección',purpose:'Finalidad',purposeText:'Entender qué funciones de HOY se utilizan para mejorar la calidad del producto y la relevancia regional.',data:'Datos',dataText:'Identificador seudónimo de navegador/sesión, tipo de evento, fecha/hora, vista/idioma y contexto técnico limitado. Texto libre, nombre, email, teléfono y dirección se filtran de los metadatos de Analytics.',recipient:'Destinatarios / infraestructura',recipientText:'HOY procesa los eventos en la infraestructura Supabase de HOY. Otros destinatarios y transferencias se documentarán antes de la activación.',retention:'Conservación',rights:'Tu elección',rightsText:'Puedes rechazar Analytics aquí en cualquier momento. El rechazo detiene nuevos eventos y elimina los identificadores/historial local de Analytics en este dispositivo.',draftTitle:'Analytics permanece desactivado.',draftText:'El sistema de consentimiento está preparado técnicamente. Analytics en producción seguirá desactivado hasta completar y aprobar responsable, contacto de privacidad y plazo de conservación.',saveReject:'Rechazar / retirar',saveAccept:'Aceptar',noticeVersion:'Versión del aviso'}
  };

  function lang(){
    try{if(typeof state!=='undefined'&&COPY[state.lang])return state.lang}catch{}
    const l=String(document.documentElement.lang||navigator.language||'de').slice(0,2).toLowerCase();
    return COPY[l]?l:'de';
  }
  function t(){return COPY[lang()]}
  function readPref(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'null')}catch{return null}}
  function currentChoice(){
    const pref=readPref();
    if(!pref||pref.noticeVersion!==cfg.noticeVersion)return 'unknown';
    return pref.choice==='granted'?'granted':pref.choice==='rejected'?'rejected':'unknown';
  }
  function storeChoice(choice,source){
    try{
      localStorage.setItem(CONSENT_KEY,choice);
      localStorage.setItem(PREF_KEY,JSON.stringify({choice,noticeVersion:cfg.noticeVersion||'unknown',decidedAt:new Date().toISOString(),source:String(source||'privacy_ui').slice(0,40)}));
    }catch{}
  }
  function clearAnalytics(){
    if(typeof window.hoyClearProductionAnalyticsStorage181==='function')window.hoyClearProductionAnalyticsStorage181(true);
    try{
      ['hoy-anonymous-id-v1','hoy-proof-pilot-code-v1','hoy-proof-pilot-enrolled-v1','hoy-analytics-v1'].forEach(k=>localStorage.removeItem(k));
      sessionStorage.removeItem('hoy-session-id-v1');
    }catch{}
  }
  function announce(message){const n=document.querySelector('.hoy-privacy-live');if(n)n.textContent=message}
  function hideBanner(){const b=document.querySelector('.hoy-privacy-banner');if(b)b.hidden=true}
  function decide(choice,source){
    if(choice==='granted'&&!noticeReady())return;
    storeChoice(choice,source);
    if(choice!=='granted')clearAnalytics();
    hideBanner();
    renderDialog();
    announce(choice==='granted'?t().granted:t().rejected);
    window.dispatchEvent(new CustomEvent('hoy:privacy-choice',{detail:{choice,noticeVersion:cfg.noticeVersion||'unknown'}}));
  }
  function statusText(){const c=currentChoice();return c==='granted'?t().granted:c==='rejected'?t().rejected:t().unknown}
  function retentionText(){
    return productionReady()&&Number.isInteger(cfg.analyticsRetentionDays)?`${cfg.analyticsRetentionDays} ${lang()==='de'?'Tage':lang()==='es'?'días':'days'}`:(lang()==='de'?'Noch nicht freigegeben; Analytics bleibt bis zur Freigabe deaktiviert.':lang()==='es'?'Aún no aprobado; Analytics permanece desactivado.':'Not yet approved; analytics remains disabled.');
  }
  function controllerText(){
    if(productionReady())return `${cfg.controllerName} · ${cfg.controllerAddress} · ${cfg.privacyContact}`;
    return t().draftText;
  }
  function renderDialog(){
    const d=document.getElementById('privacyFlow247');if(!d)return;
    const c=t();const ready=noticeReady();
    d.innerHTML=`<div class="hoy-privacy-dialog-inner"><div class="hoy-privacy-dialog-head"><div><span class="hoy-privacy-kicker">${c.kicker}</span><h2>${c.details}</h2></div><button class="hoy-privacy-close" type="button" data-privacy-close aria-label="${c.close}">×</button></div><div class="hoy-privacy-status ${productionReady()?'good':'warn'}"><b>${productionReady()?c.current+': '+statusText():c.draftTitle}</b><p>${productionReady()?controllerText():c.draftText}</p></div><section class="hoy-privacy-section"><h3>${c.purpose}</h3><p>${c.purposeText}</p></section><section class="hoy-privacy-section"><h3>${c.data}</h3><p>${c.dataText}</p></section><section class="hoy-privacy-section"><h3>${c.recipient}</h3><p>${c.recipientText}</p></section><section class="hoy-privacy-section"><h3>${c.retention}</h3><p>${retentionText()}</p></section><section class="hoy-privacy-section"><h3>${c.rights}</h3><p>${c.rightsText}</p></section>${ready?`<div class="hoy-privacy-manage"><button type="button" class="hoy-privacy-choice" data-privacy-reject>${c.saveReject}</button><button type="button" class="hoy-privacy-choice" data-privacy-accept>${c.saveAccept}</button></div>`:''}<p class="hoy-privacy-meta">${c.noticeVersion}: ${String(cfg.noticeVersion||'draft')}</p></div>`;
    d.querySelector('[data-privacy-close]').onclick=()=>d.close();
    d.querySelector('[data-privacy-reject]')?.addEventListener('click',()=>{decide('rejected','settings');d.close()});
    d.querySelector('[data-privacy-accept]')?.addEventListener('click',()=>{decide('granted','settings');d.close()});
  }
  function mount(){
    if(document.getElementById('privacyFlow247'))return;
    const c=t();
    const banner=document.createElement('section');
    banner.className='hoy-privacy-banner';banner.setAttribute('role','region');banner.setAttribute('aria-label',c.details);
    banner.innerHTML=`<span class="hoy-privacy-kicker">${c.kicker}</span><h2>${c.title}</h2><p>${c.lead}</p><div class="hoy-privacy-actions"><button type="button" class="hoy-privacy-choice" data-privacy-reject>${c.reject}</button><button type="button" class="hoy-privacy-choice" data-privacy-accept>${c.accept}</button><button type="button" class="hoy-privacy-more" data-privacy-more>${c.more}</button></div>`;
    banner.hidden=!(noticeReady()&&currentChoice()==='unknown');
    const launcher=document.createElement('button');launcher.type='button';launcher.className='hoy-privacy-launcher';launcher.textContent=c.launcher;launcher.setAttribute('aria-haspopup','dialog');
    const dialog=document.createElement('dialog');dialog.id='privacyFlow247';dialog.className='hoy-privacy-dialog';
    const live=document.createElement('div');live.className='hoy-privacy-live';live.setAttribute('aria-live','polite');
    document.body.append(banner,launcher,dialog,live);
    renderDialog();
    banner.querySelector('[data-privacy-reject]').onclick=()=>decide('rejected','banner');
    banner.querySelector('[data-privacy-accept]').onclick=()=>decide('granted','banner');
    banner.querySelector('[data-privacy-more]').onclick=()=>{renderDialog();dialog.showModal()};
    launcher.onclick=()=>{renderDialog();dialog.showModal()};
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    window.hoyPrivacyOpen247=()=>{renderDialog();dialog.showModal()};
    window.hoyPrivacyChoice247=currentChoice;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* HOY 2.29.1 — fail-closed taxi jurisdiction routing + runtime release gates */
(function(){
  if(window.__hoyMobility229)return;
  window.__hoyMobility229=true;
  window.hoyMobilityVersion='2.29.1';

  const esc229=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const taxiIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 16h14l-1.5-6.5A2 2 0 0 0 15.55 8h-7.1A2 2 0 0 0 6.5 9.5L5 16Z"/><path d="M7.5 8 9 5h6l1.5 3M5 13H3.8a.8.8 0 0 0-.8.8V16h2M19 13h1.2a.8.8 0 0 1 .8.8V16h-2"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/><path d="M6 18v1M18 18v1"/></svg>';
  const pinIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const shieldIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>';

  const runtime={loaded:false,routingEnabled:false,consumerVisible:false,previewVisible:false,statusNote:''};
  let runtimePromise=null;
  let activeProfileId=null;
  const previewRequested=()=>new URLSearchParams(location.search).get('mobility')==='preview';

  function track(type,p,meta={}){
    try{if(typeof trackEvent==='function')trackEvent(type,p?.id||null,meta)}catch{}
  }

  async function loadRuntime({force=false}={}){
    if(!force&&runtime.loaded)return runtime;
    if(!force&&runtimePromise)return runtimePromise;
    if(!sb)return runtime;
    runtimePromise=(async()=>{
      try{
        const {data,error}=await sb.from('mobility_runtime_config').select('routing_enabled,consumer_visible,preview_visible,status_note').eq('id',1).maybeSingle();
        if(error||!data)throw error||new Error('missing Mobility runtime config');
        runtime.routingEnabled=data.routing_enabled===true;
        runtime.consumerVisible=data.consumer_visible===true;
        runtime.previewVisible=data.preview_visible===true;
        runtime.statusNote=String(data.status_note||'');
      }catch(err){
        console.warn('HOY Mobility runtime config unavailable',err);
        runtime.routingEnabled=false;
        runtime.consumerVisible=false;
        runtime.previewVisible=false;
        runtime.statusNote='';
      }finally{
        runtime.loaded=true;
        runtimePromise=null;
      }
      return runtime;
    })();
    return runtimePromise;
  }

  function uiAllowed(){
    return runtime.routingEnabled&&(runtime.consumerVisible||(runtime.previewVisible&&previewRequested()));
  }

  function ensureDialog(){
    let d=document.getElementById('mobilityFlow');
    if(d)return d;
    d=document.createElement('dialog');
    d.id='mobilityFlow';
    d.className='dialog mobility229-dialog';
    document.body.appendChild(d);
    d.addEventListener('click',e=>{if(e.target===d)d.close()});
    return d;
  }

  function panelMarkup(){
    const preview=previewRequested()&&!runtime.consumerVisible?'<span style="position:absolute;right:12px;top:10px;z-index:2;padding:4px 7px;border-radius:999px;background:#fff4cf;color:#795d16;font-size:8px;font-weight:900;letter-spacing:.12em">PREVIEW</span>':'';
    return `<section class="mobility229-card" data-mobility229-card>
      ${preview}
      <div class="mobility229-icon">${taxiIcon}</div>
      <div class="mobility229-card-copy">
        <small>HOY MOBILITY</small>
        <h3>Das richtige Taxi. Ohne Bezirksrätsel.</h3>
        <p>HOY prüft den Abholort und wählt nur dann einen Taxikontakt, wenn die Zuständigkeit eindeutig ist.</p>
      </div>
      <button type="button" data-mobility229-open>Taxi passend finden <span>→</span></button>
    </section>`;
  }

  async function decorateProfile(id){
    const numericId=Number(id);
    const p=(DATA||[]).find(x=>Number(x.id)===numericId);
    const d=document.getElementById('detail');
    if(!p||!d)return;
    d.querySelector('[data-mobility229-card]')?.remove();
    await loadRuntime();
    if(activeProfileId!==numericId||!d.open||!uiAllowed())return;
    const actions=d.querySelector('.actions');
    if(!actions)return;
    actions.insertAdjacentHTML('afterend',panelMarkup());
    const button=d.querySelector('[data-mobility229-open]');
    if(button)button.onclick=()=>{void openMobility(p)};
    track('mobility_cta_viewed',p,{surface:'profile',preview:previewRequested()&&!runtime.consumerVisible});
  }

  function flowShell(title,body,{back=false}={}){
    return `<div class="mobility229-flow">
      <div class="mobility229-head">
        <button type="button" class="round" data-mobility229-${back?'back':'close'}>${back?(typeof icons!=='undefined'&&icons.back?icons.back:'←'):'×'}</button>
        <span>HOY MOBILITY · TAXI</span>
      </div>
      <h2>${title}</h2>
      ${body}
    </div>`;
  }

  function bindClose(d){
    d.querySelector('[data-mobility229-close]')?.addEventListener('click',()=>d.close());
  }

  async function openMobility(p){
    await loadRuntime({force:true});
    if(!uiAllowed()){
      document.querySelector('[data-mobility229-card]')?.remove();
      return;
    }
    const d=ensureDialog();
    track('mobility_cta_clicked',p,{surface:'profile',preview:previewRequested()&&!runtime.consumerVisible});
    renderChooser(d,p);
    if(!d.open)d.showModal();
  }

  function renderChooser(d,p){
    const hasVenueCoords=Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude));
    const body=`<p class="mobility229-lead">Für das richtige Taxi zählt der <strong>Abholort</strong>. Wähle, wo die Fahrt beginnen soll.</p>
      <div class="mobility229-destination"><span>${pinIcon}</span><div><small>GEÖFFNETES ZIEL</small><b>${esc229(p.name)}</b><em>${esc229(p.area||'')}</em></div></div>
      <div class="mobility229-choices">
        <button type="button" class="mobility229-choice primary" data-mobility229-direction="to">
          <span class="mobility229-choice-icon">${pinIcon}</span>
          <div><b>Zu diesem Ort</b><small>Mein aktueller Standort ist der Abholort.</small></div><i>→</i>
        </button>
        <button type="button" class="mobility229-choice" data-mobility229-direction="from" ${hasVenueCoords?'':'disabled'}>
          <span class="mobility229-choice-icon">${taxiIcon}</span>
          <div><b>Von diesem Ort</b><small>${hasVenueCoords?'Dieser Betrieb ist der Abholort.':'Noch keine verifizierten Koordinaten für diesen Ort.'}</small></div><i>→</i>
        </button>
      </div>
      <div class="mobility229-trust">${shieldIcon}<p><b>Fail closed.</b> Ist Cartagena/San Javier nicht eindeutig, zeigt HOY bewusst keinen Anrufbutton.</p></div>`;
    d.innerHTML=flowShell('Wo soll das Taxi dich abholen?',body);
    bindClose(d);
    d.querySelector('[data-mobility229-direction="to"]')?.addEventListener('click',()=>resolveCurrentLocation(d,p));
    d.querySelector('[data-mobility229-direction="from"]')?.addEventListener('click',()=>{
      if(!hasVenueCoords)return;
      resolvePoint(d,p,{latitude:Number(p.latitude),longitude:Number(p.longitude),accuracy:0,mode:'venue'},'from');
    });
  }

  function renderLoading(d,p,label){
    const body=`<div class="mobility229-loading"><span class="mobility229-spinner"></span><b>Zuständigkeit wird geprüft …</b><p>${esc229(label)}</p></div>
      <div class="mobility229-checklist"><span class="active">1</span><p>Abholort bestimmen</p><span>2</span><p>Taxi-Gebiet prüfen</p><span>3</span><p>Verifizierten Anbieter freigeben</p></div>`;
    d.innerHTML=flowShell('HOY findet das passende Taxi.',body,{back:true});
    d.querySelector('[data-mobility229-back]')?.addEventListener('click',()=>renderChooser(d,p));
  }

  function resolveCurrentLocation(d,p){
    if(!navigator.geolocation){
      renderFailure(d,p,{status:'uncertain',code:'geolocation_unavailable'},'to');
      return;
    }
    renderLoading(d,p,'Dein Standort wird mit hoher Genauigkeit abgefragt.');
    navigator.geolocation.getCurrentPosition(
      pos=>{
        const accuracy=Math.round(pos.coords.accuracy||0);
        track('mobility_location_resolved',p,{direction:'to',accuracy_bucket:accuracy<=20?'0-20':accuracy<=50?'21-50':accuracy<=120?'51-120':'120+'});
        resolvePoint(d,p,{latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy,mode:'gps'},'to');
      },
      err=>renderFailure(d,p,{status:'uncertain',code:err?.code===1?'geolocation_denied':err?.code===3?'geolocation_timeout':'geolocation_failed'},'to'),
      {enableHighAccuracy:true,timeout:9000,maximumAge:15000}
    );
  }

  async function resolvePoint(d,p,point,direction){
    renderLoading(d,p,direction==='to'?'Abholort wird gegen die Taxi-Gebiete geprüft.':`${p.name} wird als Abholort geprüft.`);
    if(!sb){renderFailure(d,p,{status:'uncertain',code:'mobility_service_unavailable'},direction);return}
    try{
      const {data,error}=await sb.functions.invoke('mobility-resolve',{body:point});
      if(error)throw error;
      if(data?.status==='resolved'){
        track('mobility_area_resolved',p,{direction,municipality:data.municipality||'',status:'resolved'});
        track('mobility_provider_shown',p,{direction,provider_slug:data.provider?.slug||'',municipality:data.municipality||''});
        renderResolved(d,p,data,direction);
      }else{
        track('mobility_area_resolved',p,{direction,status:data?.status||'uncertain',code:data?.code||'unknown'});
        renderFailure(d,p,data||{status:'uncertain',code:'empty_result'},direction);
      }
    }catch(err){
      console.warn('HOY Mobility resolve failed',err);
      renderFailure(d,p,{status:'uncertain',code:'mobility_service_unavailable'},direction);
    }
  }

  function pickupLabel(p,direction,data){
    if(direction==='from')return `${p.name} · ${data.municipality}`;
    return `Dein Standort · ${data.municipality}`;
  }

  function renderResolved(d,p,data,direction){
    const provider=data.provider||{};
    const phone=String(provider.phone_e164||'').replace(/[^+\d]/g,'');
    if(!phone){renderFailure(d,p,{status:'uncertain',code:'provider_phone_missing'},direction);return}
    const datasetDate=data.source?.boundary_dataset_date?new Intl.DateTimeFormat('de-DE').format(new Date(`${data.source.boundary_dataset_date}T00:00:00Z`)):'aktuell geprüft';
    const boundaryDistance=Number(data.distance_to_boundary_m);
    const body=`<div class="mobility229-success">
        <div class="mobility229-success-mark">${shieldIcon}</div>
        <small>ZUSTÄNDIGKEIT GEPRÜFT</small>
        <h3>${esc229(provider.name||'Taxidienst')}</h3>
        <p>HOY hat den Abholort eindeutig dem Taxigebiet <strong>${esc229(data.municipality||'')}</strong> zugeordnet.</p>
      </div>
      <div class="mobility229-route-card">
        <div><small>ABHOLUNG</small><b>${esc229(pickupLabel(p,direction,data))}</b></div>
        ${direction==='to'?`<div class="mobility229-route-line"></div><div><small>ZIEL</small><b>${esc229(p.name)}</b></div>`:''}
      </div>
      <button type="button" class="mobility229-call" data-mobility229-call>${taxiIcon}<span><small>JETZT ANRUFEN</small><b>${esc229(provider.phone_display||phone)}</b></span><i>→</i></button>
      ${provider.alternate_phone_e164?`<button type="button" class="mobility229-alt" data-mobility229-alt>Alternative Nummer desselben Anbieters · ${esc229(provider.alternate_phone_display||provider.alternate_phone_e164)}</button>`:''}
      <div class="mobility229-proof">
        <div><span>✓</span><p><b>Provider verifiziert</b><small>${esc229(provider.source_label||'Offizielle Quelle')}</small></p></div>
        <div><span>✓</span><p><b>Gebietsgrenze lokal geprüft</b><small>IGN/CNIG · Datenstand ${esc229(datasetDate)}</small></p></div>
        ${Number.isFinite(boundaryDistance)?`<div><span>✓</span><p><b>Sicher außerhalb der Grenzzone</b><small>ca. ${Math.round(boundaryDistance)} m zur Cartagena-San-Javier-Grenze</small></p></div>`:''}
      </div>
      <p class="mobility229-legal">HOY wählt den Kontakt, startet den Anruf aber nicht automatisch. Die Beförderung und Abrechnung erfolgen direkt mit dem Taxiunternehmen.</p>`;
    d.innerHTML=flowShell('Das passende Taxi ist gefunden.',body,{back:true});
    d.querySelector('[data-mobility229-back]')?.addEventListener('click',()=>renderChooser(d,p));
    d.querySelector('[data-mobility229-call]')?.addEventListener('click',()=>{
      track('mobility_contact_clicked',p,{direction,provider_slug:provider.slug||'',municipality:data.municipality||'',method:'phone'});
      location.href=`tel:${phone}`;
    });
    d.querySelector('[data-mobility229-alt]')?.addEventListener('click',()=>{
      const alt=String(provider.alternate_phone_e164||'').replace(/[^+\d]/g,'');
      if(!alt)return;
      track('mobility_contact_clicked',p,{direction,provider_slug:provider.slug||'',municipality:data.municipality||'',method:'alternate_phone'});
      location.href=`tel:${alt}`;
    });
  }

  function failureCopy(code){
    const map={
      low_location_accuracy:['Standort noch zu ungenau.','Dein Handy kann den Abholort gerade nicht zuverlässig genug bestimmen. HOY wählt deshalb kein Taxi.'],
      near_municipal_boundary:['Du bist im Grenzbereich.','Cartagena und San Javier liegen für diesen Abholort zu nah beieinander. HOY rät hier nicht.'],
      municipality_not_unique:['Taxigebiet nicht eindeutig.','Der Abholort liegt genau an oder außerhalb der eindeutig erkennbaren Gebietsgrenze.'],
      outside_hoy_region:['Noch außerhalb des HOY-Mobility-Gebiets.','Für diesen Abholort ist in v0.1 noch kein verifiziertes Routing freigeschaltet.'],
      no_verified_service_area:['Gebiet noch nicht freigegeben.','HOY kennt die Gemeinde, hat dafür aber noch keine verifizierte Taxi-Regel veröffentlicht.'],
      no_verified_provider:['Noch kein verifizierter Anbieter.','HOY kennt das Gebiet, gibt aber ohne bestätigten Taxikontakt keinen Anruf frei.'],
      geolocation_denied:['Standortfreigabe fehlt.','Ohne deinen Abholort kann HOY nicht sicher entscheiden, welches Taxi zuständig ist.'],
      geolocation_timeout:['Standortbestimmung dauerte zu lange.','Versuche es noch einmal an einem Ort mit besserem GPS-Empfang.'],
      geolocation_unavailable:['Standort nicht verfügbar.','Dieses Gerät stellt HOY gerade keinen Standort bereit.'],
      geolocation_failed:['Standort konnte nicht bestimmt werden.','HOY gibt ohne sicheren Abholort bewusst kein Taxi frei.'],
      provider_phone_missing:['Kontakt nicht vollständig verifiziert.','Der Anbieter ist bekannt, aber die freigegebene Rufnummer fehlt.'],
      mobility_kill_switch:['HOY Mobility ist momentan pausiert.','Die Taxi-Zuordnung wurde zentral deaktiviert. HOY gibt in diesem Zustand bewusst keinen Kontakt frei.'],
      routing_config_unavailable:['Taxi-Regeln gerade nicht verlässlich verfügbar.','HOY kann die aktuelle Zuständigkeit nicht sicher prüfen und gibt deshalb keinen Anruf frei.'],
      mobility_service_unavailable:['Mobility ist gerade nicht sicher erreichbar.','HOY fällt nicht auf eine geratene Telefonnummer zurück. Bitte versuche es erneut.']
    };
    return map[code]||['Noch keine sichere Taxi-Zuordnung.','HOY konnte den richtigen Anbieter nicht zweifelsfrei bestimmen und gibt deshalb keinen Anruf frei.'];
  }

  function renderFailure(d,p,result,direction){
    const [title,copy]=failureCopy(result?.code);
    const boundary=result?.code==='near_municipal_boundary';
    const body=`<div class="mobility229-failure">
        <div class="mobility229-failure-mark">!</div>
        <small>KEIN AUTO-ROUTING</small>
        <h3>${esc229(title)}</h3>
        <p>${esc229(copy)}</p>
      </div>
      <div class="mobility229-trust strong">${shieldIcon}<p><b>Das ist Absicht.</b> Lieber einmal mehr nach dem Abholort fragen als dich mit dem falschen Taxibezirk zu verbinden.</p></div>
      <div class="mobility229-retry">
        ${direction==='to'?'<button type="button" class="primary" data-mobility229-retry>Standort erneut prüfen</button>':''}
        <button type="button" data-mobility229-choose>Abholart ändern</button>
      </div>
      ${boundary?'<p class="mobility229-legal">Für Grenzfälle ergänzen wir später zusätzlich verifizierte POI-Zuordnungen. Bis dahin bleibt der automatische Anruf gesperrt.</p>':''}`;
    d.innerHTML=flowShell('HOY bleibt auf der sicheren Seite.',body,{back:true});
    d.querySelector('[data-mobility229-back]')?.addEventListener('click',()=>renderChooser(d,p));
    d.querySelector('[data-mobility229-choose]')?.addEventListener('click',()=>renderChooser(d,p));
    d.querySelector('[data-mobility229-retry]')?.addEventListener('click',()=>resolveCurrentLocation(d,p));
  }

  const baseOpenDetail229=openDetail;
  openDetail=function(id){
    activeProfileId=Number(id);
    baseOpenDetail229(id);
    void decorateProfile(id);
  };

  const detail229=document.getElementById('detail');
  detail229?.addEventListener('close',()=>{activeProfileId=null});
  void loadRuntime();

  window.hoyMobility229={open:openMobility,decorateProfile,loadRuntime,runtime};
})();

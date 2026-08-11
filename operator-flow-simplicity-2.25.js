/* HOY 2.25.0 — fast operator flows: fewer simultaneous choices, safer defaults, quicker repeat actions */
(function(){
  if(window.__hoyOperatorFlowSimplicity250)return;
  window.__hoyOperatorFlowSimplicity250=true;
  window.hoyOperatorFlowSimplicityVersion='2.25.0';

  const q=(root,sel)=>root?.querySelector(sel)||null;
  const qa=(root,sel)=>[...(root?.querySelectorAll(sel)||[])];
  const btn=(label,cls='')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;return b};
  const note=(title,text)=>{const n=document.createElement('div');n.className='op-fast-intro';n.innerHTML=`<b>${title}</b><span>${text}</span>`;return n};
  const mark=root=>{if(!root||root.dataset.hoyFlowSimple==='2.25.0')return false;root.dataset.hoyFlowSimple='2.25.0';return true};

  function enhanceServices(){
    const d=document.getElementById('operatorServicesFlow');const root=q(d,'.operator-flow');
    if(!mark(root))return;
    const lead=q(root,'.claim-lead');
    if(lead)lead.textContent='Drei kurze Antworten. Was du noch nicht sicher weißt, darf bewusst offen bleiben.';
    const rows=qa(root,'.hub-service-row');
    if(rows.length){
      const intro=note('In etwa 30 Sekunden erledigt','Reservierung, Abholung und Lieferung jeweils mit Ja, Nein oder Noch prüfen bestätigen.');
      (q(root,'.hub-services-edit')||rows[0].parentNode).before(intro);
    }
    const summary=document.createElement('div');summary.className='op-service-summary';
    const refresh=()=>{
      const known=rows.filter(row=>q(row,'select')?.value!=='unknown').length;
      summary.textContent=known===rows.length?'Alles beantwortet':`${known} von ${rows.length} beantwortet · Unklares darf offen bleiben`;
    };
    rows.forEach(row=>{
      const select=q(row,'select');if(!select)return;
      select.classList.add('op-native-select');
      const choices=document.createElement('div');choices.className='op-choice-group';
      [['available','Ja'],['unavailable','Nein'],['unknown','Noch prüfen']].forEach(([value,label])=>{
        const b=btn(label,'op-choice');b.dataset.value=value;
        const sync=()=>b.classList.toggle('active',select.value===value);sync();
        b.onclick=()=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));qa(choices,'.op-choice').forEach(x=>x.classList.toggle('active',x.dataset.value===value));refresh()};
        choices.appendChild(b);
      });
      row.appendChild(choices);
    });
    const edit=q(root,'.hub-services-edit');if(edit)edit.after(summary);refresh();
    const save=q(root,'[data-op-services-save]');if(save)save.textContent='Services speichern';
  }

  function dayRow(root,key){return q(root,`[data-live-day="${key}"]`)}
  function copyDay(root,sourceKey,targetKeys){
    const source=dayRow(root,sourceKey);if(!source)return;
    const closed=!!q(source,'[data-day-closed]')?.checked;
    const vals=['[data-open-1]','[data-close-1]','[data-open-2]','[data-close-2]'].map(sel=>q(source,sel)?.value||'');
    targetKeys.forEach(key=>{
      const target=dayRow(root,key);if(!target)return;
      const box=q(target,'[data-day-closed]');if(box){box.checked=closed;box.dispatchEvent(new Event('change',{bubbles:true}))}
      ['[data-open-1]','[data-close-1]','[data-open-2]','[data-close-2]'].forEach((sel,i)=>{const input=q(target,sel);if(input)input.value=vals[i]});
    });
  }
  function madridToday(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function enhanceHours(){
    const d=document.getElementById('liveHoursFlow');const root=q(d,'.live-hours-flow');
    if(!mark(root))return;
    const week=q(root,'.live-week');
    if(week){
      const intro=note('Schneller Wochenplan','Einen typischen Tag eintragen und gleiche Tage mit einem Klick übernehmen. Danach nur Ausnahmen ändern.');
      const quick=document.createElement('div');quick.className='op-hours-quick';
      const weekdays=btn('Mo–Fr wie Montag');weekdays.onclick=()=>copyDay(root,'mon',['tue','wed','thu','fri']);
      const weekend=btn('Sa/So wie Samstag');weekend.onclick=()=>copyDay(root,'sat',['sun']);
      const all=btn('Alle Tage wie Montag');all.onclick=()=>copyDay(root,'mon',['tue','wed','thu','fri','sat','sun']);
      quick.append(weekdays,weekend,all);week.before(intro,quick);
    }
    const special=q(root,'.special-editor');
    if(special){
      const details=document.createElement('details');details.className='op-optional op-special-details';
      details.open=!!q(special,'[data-special-date]')?.value;
      const summary=document.createElement('summary');summary.textContent='Sondertag oder spontane Abweichung';
      const body=document.createElement('div');body.className='op-optional-body';
      special.parentNode.insertBefore(details,special);details.append(summary,body);body.appendChild(special);
      const todayClosed=btn('Heute geschlossen','op-today-closed');
      todayClosed.onclick=()=>{
        details.open=true;
        const date=q(special,'[data-special-date]');if(date)date.value=madridToday();
        const closed=q(special,'[data-special-closed]');if(closed)closed.checked=true;
        qa(special,'input[type="time"]').forEach(x=>x.value='');
        q(special,'[data-special-note]')?.focus();
      };
      summary.after(todayClosed);
    }
    const save=q(root,'[data-live-save]');if(save)save.textContent='Öffnungszeiten speichern';
  }

  function enhanceMenu(){
    const d=document.getElementById('menuIntakeFlow');const root=q(d,'.menu-intake-flow');
    if(!mark(root))return;
    const lead=q(root,'.claim-lead');if(lead)lead.innerHTML='Wähle <b>eine</b> Quelle. HOY erstellt daraus einen strukturierten Entwurf. <b>Nichts wird ungeprüft veröffentlicht.</b>';
    const methods=q(root,'.menu-intake-methods');const sections=qa(methods,':scope > section');
    if(methods&&sections.length){
      const intro=note('Ein Weg reicht','Für die meisten Betriebe ist PDF/Foto am schnellsten. Link und Direkteingabe bleiben jederzeit verfügbar.');
      const tabs=document.createElement('div');tabs.className='op-method-tabs';
      const labels=['PDF / Foto','Offizieller Link','Direkt eingeben'];
      const activate=index=>{
        sections.forEach((section,i)=>section.classList.toggle('op-method-hidden',i!==index));
        qa(tabs,'button').forEach((b,i)=>b.classList.toggle('active',i===index));
      };
      sections.forEach((section,i)=>{const b=btn(labels[i]||`Weg ${i+1}`);b.onclick=()=>activate(i);tabs.appendChild(b)});
      methods.before(intro,tabs);activate(0);
    }
    const history=q(root,'.menu-intake-dialog-history');
    if(history){
      const details=document.createElement('details');details.className='op-optional op-history-details';
      const summary=document.createElement('summary');summary.textContent='Letzte Einreichungen ansehen';
      history.parentNode.insertBefore(details,history);details.append(summary,history);
    }
  }

  function enhanceOffers(){
    const d=document.getElementById('operatorOffersFlow');const root=q(d,'.operator-flow');const form=q(root,'.hub-offer-form');
    if(!root||!form||!mark(root))return;
    const intro=note('Schnell veröffentlichungsfertig','Für einen Entwurf reichen Typ und Titel. Beschreibung, Preis, Datum und Uhrzeit sind optional und können später ergänzt werden.');
    form.before(intro);
    const optional=[
      q(form,'[data-hub-offer-description]')?.closest('.claim-field'),
      q(form,'[data-hub-offer-price]')?.closest('.claim-field'),
      q(form,'.hub-offer-dates'),
      q(form,'[data-hub-offer-time]')?.closest('.claim-field')
    ].filter(Boolean);
    const actions=q(form,'.hub-offer-form-actions');
    if(optional.length&&actions){
      const details=document.createElement('details');details.className='op-optional op-offer-details';
      const hasOptional=Boolean(q(form,'[data-hub-offer-description]')?.value.trim()||q(form,'[data-hub-offer-price]')?.value.trim()||q(form,'[data-hub-offer-time]')?.value.trim()||q(form,'[data-hub-offer-cancel]'));
      details.open=hasOptional;
      const summary=document.createElement('summary');summary.textContent='Details ergänzen (optional)';
      const body=document.createElement('div');body.className='op-optional-body';
      actions.before(details);details.append(summary,body);optional.forEach(x=>body.appendChild(x));
    }
  }

  function enhanceMedia(){
    const d=document.getElementById('mediaReview');const root=q(d,'.media-review-flow');
    if(!root||!mark(root))return;
    const save=q(root,'[data-media-save]');if(!save)return;
    const title=q(root,'.media-review-title');
    if(title){
      const p=q(title,'p');if(p)p.textContent='HOY hat vorausgewählt. Du entscheidest nur noch: verwenden, nicht verwenden oder ersetzen.';
      const steps=document.createElement('div');steps.className='op-media-steps';
      const cards=qa(root,'.media-review-card');const decided=cards.filter(card=>q(card,'.media-decisions .active')).length;
      steps.innerHTML=`<b>${decided}/${cards.length} entschieden</b><span>1 · Auswahl prüfen</span><span>2 · Nutzungsrechte bestätigen</span><span>3 · Speichern</span>`;
      title.after(steps);
    }
    const all=q(root,'[data-media-all]');
    if(all){
      all.textContent='Alle Bilder passen';
      all.addEventListener('click',()=>setTimeout(()=>q(document,'#mediaReview [data-media-rights]')?.focus(),0));
    }
    save.textContent='Auswahl speichern';
  }

  function enhanceAll(){enhanceServices();enhanceHours();enhanceMenu();enhanceOffers();enhanceMedia()}
  window.hoyEnhanceOperatorFlows=enhanceAll;
  const observer=new MutationObserver(()=>enhanceAll());
  const start=()=>{observer.observe(document.body,{childList:true,subtree:true});enhanceAll()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

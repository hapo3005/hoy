/* HOY 2.14 — decision-first guest journey: clearer promise, richer discovery signals */
(function(){
  const baseHome214=home;
  const baseDiscover214=discover;
  const baseListCard214=listCard;

  function signalItems214(p){
    const out=[];
    const menu=menuFor(p);
    if(menu?.localized)out.push({label:'Menü auf Deutsch',kind:'good'});
    else if(['structured','partial'].includes(menu?.status))out.push({label:'Speisekarte',kind:'good'});
    if(effectiveServiceState(p,'reservation')==='available')out.push({label:'Reservierbar',kind:'good'});
    if(isClaimed(p)||p?.operator_verified)out.push({label:'Betreiber bestätigt',kind:'trust'});
    else if(p?.profile_quality==='premium')out.push({label:'HOY geprüft',kind:'trust'});
    if(!out.length)out.push({label:'Basisprofil',kind:'muted'});
    return out.slice(0,2);
  }

  listCard=function(p){
    const html=baseListCard214(p);
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const card=shell.firstElementChild;
    if(!card)return html;
    card.classList.add('decision-card-signature');
    const copy=card.querySelector('.decision-copy');
    const oldState=card.querySelector('.profile-state');
    const signals=document.createElement('div');
    signals.className='decision-signals';
    signals.setAttribute('aria-label','HOY Signale');
    signalItems214(p).forEach(item=>{
      const span=document.createElement('span');
      span.className=`decision-signal ${item.kind}`;
      span.textContent=item.label;
      signals.appendChild(span);
    });
    if(oldState)oldState.replaceWith(signals);
    else copy?.appendChild(signals);
    return card.outerHTML;
  };

  home=function(){
    const html=baseHome214();
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    root.classList.add('journey-home-signature');
    const hero=root.querySelector('.journey-hero');
    hero?.classList.add('journey-signature-hero');

    const heroCopy=hero?.querySelector('.hero-copy');
    const copy=heroCopy?.querySelector('p');
    if(copy)copy.innerHTML='Finde Essen, Drinks und besondere Orte – mit <strong>Menüs, Services und klarer Datenlage</strong> an einem Ort.';

    const title=hero?.querySelector('.intent-title');
    const titleSmall=title?.querySelector('small');
    if(titleSmall)titleSmall.textContent='Nach Anlass, Küche oder Service';

    hero?.querySelectorAll('[data-home-intent]').forEach(button=>{
      const label=button.querySelector('strong')?.textContent?.trim()||button.textContent.trim();
      button.setAttribute('aria-label',`${label} entdecken`);
    });

    const searchButton=hero?.querySelector('[data-home-search-go]');
    if(searchButton)searchButton.textContent='Finden';

    const search=hero?.querySelector('.home-search');
    if(search&&!hero.querySelector('.journey-trust-strip')){
      const trust=document.createElement('div');
      trust.className='journey-trust-strip';
      trust.setAttribute('aria-label','Was HOY bündelt');
      trust.innerHTML='<span>Speisekarten</span><i aria-hidden="true">·</i><span>Services</span><i aria-hidden="true">·</i><span>Datenstatus sichtbar</span>';
      search.insertAdjacentElement('afterend',trust);
    }
    return root.outerHTML;
  };

  discover=function(){
    const html=baseDiscover214();
    const shell=document.createElement('div');
    shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    root.classList.add('journey-discover-signature');

    const head=root.querySelector('.journey-discover-head');
    const h1=head?.querySelector('h1');
    const p=head?.querySelector('p');
    if(h1)h1.textContent='Finde deinen Ort.';
    if(p)p.textContent='Nach Stimmung, Küche oder Service – und mit Menü-, Service- und Datenstatus direkt im Treffer.';

    const filterSmall=root.querySelector('.journey-filter-block .consumer-filter-head small');
    if(filterSmall)filterSmall.textContent='wischen · kombinieren';

    const q=root.querySelector('#q');
    if(q)q.placeholder='Betrieb, Ort, Küche oder Stimmung …';
    return root.outerHTML;
  };
})();

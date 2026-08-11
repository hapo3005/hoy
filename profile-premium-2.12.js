/* HOY 2.18.5 — premium guest profile orchestration with refresh-safe user-owned navigation */
(function(){
  const text=(v)=>String(v||'').trim();

  function directChild(root,predicate){
    return [...(root?.children||[])].find(predicate)||null;
  }

  function trustItems(p){
    const out=[];
    const m=menuFor(p);
    if(m?.localized)out.push(state?.lang==='en'?'Menu in English':state?.lang==='es'?'Carta en español':'Speisekarte auf Deutsch');
    else if(['structured','partial','official_link'].includes(m?.status))out.push('Speisekarte verfügbar');
    if(isClaimed(p))out.push('Vom Betrieb bestätigt');
    else out.push('Von HOY geprüft');
    if(effectiveServiceState(p,'reservation')==='available')out.push('Reservierung möglich');
    return out.slice(0,3);
  }

  function setActiveNav(nav,href){
    nav?.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===href));
  }

  function activeSectionHref(d){
    const sections=['#profile-about','#profile-menu','#profile-info']
      .map(sel=>d?.querySelector(sel)).filter(Boolean);
    if(!sections.length)return '#profile-about';
    const box=d.getBoundingClientRect();
    const threshold=box.top+Math.min(150,Math.max(96,box.height*.22));
    let chosen=sections[0];
    for(const section of sections){
      if(section.getBoundingClientRect().top<=threshold)chosen=section;
      else break;
    }
    return `#${chosen.id}`;
  }

  function wireSectionSpy(d,nav){
    d._hoyProfileObserver?.disconnect?.();
    d._hoyProfileObserver=null;
    if(d._hoyProfileScrollHandler)d.removeEventListener('scroll',d._hoyProfileScrollHandler);
    if(d._hoyProfileScrollFrame)cancelAnimationFrame(d._hoyProfileScrollFrame);

    const sync=()=>{
      d._hoyProfileScrollFrame=0;
      if(!d.open||!nav?.isConnected||d._hoyMenuRefreshing)return;
      setActiveNav(nav,activeSectionHref(d));
    };
    const onScroll=()=>{
      if(d._hoyMenuRefreshing||d._hoyProfileScrollFrame)return;
      d._hoyProfileScrollFrame=requestAnimationFrame(sync);
    };
    d.addEventListener('scroll',onScroll,{passive:true});
    d._hoyProfileScrollHandler=onScroll;
    d._hoyProfileSyncSection=sync;
  }

  function ensureMenuCategoryNav(d){
    const section=d?.querySelector('#profile-menu');
    const panel=section?.querySelector('.menu-panel');
    if(!section||!panel)return false;
    if(panel.querySelector('.menu-category-nav'))return true;
    const cats=[...panel.querySelectorAll('.menu-cat')];
    if(cats.length<2)return false;

    const nav=document.createElement('nav');
    nav.className='menu-category-nav';
    nav.setAttribute('aria-label','Speisekarten-Kategorien');
    for(const cat of cats){
      const title=text(cat.querySelector('h4')?.textContent);
      if(!title)continue;
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=title;
      btn.addEventListener('click',()=>cat.scrollIntoView({behavior:'smooth',block:'start'}));
      nav.appendChild(btn);
    }
    if(!nav.children.length)return false;

    const meta=panel.querySelector('.menu-result-meta');
    const input=panel.querySelector('input.menu-search,[data-menu-search]');
    if(meta)meta.insertAdjacentElement('afterend',nav);
    else if(input)input.insertAdjacentElement('afterend',nav);
    else panel.prepend(nav);
    return true;
  }

  function keepMenuNavigationDeterministic(d){
    d._hoyMenuNavObserver?.disconnect?.();
    const section=d?.querySelector('#profile-menu');
    if(!section)return;
    if(ensureMenuCategoryNav(d))return;

    const observer=new MutationObserver(()=>{
      if(ensureMenuCategoryNav(d)){
        observer.disconnect();
        if(d._hoyMenuNavObserver===observer)d._hoyMenuNavObserver=null;
      }
    });
    observer.observe(section,{childList:true,subtree:true});
    d._hoyMenuNavObserver=observer;
    setTimeout(()=>{
      ensureMenuCategoryNav(d);
      observer.disconnect();
      if(d._hoyMenuNavObserver===observer)d._hoyMenuNavObserver=null;
    },750);
  }

  function enhanceProfile(p,d){
    if(!p||!d?.classList.contains('continuous-profile'))return;
    const body=d.querySelector('.detail-body');
    if(!body||body.querySelector('.profile-identity-card'))return;
    d.classList.add('profile-premium');

    const eyebrow=directChild(body,x=>x.classList.contains('eyebrow'));
    const title=directChild(body,x=>x.tagName==='H2');
    const metaEl=directChild(body,x=>x.classList.contains('meta'));
    const status=directChild(body,x=>x.classList.contains('statusrow'));
    const snapshot=directChild(body,x=>x.classList.contains('showcase-snapshot'));
    const actions=directChild(body,x=>x.classList.contains('actions'));
    const services=directChild(body,x=>x.classList.contains('service-grid'));
    const serviceSummary=directChild(body,x=>x.classList.contains('service-summary'));
    const nav=directChild(body,x=>x.classList.contains('profile-anchor-nav'));
    const flow=directChild(body,x=>x.classList.contains('profile-continuous-flow'));

    const identity=document.createElement('section');
    identity.className='profile-identity-card';
    if(eyebrow){eyebrow.classList.add('profile-location-kicker');identity.appendChild(eyebrow)}
    if(title)identity.appendChild(title);
    if(metaEl&&text(metaEl.textContent))identity.appendChild(metaEl);
    const trust=trustItems(p);
    if(trust.length){
      const line=document.createElement('div');
      line.className='profile-trust-line';
      line.innerHTML=trust.map((item,i)=>`<span>${esc(item)}</span>${i<trust.length-1?'<i aria-hidden="true">·</i>':''}`).join('');
      identity.appendChild(line);
    }
    status?.remove();
    body.insertBefore(identity,body.firstChild);

    if(snapshot){snapshot.classList.add('profile-quick-snapshot');identity.insertAdjacentElement('afterend',snapshot)}
    if(actions){
      actions.classList.add('profile-quick-actions');
      const sticky=d.querySelector('.detail-primary-bar');
      if(sticky)actions.querySelectorAll('a').forEach(a=>{if((a.getAttribute('href')||'').includes('google.com/maps'))a.classList.add('profile-action-duplicate')});
      (snapshot||identity).insertAdjacentElement('afterend',actions);
    }

    if(nav){
      nav.classList.add('profile-premium-nav');
      setActiveNav(nav,'#profile-about');
      nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setActiveNav(nav,a.getAttribute('href'))));
      (actions||snapshot||identity).insertAdjacentElement('afterend',nav);
      wireSectionSpy(d,nav);
    }

    const about=flow?.querySelector('#profile-about');
    if(about){
      const head=about.querySelector('.profile-section-head');
      const small=head?.querySelector('small');
      const h3=head?.querySelector('h3');
      if(small)small.textContent='ÜBERBLICK';
      if(h3)h3.textContent='Das Restaurant';
      if(services){
        services.classList.add('profile-service-facts');
        const hours=about.querySelector('.profile-hours');
        (hours||about.querySelector('.desc')||head)?.insertAdjacentElement('afterend',services);
      }
    }

    serviceSummary?.remove();
    keepMenuNavigationDeterministic(d);
  }

  const baseOpenDetail212=openDetail;
  openDetail=function(id){
    baseOpenDetail212(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)enhanceProfile(p,d);
  };

  // A menu-data refresh is not navigation. profile-flow preserves the active tab while replacing the menu.
  // This notification intentionally performs no section/layout work; the existing scroll handler already
  // queries the current DOM the next time the user actually scrolls.
})();

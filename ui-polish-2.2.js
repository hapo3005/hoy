/* HOY 2.2 — showcase detail UX, category jumps and primary mobile actions */
(function(){
  const SHOWCASE_IDS_22=new Set([1,2,3,5,7,8,9,11,13,14,15,16,17,20,21,22]);
  const isShowcase=p=>!!p&&SHOWCASE_IDS_22.has(Number(p.id));

  function decorateShowcaseLists(){
    document.querySelectorAll('[data-open]').forEach(card=>{
      const id=Number(card.getAttribute('data-open'));
      if(SHOWCASE_IDS_22.has(id)&&card.classList.contains('list-card'))card.classList.add('showcase-list-card');
    });
  }

  const baseWire22=wire;
  wire=function(){
    baseWire22();
    decorateShowcaseLists();
  };

  function menuEnhance(d,p){
    if(!isShowcase(p)||!d)return;
    const panel=d.querySelector('.menu-panel');
    if(!panel)return;
    const input=panel.querySelector('input.menu-search,[data-menu-search]');
    const cats=[...panel.querySelectorAll('.menu-cat')];
    const items=[...panel.querySelectorAll('[data-menu-item]')];
    if(input){
      input.setAttribute('aria-label',`Speisekarte von ${p.name} durchsuchen`);
      input.setAttribute('autocomplete','off');
    }
    if(items.length&&!panel.querySelector('.menu-result-meta')){
      const meta=document.createElement('div');
      meta.className='menu-result-meta';
      meta.innerHTML=`<span>In HOY erfasst</span><strong data-menu-visible>${items.length} Positionen</strong>`;
      if(input)input.insertAdjacentElement('afterend',meta);else panel.prepend(meta);
      const updateCount=()=>{
        const visible=items.filter(x=>x.style.display!=='none').length;
        const out=meta.querySelector('[data-menu-visible]');
        if(out)out.textContent=`${visible} ${visible===1?'Position':'Positionen'}`;
      };
      input?.addEventListener('input',()=>requestAnimationFrame(updateCount));
    }
    if(cats.length>1&&!panel.querySelector('.menu-category-nav')){
      const nav=document.createElement('nav');
      nav.className='menu-category-nav';
      nav.setAttribute('aria-label','Speisekarten-Kategorien');
      for(const cat of cats){
        const title=cat.querySelector('h4')?.textContent?.trim();
        if(!title)continue;
        const btn=document.createElement('button');
        btn.type='button';
        btn.textContent=title;
        btn.addEventListener('click',()=>cat.scrollIntoView({behavior:'smooth',block:'start'}));
        nav.appendChild(btn);
      }
      const meta=panel.querySelector('.menu-result-meta');
      if(meta)meta.insertAdjacentElement('afterend',nav);
      else if(input)input.insertAdjacentElement('afterend',nav);
      else panel.prepend(nav);
    }
  }

  const baseSetDetailTab22=setDetailTab;
  setDetailTab=function(d,p,tab){
    baseSetDetailTab22(d,p,tab);
    if(tab==='menu')menuEnhance(d,p);
  };

  function primaryBar(p,d){
    if(!p||!d||d.querySelector('.detail-primary-bar'))return;
    const reservable=effectiveServiceState(p,'reservation')==='available';
    const bar=document.createElement('div');
    bar.className='detail-primary-bar';
    const phone=phoneHref(p);
    const primary=reservable
      ?`<button type="button" class="primary" data-ux22-reserve>${icons.calendar}<span>Reservieren</span></button>`
      :`<a class="primary" href="${esc(phone)}">${icons.phone}<span>Anrufen</span></a>`;
    bar.innerHTML=`${primary}<a class="secondary" target="_blank" rel="noopener" href="${esc(routeHref(p))}">${icons.pin}<span>Route</span></a>`;
    d.appendChild(bar);
    bar.querySelector('[data-ux22-reserve]')?.addEventListener('click',()=>{
      d.close();
      openServiceFlow(p,'reservation');
    });
    bar.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      const href=a.getAttribute('href')||'';
      trackEvent(href.startsWith('tel:')?'call_click':'route_start',p.id,{from:'profile_sticky'});
    }));
  }

  function enhanceDetail(p,d){
    if(!p||!d)return;
    // Direct location/service actions are a core profile capability, not a showcase-only perk.
    primaryBar(p,d);
    if(!isShowcase(p))return;
    d.classList.add('ux22-detail');
    d.setAttribute('aria-label',`${p.name} auf HOY`);
    d.querySelector('[data-close]')?.setAttribute('aria-label','Profil schließen');
    d.querySelector('[data-share]')?.setAttribute('aria-label','Profil teilen');
    d.querySelector('[data-favdialog]')?.setAttribute('aria-label','Als Favorit speichern');
    const menuBtn=d.querySelector('[data-tab="menu"]');
    if(menuBtn&&menuFor(p)?.status==='partial')menuBtn.textContent='Speisekarte · Auswahl';
  }

  const baseOpenDetail22=openDetail;
  openDetail=function(id){
    baseOpenDetail22(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)enhanceDetail(p,d);
  };
})();

/* HOY 2.18.3 — signature localized menu experience with rerender-safe scroll navigation */
(function(){
  const COPY={
    de:{title:'Speisekarte auf Deutsch',partial:'Auswahl auf Deutsch',promise:'Für dich auf Deutsch',proof:'Kulinarisch übersetzt · Originalpreise unverändert',body:'HOY überträgt Gerichte sinngemäß statt Wort für Wort. Spanische Eigennamen bleiben erhalten, wenn sie zum Gericht gehören.',search:'Speisekarte durchsuchen …',checked:'HOY redaktionell geprüft'},
    en:{title:'Menu in English',partial:'Selection in English',promise:'In English for you',proof:'Culinary translation · original prices unchanged',body:'HOY translates dishes by culinary meaning rather than word for word. Spanish names stay where they are part of the dish.',search:'Search this menu …',checked:'Editorially reviewed by HOY'},
    es:{title:'Carta en español',partial:'Selección en español',promise:'En español para ti',proof:'Adaptación culinaria · precios originales sin cambios',body:'HOY adapta los platos por su sentido culinario, no palabra por palabra. Los nombres propios se mantienen cuando forman parte del plato.',search:'Buscar en esta carta …',checked:'Revisado por HOY'}
  };

  function copyFor(m){return COPY[m?.locale]||COPY.de}
  function itemCount(section){return section?.querySelectorAll('[data-menu-item]').length||0}

  function decorateSearch(section,m){
    const input=section.querySelector('[data-menu-search]');
    if(!input)return;
    const c=copyFor(m);
    input.placeholder=c.search;
    if(input.parentElement?.classList.contains('menu-signature-search'))return;

    const shell=document.createElement('div');
    shell.className='menu-signature-search';
    input.parentNode.insertBefore(shell,input);
    shell.appendChild(input);
    shell.insertAdjacentHTML('afterbegin','<svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>');
    const clear=document.createElement('button');
    clear.type='button';
    clear.className='menu-signature-clear';
    clear.setAttribute('aria-label','Suche löschen');
    clear.textContent='×';
    shell.appendChild(clear);
    const sync=()=>shell.classList.toggle('has-value',!!input.value);
    input.addEventListener('input',sync);
    clear.addEventListener('click',()=>{
      input.value='';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus();
    });
    sync();
  }

  function categoryTitle(cat){
    const h=cat.querySelector('h4');
    if(!h)return '';
    const clone=h.cloneNode(true);
    clone.querySelectorAll('.menu-cat-count').forEach(x=>x.remove());
    return String(clone.textContent||'').trim();
  }

  function ensureCategoryNav(section,cats){
    let nav=section.querySelector('.menu-category-nav');
    if(nav||cats.length<2)return nav;
    const panel=section.querySelector('.menu-panel')||section.querySelector('.localized-menu-panel')||section;
    nav=document.createElement('nav');
    nav.className='menu-category-nav';
    nav.setAttribute('aria-label','Speisekarten-Kategorien');
    nav.dataset.hoySignatureNav='1';
    cats.forEach(cat=>{
      const title=categoryTitle(cat);
      if(!title)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=title;
      btn.addEventListener('click',()=>cat.scrollIntoView({behavior:'smooth',block:'start'}));
      nav.appendChild(btn);
    });
    const meta=panel.querySelector('.menu-result-meta');
    const search=panel.querySelector('.menu-signature-search');
    const input=panel.querySelector('[data-menu-search]');
    if(meta)meta.insertAdjacentElement('afterend',nav);
    else if(search)search.insertAdjacentElement('afterend',nav);
    else if(input)input.insertAdjacentElement('afterend',nav);
    else panel.insertBefore(nav,cats[0]||panel.firstChild);
    return nav;
  }

  function categoryIndexForPosition(d,cats){
    if(!cats.length)return 0;
    const box=d.getBoundingClientRect();
    const threshold=box.top+Math.min(180,Math.max(120,box.height*.28));
    let chosen=0;
    cats.forEach((cat,i)=>{if(cat.getBoundingClientRect().top<=threshold)chosen=i});
    return chosen;
  }

  function wireCategoryScrollSync(d,nav,cats,buttons){
    d._hoyMenuSignatureObserver?.disconnect?.();
    d._hoyMenuSignatureObserver=null;
    if(d._hoyMenuSignatureScrollHandler)d.removeEventListener('scroll',d._hoyMenuSignatureScrollHandler);
    if(d._hoyMenuSignatureScrollFrame)cancelAnimationFrame(d._hoyMenuSignatureScrollFrame);

    const sync=()=>{
      d._hoyMenuSignatureScrollFrame=0;
      if(!d.open||!nav?.isConnected)return;
      const idx=categoryIndexForPosition(d,cats);
      const changed=nav.dataset.hoyActiveIndex!==String(idx);
      buttons.forEach((b,j)=>b.classList.toggle('active',j===idx));
      nav.dataset.hoyActiveIndex=String(idx);
      if(changed&&nav.scrollWidth>nav.clientWidth){
        const b=buttons[idx];
        if(b)nav.scrollTo({left:Math.max(0,b.offsetLeft-nav.clientWidth/2+b.clientWidth/2),behavior:'auto'});
      }
    };
    const onScroll=()=>{
      if(d._hoyMenuSignatureScrollFrame)return;
      d._hoyMenuSignatureScrollFrame=requestAnimationFrame(sync);
    };
    d.addEventListener('scroll',onScroll,{passive:true});
    d._hoyMenuSignatureScrollHandler=onScroll;
    d._hoyMenuSignatureSync=sync;
    queueMicrotask(sync);
  }

  function decorateCategories(section,d){
    const cats=[...section.querySelectorAll('.menu-cat')];
    if(!cats.length)return false;

    const nav=ensureCategoryNav(section,cats);
    if(!nav)return false;

    cats.forEach(cat=>{
      const h=cat.querySelector('h4');
      if(!h||h.querySelector('.menu-cat-count'))return;
      const count=cat.querySelectorAll('[data-menu-item]').length;
      const span=document.createElement('span');
      span.className='menu-cat-count';
      span.textContent=`${count} ${count===1?'Position':'Positionen'}`;
      h.appendChild(span);
    });

    nav.classList.add('menu-signature-categories');
    const buttons=[...nav.querySelectorAll('button')];
    buttons.forEach((btn,i)=>{
      if(btn.dataset.hoySignatureBound==='1')return;
      btn.dataset.hoySignatureBound='1';
      btn.addEventListener('click',()=>{
        buttons.forEach((b,j)=>b.classList.toggle('active',i===j));
        nav.dataset.hoyActiveIndex=String(i);
      });
    });
    if(buttons[0]&&!buttons.some(b=>b.classList.contains('active')))buttons[0].classList.add('active');
    wireCategoryScrollSync(d,nav,cats,buttons);
    return true;
  }

  function addPromise(section,m){
    if(!m?.localized||section.querySelector('.menu-signature-promise'))return;
    const c=copyFor(m);
    const partial=m.status==='partial';
    const promise=document.createElement('div');
    promise.className='menu-signature-promise';
    promise.innerHTML=`<div class="menu-signature-promise-top"><span class="menu-signature-lang">${esc((m.locale||'de').toUpperCase())}</span><div><b>${esc(c.promise)}</b><small>${esc(c.proof)}</small></div></div><p>${esc(c.body)}</p><span class="menu-signature-review">✓ ${esc(c.checked)}${partial?' · aktuelle Auswahl':''}</span>`;
    const head=section.querySelector(':scope > .profile-section-head');
    head?.insertAdjacentElement('afterend',promise);
  }

  function restyleProvenance(section){
    const status=section.querySelector('.localized-menu-panel .menu-status');
    if(status)status.classList.add('menu-signature-provenance');
  }

  function applySignatureState(section,p,d){
    const m=menuFor(p);
    section.classList.add('menu-signature');
    section.classList.toggle('menu-signature-localized',!!m?.localized);
    section.dataset.menuLocale=m?.locale||'';

    const head=section.querySelector(':scope > .profile-section-head');
    const h3=head?.querySelector('h3');
    const small=head?.querySelector('small');
    const count=head?.querySelector('.profile-menu-count');
    if(small)small.textContent='HOY SPEISEKARTE';
    if(h3&&m?.localized){
      const c=copyFor(m);
      h3.textContent=m.status==='partial'?c.partial:c.title;
    }
    const n=itemCount(section);
    if(count&&n)count.textContent=`${n} Positionen`;

    addPromise(section,m);
    restyleProvenance(section);
    decorateSearch(section,m);
    return decorateCategories(section,d);
  }

  function enhanceSignatureMenu(p,d){
    const section=d?.querySelector('#profile-menu');
    if(!p||!section)return;
    if(applySignatureState(section,p,d))return;

    const observer=new MutationObserver(()=>{
      if(applySignatureState(section,p,d))observer.disconnect();
    });
    observer.observe(section,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),5000);
  }

  const baseOpenDetail213Menu=openDetail;
  openDetail=function(id){
    baseOpenDetail213Menu(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)enhanceSignatureMenu(p,d);
  };

  window.addEventListener('hoy:profile-menu-refreshed',e=>{
    const id=Number(e.detail?.restaurantId||0);
    const d=document.getElementById('detail');
    if(!d?.open||Number(d.dataset.restaurantId||0)!==id)return;
    clearTimeout(d._hoySignatureRefreshTimer2183);
    d._hoySignatureRefreshTimer2183=setTimeout(()=>{
      if(!d.open||Number(d.dataset.restaurantId||0)!==id)return;
      const p=DATA.find(x=>Number(x.id)===id);
      if(p)enhanceSignatureMenu(p,d);
    },0);
  });
})();

/* HOY 2.20.1 — signature localized menu experience with bounded non-blocking refresh reconciliation */
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

  function decorateCategories(section,d){
    const cats=[...section.querySelectorAll('.menu-cat')];
    if(!cats.length)return false;
    const nav=ensureCategoryNav(section,cats);
    if(!nav)return false;

    d._hoyMenuSignatureObserver?.disconnect?.();
    d._hoyMenuSignatureObserver=null;
    if(d._hoyMenuSignatureScrollHandler)d.removeEventListener('scroll',d._hoyMenuSignatureScrollHandler);
    d._hoyMenuSignatureScrollHandler=null;
    if(d._hoyMenuSignatureScrollFrame)cancelAnimationFrame(d._hoyMenuSignatureScrollFrame);
    d._hoyMenuSignatureScrollFrame=0;

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
    const activeIndex=Math.max(0,buttons.findIndex(b=>b.classList.contains('active')));
    buttons.forEach((b,i)=>b.classList.toggle('active',i===activeIndex));
    nav.dataset.hoyActiveIndex=String(activeIndex);
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
    if(small&&small.textContent!=='HOY SPEISEKARTE')small.textContent='HOY SPEISEKARTE';
    if(h3&&m?.localized){
      const c=copyFor(m);
      const wanted=m.status==='partial'?c.partial:c.title;
      if(h3.textContent!==wanted)h3.textContent=wanted;
    }
    const n=itemCount(section);
    if(count&&n){const wanted=`${n} Positionen`;if(count.textContent!==wanted)count.textContent=wanted}

    addPromise(section,m);
    restyleProvenance(section);
    decorateSearch(section,m);
    return decorateCategories(section,d);
  }

  function cancelSignatureRetry(d){
    if(d?._hoyMenuSignatureRetryTimer)clearTimeout(d._hoyMenuSignatureRetryTimer);
    if(d)d._hoyMenuSignatureRetryTimer=0;
  }

  function enhanceSignatureMenu(p,d){
    const section=d?.querySelector('#profile-menu');
    if(!p||!section)return;
    cancelSignatureRetry(d);
    if(applySignatureState(section,p,d))return;

    // WebKit can deliver MutationObserver callbacks for mutations made by the callback itself.
    // A bounded timer retry avoids a self-triggering microtask loop while still covering late menu data.
    let attempts=0;
    const retry=()=>{
      d._hoyMenuSignatureRetryTimer=0;
      if(!d.open||!section.isConnected)return;
      attempts+=1;
      if(applySignatureState(section,p,d))return;
      if(attempts<12)d._hoyMenuSignatureRetryTimer=setTimeout(retry,Math.min(240,30*attempts));
    };
    d._hoyMenuSignatureRetryTimer=setTimeout(retry,0);
  }

  const baseOpenDetail213Menu=openDetail;
  openDetail=function(id){
    baseOpenDetail213Menu(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    if(p)enhanceSignatureMenu(p,d);
  };

  let refreshTimer2193=0;
  window.addEventListener('hoy:profile-menu-refreshed',e=>{
    const id=Number(e.detail?.restaurantId||0);
    if(!id)return;
    clearTimeout(refreshTimer2193);
    refreshTimer2193=setTimeout(()=>{
      const d=document.getElementById('detail');
      if(!d?.open||Number(d.dataset.restaurantId||0)!==id)return;
      const section=d.querySelector('#profile-menu');
      const p=DATA.find(x=>Number(x.id)===id);
      if(!section||!p)return;
      const m=menuFor(p);
      const alreadyDecorated=section.classList.contains('menu-signature')
        &&!!section.querySelector('.menu-signature-categories')
        &&(!m?.localized||!!section.querySelector('.menu-signature-promise'));
      if(alreadyDecorated)return;
      enhanceSignatureMenu(p,d);
    },0);
  });
})();
/* HOY 2.13 — signature localized menu experience */
(function(){
  const COPY={
    de:{title:'Speisekarte auf Deutsch',partial:'Auswahl auf Deutsch',promise:'Für dich auf Deutsch',proof:'Kulinarisch übersetzt · Originalpreise unverändert',body:'HOY überträgt Gerichte sinngemäß statt Wort für Wort. Spanische Eigennamen bleiben erhalten, wenn sie zum Gericht gehören.',search:'Speisekarte durchsuchen …',checked:'HOY redaktionell geprüft'},
    en:{title:'Menu in English',partial:'Selection in English',promise:'In English for you',proof:'Culinary translation · original prices unchanged',body:'HOY translates dishes by culinary meaning rather than word for word. Spanish names stay where they are part of the dish.',search:'Search this menu …',checked:'Editorially reviewed by HOY'},
    es:{title:'Carta en español',partial:'Selección en español',promise:'En español para ti',proof:'Adaptación culinaria · precios originales sin cambios',body:'HOY adapta los platos por su sentido culinario, no palabra por palabra. Los nombres propios se mantienen cuando forman parte del plato.',search:'Buscar en esta carta …',checked:'Revisado por HOY'}
  };

  function text(v){return String(v||'').trim()}
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

  function decorateCategories(section,d){
    const cats=[...section.querySelectorAll('.menu-cat')];
    cats.forEach(cat=>{
      const h=cat.querySelector('h4');
      if(!h||h.querySelector('.menu-cat-count'))return;
      const count=cat.querySelectorAll('[data-menu-item]').length;
      const span=document.createElement('span');
      span.className='menu-cat-count';
      span.textContent=`${count} ${count===1?'Position':'Positionen'}`;
      h.appendChild(span);
    });

    const nav=section.querySelector('.menu-category-nav');
    if(!nav||!cats.length)return false;
    nav.classList.add('menu-signature-categories');
    const buttons=[...nav.querySelectorAll('button')];
    buttons.forEach((btn,i)=>{
      btn.addEventListener('click',()=>buttons.forEach((b,j)=>b.classList.toggle('active',i===j)));
    });
    if(buttons[0]&&!buttons.some(b=>b.classList.contains('active')))buttons[0].classList.add('active');

    d._hoyMenuSignatureObserver?.disconnect?.();
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(!visible)return;
        const idx=cats.indexOf(visible.target);
        if(idx<0)return;
        buttons.forEach((b,j)=>b.classList.toggle('active',j===idx));
        buttons[idx]?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
      },{root:d,rootMargin:'-138px 0px -64% 0px',threshold:[0,.08,.2,.4]});
      cats.forEach(cat=>observer.observe(cat));
      d._hoyMenuSignatureObserver=observer;
    }
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

  function enhanceSignatureMenu(p,d){
    const section=d?.querySelector('#profile-menu');
    if(!p||!section)return;
    const m=menuFor(p);
    section.classList.add('menu-signature');
    if(m?.localized)section.classList.add('menu-signature-localized');
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
    if(decorateCategories(section,d))return;

    const observer=new MutationObserver(()=>{
      decorateSearch(section,m);
      restyleProvenance(section);
      if(decorateCategories(section,d))observer.disconnect();
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
})();

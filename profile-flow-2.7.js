/* HOY 2.7 — continuous restaurant profile with inline localized menu */
(function(){
  function wireInlineMenu(root){
    const input=root.querySelector('[data-menu-search]');
    const wrap=root.querySelector('[data-inline-menu-wrap]');
    if(input){
      input.oninput=e=>{
        const q=e.target.value.toLowerCase().trim();
        if(q)wrap?.classList.remove('is-collapsed');
        root.querySelectorAll('[data-menu-item]').forEach(x=>x.style.display=!q||String(x.dataset.menuText||'').includes(q)?'grid':'none');
        root.querySelectorAll('.menu-cat').forEach(cat=>{const visible=[...cat.querySelectorAll('[data-menu-item]')].some(x=>x.style.display!=='none');cat.style.display=visible?'':'none'});
      };
    }
    root.querySelector('[data-menu-expand]')?.addEventListener('click',e=>{
      const collapsed=wrap.classList.toggle('is-collapsed');
      e.currentTarget.textContent=collapsed?'Komplette Speisekarte anzeigen':'Speisekarte einklappen';
      e.currentTarget.setAttribute('aria-expanded',String(!collapsed));
    });
  }
  function offerInline(p){
    const o=(isClaimed(p)&&['pro','business'].includes(claimDraft.activePlan))?claimDraft.offer:null;
    if(o?.title)return `<section class="profile-section"><div class="profile-section-head"><small>AKTUELL</small><h3>Angebote</h3></div><div class="owner-offer"><b>${esc(o.title)}</b><p>${esc(o.description||'')}</p></div></section>`;
    return '';
  }
  function operatorHoursBlock(p){
    const meta=window.hoyLiveHoursMeta?.(p)||null;
    const h=effectiveValue(p,'hours')||'Noch nicht bestätigt';
    return `<div class="profile-hours ${meta?.operator?'operator-confirmed':''}"><div><small>ÖFFNUNGSZEITEN</small><strong>${esc(h)}</strong>${meta?.notice?`<span>${esc(meta.notice)}</span>`:''}</div><div class="hours-proof">${meta?.operator?`<b>✓ Vom Betrieb bestätigt</b><small>${meta.updated?'Aktualisiert '+esc(meta.updated):'Live gepflegt'}</small>`:`<b>HOY geprüft</b><small>Kann saisonal abweichen</small>`}</div></div>`;
  }
  function infoInline(p){
    return `<section class="profile-section profile-info-section" id="profile-info"><div class="profile-section-head"><small>DETAILS</small><h3>Gut zu wissen</h3></div><div class="facts"><div class="fact"><b>Adresse</b><span>${esc(effectiveValue(p,'address'))}</span></div><div class="fact"><b>Telefon</b><span>${esc(effectiveValue(p,'phone'))}</span></div><div class="fact"><b>Website</b><span>${cleanSite(p)?`<a href="${esc(cleanSite(p))}" target="_blank" rel="noopener">Website öffnen ↗</a>`:'Nicht verifiziert'}</span></div><div class="fact"><b>Datenstatus</b><span>${isClaimed(p)?'Vom Betreiber bestätigt':'HOY geprüft / noch nicht vom Betreiber übernommen'}</span></div></div></section>`;
  }
  function menuInline(p){
    const m=menuFor(p);const count=(m?.categories||[]).reduce((n,[,items])=>n+(items?.length||0),0);const collapse=count>14;
    return `<section class="profile-section profile-menu-section" id="profile-menu"><div class="profile-section-head"><div><small>HOY SPEISEKARTE</small><h3>${m?.localized?'In deiner Sprache':'Speisekarte'}</h3></div><span class="profile-menu-count">${count?`${count} Positionen`:menuStatusLabel(m)}</span></div><div data-inline-menu-wrap class="profile-inline-menu ${collapse?'is-collapsed':''}">${menuPanel(p)}</div>${collapse?'<button class="inline-menu-expand" type="button" data-menu-expand aria-expanded="false">Komplette Speisekarte anzeigen</button>':''}</section>`;
  }
  function transformProfile(p,d){
    if(!p||!d)return;
    const oldTabs=d.querySelector('.tabs');const oldContent=d.querySelector('[data-tab-content]');
    if(!oldTabs||!oldContent)return;
    d.classList.add('continuous-profile');
    d.querySelector('.showcase-menu-preview')?.remove();
    if(window.hoyLiveHoursMeta?.(p)?.operator){
      d.querySelector('.showcase-warning')?.remove();
      const minis=d.querySelectorAll('.showcase-snapshot .showcase-mini');
      if(minis[1]){minis[1].querySelector('strong').textContent='Vom Betrieb bestätigt';minis[1].querySelector('span').textContent=effectiveValue(p,'hours')||'Live gepflegt'}
    }
    const nav=document.createElement('nav');nav.className='profile-anchor-nav';nav.setAttribute('aria-label','Restaurantprofil');nav.innerHTML='<a href="#profile-about">Überblick</a><a href="#profile-menu">Speisekarte</a><a href="#profile-info">Infos</a>';
    const flow=document.createElement('div');flow.className='profile-continuous-flow';flow.innerHTML=`<section class="profile-section profile-about-section" id="profile-about"><div class="profile-section-head"><small>ÜBER DAS RESTAURANT</small><h3>${esc(p.name)}</h3></div><p class="desc">${esc(effectiveValue(p,'description'))}</p>${operatorHoursBlock(p)}</section>${menuInline(p)}${offerInline(p)}${infoInline(p)}`;
    oldTabs.replaceWith(nav);oldContent.replaceWith(flow);
    wireInlineMenu(flow);
    nav.querySelectorAll('a').forEach(a=>a.onclick=e=>{e.preventDefault();const target=d.querySelector(a.getAttribute('href'));target?.scrollIntoView({behavior:'smooth',block:'start'})});
  }
  const baseOpenDetail27=openDetail;
  openDetail=function(id){
    baseOpenDetail27(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));const d=document.getElementById('detail');
    if(p)transformProfile(p,d);
  };
})();

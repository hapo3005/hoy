/* HOY 2.40.3 — keep Family result cards structurally and visually consistent. */
(function(){
  if(window.__hoyFamilyCardConsistency240)return;
  window.__hoyFamilyCardConsistency240=true;

  const api=window.hoyFamilyPlaygrounds240;
  if(!api)return;
  const esc240=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active=()=>!!state?.family&&state.family!=='all';

  function familyBadges(p){
    const rows=api.primaryBadges?.(p,2)||[];
    return rows.length?`<div class="family240-card-badges" data-family240-card-badges>${rows.map(x=>`<span class="${esc240(x.tone||'')}">${esc240(x.label)}</span>`).join('')}</div>`:'';
  }

  function harmonize(root){
    if(!root)return;
    root.querySelectorAll('.list-card[data-open]').forEach(card=>{
      card.querySelectorAll('[data-family240-card-badges],.family240-card-badges').forEach(x=>x.remove());
      if(!active())return;
      const id=Number(card.dataset.open);
      const p=(DATA||[]).find(x=>Number(x.id)===id);
      const f=api.familyFor?.(p);
      if(!f)return;
      const badges=familyBadges(p);
      const copy=card.querySelector('.decision-copy')||card.children[1]||card;
      const verdict=copy.querySelector('.decision280-card-verdict')||card.querySelector(':scope > .decision280-card-verdict');
      if(badges){
        if(verdict&&verdict.parentElement===copy)verdict.insertAdjacentHTML('beforebegin',badges);
        else copy.insertAdjacentHTML('beforeend',badges);
      }
      /* Research drafts keep the normal decision-copy content, while the verdict remains
         its own card grid item. This preserves the established compact shell contract. */
      if(card.classList.contains('family240-research-card')&&verdict&&verdict.parentElement!==card)card.appendChild(verdict);
    });
  }

  const baseListCard2403=listCard;
  listCard=function(p){
    if(p?.__family240_preview_profile!==true)return baseListCard2403(p);
    const venue=typeof meta==='function'?(meta(p)||p.area||''):p.area||'';
    const draft=(state?.lang==='en'?'RESEARCH DRAFT · NOT LIVE':state?.lang==='es'?'BORRADOR · NO PUBLICADO':'RESEARCH-DRAFT · NICHT LIVE');
    const preview=(state?.lang==='en'?'PREVIEW':state?.lang==='es'?'VISTA PREVIA':'VORSCHAU');
    return `<article class="list-card family240-research-card" data-open="${Number(p.id)}">
      <div class="list-art family240-research-art"><span>${esc240(preview)}</span></div>
      <div class="decision-copy"><h3>${esc240(p.name)}</h3><p>${esc240(venue)}</p><span class="family240-research-draft" data-family240-research-draft>${esc240(draft)}</span>${familyBadges(p)}</div>
      <span class="family240-research-lock" hidden aria-hidden="true"></span>
    </article>`;
  };

  const baseDiscover2403=discover;
  discover=function(){
    const html=baseDiscover2403();
    const shell=document.createElement('div');shell.innerHTML=html;
    const root=shell.firstElementChild;
    if(!root)return html;
    harmonize(root);
    return root.outerHTML;
  };

  window.hoyFamilyCardConsistency240={harmonize};
})();

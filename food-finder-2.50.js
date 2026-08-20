/* HOY 2.50.0 — global dish search over guest-approved native menus only.
 * Competitive principle: do not widen data truth. This layer consumes only
 * menu-native-standard guest output and existing HOY NOW / decision signals.
 */
(function(){
  'use strict';
  if(window.__hoyFoodFinder250)return;
  window.__hoyFoodFinder250=true;
  window.hoyFoodFinderVersion='2.50.0';

  const MAX_RESULTS=40;
  const ui={query:'',openOnly:false,sort:'best'};
  const copy={
    de:{eyebrow:'HOY FOOD FINDER',title:'Finde das Gericht. Nicht nur das Restaurant.',lead:'HOY durchsucht freigegebene Speisekarten restaurantübergreifend und verbindet Preis mit dem, was jetzt wirklich nutzbar ist.',placeholder:'z. B. Paella, Burger, glutenfrei …',open:'Jetzt geöffnet',best:'Beste jetzt',price:'Günstigste zuerst',empty:'Noch kein passender, freigegebener Menütreffer.',results:'Treffer',unknown:'Preis nicht eindeutig vergleichbar',openNow:'Jetzt geöffnet',checkHours:'Öffnungszeiten prüfen'},
    es:{eyebrow:'HOY FOOD FINDER',title:'Encuentra el plato. No solo el restaurante.',lead:'HOY busca entre cartas aprobadas y combina precio con lo que realmente puedes usar ahora.',placeholder:'p. ej. paella, hamburguesa, sin gluten …',open:'Abierto ahora',best:'Mejor ahora',price:'Más barato primero',empty:'Todavía no hay un resultado de carta aprobado.',results:'resultados',unknown:'Precio no comparable con seguridad',openNow:'Abierto ahora',checkHours:'Comprobar horario'},
    en:{eyebrow:'HOY FOOD FINDER',title:'Find the dish. Not just the restaurant.',lead:'HOY searches approved menus across restaurants and combines price with what is actually usable now.',placeholder:'e.g. paella, burger, gluten-free …',open:'Open now',best:'Best now',price:'Lowest price first',empty:'No matching approved menu item yet.',results:'results',unknown:'Price is not safely comparable',openNow:'Open now',checkHours:'Check opening hours'}
  };

  const locale=()=>['de','es','en'].includes(state?.lang)?state.lang:'de';
  const esc250=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

  function comparablePrice(value){
    const raw=String(value??'').trim();
    if(!raw)return null;
    const compact=raw.replace(/\s/g,'');
    const m=compact.match(/^(\d{1,4}(?:[.,]\d{1,2})?)(?:€|EUR)?$/i);
    if(!m)return null;
    const n=Number(m[1].replace(',','.'));
    return Number.isFinite(n)&&n>=0?n:null;
  }

  function menuEligible(menu,lang=locale()){
    if(!menu||menu.nativeMenu!==true||menu.localized!==true)return false;
    if(menu.guestAvailability!=='in_app_native'||menu.locale!==lang)return false;
    if(menu.languageCoverage?.complete!==true)return false;
    if(!Array.isArray(menu.categories)||!menu.categories.length)return false;
    return true;
  }

  function restaurantFor(id){return (DATA||[]).find(p=>Number(p.id)===Number(id))||null}
  function nowStatus(p,now=new Date()){return window.hoyNowStatus219For?.(p,now)||null}
  function decisionScore(p,now=new Date()){
    const result=window.hoyDecision280For?.(p,now);
    return Number.isFinite(Number(result?.score))?Number(result.score):0;
  }

  function catalog(lang=locale()){
    const rows=[];
    for(const p of DATA||[]){
      const menu=MENUS?.[Number(p.id)]||null;
      if(!menuEligible(menu,lang))continue;
      for(const category of menu.categories||[]){
        const categoryName=String(category?.[0]??'').trim();
        const items=Array.isArray(category?.[1])?category[1]:[];
        for(const item of items){
          const name=String(item?.[0]??'').trim();
          if(!name)continue;
          const priceText=String(item?.[1]??'').trim();
          const originalName=String(item?.[2]??'').trim();
          const description=String(item?.[3]??'').trim();
          rows.push({
            restaurantId:Number(p.id),restaurant:p,category:categoryName,name,priceText,
            price:comparablePrice(priceText),originalName,description,
            haystack:normalize([name,originalName,description,categoryName,p.name,p.area].filter(Boolean).join(' '))
          });
        }
      }
    }
    return rows;
  }

  function search({query='',openOnly=false,sort='best',limit=MAX_RESULTS,now=new Date(),lang=locale()}={}){
    const needle=normalize(query);
    let rows=catalog(lang).filter(row=>!needle||row.haystack.includes(needle));
    if(openOnly)rows=rows.filter(row=>nowStatus(row.restaurant,now)?.state==='open');
    rows=rows.map((row,index)=>({...row,index,now:nowStatus(row.restaurant,now),decision:decisionScore(row.restaurant,now)}));
    rows.sort((a,b)=>{
      if(sort==='price'){
        const ap=a.price==null?Number.POSITIVE_INFINITY:a.price;
        const bp=b.price==null?Number.POSITIVE_INFINITY:b.price;
        if(ap!==bp)return ap-bp;
        if(b.decision!==a.decision)return b.decision-a.decision;
      }else{
        if(b.decision!==a.decision)return b.decision-a.decision;
        const aOpen=a.now?.state==='open'?1:0,bOpen=b.now?.state==='open'?1:0;
        if(bOpen!==aOpen)return bOpen-aOpen;
        const ap=a.price==null?Number.POSITIVE_INFINITY:a.price;
        const bp=b.price==null?Number.POSITIVE_INFINITY:b.price;
        if(ap!==bp)return ap-bp;
      }
      const rest=String(a.restaurant?.name||'').localeCompare(String(b.restaurant?.name||''),lang);
      return rest||String(a.name).localeCompare(String(b.name),lang)||a.index-b.index;
    });
    return rows.slice(0,Math.max(0,Number(limit)||MAX_RESULTS));
  }

  function resultCard(row,c){
    const status=row.now?.state==='open'?`<span class="food250-open">${esc250(c.openNow)}</span>`:`<span class="food250-hours">${esc250(c.checkHours)}</span>`;
    const price=row.priceText?`<strong>${esc250(row.priceText)}</strong>`:`<small>${esc250(c.unknown)}</small>`;
    return `<button type="button" class="food250-result" data-food250-open="${Number(row.restaurantId)}"><span class="food250-result-main"><b>${esc250(row.name)}</b><small>${esc250(row.restaurant?.name||'')} · ${esc250(row.category||'')}</small><span>${status}</span></span><span class="food250-price">${price}</span><i aria-hidden="true">→</i></button>`;
  }

  function block(){
    const c=copy[locale()];
    const rows=search(ui);
    return `<section class="food250" data-food250-root>
      <div class="food250-head"><div><span>${c.eyebrow}</span><h2>${c.title}</h2><p>${c.lead}</p></div></div>
      <div class="food250-controls">
        <label class="food250-search"><span aria-hidden="true">⌕</span><input data-food250-query value="${esc250(ui.query)}" placeholder="${esc250(c.placeholder)}" autocomplete="off"></label>
        <button type="button" class="${ui.openOnly?'active':''}" data-food250-open-only aria-pressed="${ui.openOnly?'true':'false'}">${c.open}</button>
        <select data-food250-sort aria-label="Sortierung"><option value="best" ${ui.sort==='best'?'selected':''}>${c.best}</option><option value="price" ${ui.sort==='price'?'selected':''}>${c.price}</option></select>
      </div>
      <div class="food250-meta"><strong>${rows.length}</strong> ${c.results}</div>
      <div class="food250-results">${rows.length?rows.map(r=>resultCard(r,c)).join(''):`<div class="food250-empty">${c.empty}</div>`}</div>
    </section>`;
  }

  function inject(html){
    const shell=document.createElement('div');shell.innerHTML=html;const root=shell.firstElementChild;if(!root)return html;
    if(root.querySelector('[data-food250-root]'))return root.outerHTML;
    if(!catalog().length)return root.outerHTML;
    const live=root.querySelector('[data-live239-root]');
    const decision=root.querySelector('[data-decision280-home]');
    const hero=root.querySelector('.journey-hero')||root.firstElementChild;
    const anchor=live||decision||hero;
    if(anchor)anchor.insertAdjacentHTML('afterend',block());
    return root.outerHTML;
  }

  const baseHome250=home;
  home=function(){return inject(baseHome250())};

  function rerender(){if(state?.view==='home'&&typeof render==='function')render()}
  document.addEventListener('input',e=>{
    const input=e.target.closest?.('[data-food250-query]');if(!input)return;
    ui.query=input.value||'';rerender();
    requestAnimationFrame(()=>{const next=document.querySelector('[data-food250-query]');if(next){next.focus();next.setSelectionRange(ui.query.length,ui.query.length)}});
  });
  document.addEventListener('change',e=>{
    const sort=e.target.closest?.('[data-food250-sort]');if(!sort)return;
    ui.sort=sort.value==='price'?'price':'best';rerender();
  });
  document.addEventListener('click',e=>{
    const toggle=e.target.closest?.('[data-food250-open-only]');
    if(toggle){ui.openOnly=!ui.openOnly;rerender();return}
    const open=e.target.closest?.('[data-food250-open]');
    if(open&&typeof openDetail==='function')openDetail(Number(open.dataset.food250Open));
  });
  window.addEventListener('hoy:menus-ready',()=>rerender());

  window.hoyFoodFinder250={version:'2.50.0',normalize,comparablePrice,menuEligible,catalog,search,state:ui,restaurantFor};
  rerender();
})();

/* HOY 1.7 — Signature-driven discovery without adding visual clutter */
(function(){
  state.decision=state.decision||'all';

  /* These filters are intentionally derived from the researched Signature corpus.
     They are not generic cuisine claims and only appear when at least one live profile matches. */
  const DECISION_FILTERS=[
    {key:'water',label:'Am Wasser',test:/wasser|meer|strand|hafen|küste|beach|mar menor|meerblick|marina|playa|cala reona/i},
    {key:'fish',label:'Fisch & Seafood',test:/fisch|meeresfr|seafood|marisco|pescad/i},
    {key:'rice',label:'Arroces',test:/\breis|arroz|arroces|paella/i},
    {key:'caldero',label:'Caldero',test:/caldero/i},
    {key:'sunset',label:'Sunset',test:/sunset|sonnenuntergang|atardecer/i},
    {key:'chiringuito',label:'Chiringuito',test:/chiringuito/i},
    {key:'grill',label:'Grill',test:/grill|fleisch|steak|brasa|carne/i},
    {key:'japan',label:'Japanisch',test:/japan|sushi|nikkei/i}
  ];

  function signatureSearchText(p){
    const tags=Array.isArray(p?.signature_tags)?p.signature_tags.join(' '):'';
    return [p?.signature_title,p?.signature_text,tags].filter(Boolean).join(' ').toLowerCase();
  }

  function decisionKeys(p){
    const text=signatureSearchText(p);
    return DECISION_FILTERS.filter(x=>x.test.test(text)).map(x=>x.key);
  }

  function decisionHint(p){
    const tags=(Array.isArray(p?.signature_tags)?p.signature_tags:[]).filter(Boolean).map(String);
    if(tags.length)return tags.slice(0,2).join(' · ');
    if(p?.signature_title)return String(p.signature_title);
    return serviceText(p);
  }

  function visibleDecisionFilters(){
    return DECISION_FILTERS.filter(f=>DATA.some(p=>decisionKeys(p).includes(f.key)));
  }

  filtered=function(){
    const q=state.query.trim().toLowerCase();
    return DATA.filter(p=>{
      const searchable=[p.name,p.area,p.meta,p.description,p.signature_title,p.signature_text,...(Array.isArray(p.signature_tags)?p.signature_tags:[])].filter(Boolean).join(' ').toLowerCase();
      const queryOk=!q||searchable.includes(q);
      const serviceOk=state.service==='all'||
        (state.service==='reservation'&&yes(p.reservation))||
        (state.service==='pickup'&&yes(p.pickup))||
        (state.service==='delivery'&&yes(p.delivery));
      const decisionOk=state.decision==='all'||decisionKeys(p).includes(state.decision);
      return queryOk&&serviceOk&&decisionOk;
    });
  };

  const baseListCard=listCard;
  listCard=function(p){
    if(!p?.signature_title&&!p?.signature_tags)return baseListCard(p);
    const m=meta(p);
    return `<article class="list-card decision-card" data-open="${p.id}"><div class="list-art" style="position:relative;overflow:hidden">${mediaMarkup(p)}</div><div class="decision-copy"><h3>${esc(p.name)}</h3>${m?`<p>${esc(m)}</p>`:''}<div class="decision-hint">${esc(decisionHint(p))}</div></div><button class="heart2" data-fav="${p.id}" aria-label="${state.favorites.has(p.id)?'Aus Favoriten entfernen':'Zu Favoriten hinzufügen'}">${icons.heart}</button></article>`;
  };

  discover=function(){
    const list=filtered();
    const decisions=visibleDecisionFilters();
    if(state.decision!=='all'&&!decisions.some(x=>x.key===state.decision))state.decision='all';
    const decisionRow=decisions.length?`<div class="decision-filter"><div class="decision-filter-label"><span>WOFÜR GEHST DU LOS?</span><small>Aus den recherchierten Signature-Merkmalen</small></div><div class="decisionline"><button class="${state.decision==='all'?'active':''}" data-decision="all">Alles</button>${decisions.map(x=>`<button class="${state.decision===x.key?'active':''}" data-decision="${x.key}">${esc(x.label)}</button>`).join('')}</div></div>`:'';
    return `<section><div class="head"><div class="head-top"><div class="brand" style="color:var(--navy)"><b>H<span>O</span><em>Y</em></b><small>LA MANGA</small></div><button class="round" data-lang>${state.lang.toUpperCase()}</button></div><h1>Entdecken.</h1><p>Restaurants rund um La Manga und Cabo de Palos – jetzt auch danach, warum sie zu deinem Abend passen.</p><div class="searchline"><input id="q" placeholder="Restaurant, Gericht, Stimmung oder Ort …" value="${esc(state.query)}"><button>${icons.compass}</button></div></div><div class="filterline">${[['all','Alle'],['reservation','Reservierung'],['pickup','Abholung'],['delivery','Lieferung']].map(([k,l])=>`<button class="${state.service===k?'active':''}" data-filter="${k}">${l}</button>`).join('')}</div>${decisionRow}<div class="result-count">${list.length} ${list.length===1?'Ort':'Orte'} passen zu deiner Auswahl</div><div class="list">${list.map(listCard).join('')||'<div class="empty"><h2>Nichts gefunden.</h2><p>Ändere Suche oder Filter.</p><button data-decision-reset>Filter zurücksetzen</button></div>'}</div></section>`;
  };

  const baseWire=wire;
  wire=function(){
    baseWire();
    document.querySelectorAll('[data-decision]').forEach(b=>b.onclick=()=>{state.decision=b.dataset.decision;render()});
    document.querySelectorAll('[data-decision-reset]').forEach(b=>b.onclick=()=>{state.query='';state.service='all';state.decision='all';render()});
  };
})();

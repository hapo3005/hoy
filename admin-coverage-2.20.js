/* HOY Control 2.20 — internal decision-data coverage dashboard */
(function(){
  const VERSION='2.20.0';
  const DAY=864e5;
  const coverage={loaded:false,loading:false,error:'',liveHours:[],specialHours:[],offers:[],translations:[]};
  window.hoyCoverageVersion220=VERSION;

  const baseLoadData220=loadData;
  const baseRenderQuality220=renderQuality;
  const baseWire220=wire;

  const clean=v=>String(v??'').trim();
  const idOf=v=>Number(v?.restaurant_id ?? v?.id);
  const pct=(n,d)=>d?Math.round(n/d*100):0;
  const fresh=(v,days=90)=>{if(!v)return false;const t=new Date(v).getTime();return Number.isFinite(t)&&Date.now()-t<=days*DAY};
  const published=()=>state.restaurants.filter(r=>r.is_published);
  const officialMenu=r=>menuFor(r.id).some(x=>x.is_official===true);
  const structuredMenu=r=>itemsFor(r.id).length>0;
  const germanCount=r=>coverage.translations.filter(x=>Number(x.restaurant_id)===Number(r.id)).length;
  const liveFor=r=>coverage.liveHours.find(x=>idOf(x)===Number(r.id))||null;
  const specialFor=r=>coverage.specialHours.filter(x=>idOf(x)===Number(r.id));
  const currentFor=r=>coverage.offers.filter(x=>idOf(x)===Number(r.id));
  const svcFor=r=>relOne(r.restaurant_services);
  const hasServiceRow=r=>Object.keys(svcFor(r)||{}).length>0;
  const knownService=r=>['reservation_state','pickup_state','delivery_state'].some(k=>clean(svcFor(r)?.[k])&&svcFor(r)[k]!=='unknown');
  const confirmedService=r=>!!svcFor(r)?.confirmed_at;
  const baseHours=r=>!!clean(r.hours_text);

  async function loadCoverageData220(){
    if(coverage.loading)return;
    coverage.loading=true;coverage.error='';
    try{
      const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      const now=new Date().toISOString();
      const [live,special,offers,translations]=await Promise.all([
        sb.from('restaurant_live_hours').select('restaurant_id,confirmed_at,updated_at'),
        sb.from('restaurant_special_hours').select('restaurant_id,service_date,is_closed,updated_at').gte('service_date',today),
        sb.from('offers').select('id,restaurant_id,offer_type,status,starts_at,ends_at,publisher_kind,published_at').eq('status','published').gt('ends_at',now),
        sb.from('menu_item_translations').select('menu_item_id,locale,translation_status').eq('locale','de').eq('translation_status','curated')
      ]);
      const fail=[live,special,offers,translations].find(x=>x.error);if(fail?.error)throw fail.error;
      const itemRestaurant=new Map(state.menuItems.map(x=>[String(x.id),Number(x.restaurant_id)]));
      coverage.liveHours=live.data||[];
      coverage.specialHours=special.data||[];
      coverage.offers=offers.data||[];
      coverage.translations=(translations.data||[]).map(x=>({...x,restaurant_id:itemRestaurant.get(String(x.menu_item_id))})).filter(x=>Number.isInteger(x.restaurant_id));
      coverage.loaded=true;
    }catch(err){coverage.error=err?.message||String(err);coverage.loaded=false;console.warn('HOY coverage data unavailable',err)}finally{coverage.loading=false}
  }

  loadData=async function(){
    await baseLoadData220();
    coverage.loaded=false;
    await loadCoverageData220();
  };

  function scoreInfo(r){
    const hasLive=!!liveFor(r),hasHours=baseHours(r),hasOfficial=officialMenu(r),hasItems=structuredMenu(r),de=germanCount(r)>0;
    const hasKnownService=knownService(r),svcConfirmed=confirmedService(r);
    const sourceFresh=fresh(r.source_checked_at,90),signature=r.signature_status==='researched';
    let score=0;
    score+=hasLive?30:hasHours?18:0;
    score+=de?25:hasItems?20:hasOfficial?10:0;
    score+=svcConfirmed?15:hasKnownService?10:hasServiceRow(r)?4:0;
    score+=clean(r.phone)?6:0;
    score+=clean(r.website)?4:0;
    score+=signature?10:0;
    score+=sourceFresh?10:r.source_checked_at?5:0;
    const candidates=[];
    if(!hasHours&&!hasLive)candidates.push({key:'hours',label:'Öffnungszeiten recherchieren',detail:'größter direkter Hebel für „jetzt“',impact:30});
    else if(!hasLive)candidates.push({key:'live',label:'Aktualität erhöhen',detail:'Basiszeiten vorhanden · Betreiberbestätigung später',impact:12});
    if(!hasOfficial)candidates.push({key:'menu-source',label:'Offizielle Menüquelle finden',detail:'Menüzugang für die Gastentscheidung',impact:25});
    else if(!hasItems)candidates.push({key:'menu-import',label:'Menü strukturieren',detail:'offizielle Quelle ist bereits vorhanden',impact:15});
    else if(!de)candidates.push({key:'menu-de',label:'Menü auf Deutsch kuratieren',detail:'strukturiertes Menü ist bereits vorhanden',impact:5});
    if(!hasKnownService)candidates.push({key:'services',label:'Services prüfen',detail:'Reservierung · Abholung · Lieferung',impact:15});
    else if(!svcConfirmed)candidates.push({key:'services-confirm',label:'Services bestätigen lassen',detail:'vorhanden, aber noch nicht Betreiber-bestätigt',impact:5});
    if(!signature)candidates.push({key:'signature',label:'Profilnutzen schärfen',detail:'Warum lohnt sich dieser Ort?',impact:10});
    if(!sourceFresh)candidates.push({key:'freshness',label:'Quelle erneut prüfen',detail:'Basisdaten älter als 90 Tage',impact:10});
    if(!clean(r.phone))candidates.push({key:'phone',label:'Telefon ergänzen',detail:'direkter Kontakt fehlt',impact:6});
    if(!clean(r.website))candidates.push({key:'website',label:'Website ergänzen',detail:'offizieller Direktweg fehlt',impact:4});
    candidates.sort((a,b)=>b.impact-a.impact);
    return {score,hasLive,hasHours,hasOfficial,hasItems,de,hasKnownService,svcConfirmed,sourceFresh,signature,next:candidates[0]||{key:'ready',label:'Decision-ready',detail:'kein größerer Datenbaustein offen',impact:0}};
  }

  function summary220(){
    const rows=published(),total=rows.length;
    const count=fn=>rows.filter(fn).length;
    return {
      total,
      hours:count(r=>baseHours(r)||!!liveFor(r)),
      liveHours:count(r=>!!liveFor(r)),
      officialMenus:count(officialMenu),
      structuredMenus:count(structuredMenu),
      germanMenus:count(r=>germanCount(r)>0),
      services:count(hasServiceRow),
      knownServices:count(knownService),
      confirmedServices:count(confirmedService),
      currentContent:count(r=>currentFor(r).length>0),
      specialHours:count(r=>specialFor(r).length>0),
      freshSources:count(r=>fresh(r.source_checked_at,90))
    };
  }
  window.hoyCoverageSummary220=summary220;

  function scoreMarkup220(info){
    const cl=info.score>=75?'':info.score>=50?'warn':'bad';
    return `<div class="coverage-score ${cl}"><div class="track"><i style="width:${info.score}%"></i></div><b>${info.score}</b></div>`;
  }
  function tags220(r,i){
    const tags=[];
    tags.push(`<span class="coverage-tag ${i.hasLive?'good':i.hasHours?'warn':''}">${i.hasLive?'Livezeiten':i.hasHours?'Basiszeiten':'keine Zeiten'}</span>`);
    tags.push(`<span class="coverage-tag ${i.de?'good':i.hasItems?'warn':''}">${i.de?'DE-Menü':i.hasItems?'Menü strukturiert':i.hasOfficial?'Menüquelle':'kein Menü'}</span>`);
    tags.push(`<span class="coverage-tag ${i.svcConfirmed?'good':i.hasKnownService?'warn':''}">${i.svcConfirmed?'Services bestätigt':i.hasKnownService?'Services vorhanden':'Services offen'}</span>`);
    if(currentFor(r).length)tags.push('<span class="coverage-tag good">Aktuelles live</span>');
    return tags.join('');
  }
  function priorityGroups220(rows){
    const map=new Map();
    rows.forEach(({i})=>{const k=i.next.key;if(k==='ready')return;const x=map.get(k)||{...i.next,count:0};x.count++;map.set(k,x)});
    return [...map.values()].sort((a,b)=>b.count-a.count||b.impact-a.impact).slice(0,5);
  }
  function rowMarkup220(x){
    const {r,i}=x;
    return `<tr data-coverage-row data-gap="${esc(i.next.key)}" data-search="${esc([r.name,r.area,r.municipality,i.next.label].join(' ').toLowerCase())}"><td class="name-cell"><b>${esc(r.name)}</b><small>${esc(r.area||'')}${r.municipality?' · '+esc(r.municipality):''}</small></td><td>${scoreMarkup220(i)}</td><td><div class="coverage-next"><strong>${esc(i.next.label)}</strong><small>${esc(i.next.detail)}${i.next.impact?` · +${i.next.impact} Potenzial`:''}</small></div></td><td><div class="coverage-tags">${tags220(r,i)}</div></td><td><button class="ghost" data-edit="${Number(r.id)}">Öffnen</button></td></tr>`;
  }

  renderQuality=function(){
    if(!coverage.loaded&&!coverage.loading){loadCoverageData220().then(()=>{if(state.view==='quality')render()})}
    if(coverage.loading&&!coverage.loaded)return pageHead('Content Ops','Decision Coverage.','Welche Daten HOY für eine schnelle „heute, jetzt, hier“-Entscheidung wirklich braucht.')+'<section class="coverage-panel"><div class="coverage-empty">Coverage wird aus Supabase geladen …</div></section>';
    if(coverage.error&&!coverage.loaded)return baseRenderQuality220()+`<div class="alert" style="margin-top:16px"><b>Coverage-Zusatzdaten konnten nicht geladen werden:</b> ${esc(coverage.error)}</div>`;
    const s=summary220(),rows=published().map(r=>({r,i:scoreInfo(r)})).sort((a,b)=>a.i.score-b.i.score||b.i.next.impact-a.i.next.impact||a.r.name.localeCompare(b.r.name));
    const groups=priorityGroups220(rows);
    const biggest=groups[0];
    return pageHead('HOY Coverage','Decision Coverage.','Interner Arbeitsstand – kein öffentliches Qualitätsranking. Sortiert nach den Datenlücken, die die Gastentscheidung am stärksten bremsen.')+
      `<div class="coverage-kpis">
        <div class="coverage-kpi attn"><strong>${s.hours}/${s.total}</strong><span>mit Öffnungszeiten</span><small>${pct(s.hours,s.total)}% · ${s.total-s.hours} fehlen</small></div>
        <div class="coverage-kpi"><strong>${s.structuredMenus}/${s.total}</strong><span>strukturierte Menüs</span><small>${s.officialMenus} offizielle Quellen · ${s.germanMenus} auf Deutsch</small></div>
        <div class="coverage-kpi"><strong>${s.knownServices}/${s.total}</strong><span>bekannte Services</span><small>${s.services} Datensätze · ${s.confirmedServices} Betreiber-bestätigt</small></div>
        <div class="coverage-kpi good"><strong>${s.freshSources}/${s.total}</strong><span>Basisquelle ≤ 90 Tage</span><small>${pct(s.freshSources,s.total)}% aktuell geprüft</small></div>
      </div>
      <div class="coverage-focus"><section class="coverage-panel"><h2>${biggest?`Größter Hebel: ${esc(biggest.label)}`:'Keine große Datenlücke'}</h2><p>${biggest?`${biggest.count} Betriebe · zuerst dort arbeiten, bevor wir neue UI bauen.`:'Die Kernabdeckung ist vollständig.'}</p><div class="coverage-priority-list">${groups.map((g,idx)=>`<div class="coverage-priority"><b>${idx+1}</b><div><strong>${esc(g.label)}</strong><small>${esc(g.detail)}</small></div><span class="impact">${g.count} Betriebe</span></div>`).join('')}</div></section><aside class="coverage-panel"><h2>Live-Nähe</h2><p>Was heute wirklich dynamisch belegt ist.</p><div class="coverage-priority-list"><div class="coverage-priority"><b>${s.liveHours}</b><div><strong>Betreiber-Livezeiten</strong><small>heute belastbar bestätigt</small></div></div><div class="coverage-priority"><b>${s.specialHours}</b><div><strong>Sonderzeiten</strong><small>kommende Abweichungen</small></div></div><div class="coverage-priority"><b>${s.currentContent}</b><div><strong>Events / Specials</strong><small>aktuell oder bevorstehend</small></div></div></div><div class="coverage-system-gap"><small>SYSTEMLÜCKE · NICHT VENUE-SCORE</small><b>Küchenzeiten sind noch nicht strukturiert.</b><p>Kein Betrieb wird dafür abgewertet. Erst modellieren wir die Datenquelle sauber; danach messen wir die Abdeckung.</p></div></aside></div>
      <div class="coverage-toolbar"><input id="coverageSearch" placeholder="Betrieb, Ort oder nächste Datenaktion …"><select id="coverageGap"><option value="all">Alle nächsten Aktionen</option>${groups.map(g=>`<option value="${esc(g.key)}">${esc(g.label)} (${g.count})</option>`).join('')}</select></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Betrieb</th><th>Decision Score</th><th>Nächste Datenaktion</th><th>Abdeckung</th><th></th></tr></thead><tbody id="coverageRows">${rows.map(rowMarkup220).join('')}</tbody></table></div><div class="coverage-note">Score-Gewichtung: Öffnungszeiten 30 · Menü 25 · Services 15 · Direktwege 10 · Signature 10 · Quellenfrische 10. Events/Specials und Küchenzeiten werden nicht als Pflichtinhalt pro Betrieb gewertet.</div>`;
  };

  wire=function(){
    baseWire220();
    const q=document.getElementById('coverageSearch'),gap=document.getElementById('coverageGap'),body=document.getElementById('coverageRows');
    if(!q||!gap||!body)return;
    const apply=()=>{const query=clean(q.value).toLowerCase(),g=gap.value;body.querySelectorAll('[data-coverage-row]').forEach(row=>{const okQ=!query||String(row.dataset.search||'').includes(query);const okG=g==='all'||row.dataset.gap===g;row.hidden=!(okQ&&okG)})};
    q.addEventListener('input',apply);gap.addEventListener('change',apply);
  };
})();
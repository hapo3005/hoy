/* HOY 2.6 — localized menus + honest menu-evidence states */
(function(){
  const SUPPORTED_MENU_LOCALES=new Set(['de','en','es']);
  const baseMenuStatusLabel25=menuStatusLabel;
  const baseMenuPanel25=menuPanel;
  const baseOpenDetail26=openDetail;

  const MENU_EVIDENCE={
    5:{
      title:'Noch keine verlässliche digitale Karte',
      snapshot:'Noch offen',
      snapshotNote:'Keine aktuelle digitale Betreiberkarte',
      pill:'Karte nicht digital',
      text:'Das aktuelle beanspruchte Betreiberprofil bestätigt mediterran-spanische Küche, Tagesmenü und Kinderkarte. Eine belastbare digitale Speisekarte mit aktuellen Preisen ist derzeit nicht veröffentlicht. HOY erfindet deshalb keine Gerichte oder Preise.',
      action:'Betreiberprofil öffnen',
      url:p=>cleanSite(p)
    },
    7:{
      title:'Offizieller Kartenlink derzeit gestört',
      snapshot:'Link gestört',
      snapshotNote:'Offizieller Kartenlink führt derzeit zur Startseite',
      pill:'Kartenlink gestört',
      text:'Die offizielle Website bietet „Ver Carta“ an. Der derzeit hinterlegte Kartenlink leitet jedoch auf die Restaurant-Startseite zurück. HOY wartet mit einem Import, bis wieder eine aktuelle Karte zuverlässig erreichbar ist.',
      action:'Restaurantseite öffnen',
      url:p=>cleanSite(p)
    },
    11:{
      title:'Offizielle Webkarte · teilweise erfassbar',
      snapshot:'Webkarte',
      snapshotNote:'Offiziell · technisch nur teilweise strukturiert',
      pill:'Webkarte teilweise erfasst',
      text:'Playa Chica veröffentlicht die Speisekarte auf der eigenen Website. Die Seite weist aktuell alle Kartenbereiche aus, ist für HOY aber nur teilweise zuverlässig maschinenlesbar. Deshalb zeigen wir bewusst keine scheinbar vollständige strukturierte Karte.',
      action:'Originalkarte öffnen',
      url:(p,m)=>m?.source||cleanSite(p)
    },
    14:{
      title:'Aktuelle Karte noch nicht strukturiert verfügbar',
      snapshot:'Noch offen',
      snapshotNote:'Keine verlässlich strukturierte Betreiberkarte',
      pill:'Karte nicht strukturiert',
      text:'Bocana ist mit aktueller Website und Reservierungsweg verifiziert. Online kursieren zwar Menüabbildungen, HOY übernimmt diese aber nicht als offizielle strukturierte Karte, solange keine belastbare Betreiberquelle vorliegt.',
      action:'Restaurantseite öffnen',
      url:p=>cleanSite(p)
    },
    21:{
      title:'Offizielle Bildkarte',
      snapshot:'Originalkarte',
      snapshotNote:'Offizielle Bildkarte verlinkt',
      pill:'Offizielle Bildkarte',
      text:'Cabo P veröffentlicht die aktuelle Karte auf der eigenen Website bildbasiert. HOY verlinkt deshalb direkt zum Original, statt Gerichte oder Preise aus einer Bildquelle unsicher zu übernehmen.',
      action:'Originalkarte öffnen',
      url:(p,m)=>m?.source||'https://cabop.es/carta-online'
    }
  };

  async function applyLocalizedMenus(){
    if(!sb||cloud.status==='error')return;
    const locale=SUPPORTED_MENU_LOCALES.has(state.lang)?state.lang:'de';
    const [{data:translations,error:te},{data:items,error:ie}]=await Promise.all([
      sb.from('menu_item_translations').select('menu_item_id,locale,category,name,description,translation_status').eq('locale',locale),
      sb.from('menu_items').select('id,restaurant_id,source_id,category,name,price_text,is_active').eq('is_active',true).order('category').order('name')
    ]);
    if(te){console.warn('HOY menu translations unavailable',te);return}
    if(ie){console.warn('HOY menu items unavailable for localization',ie);return}

    const tr=new Map((translations||[]).map(x=>[String(x.menu_item_id),x]));
    const byRestaurant=new Map();
    for(const item of items||[]){
      const rid=Number(item.restaurant_id);
      if(!byRestaurant.has(rid))byRestaurant.set(rid,[]);
      byRestaurant.get(rid).push(item);
    }

    for(const [rid,rows] of byRestaurant){
      const localized=rows.filter(x=>tr.has(String(x.id)));
      // Never show a mixed-language structured menu as if it were fully localized.
      if(rows.length<5||localized.length!==rows.length)continue;
      const cats={};
      let curated=true;
      for(const item of rows){
        const t=tr.get(String(item.id));
        const cat=t.category||item.category||'Speisekarte';
        (cats[cat]??=[]).push([t.name||item.name,item.price_text||'',item.name||'',t.description||'']);
        if(!['curated','operator_confirmed'].includes(t.translation_status))curated=false;
      }
      const existing=MENUS[rid]||{};
      MENUS[rid]={
        ...existing,
        categories:Object.entries(cats),
        localized:true,
        locale,
        translationStatus:curated?'curated':'machine',
        originalAvailable:true,
        label:`Offizielle Quelle · ${locale==='de'?'auf Deutsch in HOY lokalisiert':locale==='en'?'in English on HOY':'en español en HOY'}`,
        note:curated?'Übersetzung redaktionell geprüft · Originalkarte verlinkt':'Übersetzung noch in redaktioneller Prüfung · Originalkarte verlinkt'
      };
    }
  }

  const baseLoadCloudMenus25=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus25();
    await applyLocalizedMenus();
  };

  menuStatusLabel=function(m){
    if(m?.localized){
      if(m.locale==='de')return m.status==='partial'?'Auswahl auf Deutsch':'Speisekarte auf Deutsch';
      if(m.locale==='en')return m.status==='partial'?'Selection in English':'Menu in English';
      if(m.locale==='es')return m.status==='partial'?'Selección en español':'Carta en español';
    }
    return baseMenuStatusLabel25(m);
  };

  function evidencePanel(p,m,evidence){
    const url=evidence.url?.(p,m)||'';
    const action=url?`<a class="menu-evidence-action" target="_blank" rel="noopener noreferrer nofollow" href="${esc(url)}">${esc(evidence.action)} ↗</a>`:'';
    return `<div class="menu-panel menu-evidence-panel">
      <div class="menu-status">
        <div class="top"><b>${esc(evidence.title)}</b><span class="pill warn">HOY geprüft 10.08.2026</span></div>
        <small>Transparenter Kartenstatus · keine erfundenen Gerichte oder Preise</small>
      </div>
      <div class="menu-evidence-card"><span class="menu-evidence-kicker">WAS HOY WEISS</span><p>${esc(evidence.text)}</p>${action}</div>
    </div>`;
  }

  menuPanel=function(p){
    const m=menuFor(p);
    const evidence=MENU_EVIDENCE[Number(p.id)];
    if(evidence&&!m?.localized)return evidencePanel(p,m,evidence);
    if(!m?.localized)return baseMenuPanel25(p);
    const source=m.source?`<a target="_blank" rel="noopener" href="${esc(m.source)}">Originalkarte öffnen ↗</a>`:'';
    const localeLabel=m.locale==='de'?'Deutsch':m.locale==='en'?'English':'Español';
    const checked=m.checked?`<span class="pill good">Geprüft ${esc(m.checked)}</span>`:'';
    const categories=(m.categories||[]).map(([cat,items])=>`<section class="menu-cat"><h4>${esc(cat)}</h4>${items.map(item=>{
      const n=item?.[0]||'',pr=item?.[1]||'',original=item?.[2]||'',desc=item?.[3]||'';
      const search=(n+' '+cat+' '+desc+' '+original).toLowerCase();
      return `<div class="menu-item localized-menu-item" data-menu-item data-menu-text="${esc(search)}"><strong>${esc(n)}</strong><span>${esc(pr)}</span>${desc?`<small class="menu-item-desc">${esc(desc)}</small>`:''}</div>`;
    }).join('')}</section>`).join('');
    const body=categories?`<input class="menu-search" data-menu-search placeholder="Diese Speisekarte durchsuchen …"><div data-menu-list>${categories}</div>`:`<div class="menu-empty"><h4>Lokalisierte Speisekarte noch nicht verfügbar.</h4></div>`;
    return `<div class="menu-panel localized-menu-panel"><div class="menu-status"><div class="top"><b>${menuStatusLabel(m)}</b>${checked}</div><div class="menu-language-row"><span class="menu-language-chip">${esc(localeLabel)} · ${m.translationStatus==='curated'?'redaktionell geprüft':'in Prüfung'}</span></div><small>${esc(m.label||'Offizielle Quelle')}${m.note?' · '+esc(m.note):''}</small>${source}${m.cloud?'<div class="cloud-source-note"><b>Aktuell synchronisiert</b></div>':''}</div>${body}</div>`;
  };

  openDetail=function(id){
    baseOpenDetail26(id);
    const evidence=MENU_EVIDENCE[Number(id)];
    if(!evidence)return;
    const d=document.getElementById('detail');
    const menuPill=[...d.querySelectorAll('.statusrow .pill')][1];
    if(menuPill){menuPill.className='pill warn';menuPill.textContent=evidence.pill}
    const mini=d.querySelector('.showcase-snapshot .showcase-mini');
    if(mini){
      const strong=mini.querySelector('strong');
      const note=mini.querySelector('span');
      if(strong)strong.textContent=evidence.snapshot;
      if(note)note.textContent=evidence.snapshotNote;
    }
  };
})();

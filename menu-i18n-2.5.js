/* HOY 2.5 — localized menu layer */
(function(){
  const SUPPORTED_MENU_LOCALES=new Set(['de','en','es']);
  const baseMenuStatusLabel25=menuStatusLabel;
  const baseMenuPanel25=menuPanel;

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

  menuPanel=function(p){
    const m=menuFor(p);
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
})();

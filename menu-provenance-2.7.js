/* HOY 2.7.2 — menu provenance: structured, image, social and official-link states */
(function(){
  const provenanceByRestaurant=new Map();
  const validUrl=v=>/^https?:\/\//i.test(String(v||''));

  function scoreSource(row,current){
    let score=0;
    if(row?.is_official)score+=100;
    if(current&&row?.source_url===current)score+=50;
    if(row?.import_status==='imported')score+=30;
    else if(row?.import_status==='partial')score+=20;
    else if(row?.import_status==='link_only')score+=10;
    if(row?.last_checked_at)score+=Math.min(9,Math.max(0,Math.floor(new Date(row.last_checked_at).getTime()/1e12)));
    return score;
  }
  function bestSource(rows,current){
    return [...rows].sort((a,b)=>scoreSource(b,current)-scoreSource(a,current))[0]||null;
  }
  function formatLabel(row){
    if(row?.source_label)return row.source_label;
    if(row?.source_format==='image_menu')return row.is_official?'Offizielle Speisekarte · Bildkarte':'Bildkarte';
    if(row?.source_format==='social_link')return row.is_official?'Offizielle Betreiberquelle':'Betreiberquelle';
    if(row?.source_format==='pdf')return row.is_official?'Offizielle PDF-Speisekarte':'PDF-Speisekarte';
    if(row?.source_format==='structured_html')return row.is_official?'Offizielle Speisekarte':'Speisekarte';
    return row?.is_official?'Offizieller Speisekarten-Link':'Speisekarten-Link';
  }
  function statusLabelFor(m){
    if(m?.localized)return null;
    if(m?.sourceFormat==='image_menu')return m.isOfficial?'Offizielle Bildkarte':'Bildkarte verlinkt';
    if(m?.sourceFormat==='social_link')return m.isOfficial?'Offizielle Betreiberquelle':'Betreiberquelle verlinkt';
    if(m?.sourceFormat==='pdf'&&m.status==='official_link')return m.isOfficial?'Offizielle PDF-Karte':'PDF-Karte verlinkt';
    if(m?.isOfficial&&m.status==='official_link')return 'Offizielle Karte verlinkt';
    return null;
  }

  async function loadMenuProvenance(){
    if(!sb)return;
    const {data,error}=await sb.from('menu_sources').select('restaurant_id,source_url,source_kind,import_status,last_checked_at,source_label,source_format,is_official,source_note');
    if(error){console.warn('HOY menu provenance unavailable',error);return}
    const grouped=new Map();
    for(const row of data||[]){
      const rid=Number(row.restaurant_id);
      if(!grouped.has(rid))grouped.set(rid,[]);
      grouped.get(rid).push(row);
    }
    provenanceByRestaurant.clear();
    for(const [rid,rows] of grouped){
      const current=MENUS[rid]?.source||'';
      const row=bestSource(rows,current);if(!row)continue;
      provenanceByRestaurant.set(rid,row);
      const existing=MENUS[rid]||{};
      MENUS[rid]={
        ...existing,
        source:existing.source||row.source_url||'',
        checked:existing.checked||(row.last_checked_at||'').slice(0,10),
        label:existing.localized?existing.label:formatLabel(row),
        note:existing.localized?existing.note:(row.source_note||existing.note||''),
        sourceFormat:row.source_format||'unknown',
        isOfficial:!!row.is_official,
        provenanceChecked:(row.last_checked_at||'').slice(0,10)
      };
    }
  }

  const baseLoadCloudMenus272=loadCloudMenus;
  loadCloudMenus=async function(){
    await baseLoadCloudMenus272();
    await loadMenuProvenance();
  };

  const baseMenuStatusLabel272=menuStatusLabel;
  menuStatusLabel=function(m){return statusLabelFor(m)||baseMenuStatusLabel272(m)};

  const baseOpenDetail272=openDetail;
  openDetail=function(id){
    baseOpenDetail272(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));if(!p)return;
    const m=menuFor(p);const label=statusLabelFor(m);if(!label)return;
    const d=document.getElementById('detail');
    const pill=[...d.querySelectorAll('.statusrow .pill')][1];
    if(pill){pill.className=m.isOfficial?'pill good':'pill warn';pill.textContent=label}
    const mini=d.querySelector('.showcase-snapshot .showcase-mini');
    if(mini){
      const strong=mini.querySelector('strong');const note=mini.querySelector('span');
      if(strong)strong.textContent=label;
      if(note)note.textContent=m.sourceFormat==='image_menu'?'Originalkarte direkt verlinkt':m.isOfficial?'Betreiberquelle direkt verlinkt':'Quelle direkt verlinkt';
    }
  };

  window.hoyMenuProvenanceFor=id=>provenanceByRestaurant.get(Number(id))||null;
})();

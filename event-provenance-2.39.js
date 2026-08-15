/* HOY 2.39 — visible provenance for HOY-curated current content */
(function(){
  if(window.__hoyEventProvenance239)return;
  window.__hoyEventProvenance239=true;

  const sourceById=new Map();

  function checkedLabel(v){
    if(!v)return '';
    const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';
    return new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
  }

  async function loadSources(){
    sourceById.clear();
    if(!sb)return;
    try{
      const {data,error}=await sb.from('offers')
        .select('id,source_url,source_label,source_checked_at,publisher_kind,status')
        .eq('status','published')
        .eq('publisher_kind','hoy')
        .not('source_url','is',null);
      if(error)throw error;
      for(const row of data||[]){
        const url=String(row.source_url||'').trim();
        if(!/^https:\/\//i.test(url))continue;
        sourceById.set(String(row.id),{url,label:String(row.source_label||'Geprüfte Originalquelle').trim()||'Geprüfte Originalquelle',checkedAt:row.source_checked_at||null});
      }
    }catch(err){
      console.warn('HOY event provenance unavailable; keeping generic proof',err);
    }
  }

  function patchProfile(d=document.getElementById('detail')){
    if(!d?.open)return;
    d.querySelectorAll('[data-open-ended-event]').forEach(item=>{
      const source=sourceById.get(String(item.dataset.openEndedEvent||''));if(!source)return;
      const proof=item.querySelector('.hoy-current-proof');if(!proof)return;
      proof.textContent='Von HOY geprüft · ';
      const link=document.createElement('a');
      link.href=source.url;link.target='_blank';link.rel='noopener';link.textContent=source.label;
      proof.appendChild(link);
      const checked=checkedLabel(source.checkedAt);
      if(checked)proof.appendChild(document.createTextNode(` · geprüft ${checked}`));
      proof.appendChild(document.createTextNode(' · Ende vom Veranstalter nicht angegeben'));
    });
  }

  const baseLoadCloudRestaurants239=loadCloudRestaurants;
  loadCloudRestaurants=async function(){await baseLoadCloudRestaurants239();await loadSources()};

  const baseOpenDetail239=openDetail;
  openDetail=function(id){baseOpenDetail239(id);patchProfile(document.getElementById('detail'))};

  window.hoyEventProvenance239={loadSources,patchProfile,sourceById};
})();

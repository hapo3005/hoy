/* HOY 1.6 — researched restaurant signatures from Supabase */
(function(){
  async function loadCloudSignatures(){
    if(!sb) return;
    const {data,error}=await sb.from('restaurants').select('id,signature_title,signature_text,signature_tags,signature_status,signature_source_url,signature_source_label,signature_checked_at,signature_confidence').eq('is_published',true).order('id');
    if(error){console.warn('HOY signatures could not be loaded',error);return;}
    const byId=new Map((data||[]).map(x=>[Number(x.id),x]));
    DATA=DATA.map(p=>{
      const s=byId.get(Number(p.id));
      return s?{...p,...s}:p;
    });
  }

  function signatureStatusLabel(p){
    return p.signature_status==='operator_confirmed'?'Vom Restaurant bestätigt':'HOY recherchiert';
  }

  function signatureDate(v){
    if(!v)return '';
    try{return new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00'))}catch{return v}
  }

  function signatureHTML(p){
    if(!p?.signature_title||!p?.signature_text)return '';
    const tags=Array.isArray(p.signature_tags)?p.signature_tags:[];
    const source=p.signature_source_url&&/^https?:\/\//i.test(p.signature_source_url)
      ?`<a class="signature-source" href="${esc(p.signature_source_url)}" target="_blank" rel="noopener noreferrer nofollow">Recherchequelle ↗</a>`:'';
    const checked=signatureDate(p.signature_checked_at);
    return `<section class="signature-card" aria-label="Signature von ${esc(p.name)}">
      <div class="signature-top"><span class="signature-kicker">SIGNATURE</span><span class="signature-status ${p.signature_status==='operator_confirmed'?'confirmed':''}">${signatureStatusLabel(p)}</span></div>
      <h3>${esc(p.signature_title)}</h3>
      <p>${esc(p.signature_text)}</p>
      ${tags.length?`<div class="signature-tags">${tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
      <div class="signature-foot"><span>${checked?'Geprüft '+esc(checked):'Recherche geprüft'}${p.signature_source_label?' · '+esc(p.signature_source_label):''}</span>${source}</div>
    </section>`;
  }

  const baseInitCloud=initCloud;
  initCloud=async function(){
    await baseInitCloud();
    if(cloud.status==='online'){
      await loadCloudSignatures();
      render();
    }
  };

  const baseOpenDetail=openDetail;
  openDetail=function(id){
    baseOpenDetail(id);
    const p=DATA.find(x=>Number(x.id)===Number(id));
    const d=document.getElementById('detail');
    const serviceGrid=d?.querySelector('.service-grid');
    if(!p||!d||!serviceGrid||!p.signature_title)return;
    const holder=document.createElement('div');
    holder.innerHTML=signatureHTML(p);
    const card=holder.firstElementChild;
    if(card)serviceGrid.parentNode.insertBefore(card,serviceGrid);
  };
})();

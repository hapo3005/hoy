/* HOY 2.40.2 — keep the explicitly enabled Family preview stable within one browser session.
   No preview data becomes live: this only preserves the existing ?familyPreview=1 gate. */
(function(){
  if(window.__hoyFamilyPreviewSession240)return;
  window.__hoyFamilyPreviewSession240=true;

  const KEY='hoy_family_preview_session_240';
  let url;
  try{url=new URL(window.location.href)}catch{return}

  const requested=url.searchParams.get('familyPreview');
  const read=()=>{try{return sessionStorage.getItem(KEY)==='1'}catch{return false}};
  const enable=()=>{try{sessionStorage.setItem(KEY,'1')}catch{}};
  const disable=()=>{try{sessionStorage.removeItem(KEY)}catch{}};
  const replace=()=>{
    try{history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`)}catch{}
  };

  if(requested==='1'){
    enable();
    window.hoyFamilyPreviewSession240={enabled:true,source:'query'};
    return;
  }

  if(requested==='0'){
    disable();
    url.searchParams.delete('familyPreview');
    replace();
    window.hoyFamilyPreviewSession240={enabled:false,source:'query-off'};
    return;
  }

  if(read()){
    url.searchParams.set('familyPreview','1');
    replace();
    window.hoyFamilyPreviewSession240={enabled:true,source:'session'};
    return;
  }

  window.hoyFamilyPreviewSession240={enabled:false,source:'none'};
})();

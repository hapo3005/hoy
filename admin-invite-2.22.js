/* HOY Control 2.22 — prepare operator invite links without sending them */
(function(){
  if(window.__hoyAdminInvite222)return;
  window.__hoyAdminInvite222=true;
  window.hoyAdminInviteVersion222='2.22.0';

  function inviteURL222(id){
    const url=new URL('./',location.href);url.search='';url.hash='';url.searchParams.set('claim',String(Number(id)));url.searchParams.set('from','operator_invite');return url.toString();
  }
  async function copy222(id,button){
    const url=inviteURL222(id);
    try{await navigator.clipboard.writeText(url);button.textContent='Kopiert ✓';setTimeout(()=>button.textContent='Link kopieren',1200);toast('Übernahme-Link kopiert – nichts wurde versendet')}
    catch{window.prompt('Übernahme-Link kopieren:',url)}
  }
  function enhance222(){
    if(state.view!=='activation')return;
    document.querySelectorAll('#activationRows [data-activation-row]').forEach(row=>{
      const edit=row.querySelector('[data-edit]');if(!edit||row.querySelector('[data-invite-copy]'))return;
      const id=Number(edit.dataset.edit);if(!id)return;
      const cell=edit.closest('td');if(!cell)return;
      const wrap=document.createElement('div');wrap.className='activation-invite-actions';
      wrap.innerHTML=`<button type="button" class="ghost" data-invite-copy="${id}">Link kopieren</button><button type="button" class="ghost" data-invite-preview="${id}">Vorschau ↗</button>`;
      cell.prepend(wrap);
    });
    document.querySelectorAll('[data-invite-copy]').forEach(b=>b.onclick=()=>copy222(Number(b.dataset.inviteCopy),b));
    document.querySelectorAll('[data-invite-preview]').forEach(b=>b.onclick=()=>window.open(inviteURL222(Number(b.dataset.invitePreview)),'_blank','noopener'));
  }

  const baseWire222=wire;
  wire=function(){baseWire222();enhance222()};

  window.hoyAdminInviteURLFor=inviteURL222;
})();

let DATA=[];
let MENUS={};
const FEATURES=Object.freeze({
  menuInRestaurant:true,
  menuLocalSearch:true,
  globalDishSearch:false,
  menuAutoRefreshFoundation:true
});
const state={view:'home',query:'',service:'all',favorites:new Set(JSON.parse(localStorage.getItem('hoy-favs')||'[]')),lang:'de'};

// --- HOY 1.2 LIVE CLOUD CLIENT ---
const LOCAL_DATA=DATA.map(x=>({...x}));
const LOCAL_MENUS=JSON.parse(JSON.stringify(MENUS));
const SUPABASE_URL='https://zlscptisdxzxuvllogza.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_CckkwI-sINoA1sEag2jbfw_-wxnr_og';
let sb=null;
let cloud={status:'connecting',error:'',user:null,restaurantCount:0,menuItemCount:0,claims:[],loadedAt:null};
function cloudStateLabel(){return cloud.status==='online'?'CLOUD LIVE':cloud.status==='error'?'FALLBACK':'VERBINDET …'}
function legacyService(v){return v==='available'?'Ja':v==='unavailable'?'Nein':'Prüfen'}
function cloudAuthMarkup(){
  if(cloud.user){const email=cloud.user.email||'Angemeldet';return `<div class="auth-box"><div class="row"><div><b>Angemeldet</b><p>${esc(email)} · Dein Betreiberkonto ist sicher angemeldet.</p></div><button class="out" data-auth-out>Abmelden</button></div></div>`}
  return `<div class="auth-box"><div class="row"><div><b>Betreiberkonto erforderlich</b><p>Zum echten Absenden eines Claims einmal anmelden oder kostenlos registrieren.</p></div><button data-auth-open>Anmelden</button></div></div>`
}
function cloudStrip(){return `<div class="cloud-strip"><div class="copy"><b>${cloud.status==='online'?'Live-Daten aus Supabase':'Lokaler Sicherheits-Fallback'}</b><small>${cloud.status==='online'?`${cloud.restaurantCount} Restaurants aus der Cloud · ${cloud.menuItemCount} Menüpositionen synchronisiert`:cloud.error||'Verbindung wird aufgebaut …'}</small></div><span class="cloud-state ${cloud.status==='online'?'online':cloud.status==='error'?'error':''}">${cloudStateLabel()}</span></div>`}
async function initCloud(){
  try{
    if(!window.supabase?.createClient) throw new Error('Supabase-Bibliothek konnte nicht geladen werden');
    sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}}=await sb.auth.getSession();cloud.user=session?.user||null;
    sb.auth.onAuthStateChange(async(_event,session)=>{cloud.user=session?.user||null;await loadOwnClaims();render();});
    await loadCloudRestaurants();
    await loadCloudMenus();
    await loadOwnClaims();
    cloud.status='online';cloud.loadedAt=new Date().toISOString();render();
  }catch(err){cloud.status='error';cloud.error=err?.message||String(err);DATA=LOCAL_DATA.map(x=>({...x}));MENUS=JSON.parse(JSON.stringify(LOCAL_MENUS));render()}
}
async function loadCloudRestaurants(){
  const {data,error}=await sb.from('restaurants').select('id,slug,name,area,description,address,phone,website,hours_text,latitude,longitude,is_published,restaurant_services(reservation_state,pickup_state,delivery_state),restaurant_entitlements(operator_verified,active_plan)').eq('is_published',true).order('id');
  if(error) throw error;
  DATA=(data||[]).map(row=>{
    const base=LOCAL_DATA.find(x=>Number(x.id)===Number(row.id))||{};
    const svc=Array.isArray(row.restaurant_services)?row.restaurant_services[0]:row.restaurant_services||{};
    const ent=Array.isArray(row.restaurant_entitlements)?row.restaurant_entitlements[0]:row.restaurant_entitlements||{};
    return {...base,id:Number(row.id),slug:row.slug,name:row.name,area:row.area,description:row.description||base.description||'',address:row.address||base.address||'',phone:row.phone||base.phone||'',website:row.website||base.website||'',hours:row.hours_text||base.hours||'',latitude:row.latitude?Number(row.latitude):null,longitude:row.longitude?Number(row.longitude):null,reservation:legacyService(svc.reservation_state),pickup:legacyService(svc.pickup_state),delivery:legacyService(svc.delivery_state),operator_verified:!!ent.operator_verified,active_plan:ent.active_plan||'free',cloud:true};
  });
  cloud.restaurantCount=DATA.length;
}
async function loadCloudMenus(){
  const [{data:sources,error:se},{data:items,error:ie}]=await Promise.all([
    sb.from('menu_sources').select('id,restaurant_id,source_url,source_kind,last_checked_at,import_status'),
    sb.from('menu_items').select('id,restaurant_id,source_id,category,name,price_text,is_active,source_checked_at').eq('is_active',true).order('category').order('name')
  ]);
  if(se) throw se;if(ie) throw ie;
  cloud.menuItemCount=(items||[]).length;
  const byRestaurant={};
  for(const item of items||[]){(byRestaurant[item.restaurant_id]??=[]).push(item)}
  for(const source of sources||[]){
    const rows=byRestaurant[source.restaurant_id]||[];
    const matching=rows.filter(x=>!source.id||x.source_id===source.id);
    // Only replace a known structured local card after a meaningful cloud import, never with a partial accidental row.
    if(matching.length>=5){
      const cats={};for(const x of matching){(cats[x.category]??=[]).push([x.name,x.price_text||''])}
      MENUS[source.restaurant_id]={status:'structured',source:source.source_url,checked:(source.last_checked_at||'').slice(0,10),label:'Offizielle Quelle · automatisch synchronisiert',categories:Object.entries(cats),cloud:true};
    }else if(!LOCAL_MENUS[source.restaurant_id]?.categories && source.source_url){
      MENUS[source.restaurant_id]={...LOCAL_MENUS[source.restaurant_id],status:'official_link',source:source.source_url,checked:(source.last_checked_at||'').slice(0,10),label:'Offizielle Quelle · automatisch synchronisiert',cloud:true};
    }
  }
}
async function loadOwnClaims(){
  cloud.claims=[];
  if(!sb||!cloud.user)return;
  const {data,error}=await sb.from('business_claims').select('id,restaurant_id,contact_name,contact_role,business_email,status,verification_method,submitted_at,reviewed_at,rejection_reason').order('submitted_at',{ascending:false});
  if(error)return;
  cloud.claims=data||[];
  const latest=cloud.claims[0];
  if(latest && (!claimDraft.restaurantId || Number(claimDraft.restaurantId)===Number(latest.restaurant_id))){
    claimDraft.restaurantId=Number(latest.restaurant_id);
    claimDraft.contact={...(claimDraft.contact||{}),name:latest.contact_name||'',email:latest.business_email||'',role:latest.contact_role||'Inhaber/in'};
    claimDraft.verification={...(claimDraft.verification||{}),status:latest.status,submittedAt:latest.submitted_at||null,verifiedAt:latest.reviewed_at||null};
    claimDraft.claimed=latest.status==='verified';claimDraft.verified=latest.status==='verified';saveClaim();
  }
}
async function submitClaimCloud(){
  if(!sb) throw new Error('Cloud-Verbindung nicht bereit');
  if(!cloud.user) throw new Error('login_required');
  const evidence={profile:claimDraft.profile||{},services:claimDraft.services||{},rights_confirmed:!!claimDraft.rightsConfirmed,image_names:claimDraft.imageNames||[],requested_plan:claimDraft.plan||'free',offer_draft:claimDraft.offer?.title?claimDraft.offer:null,client_version:'1.2'};
  const {data,error}=await sb.functions.invoke('claim-submit',{body:{restaurant_id:Number(claimDraft.restaurantId),contact_name:claimDraft.contact?.name,business_email:claimDraft.contact?.email,contact_role:claimDraft.contact?.role,evidence}});
  if(error) throw error;
  if(data?.error) throw new Error(data.error);
  await loadOwnClaims();
  return data;
}
async function authLogin(email,password){
  if(!sb) throw new Error('Cloud-Verbindung nicht bereit');
  const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;cloud.user=data.user;await loadOwnClaims();return data;
}
async function authSignup(email,password){
  if(!sb) throw new Error('Cloud-Verbindung nicht bereit');
  const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:'https://hapo3005.github.io/hoy/'}});if(error)throw error;return data;
}
async function authLogout(){if(sb)await sb.auth.signOut();cloud.user=null;cloud.claims=[];render()}
function openAuthFlow(mode='login'){
  const d=document.getElementById('authFlow');
  const logged=!!cloud.user;
  d.innerHTML=`<div class="auth-flow"><div class="claim-head"><button class="round" data-auth-close>${icons.back}</button><span class="claim-step">HOY BETREIBERKONTO</span></div>${logged?`<div class="auth-user"><b>Angemeldet</b><small>${esc(cloud.user.email||'')}</small></div><button class="auth-submit" data-auth-logout>Abmelden</button>`:`<h2>${mode==='signup'?'Kostenlos registrieren.':'Willkommen zurück.'}</h2><p class="lead">Mit deinem kostenlosen Betreiberkonto kannst du ein Restaurantprofil übernehmen. Deine Angaben werden sicher online gespeichert und dem Profil zugeordnet.</p><div class="auth-tabs"><button class="${mode==='login'?'active':''}" data-auth-mode="login">Anmelden</button><button class="${mode==='signup'?'active':''}" data-auth-mode="signup">Registrieren</button></div><div class="auth-field"><label>E-Mail</label><input type="email" data-auth-email autocomplete="email" placeholder="name@restaurant.es" value="${esc(claimDraft.contact?.email||'')}"></div><div class="auth-field"><label>Passwort</label><input type="password" data-auth-password autocomplete="${mode==='login'?'current-password':'new-password'}" placeholder="Mindestens 8 Zeichen"></div><button class="auth-submit" data-auth-submit>${mode==='signup'?'Konto erstellen':'Anmelden'}</button><p class="auth-note">Bei einer neuen Registrierung erhältst du gegebenenfalls eine Bestätigungs-E-Mail. Nach der Bestätigung führt dich der Link zurück zu HOY; anschließend kannst du dich anmelden.</p>`}</div>`;
  d.showModal();
  d.querySelector('[data-auth-close]').onclick=()=>d.close();
  d.querySelectorAll('[data-auth-mode]').forEach(x=>x.onclick=()=>openAuthFlow(x.dataset.authMode));
  d.querySelector('[data-auth-logout]')?.addEventListener('click',async()=>{await authLogout();d.close();toast('Abgemeldet')});
  d.querySelector('[data-auth-submit]')?.addEventListener('click',async e=>{const btn=e.currentTarget;const email=d.querySelector('[data-auth-email]').value.trim();const password=d.querySelector('[data-auth-password]').value;if(!email||password.length<8){toast('E-Mail und mindestens 8 Zeichen Passwort');return}btn.disabled=true;btn.innerHTML='<span class="spinner"></span>Bitte warten';try{if(mode==='signup'){const r=await authSignup(email,password);if(r.session){cloud.user=r.user;toast('Konto erstellt und angemeldet');d.close();render()}else{toast('Bestätigungs-E-Mail gesendet');openAuthFlow('login')}}else{await authLogin(email,password);toast('Angemeldet');d.close();render()}}catch(err){toast(err?.message||'Anmeldung fehlgeschlagen');btn.disabled=false;btn.textContent=mode==='signup'?'Konto erstellen':'Anmelden'}})
}
const CLAIM_KEY='hoy-claim-draft-v1';
const ANALYTICS_KEY='hoy-analytics-v1';
const AUDIT_KEY='hoy-audit-v1';
const BACKEND_MODE='supabase-cloud';
function blankClaim(){return {restaurantId:null,step:1,verified:false,claimed:false,plan:'free',activePlan:'free',requestedPlan:'free',contact:{name:'',email:'',role:'Inhaber/in'},profile:{},services:{},offer:{type:'Angebot',title:'',description:'',price:'',start:'',end:'',time:'',status:'draft',publishedAt:null},imageNames:[],ownerHero:'',rightsConfirmed:false,verification:{status:'draft',method:'business_email',submittedAt:null,verifiedAt:null}}}
function loadClaim(){try{return JSON.parse(localStorage.getItem(CLAIM_KEY)||'null')}catch{return null}}
function normalizeClaim(raw){const b=blankClaim(),r=raw||{};return {...b,...r,contact:{...b.contact,...(r.contact||{})},profile:{...b.profile,...(r.profile||{})},services:{...b.services,...(r.services||{})},offer:{...b.offer,...(r.offer||{})},verification:{...b.verification,...(r.verification||{})}}}
let claimDraft=normalizeClaim(loadClaim());
const claimSession={thumbs:[]};
function saveClaim(){localStorage.setItem(CLAIM_KEY,JSON.stringify(claimDraft))}
function readEvents(){try{return JSON.parse(localStorage.getItem(ANALYTICS_KEY)||'[]')}catch{return []}}
function trackEvent(type,restaurantId,meta={}){const rows=readEvents();rows.push({type,restaurantId:Number(restaurantId)||null,meta,at:new Date().toISOString()});localStorage.setItem(ANALYTICS_KEY,JSON.stringify(rows.slice(-500)))}
function metricCount(type,id){return readEvents().filter(e=>e.type===type&&Number(e.restaurantId)===Number(id)).length}
function readAudit(){try{return JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]')}catch{return []}}
function addAudit(action,restaurantId,detail=''){const rows=readAudit();rows.push({action,restaurantId:Number(restaurantId)||null,detail,at:new Date().toISOString()});localStorage.setItem(AUDIT_KEY,JSON.stringify(rows.slice(-100)));}
function claimVerificationStatus(){return claimDraft?.verification?.status||'draft'}
function claimedRestaurant(){return claimDraft?.restaurantId?DATA.find(x=>x.id===claimDraft.restaurantId):null}
function hasLocalVerifiedClaim(p){return !!(claimDraft?.claimed&&claimVerificationStatus()==='verified'&&Number(claimDraft.restaurantId)===Number(p.id))}
function isClaimed(p){return !!(p?.operator_verified||hasLocalVerifiedClaim(p))}
function effectiveValue(p,key){return hasLocalVerifiedClaim(p)&&claimDraft.profile?.[key]?claimDraft.profile[key]:p[key]}
function effectiveServiceState(p,kind){return hasLocalVerifiedClaim(p)&&claimDraft.services?.[kind]?claimDraft.services[kind]:serviceState(p[kind])}
function serviceStateText(st){return st==='available'?'Ja':st==='unavailable'?'Nein':'Noch prüfen'}

const icons={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',compass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2zM8 4v14M16 6v14"/></svg>',heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/></svg>',menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>',calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M16 14a6 6 0 0 1 6 6v1"/></svg>',food:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 4 5 4 8h-4"/></svg>',bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 8h12l1 13H5L6 8zM9 8a3 3 0 0 1 6 0"/></svg>',truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 13 13 0 0 0 2.8.7 2 2 0 0 1 1.7 2z"/></svg>',globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6"/></svg>',chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"/></svg>'};
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function yes(v=''){return /^ja/i.test(v)}

#!/usr/bin/env node
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const SUPABASE_URL=(process.env.SUPABASE_URL||'https://zlscptisdxzxuvllogza.supabase.co').replace(/\/$/,'');
const SUPABASE_SECRET_KEY=process.env.SUPABASE_SECRET_KEY||'';
const argValue=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback};
const SCOPE=String(argValue('--scope','core')).toLowerCase();
const LIMIT=Math.max(1,Math.min(50,Number(argValue('--limit','12'))||12));
const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
const CORE_SCOPES=new Set(['full_menu','food','breakfast','lunch','dinner','day_menu','tasting']);
const OPEN_STATUSES=new Set(['source_only','partial','invalid','insufficient','unknown']);
const MENU_TERMS=/\b(carta|cartas|men[uú]|menu|speisekarte|food|foods|drink|drinks|bebida|bebidas|vino|vinos|wine|wines|postre|postres|dessert|desserts|entrante|entrantes|starter|starters|ensalada|ensaladas|salad|salads|pescado|pescados|fish|arroces|arroz|rice|carne|carnes|meat|cocktail|cocktails|caf[eé]|caf[eé]s|coffee|precio|precios|price|prices|qr)\b/i;
const CONTROL_TERMS=/^(vinos?|entrantes?|ensaladas?|crudo|pescados?|arroces?|carnes?|para los peques|postres?(?: caseros)?|bebidas?|alcohol|caf[eé]s?|starters?|mains?|main courses?|desserts?|drinks?|wines?|food|menu|men[uú]|carta)$/i;
const SOCIAL_HOST=/\b(instagram\.com|facebook\.com|tiktok\.com)\b/i;

if(!SUPABASE_SECRET_KEY){console.error('Missing SUPABASE_SECRET_KEY');process.exit(2)}

function sbHeaders(){return {apikey:SUPABASE_SECRET_KEY,Authorization:`Bearer ${SUPABASE_SECRET_KEY}`}}
async function sb(path){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:sbHeaders()});const text=await r.text();if(!r.ok)throw new Error(`supabase_${r.status}:${text.slice(0,250)}`);return text?JSON.parse(text):[]}
function clean(v){return String(v??'').trim()}
function https(v){const s=clean(v);return /^https:\/\//i.test(s)?s:''}
function socialUrl(value){const v=clean(value);if(!v)return '';if(/^https:\/\/(?:www\.)?(?:instagram|facebook)\.com\//i.test(v))return v;if(/^@?[A-Za-z0-9._-]+$/.test(v)){const h=v.replace(/^@/,'');return `https://www.instagram.com/${h}/`}return ''}
function compactText(v,max=24000){return clean(v).replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').slice(0,max)}
function unique(arr,key=x=>x){const seen=new Set();return arr.filter(x=>{const k=key(x);if(!k||seen.has(k))return false;seen.add(k);return true})}
function safeName(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'venue'}
function hash(v){return createHash('sha256').update(String(v||'')).digest('hex').slice(0,16)}
function sourceRenderable(s){const status=clean(s.completeness_status),p=s.display_payload&&typeof s.display_payload==='object'?s.display_payload:{};if(status==='image_complete'&&Array.isArray(p.pages)&&p.pages.some(x=>https(typeof x==='string'?x:x?.url)))return true;if(status==='complete'&&clean(p.mode)==='official_embed'&&https(p.embed_url))return true;return false}
function sourceOpen(s){return s?.is_official!==false&&CORE_SCOPES.has(clean(s.coverage_scope))&&OPEN_STATUSES.has(clean(s.completeness_status))}

async function loadCatalog(){
  const [restaurants,sales,sources,checks]=await Promise.all([
    sb('restaurants?select=id,name,area,website,is_published,venue_type&is_published=eq.true&order=name.asc'),
    sb('venue_sales_pipeline?select=restaurant_id,contact_instagram,contact_website&order=restaurant_id.asc'),
    sb('menu_sources?select=id,restaurant_id,source_url,source_label,source_format,is_official,coverage_scope,completeness_status,display_payload&is_official=eq.true&order=restaurant_id.asc'),
    sb('menu_discovery_checks?select=restaurant_id,channel,source_url,status,menu_scope,is_official,evidence_note,checked_at,next_review_at&order=checked_at.desc')
  ]);
  const salesMap=new Map(sales.map(x=>[Number(x.restaurant_id),x]));
  const sourceMap=new Map(),checkMap=new Map();
  for(const s of sources){const id=Number(s.restaurant_id);if(!sourceMap.has(id))sourceMap.set(id,[]);sourceMap.get(id).push(s)}
  for(const c of checks){const id=Number(c.restaurant_id);if(!checkMap.has(id))checkMap.set(id,[]);checkMap.get(id).push(c)}
  return restaurants.map(r=>({...r,sales:salesMap.get(Number(r.id))||{},sources:sourceMap.get(Number(r.id))||[],checks:checkMap.get(Number(r.id))||[]}));
}

function candidateFor(r){
  if(SCOPE==='core'&&!CORE_AREAS.has(clean(r.area)))return null;
  if(r.sources.some(sourceRenderable))return null;
  const openSources=r.sources.filter(sourceOpen);
  const urls=[];
  for(const s of openSources){const u=https(s.source_url);if(u&&!SOCIAL_HOST.test(u))urls.push({url:u,kind:'menu_source',label:clean(s.source_label)||clean(s.source_format)||'official menu source',status:clean(s.completeness_status)})}
  for(const v of [r.website,r.sales?.contact_website]){const u=https(v);if(u&&!SOCIAL_HOST.test(u))urls.push({url:u,kind:'website',label:'official website',status:''})}
  const social=unique([socialUrl(r.sales?.contact_instagram),socialUrl(r.website),socialUrl(r.sales?.contact_website)].filter(Boolean));
  const latest=(r.checks||[])[0]||null;
  let score=CORE_AREAS.has(clean(r.area))?50:10;
  if(openSources.length)score+=35;
  if(urls.length)score+=15;
  if(social.length)score+=5;
  if(latest?.status==='menu_found')score+=8;
  return {restaurant_id:Number(r.id),name:r.name,area:r.area,venue_type:r.venue_type||'',urls:unique(urls,x=>x.url).slice(0,3),social,open_source_count:openSources.length,last_check:latest,score};
}

async function dismissConsent(page){
  const labels=['Aceptar','Accept','Aceptar todas','Accept all','Entendido','OK','De acuerdo'];
  for(const label of labels){
    const el=page.getByRole('button',{name:new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i')}).first();
    if(await el.isVisible().catch(()=>false)){await el.click({timeout:1500}).catch(()=>{});await page.waitForTimeout(200);break}
  }
}

async function collect(page){
  return page.evaluate(({menuPattern})=>{
    const re=new RegExp(menuPattern,'i');
    const abs=v=>{try{return new URL(v,location.href).href}catch{return ''}};
    const anchors=[...document.querySelectorAll('a[href]')].map(a=>({text:(a.innerText||a.getAttribute('aria-label')||'').trim().slice(0,180),url:abs(a.getAttribute('href'))})).filter(x=>x.url&&re.test(`${x.text} ${x.url}`));
    const frames=[...document.querySelectorAll('iframe[src]')].map(f=>({title:(f.getAttribute('title')||'').trim().slice(0,180),url:abs(f.getAttribute('src'))})).filter(x=>x.url&&re.test(`${x.title} ${x.url}`));
    const images=[...document.querySelectorAll('img')].map(img=>{const src=abs(img.currentSrc||img.getAttribute('src')||img.getAttribute('data-src')||'');const alt=(img.getAttribute('alt')||img.getAttribute('title')||'').trim();const parent=(img.closest('figure,article,section,div')?.innerText||'').trim().slice(0,300);return {alt:alt.slice(0,180),url:src,context:parent}}).filter(x=>x.url&&re.test(`${x.alt} ${x.url} ${x.context}`)&&!/logo|favicon|avatar/i.test(`${x.alt} ${x.url}`));
    const controls=[...document.querySelectorAll('button,[role="tab"],a')].map((el,i)=>({i,text:(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100),tag:el.tagName,role:el.getAttribute('role')||''})).filter(x=>x.text);
    return {title:document.title,body:(document.body?.innerText||'').slice(0,40000),anchors,frames,images,controls};
  },{menuPattern:MENU_TERMS.source});
}

function lines(v){return unique(compactText(v,40000).split('\n').map(x=>x.trim()).filter(Boolean))}
function delta(before,after){const old=new Set(lines(before));return lines(after).filter(x=>!old.has(x)).join('\n').slice(0,12000)}

async function inspectUrl(context,entry,venue,index){
  const page=await context.newPage();
  const record={requested_url:entry.url,kind:entry.kind,label:entry.label,status_hint:entry.status,final_url:'',http_status:null,title:'',error:null,anchors:[],iframes:[],images:[],dynamic_states:[],body_excerpt:''};
  try{
    const response=await page.goto(entry.url,{waitUntil:'domcontentloaded',timeout:30000});
    record.http_status=response?.status()??null;
    await page.waitForTimeout(1200);
    await dismissConsent(page);
    await page.waitForTimeout(500);
    record.final_url=page.url();
    const initial=await collect(page);
    record.title=initial.title;
    record.body_excerpt=compactText(initial.body,18000);
    record.anchors=unique(initial.anchors,x=>x.url).slice(0,40);
    record.iframes=unique(initial.frames,x=>x.url).slice(0,20);
    record.images=unique(initial.images,x=>x.url).slice(0,30);

    const candidates=initial.controls.filter(x=>CONTROL_TERMS.test(x.text)).slice(0,24);
    for(const c of candidates){
      const locator=page.locator('button,[role="tab"],a').filter({hasText:c.text}).first();
      if(!await locator.isVisible().catch(()=>false))continue;
      const before=await page.locator('body').innerText().catch(()=>initial.body);
      await locator.click({timeout:2000,force:true}).catch(()=>{});
      await page.waitForTimeout(450);
      const after=await page.locator('body').innerText().catch(()=>before);
      const d=delta(before,after);
      const state=await collect(page);
      if(d||state.anchors.length!==initial.anchors.length||state.images.length!==initial.images.length||state.frames.length!==initial.frames.length){
        record.dynamic_states.push({control:c.text,text_delta:d,anchors:unique(state.anchors,x=>x.url).slice(0,30),iframes:unique(state.frames,x=>x.url).slice(0,15),images:unique(state.images,x=>x.url).slice(0,25)});
      }
    }

    if(index<12){
      await mkdir('menu-discovery-screenshots',{recursive:true});
      const file=`menu-discovery-screenshots/${String(index+1).padStart(2,'0')}-${venue.restaurant_id}-${safeName(venue.name)}-${hash(entry.url)}.png`;
      await page.screenshot({path:file,fullPage:true,animations:'disabled'}).catch(()=>{});
      record.screenshot=file;
    }
  }catch(error){record.error=String(error?.message||error).slice(0,600);record.final_url=page.url()||entry.url}
  finally{await page.close().catch(()=>{})}
  return record;
}

const catalog=await loadCatalog();
const candidates=catalog.map(candidateFor).filter(Boolean).filter(x=>x.urls.length||x.social.length).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'es')).slice(0,LIMIT);
console.log(`HOY browser menu discovery · scope=${SCOPE} · candidates=${candidates.length}/${catalog.length}`);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'es-ES',timezoneId:'Europe/Madrid',viewport:{width:1280,height:1600},userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36 HOY-Menu-Discovery/2.28'});
const results=[];
for(let i=0;i<candidates.length;i++){
  const c=candidates[i];
  console.log(`▶ ${i+1}/${candidates.length} ${c.name}`);
  const pages=[];
  for(const entry of c.urls){pages.push(await inspectUrl(context,entry,c,i))}
  results.push({...c,pages});
}
await context.close();await browser.close();

const summary={generated_at:new Date().toISOString(),scope:SCOPE,limit:LIMIT,catalog_count:catalog.length,candidate_count:candidates.length,venues:results.map(v=>({restaurant_id:v.restaurant_id,name:v.name,area:v.area,open_source_count:v.open_source_count,page_count:v.pages.length,dynamic_state_count:v.pages.reduce((n,p)=>n+p.dynamic_states.length,0),menu_links:v.pages.reduce((n,p)=>n+p.anchors.length,0),menu_images:v.pages.reduce((n,p)=>n+p.images.length,0),menu_iframes:v.pages.reduce((n,p)=>n+p.iframes.length,0),errors:v.pages.filter(p=>p.error).length}))};
await writeFile('menu-discovery-report.json',JSON.stringify({summary,venues:results},null,2));
await writeFile('menu-discovery-summary.json',JSON.stringify(summary,null,2));
console.table(summary.venues);
console.log('Discovery is evidence-only: no Supabase writes were performed.');

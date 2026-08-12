#!/usr/bin/env node
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const SUPABASE_URL='https://zlscptisdxzxuvllogza.supabase.co';
const SUPABASE_KEY='sb_publishable_CckkwI-sINoA1sEag2jbfw_-wxnr_og';
const CORE_AREAS=new Set(['La Manga del Mar Menor','Cabo de Palos']);
const NON_CORE_SCOPES=new Set(['wine','dessert','drinks','highlights','secondary']);
const MENU_RE=/(carta|men[uú]|speisekarte|food|drink|bebida|vino|postre|dessert|starter|main|ensalada|pescado|arroz|carne|cocktail|precio|price|qr|\.pdf)/i;
const CLICK_RE=/^(carta|men[uú]|food|drinks?|bebidas?|vinos?|entrantes?|ensaladas?|crudo|pescados?|arroces?|carnes?|para los peques|postres?(?: caseros)?|alcohol|caf[eé]s?|starters?|mains?|main courses?|desserts?|wines?)$/i;
const args=Object.fromEntries(process.argv.slice(2).reduce((a,x,i,all)=>x.startsWith('--')?[...a,[x.slice(2),all[i+1]]]:a,[]));
const trigger=JSON.parse(await readFile('.github/hoy-menu-discovery-trigger.json','utf8'));
const scope=(args.scope||trigger.scope||'core').toLowerCase();
const limit=Math.max(1,Math.min(50,Number(args.limit||trigger.limit||14)||14));

async function sb(path){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});
  if(!r.ok)throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0,300)}`);
  return r.json();
}
const clean=v=>String(v??'').trim();
const https=v=>/^https:\/\//i.test(clean(v))?clean(v):'';
const uniq=(arr,key=x=>x)=>{const s=new Set();return arr.filter(x=>{const k=key(x);if(!k||s.has(k))return false;s.add(k);return true})};
const safe=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'venue';
const hash=v=>createHash('sha256').update(v).digest('hex').slice(0,10);

const [restaurants,sources]=await Promise.all([
  sb('restaurants?select=id,name,area,website,is_published&is_published=eq.true&order=name.asc'),
  sb('menu_sources?select=id,restaurant_id,source_url,source_label,is_official,coverage_scope,completeness_status,display_payload&is_official=eq.true&order=restaurant_id.asc')
]);
const sourceMap=new Map();
for(const s of sources){const id=Number(s.restaurant_id);if(!sourceMap.has(id))sourceMap.set(id,[]);sourceMap.get(id).push(s)}
function coreSource(s){return !NON_CORE_SCOPES.has(clean(s.coverage_scope)||'full_menu')}
function renderable(s){
  const st=clean(s.completeness_status),p=s.display_payload||{};
  if(st==='image_complete'&&Array.isArray(p.pages)&&p.pages.some(x=>https(typeof x==='string'?x:x?.url)))return true;
  if((st==='embed_complete'||st==='complete')&&clean(p.mode)==='official_embed'&&https(p.embed_url))return true;
  return st==='complete'&&coreSource(s);
}
function candidate(r){
  if(scope==='core'&&!CORE_AREAS.has(clean(r.area)))return null;
  const rs=sourceMap.get(Number(r.id))||[];
  if(rs.some(s=>s.is_official!==false&&coreSource(s)&&renderable(s)))return null;
  const urls=[];
  for(const s of rs.filter(coreSource)){const u=https(s.source_url);if(u)urls.push({url:u,kind:'known_menu_source',label:clean(s.source_label)||'Offizielle Kartenquelle'})}
  const site=https(r.website);if(site)urls.push({url:site,kind:'website',label:'Offizielle Website'});
  for(const u of trigger.extra_urls?.[String(r.id)]||[]){if(https(u))urls.push({url:https(u),kind:/instagram|facebook/i.test(u)?'official_social':'operator_route',label:'Bekannter Betreiberkanal'})}
  const unique=uniq(urls,x=>x.url).slice(0,5);
  if(!unique.length)return null;
  let score=CORE_AREAS.has(clean(r.area))?50:10;
  if(rs.some(coreSource))score+=30;if(site)score+=15;if(unique.some(x=>x.kind==='official_social'))score+=5;
  return {restaurant_id:Number(r.id),name:r.name,area:r.area,score,urls:unique};
}
const candidates=restaurants.map(candidate).filter(Boolean).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'es')).slice(0,limit);

async function dismiss(page){
  for(const re of [/aceptar/i,/accept all/i,/allow all/i,/entendido/i,/de acuerdo/i]){
    const b=page.getByRole('button',{name:re}).first();if(await b.isVisible().catch(()=>false)){await b.click({timeout:1500}).catch(()=>{});break}
  }
}
async function collect(page){
  return page.evaluate(src=>{
    const re=new RegExp(src,'i'),abs=v=>{try{return new URL(v,location.href).href}catch{return ''}};
    const anchors=[...document.querySelectorAll('a[href]')].map(a=>({text:(a.innerText||a.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,160),url:abs(a.getAttribute('href'))})).filter(x=>x.url&&re.test(`${x.text} ${x.url}`));
    const iframes=[...document.querySelectorAll('iframe[src]')].map(f=>({title:(f.title||'').trim().slice(0,160),url:abs(f.src)})).filter(x=>x.url);
    const images=[...document.querySelectorAll('img')].map(img=>({alt:(img.alt||img.title||'').trim().slice(0,160),url:abs(img.currentSrc||img.src||img.dataset.src||''),w:img.naturalWidth||0,h:img.naturalHeight||0})).filter(x=>x.url&&re.test(`${x.alt} ${x.url}`)&&!/logo|favicon|avatar/i.test(`${x.alt} ${x.url}`));
    const controls=[...document.querySelectorAll('button,[role="tab"],a')].map((el,i)=>({i,text:(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100)})).filter(x=>x.text);
    return {title:document.title,body:(document.body?.innerText||'').slice(0,30000),anchors,iframes,images,controls};
  },MENU_RE.source);
}
async function officialLocaleSnapshot(page,url,code='DE'){
  try{
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(900);await dismiss(page);await page.waitForTimeout(300);
    const before=await page.locator('body').innerText().catch(()=>'');
    const controls=page.locator('button,[role="button"],[role="tab"],a');
    const count=await controls.count();let chosen=null;
    for(let i=0;i<count;i++){
      const el=controls.nth(i),text=clean(await el.innerText().catch(()=>''));
      if(text.toUpperCase()===code&&await el.isVisible().catch(()=>false)){chosen=el;break}
    }
    if(!chosen)return null;
    await chosen.click({timeout:2500,force:true}).catch(()=>{});await page.waitForTimeout(900);
    const after=await page.locator('body').innerText().catch(()=>before);
    if(!after||after===before)return null;
    const state=await collect(page);
    return {locale:code.toLowerCase(),final_url:page.url(),title:state.title,body:clean(state.body).slice(0,30000),anchors:uniq(state.anchors,x=>x.url).slice(0,40),iframes:uniq(state.iframes,x=>x.url).slice(0,20),images:uniq(state.images,x=>x.url).slice(0,30)};
  }catch{return null}
}
async function inspect(context,venue,entry,index){
  const page=await context.newPage();
  const out={...entry,requested_url:entry.url,final_url:'',http_status:null,title:'',error:null,anchors:[],iframes:[],images:[],dynamic:[],locales:{}};
  try{
    const response=await page.goto(entry.url,{waitUntil:'domcontentloaded',timeout:30000});out.http_status=response?.status()??null;
    await page.waitForTimeout(1200);await dismiss(page);await page.waitForTimeout(500);out.final_url=page.url();
    const first=await collect(page);out.title=first.title;out.body_excerpt=clean(first.body).slice(0,12000);out.anchors=uniq(first.anchors,x=>x.url).slice(0,50);out.iframes=uniq(first.iframes,x=>x.url).slice(0,30);out.images=uniq(first.images,x=>x.url).slice(0,40);
    for(const c of first.controls.filter(x=>CLICK_RE.test(x.text)).slice(0,24)){
      const before=await page.locator('body').innerText().catch(()=>first.body);
      const loc=page.locator('button,[role="tab"],a').filter({hasText:c.text}).first();if(!await loc.isVisible().catch(()=>false))continue;
      await loc.click({timeout:1800,force:true}).catch(()=>{});await page.waitForTimeout(500);
      const after=await collect(page);const body=await page.locator('body').innerText().catch(()=>before);
      if(body!==before||after.anchors.length!==first.anchors.length||after.images.length!==first.images.length||after.iframes.length!==first.iframes.length)out.dynamic.push({control:c.text,anchors:uniq(after.anchors,x=>x.url).slice(0,30),iframes:uniq(after.iframes,x=>x.url).slice(0,20),images:uniq(after.images,x=>x.url).slice(0,30),text_delta:clean(body).slice(0,12000)});
    }
    const de=await officialLocaleSnapshot(page,entry.url,'DE');if(de)out.locales.de=de;
    await mkdir('menu-discovery-screenshots',{recursive:true});const file=`menu-discovery-screenshots/${String(index+1).padStart(2,'0')}-${venue.restaurant_id}-${safe(venue.name)}-${hash(entry.url)}.png`;await page.screenshot({path:file,fullPage:true,animations:'disabled'}).catch(()=>{});out.screenshot=file;
  }catch(e){out.error=String(e?.message||e).slice(0,700);out.final_url=page.url()||entry.url}finally{await page.close().catch(()=>{})}
  return out;
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'es-ES',timezoneId:'Europe/Madrid',viewport:{width:1280,height:1600}});
const results=[];
for(let i=0;i<candidates.length;i++){
  const v=candidates[i];console.log(`▶ ${i+1}/${candidates.length} ${v.name}`);const pages=[];
  for(const e of v.urls)pages.push(await inspect(context,v,e,i));results.push({...v,pages});
}
await context.close();await browser.close();
const summary={generated_at:new Date().toISOString(),scope,limit,candidate_count:results.length,venues:results.map(v=>({restaurant_id:v.restaurant_id,name:v.name,area:v.area,pages:v.pages.length,links:v.pages.reduce((n,p)=>n+p.anchors.length,0),iframes:v.pages.reduce((n,p)=>n+p.iframes.length,0),images:v.pages.reduce((n,p)=>n+p.images.length,0),dynamic:v.pages.reduce((n,p)=>n+p.dynamic.length,0),official_de:v.pages.filter(p=>p.locales?.de?.body).length,errors:v.pages.filter(p=>p.error).length}))};
await writeFile('menu-discovery-report.json',JSON.stringify({summary,venues:results},null,2));await writeFile('menu-discovery-summary.json',JSON.stringify(summary,null,2));
console.table(summary.venues);console.log('Evidence-only discovery complete. No Supabase writes were performed.');

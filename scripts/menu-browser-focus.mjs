#!/usr/bin/env node
import {chromium} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const cfg=JSON.parse(await readFile('.github/hoy-menu-discovery-trigger.json','utf8'));
const ids=(cfg.focus_ids||[]).map(Number).filter(Number.isFinite);
if(!ids.length)throw new Error('focus_ids is empty');
const clean=v=>String(v??'').trim();
const safe=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'venue';
const hash=v=>createHash('sha256').update(v).digest('hex').slice(0,10);
const MENU_RE=/(carta|men[uú]|desayuno|tostada|caf[eé]|gofre|crep|zumo|batido|tapa|refresco|cerveza|vino|licor|ginebra|ron|whisk|vodka|cocktail|precio|price|€|\.pdf)/i;

async function dismiss(page){for(const re of [/aceptar/i,/accept all/i,/allow all/i,/entendido/i,/de acuerdo/i]){const b=page.getByRole('button',{name:re}).first();if(await b.isVisible().catch(()=>false)){await b.click({timeout:1500}).catch(()=>{});break}}}
async function collect(page){return page.evaluate(src=>{const re=new RegExp(src,'i'),abs=v=>{try{return new URL(v,location.href).href}catch{return ''}};return {title:document.title,body:(document.body?.innerText||'').slice(0,40000),anchors:[...document.querySelectorAll('a[href]')].map(a=>({text:(a.innerText||a.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,160),url:abs(a.getAttribute('href'))})).filter(x=>x.url&&re.test(`${x.text} ${x.url}`)),images:[...document.querySelectorAll('img')].map(i=>({alt:(i.alt||i.title||'').trim().slice(0,160),url:abs(i.currentSrc||i.src||i.dataset.src||''),w:i.naturalWidth||0,h:i.naturalHeight||0})).filter(x=>x.url&&re.test(`${x.alt} ${x.url}`)),iframes:[...document.querySelectorAll('iframe[src]')].map(f=>({title:(f.title||'').trim().slice(0,160),url:abs(f.src)})).filter(x=>x.url)}},MENU_RE.source)}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({locale:'es-ES',timezoneId:'Europe/Madrid',viewport:{width:1280,height:1600}});
const venues=[];
await mkdir('menu-discovery-screenshots',{recursive:true});
for(const id of ids){
  const urls=[...new Set((cfg.extra_urls?.[String(id)]||[]).filter(x=>/^https:\/\//i.test(x)))];
  const venue={restaurant_id:id,name:`focus-${id}`,area:'core',pages:[]};
  for(let i=0;i<urls.length;i++){
    const url=urls[i],page=await context.newPage();const out={requested_url:url,final_url:'',http_status:null,title:'',body_excerpt:'',anchors:[],images:[],iframes:[],error:null};
    try{const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});out.http_status=response?.status()??null;await page.waitForTimeout(1100);await dismiss(page);await page.waitForTimeout(350);const data=await collect(page);Object.assign(out,{final_url:page.url(),title:data.title,body_excerpt:clean(data.body).slice(0,30000),anchors:data.anchors.slice(0,80),images:data.images.slice(0,60),iframes:data.iframes.slice(0,30)});const shot=`menu-discovery-screenshots/focus-${id}-${String(i+1).padStart(2,'0')}-${hash(url)}.png`;await page.screenshot({path:shot,fullPage:true,animations:'disabled'}).catch(()=>{});out.screenshot=shot}catch(e){out.error=String(e?.message||e).slice(0,700);out.final_url=page.url()||url}finally{await page.close().catch(()=>{})}venue.pages.push(out);console.log(`▶ ${id} ${i+1}/${urls.length} ${url} · ${out.http_status||'ERR'} · ${out.title}`)}
  venues.push(venue);
}
await context.close();await browser.close();
const summary={generated_at:new Date().toISOString(),mode:'focus',focus_ids:ids,venue_count:venues.length,venues:venues.map(v=>({restaurant_id:v.restaurant_id,pages:v.pages.length,ok:v.pages.filter(p=>p.http_status&&p.http_status<400&&!p.error).length,errors:v.pages.filter(p=>p.error||!p.http_status||p.http_status>=400).length,priced_pages:v.pages.filter(p=>/€/.test(p.body_excerpt||'')).length}))};
await writeFile('menu-discovery-report.json',JSON.stringify({summary,venues},null,2));await writeFile('menu-discovery-summary.json',JSON.stringify(summary,null,2));
console.table(summary.venues);console.log('Focused evidence-only discovery complete. No Supabase writes were performed.');

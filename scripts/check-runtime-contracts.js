const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const fail=message=>{throw new Error(message)};

function normalizeLocal(ref){
  if(!ref||/^(?:https?:|data:|mailto:|tel:|#)/i.test(ref))return null;
  const clean=ref.split('#')[0].split('?')[0].trim();
  if(!clean)return null;
  return `./${clean.replace(/^\.\//,'').replace(/^\//,'')}`;
}

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','tests','scripts','playwright-report','test-results'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function checkPwaAssetGraph(){
  const html=read('index.html');
  const worker=read('service-worker.js');
  const coreMatch=worker.match(/const CORE=\[(.*?)\];/s);
  if(!coreMatch)fail('service-worker CORE list not found');
  const core=[...coreMatch[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
  const duplicates=[...new Set(core.filter((value,index)=>core.indexOf(value)!==index))];
  if(duplicates.length)fail(`Duplicate service-worker CORE entries: ${duplicates.join(', ')}`);

  const refs=[];
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)){
    const normalized=normalizeLocal(match[1]);
    if(normalized)refs.push(normalized);
  }
  const runtimeAssets=[...new Set(refs.filter(ref=>/\.(?:js|css|webmanifest|svg)$/i.test(ref)))];
  const coreSet=new Set(core);
  const missingFromCache=runtimeAssets.filter(ref=>!coreSet.has(ref));
  if(missingFromCache.length)fail(`index.html local runtime assets missing from service-worker CORE: ${missingFromCache.join(', ')}`);

  const missingFiles=runtimeAssets
    .map(ref=>ref.replace(/^\.\//,''))
    .filter(rel=>!fs.existsSync(path.join(ROOT,rel)));
  if(missingFiles.length)fail(`index.html references missing local files: ${missingFiles.join(', ')}`);

  const missingCoreFiles=core
    .filter(ref=>ref!=='./')
    .map(ref=>ref.replace(/^\.\//,''))
    .filter(rel=>!fs.existsSync(path.join(ROOT,rel)));
  if(missingCoreFiles.length)fail(`service-worker CORE references missing local files: ${missingCoreFiles.join(', ')}`);

  console.log(`PWA runtime graph: ${runtimeAssets.length} local index assets; ${core.length} CORE entries; complete.`);
}

function checkAnalyticsContract(){
  const contract=JSON.parse(read('data/analytics-event-contract-2.45.json'));
  const allowed=new Set(contract.event_types||[]);
  if(!allowed.size)fail('Analytics event contract is empty');
  if(allowed.size!==(contract.event_types||[]).length)fail('Analytics event contract contains duplicate event types');

  const used=new Set();
  for(const full of walk(ROOT)){
    if(path.extname(full)!=='.js')continue;
    const text=fs.readFileSync(full,'utf8');
    for(const match of text.matchAll(/\btrackEvent\s*\(\s*["']([^"']+)["']/g))used.add(match[1]);
  }
  const unsupported=[...used].filter(type=>!allowed.has(type)).sort();
  if(unsupported.length)fail(`Client trackEvent types missing from analytics contract: ${unsupported.join(', ')}`);

  const migration=read('supabase/migrations/20260818090000_hoy_245_family_analytics_contract.sql');
  const missingFromMigration=[...allowed].filter(type=>!migration.includes(`'${type}'`));
  if(missingFromMigration.length)fail(`Analytics contract types missing from 2.45 RPC migration: ${missingFromMigration.join(', ')}`);

  const requiredGuards=[
    "raise exception 'Unsupported analytics event type'",
    "jsonb_typeof(p_metadata) <> 'object'",
    'pg_column_size(p_metadata) > 4096',
    'r.is_published',
    'security definer',
    'set search_path = public, pg_temp',
    'revoke all on function public.log_analytics_event',
    'grant execute on function public.log_analytics_event'
  ];
  const lowerMigration=migration.toLowerCase();
  const missingGuards=requiredGuards.filter(item=>!lowerMigration.includes(item.toLowerCase()));
  if(missingGuards.length)fail(`Analytics migration lost required safety guards: ${missingGuards.join(', ')}`);

  console.log(`Analytics contract: ${used.size} literal client event types; ${allowed.size} allowed server types; aligned.`);
}

checkPwaAssetGraph();
checkAnalyticsContract();

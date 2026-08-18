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

function lineAt(text,index){return text.slice(0,index).split('\n').length}

function extractFirstArgument(text,start){
  let depth=0;
  let quote=null;
  let escaped=false;
  for(let i=start;i<text.length;i++){
    const ch=text[i];
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote){quote=null;continue}
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='('||ch==='['||ch==='{'){depth++;continue}
    if(ch===')'||ch===']'||ch==='}'){
      if(depth===0)return null;
      depth--;
      continue;
    }
    if(ch===','&&depth===0)return text.slice(start,i).trim();
  }
  return null;
}

function isWrappedByOuterParens(expr){
  if(!expr.startsWith('(')||!expr.endsWith(')'))return false;
  let depth=0,quote=null,escaped=false;
  for(let i=0;i<expr.length;i++){
    const ch=expr[i];
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='(')depth++;
    else if(ch===')'){
      depth--;
      if(depth===0&&i!==expr.length-1)return false;
    }
  }
  return depth===0&&!quote;
}

function stripOuterParens(expr){
  let out=expr.trim();
  while(isWrappedByOuterParens(out))out=out.slice(1,-1).trim();
  return out;
}

function topLevelConditional(expr){
  let depth=0,quote=null,escaped=false,q=-1,nested=0;
  for(let i=0;i<expr.length;i++){
    const ch=expr[i];
    if(quote){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='('||ch==='['||ch==='{'){depth++;continue}
    if(ch===')'||ch===']'||ch==='}'){depth--;continue}
    if(depth!==0)continue;
    if(ch==='?'){
      // Optional chaining is not a conditional operator.
      if(expr[i+1]==='.')continue;
      if(q===-1){q=i;continue}
      nested++;
      continue;
    }
    if(ch===':'&&q!==-1){
      if(nested>0){nested--;continue}
      return {question:q,colon:i};
    }
  }
  return null;
}

function enumerateStaticEventExpression(raw){
  const expr=stripOuterParens(raw);
  const literal=expr.match(/^(['"])([a-z0-9_]+)\1$/i);
  if(literal)return [literal[2]];
  if(expr.includes('`'))return null;
  const conditional=topLevelConditional(expr);
  if(!conditional)return null;
  const yes=enumerateStaticEventExpression(expr.slice(conditional.question+1,conditional.colon));
  const no=enumerateStaticEventExpression(expr.slice(conditional.colon+1));
  if(!yes||!no)return null;
  return [...yes,...no];
}

function addUsedEvent(usedByFile,type,rel){
  const files=usedByFile.get(type)||new Set();
  files.add(rel);
  usedByFile.set(type,files);
}

function checkAnalyticsContract(){
  const contract=JSON.parse(read('data/analytics-event-contract-2.45.json'));
  const allowed=new Set(contract.event_types||[]);
  if(!allowed.size)fail('Analytics event contract is empty');
  if(allowed.size!==(contract.event_types||[]).length)fail('Analytics event contract contains duplicate event types');

  const usedByFile=new Map();
  const dynamicCalls=[];
  for(const full of walk(ROOT)){
    if(path.extname(full)!=='.js')continue;
    const text=fs.readFileSync(full,'utf8');
    const rel=path.relative(ROOT,full).replaceAll(path.sep,'/');

    for(const match of text.matchAll(/\btrackEvent\s*\(/g)){
      const start=match.index||0;
      const prefix=text.slice(Math.max(0,start-24),start);
      if(/function\s*$/.test(prefix))continue;
      const firstArg=extractFirstArgument(text,start+match[0].length);
      const eventTypes=firstArg&&enumerateStaticEventExpression(firstArg);
      if(!eventTypes){
        dynamicCalls.push(`${rel}:${lineAt(text,start)}`);
        continue;
      }
      for(const type of eventTypes)addUsedEvent(usedByFile,type,rel);
    }
  }

  if(dynamicCalls.length){
    fail(`Dynamic analytics event names are forbidden; use a literal or statically enumerable literal ternary: ${dynamicCalls.join(', ')}`);
  }

  const used=new Set(usedByFile.keys());
  const unsupported=[...used].filter(type=>!allowed.has(type)).sort();
  if(unsupported.length){
    const detail=unsupported.map(type=>`${type} <- ${[...usedByFile.get(type)].sort().join(', ')}`).join('; ');
    fail(`Client trackEvent types missing from analytics contract: ${detail}`);
  }

  const migration=read('supabase/migrations/20260818090000_hoy_245_analytics_contract.sql');
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
    'grant execute on function public.log_analytics_event',
    "current_setting('request.headers', true)",
    "request_headers->>'x-hoy-qa'",
    "request_user_agent like '%headlesschrome%'"
  ];
  const lowerMigration=migration.toLowerCase();
  const missingGuards=requiredGuards.filter(item=>!lowerMigration.includes(item.toLowerCase()));
  if(missingGuards.length)fail(`Analytics migration lost required safety guards: ${missingGuards.join(', ')}`);

  const playwright=read('playwright.config.js').toLowerCase();
  if(!playwright.includes("'x-hoy-qa':'1'"))fail('Playwright QA marker X-HOY-QA=1 is missing');

  console.log(`Analytics contract: ${used.size} statically enumerable client event types; ${allowed.size} allowed server types; aligned and fail-closed.`);
}

checkPwaAssetGraph();
checkAnalyticsContract();

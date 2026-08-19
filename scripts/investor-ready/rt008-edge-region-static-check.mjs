import fs from 'node:fs';
import path from 'node:path';

const fail=(msg)=>{console.error(`RT-008 EDGE REGION FAIL: ${msg}`);process.exitCode=1};
const pass=(msg)=>console.log(`RT-008 EDGE REGION PASS: ${msg}`);

const policyPath='edge-region-policy-2.48.js';
const indexPath='index.html';
const adminPath='admin.html';
const swPath='service-worker.js';
const evidencePath='docs/investor-ready/rt008-edge-region-policy-2026-08-19.md';

const policy=fs.readFileSync(policyPath,'utf8');
const index=fs.readFileSync(indexPath,'utf8');
const admin=fs.readFileSync(adminPath,'utf8');
const sw=fs.readFileSync(swPath,'utf8');
const evidence=fs.readFileSync(evidencePath,'utf8');

const ACTIVE_CORE_FUNCTIONS=[
  'claim-submit','publish-offer','venue-media-approve','admin-ops',
  'location-geocode-once','cartociudad-geocode-once','cartociudad-debug',
  'address-fallback-geocode-once','cartociudad-find-fallback','cartociudad-locate-debug',
  'menu-intake-process','promotion-insights','menu-image-once','operator-hours-confirm',
  'mobility-resolve','menu-discovery','menu-editorial-import','menu-social-handoff',
  'operator-accessibility-confirm'
].sort();

const LIVE_ONLY_SOURCE_GAP=[
  'address-fallback-geocode-once','cartociudad-debug','cartociudad-find-fallback',
  'cartociudad-geocode-once','cartociudad-locate-debug','claim-submit',
  'location-geocode-once','menu-image-once','mobility-resolve','publish-offer'
].sort();

if(policy.includes("const PINNED_REGION='eu-central-1'"))pass('policy pins to Core DB region eu-central-1');else fail('pinned region is not eu-central-1');
if(policy.includes("unknownFunctionBehavior:'BLOCK'"))pass('unknown functions fail closed');else fail('unknown function behaviour is not BLOCK');
if(policy.includes('hoy_edge_region_mismatch'))pass('observed contradictory region fails closed when header is exposed');else fail('region mismatch fail-closed guard missing');

for(const slug of ACTIVE_CORE_FUNCTIONS){
  const needle=`'${slug}':Object.freeze({region:PINNED_REGION`;
  if(policy.includes(needle))pass(`classified active function ${slug}`);else fail(`active function missing or not pinned: ${slug}`);
}

const policyEntries=[...policy.matchAll(/^\s*'([^']+)':Object\.freeze\(\{region:PINNED_REGION/gm)].map(m=>m[1]).sort();
if(JSON.stringify(policyEntries)===JSON.stringify(ACTIVE_CORE_FUNCTIONS))pass('policy set exactly matches 19-function live audit snapshot');
else fail(`policy set differs from live audit snapshot: ${JSON.stringify(policyEntries)}`);

function assertLoadOrder(html,label,clientNeedle){
  const sdk=html.indexOf('@supabase/supabase-js@2.111.0/dist/umd/supabase.js');
  const guard=html.indexOf('edge-region-policy-2.48.js?v=2.48.0');
  const client=html.indexOf(clientNeedle);
  if(sdk>=0&&guard>sdk&&client>guard)pass(`${label} loads region guard after Supabase SDK and before client creation script`);
  else fail(`${label} region guard load order is unsafe`);
}
assertLoadOrder(index,'public shell','app-1.js');
assertLoadOrder(admin,'admin shell','admin.js?v=2.10.0');

if(sw.includes("'./edge-region-policy-2.48.js'"))pass('PWA cache contains region policy asset');else fail('PWA cache missing region policy asset');

const trackedFunctions=fs.existsSync('supabase/functions')
  ? fs.readdirSync('supabase/functions',{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort()
  : [];
for(const slug of trackedFunctions){
  if(ACTIVE_CORE_FUNCTIONS.includes(slug))pass(`source-tracked function classified: ${slug}`);else fail(`source-tracked function is unclassified: ${slug}`);
}
const liveOnly=ACTIVE_CORE_FUNCTIONS.filter(x=>!trackedFunctions.includes(x)).sort();
if(JSON.stringify(liveOnly)===JSON.stringify(LIVE_ONLY_SOURCE_GAP))pass('10 active live-only source gaps remain explicitly enumerated');
else fail(`live/source gap changed and must be reviewed: ${JSON.stringify(liveOnly)}`);
for(const slug of LIVE_ONLY_SOURCE_GAP){
  if(evidence.includes(`\`${slug}\``))pass(`evidence discloses live-only source gap ${slug}`);else fail(`evidence omits live-only source gap ${slug}`);
}

function walk(dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','docs','playwright-report','test-results'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p,out);else out.push(p);
  }
  return out;
}
const runtimeFiles=walk('.').filter(p=>/\.(?:js|mjs|html|ya?ml)$/.test(p));
for(const p of runtimeFiles){
  if(p===policyPath||p.endsWith('rt008-edge-region-static-check.mjs'))continue;
  const s=fs.readFileSync(p,'utf8');
  if(s.includes('/functions/v1/')){
    if(/forceFunctionRegion=eu-central-1|['\"]x-region['\"]\s*:\s*['\"]eu-central-1['\"]/.test(s))pass(`direct Edge URL is region-scoped: ${p}`);
    else fail(`direct Edge URL lacks eu-central-1 routing: ${p}`);
  }
  if(p.startsWith('scripts/')&&s.includes('.functions.invoke(')&&!s.includes("region:'eu-central-1'")&&!s.includes('region:"eu-central-1"')){
    fail(`non-browser script invokes Edge Function without explicit eu-central-1: ${p}`);
  }
}

if(process.exitCode)process.exit(process.exitCode);
console.log('RT-008 Edge region static check complete.');

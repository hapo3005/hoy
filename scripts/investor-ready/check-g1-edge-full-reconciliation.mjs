import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const liveCapture=JSON.parse(fs.readFileSync('docs/investor-ready/g1-edge-live-source-manifest-2026-08-19.json','utf8'));
const full=JSON.parse(fs.readFileSync('docs/investor-ready/g1-edge-full-live-reconciliation-2026-08-19.json','utf8'));

const active=[
  'claim-submit','publish-offer','venue-media-approve','admin-ops','location-geocode-once',
  'cartociudad-geocode-once','cartociudad-debug','address-fallback-geocode-once',
  'cartociudad-find-fallback','cartociudad-locate-debug','menu-intake-process','promotion-insights',
  'menu-image-once','operator-hours-confirm','mobility-resolve','menu-discovery','menu-editorial-import',
  'menu-social-handoff','operator-accessibility-confirm'
].sort();

const dirs=fs.readdirSync('supabase/functions',{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
if(JSON.stringify(dirs)!==JSON.stringify(active)) throw new Error(`active source-path set drift: ${JSON.stringify(dirs)}`);
if(full.active_live_count!==19) throw new Error('full reconciliation live count must be 19');
if(full.accounting?.captured_exact_in_repo!==10 || full.accounting?.repo_desired_state_ahead_of_live!==9 || full.accounting?.unaccounted!==0){
  throw new Error(`invalid accounting: ${JSON.stringify(full.accounting)}`);
}

const recoveredEntries=Object.entries(liveCapture.recovered||{});
const survivorEntries=Object.entries(full.existing_repo_survivors||{});
if(recoveredEntries.length!==10) throw new Error(`expected 10 recovered captures, got ${recoveredEntries.length}`);
if(survivorEntries.length!==9) throw new Error(`expected 9 repo survivors, got ${survivorEntries.length}`);

const recoveredSet=new Set(recoveredEntries.map(([slug])=>slug));
const survivorSet=new Set(survivorEntries.map(([slug])=>slug));
for(const slug of recoveredSet) if(survivorSet.has(slug)) throw new Error(`slug appears in both accounting sets: ${slug}`);
const union=[...recoveredSet,...survivorSet].sort();
if(JSON.stringify(union)!==JSON.stringify(active)) throw new Error(`19/19 accounting union mismatch: ${JSON.stringify(union)}`);

for(const [slug,meta] of recoveredEntries){
  const path=`supabase/functions/${slug}/index.ts`;
  if(!fs.existsSync(path)) throw new Error(`missing recovered source: ${slug}`);
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  if(sha!==meta.file_sha256) throw new Error(`recovered live-capture fingerprint drift: ${slug}`);
  if(!/^[a-f0-9]{64}$/.test(meta.ezbr_sha256)) throw new Error(`invalid recovered live bundle hash: ${slug}`);
}

for(const [slug,meta] of survivorEntries){
  const path=`supabase/functions/${slug}/index.ts`;
  if(!fs.existsSync(path)) throw new Error(`missing repo survivor source: ${slug}`);
  const blob=execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();
  if(blob!==meta.repo_index_blob_sha) throw new Error(`repo survivor blob drift: ${slug} expected=${meta.repo_index_blob_sha} actual=${blob}`);
  if(!/^[a-f0-9]{64}$/.test(meta.live_ezbr_sha256)) throw new Error(`invalid live bundle fingerprint: ${slug}`);
  if(meta.verify_jwt!==true) throw new Error(`unexpected survivor verify_jwt state: ${slug}`);
  if(!String(meta.reconciliation||'').startsWith('DRIFT_CONFIRMED_REPO_AHEAD')) throw new Error(`survivor drift classification missing: ${slug}`);
  const body=fs.readFileSync(path,'utf8');
  if(!meta.repo_probe || !body.includes(meta.repo_probe)) throw new Error(`repo survivor probe missing: ${slug}`);
}

const venueExtra=full.existing_repo_survivors?.['venue-media-approve']?.repo_extra_files?.['deno.json'];
if(!venueExtra) throw new Error('venue-media-approve deno.json evidence missing');
const venueDeno='supabase/functions/venue-media-approve/deno.json';
if(!fs.existsSync(venueDeno)) throw new Error('venue-media-approve deno.json missing');
const venueDenoBlob=execFileSync('git',['hash-object',venueDeno],{encoding:'utf8'}).trim();
if(venueDenoBlob!==venueExtra) throw new Error(`venue deno.json drift: ${venueDenoBlob}`);

if(full.boundary?.no_production_deploy!==true || full.boundary?.no_supabase_redeploy!==true || full.boundary?.no_database_mutation!==true || full.boundary?.no_automatic_merge!==true){
  throw new Error('G1 evidence boundary weakened');
}

console.log('G1 EDGE FULL RECONCILIATION GREEN: 19/19 accounted; 10/10 captured-exact recovery sources; 9/9 repo-desired-state-ahead deployment drifts classified; 0 unaccounted.');

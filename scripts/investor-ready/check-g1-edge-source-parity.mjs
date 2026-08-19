import fs from 'node:fs';
import crypto from 'node:crypto';

const manifest=JSON.parse(fs.readFileSync('docs/investor-ready/g1-edge-live-source-manifest-2026-08-19.json','utf8'));
const active=[
  'claim-submit','publish-offer','venue-media-approve','admin-ops','location-geocode-once',
  'cartociudad-geocode-once','cartociudad-debug','address-fallback-geocode-once',
  'cartociudad-find-fallback','cartociudad-locate-debug','menu-intake-process','promotion-insights',
  'menu-image-once','operator-hours-confirm','mobility-resolve','menu-discovery','menu-editorial-import',
  'menu-social-handoff','operator-accessibility-confirm'
].sort();
const dirs=fs.readdirSync('supabase/functions',{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name).sort();
if(JSON.stringify(dirs)!==JSON.stringify(active)) throw new Error(`source-path parity mismatch: ${JSON.stringify(dirs)}`);
if(manifest.active_function_count!==19) throw new Error('manifest active_function_count must be 19');
const recovered=Object.entries(manifest.recovered);
if(recovered.length!==10) throw new Error(`expected 10 recovered functions, got ${recovered.length}`);
for(const [slug,meta] of recovered){
  const p=`supabase/functions/${slug}/index.ts`;
  if(!fs.existsSync(p)) throw new Error(`missing recovered source: ${slug}`);
  const body=fs.readFileSync(p);
  const sha=crypto.createHash('sha256').update(body).digest('hex');
  if(sha!==meta.file_sha256) throw new Error(`source fingerprint mismatch: ${slug} ${sha}`);
  if(!/^[a-f0-9]{64}$/.test(meta.ezbr_sha256)) throw new Error(`invalid live bundle fingerprint: ${slug}`);
  if(typeof meta.verify_jwt!=='boolean') throw new Error(`verify_jwt missing: ${slug}`);
  if(meta.runtime_state==='retired_410' && !body.toString().includes("error:'retired'")) throw new Error(`retired marker drift: ${slug}`);
  if(meta.runtime_state==='disabled_410' && !body.toString().includes("error:'disabled'")) throw new Error(`disabled marker drift: ${slug}`);
}
if(manifest.recovered['mobility-resolve'].verify_jwt!==false) throw new Error('mobility-resolve live auth metadata drift');
for(const [slug,meta] of recovered){
  if(slug!=='mobility-resolve' && meta.verify_jwt!==true) throw new Error(`unexpected verify_jwt=false: ${slug}`);
}
console.log(`G1 EDGE SOURCE PARITY GREEN: ${dirs.length}/19 source paths; ${recovered.length}/10 recovered captures fingerprinted.`);

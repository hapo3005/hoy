import fs from 'node:fs';

const p='supabase/functions/menu-editorial-import/index.ts';
if(!fs.existsSync(p)) throw new Error('menu-editorial-import source missing');
const s=fs.readFileSync(p,'utf8');
const markers=[
  'npm:@supabase/supabase-js@2.111.0',
  'private_dns_target',
  "redirect:'manual'",
  'too_many_redirects',
  'source_too_large',
  'trusted_core_source_required',
  'OPENAI_RESPONSES',
  'store:false',
  'safety_identifier:',
  "type:'json_schema'",
  'strict:true',
  'model_refused_source',
  'admin_identity_mismatch',
  'Keine automatische Veröffentlichung',
  'UNTRUSTED DATA'
];
const missing=markers.filter(x=>!s.includes(x));
if(missing.length){
  console.error('HOY menu editorial preflight: FAIL');
  for(const x of missing) console.error(`missing marker: ${x}`);
  process.exit(1);
}
console.log('HOY menu editorial preflight: PASS');

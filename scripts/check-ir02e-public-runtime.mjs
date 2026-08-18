import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const out=path.join(root,'.tmp-public-runtime-qa');
const policy=JSON.parse(fs.readFileSync(path.join(root,'deploy/public-runtime-policy.json'),'utf8'));
const fail=msg=>{throw new Error(`IR-02E FAIL: ${msg}`)};

const build=()=>spawnSync(process.execPath,['scripts/build-public-runtime.mjs'],{
  cwd:root,env:{...process.env,HOY_PUBLIC_RUNTIME_DIR:out},encoding:'utf8'
});
const walk=dir=>{
  const result=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory())result.push(...walk(abs)); else result.push(abs);
  }
  return result;
};
const digest=abs=>crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');

fs.rmSync(out,{recursive:true,force:true});
let built=build();
if(built.status!==0)fail(built.stderr||built.stdout||'public runtime build failed');

const files=walk(out);
if(!files.length)fail('public runtime is empty');
for(const required of ['index.html','package.json','public-release-manifest.json']){
  if(!fs.existsSync(path.join(out,required)))fail(`${required} missing from public runtime`);
}

for(const abs of files){
  const rel=path.relative(out,abs).split(path.sep).join('/');
  const parts=rel.split('/');
  if(parts.some(p=>policy.never_publish_directories.includes(p)))fail(`forbidden directory leaked: ${rel}`);
  if(policy.never_publish_extensions.includes(path.extname(rel).toLowerCase()))fail(`forbidden extension leaked: ${rel}`);
  const lower=rel.toLowerCase();
  if(policy.never_publish_name_fragments.some(x=>lower.includes(String(x).toLowerCase())))fail(`forbidden filename leaked: ${rel}`);
  const text=fs.readFileSync(abs,'utf8');
  for(const pattern of policy.secret_patterns){
    if(text.includes(pattern))fail(`secret pattern ${pattern} leaked: ${rel}`);
  }
}

const runtimePackage=JSON.parse(fs.readFileSync(path.join(out,'package.json'),'utf8'));
if(Object.keys(runtimePackage).sort().join(',')!=='name,version')fail('runtime package metadata must expose only name/version');
if(!/^\d+\.\d+\.\d+$/.test(String(runtimePackage.version||'')))fail('runtime package version must be semver');

const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/gi)].map(m=>m[1]);
for(const ref of refs){
  if(/^(?:https?:|data:|mailto:|tel:|\/\/)/i.test(ref))continue;
  const local=ref.replace(/^\.\//,'').replace(/^\//,'');
  if(!local||local.endsWith('/'))continue;
  if(!fs.existsSync(path.join(out,local)))fail(`index.html references missing runtime asset: ${local}`);
}

const manifestPath=path.join(out,'public-release-manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.schema_version!=='1.1')fail('unexpected manifest schema');
if('generated_at' in manifest)fail('volatile generated_at must not be embedded in deterministic manifest');
if(!Array.isArray(manifest.files)||manifest.file_count!==manifest.files.length)fail('release manifest count mismatch');
if(manifest.files.some(x=>/^(?:docs|data|scripts|supabase|tests|\.github)\//.test(x.path)))fail('sensitive path recorded in release manifest');
if(!manifest.files.some(x=>x.path==='package.json'))fail('sanitized package metadata missing from manifest');
for(const item of manifest.files){
  const abs=path.join(out,item.path);
  if(!fs.existsSync(abs))fail(`manifest references missing file ${item.path}`);
  if(fs.statSync(abs).size!==item.bytes)fail(`byte count mismatch for ${item.path}`);
  if(digest(abs)!==item.sha256)fail(`sha256 mismatch for ${item.path}`);
}

// Prove deterministic manifest output by rebuilding from unchanged source.
const firstManifest=fs.readFileSync(manifestPath);
built=build();
if(built.status!==0)fail(built.stderr||built.stdout||'second public runtime build failed');
const secondManifest=fs.readFileSync(manifestPath);
if(!firstManifest.equals(secondManifest))fail('public release manifest is not deterministic across identical builds');

// Platform Core is an explicit-file future integration path, never a directory leak.
const platformCoreDir=path.join(root,'platform-core');
if(fs.existsSync(platformCoreDir)){
  for(const rel of policy.public_optional_files||[]){
    if(fs.existsSync(path.join(root,rel))&&!fs.existsSync(path.join(out,rel)))fail(`optional runtime file not copied: ${rel}`);
  }
  for(const forbidden of ['platform-core/README.md','platform-core/consumer-contract.json','platform-core/adoption.json','platform-core/tests/core.test.cjs']){
    if(fs.existsSync(path.join(out,forbidden)))fail(`internal Platform Core asset leaked: ${forbidden}`);
  }
}

const fileCount=manifest.file_count;
fs.rmSync(out,{recursive:true,force:true});
console.log(JSON.stringify({ok:true,fileCount,deterministicManifest:true,mode:policy.mode},null,2));

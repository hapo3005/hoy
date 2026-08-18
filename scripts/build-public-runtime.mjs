import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const policy=JSON.parse(fs.readFileSync(path.join(root,'deploy/public-runtime-policy.json'),'utf8'));
const out=path.resolve(root,process.env.HOY_PUBLIC_RUNTIME_DIR||'dist-public');
const normalize=p=>p.split(path.sep).join('/');
const denyName=rel=>{
  const lower=rel.toLowerCase();
  if(policy.never_publish_name_fragments.some(x=>lower.includes(String(x).toLowerCase())))return true;
  return policy.never_publish_extensions.includes(path.extname(lower));
};
const assertSafeRel=rel=>{
  const normalized=normalize(rel);
  const parts=normalized.split('/');
  if(parts.some(p=>policy.never_publish_directories.includes(p)))throw new Error(`blocked public path: ${normalized}`);
  if(denyName(normalized))throw new Error(`blocked public filename: ${normalized}`);
  if(normalized.startsWith('../')||path.isAbsolute(rel))throw new Error(`unsafe public path: ${normalized}`);
};
const copyFile=rel=>{
  assertSafeRel(rel);
  const src=path.join(root,rel);
  if(!fs.existsSync(src)||!fs.statSync(src).isFile())throw new Error(`public source file missing: ${rel}`);
  const dst=path.join(out,rel);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
};
const walk=dir=>{
  const abs=path.join(root,dir);
  if(!fs.existsSync(abs))return [];
  const rows=[];
  for(const entry of fs.readdirSync(abs,{withFileTypes:true})){
    const rel=normalize(path.relative(root,path.join(abs,entry.name)));
    if(entry.isDirectory())rows.push(...walk(rel));
    else rows.push(rel);
  }
  return rows;
};
const walkOut=dir=>{
  const rows=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory())rows.push(...walkOut(abs)); else rows.push(abs);
  }
  return rows;
};

fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});

for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(!entry.isFile())continue;
  const rel=entry.name;
  const ext=path.extname(rel.toLowerCase());
  if(policy.public_root_files.includes(rel)||policy.public_root_extensions.includes(ext))copyFile(rel);
}
for(const dir of policy.public_directories){
  for(const rel of walk(dir))copyFile(rel);
}
for(const rel of policy.public_optional_files||[]){
  const src=path.join(root,rel);
  if(fs.existsSync(src))copyFile(rel);
}

const sourcePackage=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(String(sourcePackage.version||'')))throw new Error('invalid source package version for runtime metadata');
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:sourcePackage.name||'hoy',version:sourcePackage.version},null,2)+'\n');

for(const required of policy.required_runtime_files){
  if(!fs.existsSync(path.join(out,required)))throw new Error(`required runtime file missing: ${required}`);
}

const manifest=[];
for(const abs of walkOut(out)){
  const rel=normalize(path.relative(out,abs));
  if(rel==='public-release-manifest.json')continue;
  assertSafeRel(rel);
  const body=fs.readFileSync(abs);
  const text=body.toString('utf8');
  for(const pattern of policy.secret_patterns){
    if(text.includes(pattern))throw new Error(`secret-pattern '${pattern}' found in public runtime: ${rel}`);
  }
  manifest.push({path:rel,bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex')});
}
manifest.sort((a,b)=>a.path.localeCompare(b.path));

// Intentionally deterministic: volatile generation timestamps belong to workflow
// metadata, not to the content-addressed public runtime manifest.
const release={schema_version:'1.1',mode:policy.mode,file_count:manifest.length,files:manifest};
fs.writeFileSync(path.join(out,'public-release-manifest.json'),JSON.stringify(release,null,2)+'\n');
console.log(`HOY public runtime built: ${manifest.length} files -> ${path.relative(root,out)}`);

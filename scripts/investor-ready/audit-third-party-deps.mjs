#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['.'];
const skip = new Set(['.git','node_modules','playwright-report','test-results','dist','build','coverage','investor-ready-audit']);
const textExt = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.html','.htm','.yml','.yaml','.json','.md']);
const records = [];
const licenses = [];

function rel(root,file){ return path.relative(root,file).replaceAll(path.sep,'/'); }
function add(root,file,kind,spec,declaredVersion=''){
  records.push({root:path.resolve(root),file:rel(root,file),kind,spec,declared_version:declaredVersion||''});
}
function walk(root,dir=root){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(root,p);
    else inspect(root,p);
  }
}
function inspect(root,file){
  const base=path.basename(file);
  if(/^licen[cs]e(?:\..*)?$/i.test(base)||/^notice(?:\..*)?$/i.test(base)||/^copying(?:\..*)?$/i.test(base)){
    licenses.push({root:path.resolve(root),file:rel(root,file)});
  }
  if(base==='package.json'){
    try{
      const j=JSON.parse(fs.readFileSync(file,'utf8'));
      for(const [bucket,obj] of Object.entries({dependency:j.dependencies||{},devDependency:j.devDependencies||{},peerDependency:j.peerDependencies||{},optionalDependency:j.optionalDependencies||{}})){
        for(const [name,version] of Object.entries(obj)) add(root,file,bucket,name,String(version));
      }
    }catch(e){ add(root,file,'parse_error',`package.json:${e.message}`); }
  }
  const ext=path.extname(file).toLowerCase();
  if(!textExt.has(ext) || fs.statSync(file).size>2_000_000) return;
  let txt=''; try{ txt=fs.readFileSync(file,'utf8'); }catch{return;}

  for(const m of txt.matchAll(/(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) add(root,file,'external_html',m[1]);
  for(const m of txt.matchAll(/(?:from\s*|import\s*\(?\s*)["']((?:npm:|jsr:|https?:\/\/)[^"']+)["']/g)) add(root,file,'external_import',m[1]);
  if(/\.ya?ml$/i.test(file)) for(const m of txt.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) add(root,file,'github_action',m[1]);
}

for(const root0 of roots){
  const root=path.resolve(root0);
  if(!fs.existsSync(root)){ console.error(`missing root: ${root0}`); process.exitCode=2; continue; }
  walk(root);
}

records.sort((a,b)=>`${a.root}/${a.file}/${a.kind}/${a.spec}`.localeCompare(`${b.root}/${b.file}/${b.kind}/${b.spec}`));
const dedup=[]; const seen=new Set();
for(const r of records){ const k=JSON.stringify(r); if(!seen.has(k)){seen.add(k);dedup.push(r);} }

const outDir=path.resolve('investor-ready-audit');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'third-party-dependencies.json'),JSON.stringify({generated_at:new Date().toISOString(),roots:roots.map(x=>path.resolve(x)),records:dedup,license_files:licenses},null,2));

const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
const cols=['root','file','kind','spec','declared_version'];
const csv=[cols.map(esc).join(','),...dedup.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+'\n';
fs.writeFileSync(path.join(outDir,'third-party-dependencies.csv'),csv);
fs.writeFileSync(path.join(outDir,'license-files.json'),JSON.stringify(licenses,null,2));

const unpinned = dedup.filter(r => (r.kind==='external_html'||r.kind==='external_import'||r.kind==='github_action') && (/(@2(?:\b|\/))/.test(r.spec) || /@(main|master|latest)\b/.test(r.spec) || (!/@|\b\d+\.\d+\.\d+/.test(r.spec) && /cdn\.jsdelivr\.net\/npm\//.test(r.spec))));
const summary={records:dedup.length,license_files:licenses.length,possible_unpinned_runtime_or_action:unpinned.length};
fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
if(unpinned.length){
  console.log('\nPossible unpinned dependencies/actions:');
  for(const r of unpinned) console.log(`- ${r.file}: ${r.spec}`);
}

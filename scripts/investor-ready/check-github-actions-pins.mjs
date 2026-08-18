import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const workflowDir=path.join(root,'.github','workflows');
const files=fs.readdirSync(workflowDir).filter(x=>/\.ya?ml$/i.test(x)).sort();
const findings=[];
const inventory=[];
const usesRe=/^\s*(?:-\s*)?uses:\s*([^\s#]+)(?:\s+#\s*(.*))?$/gm;
for(const file of files){
  const text=fs.readFileSync(path.join(workflowDir,file),'utf8');
  let m;
  while((m=usesRe.exec(text))){
    const spec=m[1];
    if(spec.startsWith('./')) continue;
    const at=spec.lastIndexOf('@');
    const ref=at>=0?spec.slice(at+1):'';
    const target=at>=0?spec.slice(0,at):spec;
    const immutable=/^[0-9a-f]{40}$/i.test(ref);
    inventory.push({file,target,ref,immutable,comment:(m[2]||'').trim()});
    if(!immutable) findings.push({file,spec,reason:'remote action/reusable workflow is not pinned to a full 40-character commit SHA'});
  }
}
const summary={schema_version:'1.0',workflow_files:files.length,remote_uses_records:inventory.length,immutable_records:inventory.filter(x=>x.immutable).length,floating_records:findings.length,status:findings.length?'REVIEW_REQUIRED':'GREEN',findings,inventory};
fs.mkdirSync('investor-ready-actions-pin-audit',{recursive:true});
fs.writeFileSync('investor-ready-actions-pin-audit/SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync('investor-ready-actions-pin-audit/SUMMARY.md',[
  '# RT-006 GitHub Actions immutable-pin audit','',
  `- Workflow files: ${summary.workflow_files}`,
  `- Remote uses records: ${summary.remote_uses_records}`,
  `- Immutable full-SHA refs: ${summary.immutable_records}`,
  `- Floating refs: ${summary.floating_records}`,
  `- Status: **${summary.status}**`,
  ...(findings.length?['','## Review required',...findings.map(x=>`- ${x.file}: \`${x.spec}\``)]:[])
].join('\n')+'\n');
console.log(JSON.stringify({workflow_files:summary.workflow_files,remote_uses_records:summary.remote_uses_records,immutable_records:summary.immutable_records,floating_records:summary.floating_records,status:summary.status}));
if(findings.length) process.exit(1);

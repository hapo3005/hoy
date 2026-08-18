const {test,expect}=require('@playwright/test');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');

test('G1 Acquisition Clean master register is internally consistent',async()=>{
  const output=execFileSync(process.execPath,['scripts/check-acquisition-clean.cjs'],{
    cwd:process.cwd(),
    encoding:'utf8'
  });
  const result=JSON.parse(output);
  expect(result.ok).toBe(true);
  expect(result.gate).toBe('G1_ACQUISITION_CLEAN');
  expect(result.schemaVersion).toBe('1.1.0');
  expect(result.overallStatus).toBe('IN_PROGRESS');
  expect(result.items).toBeGreaterThanOrEqual(12);
  expect(result.supersededCanonicalPathsBlocked).toBe(true);
});

test('G1 clean successors replace overlapping historical merge paths without declaring DONE',async()=>{
  const reg=JSON.parse(fs.readFileSync('docs/investor-ready/g1-acquisition-clean-register.json','utf8'));
  const byId=new Map(reg.items.map(x=>[x.id,x]));

  expect(byId.get('G1-DIGITAL-CONTROL').canonical).toEqual(['hapo3005/hoy#119']);
  expect(byId.get('G1-PRIVACY').canonical).toEqual(['hapo3005/hoy#120']);
  expect(byId.get('G1-PUBLIC-RUNTIME').canonical).toEqual(['hapo3005/hoy#121']);
  expect(byId.get('G1-BUSINESS-TERMS').canonical).toEqual(['hapo3005/hoy#122']);
  expect(byId.get('G1-CORP-IP').canonical).toContain('hapo3005/hoy#123');

  const active=reg.items.filter(x=>x.status!=='REFERENCE_ONLY').flatMap(x=>x.canonical);
  for(const old of ['hapo3005/hoy#105','hapo3005/hoy#107','hapo3005/hoy#109'])expect(active).not.toContain(old);
  expect(reg.overallStatus).toBe('IN_PROGRESS');
});

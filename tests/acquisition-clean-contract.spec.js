const {test,expect}=require('@playwright/test');
const {execFileSync}=require('node:child_process');

test('G1 Acquisition Clean master register is internally consistent',async()=>{
  const output=execFileSync(process.execPath,['scripts/check-acquisition-clean.cjs'],{
    cwd:process.cwd(),
    encoding:'utf8'
  });
  const result=JSON.parse(output);
  expect(result.ok).toBe(true);
  expect(result.gate).toBe('G1_ACQUISITION_CLEAN');
  expect(result.overallStatus).toBe('IN_PROGRESS');
  expect(result.items).toBeGreaterThanOrEqual(9);
});

const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('main-menu isolation runs before language integrity and is cached',async({request})=>{
  const [js,index,worker]=await Promise.all([request.get('./menu-core-scope-2.36.js'),request.get('./index.html'),request.get('./service-worker.js')]);
  for(const r of [js,index,worker])expect(r.ok()).toBeTruthy();
  const code=await js.text(),html=await index.text(),sw=await worker.text();
  expect(code).toContain("window.hoyMenuCoreScopeVersion='2.36.0'");
  expect(html.indexOf('menu-core-scope-2.36.js')).toBeGreaterThan(html.indexOf('menu-integrity-2.32.js'));
  expect(html.indexOf('menu-core-scope-2.36.js')).toBeLessThan(html.indexOf('menu-language-integrity-2.33.js'));
  expect(sw).toContain('./menu-core-scope-2.36.js');
});

test('exactly one deterministic primary main source owns contentSourceIds',()=>{
  const code=fs.readFileSync('menu-core-scope-2.36.js','utf8');
  expect(code).toContain('primaryCore(coreContent)');
  expect(code).toContain('scopeWeight');
  expect(code).toContain('statusWeight');
  expect(code).toContain('completeness_checked_at,last_checked_at');
  expect(code).toContain('const coreIds=[String(primary.id)]');
  expect(code).toContain('contentSourceIds:coreIds');
  expect(code).toContain('supplementalSourceIds');
});

test('scope isolation remains read-only and fail-closed',()=>{
  const code=fs.readFileSync('menu-core-scope-2.36.js','utf8');
  expect(code).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|functions\.invoke/);
  expect(code).toContain("console.error('HOY core menu scope isolation failed'");
  expect(code).toContain('throw error');
});

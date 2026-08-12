const {test,expect}=require('@playwright/test');

test('active official source selection excludes stale states and protects main-menu scope',async({request})=>{
  const r=await request.get('./menu-source-truth-2.34.js');
  expect(r.ok()).toBeTruthy();
  const js=await r.text();
  expect(js).toContain("EXCLUDED_STATUSES=new Set(['superseded','invalid','unknown'])");
  expect(js).toContain('statusWeight234');
  expect(js).toContain('!EXCLUDED_STATUSES.has(clean234(s.completeness_status))');
  expect(js).toContain('scopeWeight234(b)-scopeWeight234(a)||statusWeight234(b)-statusWeight234(a)');
});

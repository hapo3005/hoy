const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('browser discovery is evidence-only and needs no privileged secret',()=>{
  const js=fs.readFileSync('scripts/menu-browser-discovery.mjs','utf8');
  const wf=fs.readFileSync('.github/workflows/menu-browser-discovery.yml','utf8');
  expect(js).toContain('Evidence-only discovery complete');
  expect(js).not.toMatch(/service_role|SUPABASE_SECRET|venue_sales_pipeline|menu_discovery_checks/);
  expect(js).not.toMatch(/\/rest\/v1\/[^'`]+[^\n]*(POST|PATCH|DELETE)|method\s*:\s*['"](?:POST|PATCH|DELETE)/i);
  expect(wf).not.toContain('HOY_SUPABASE_SECRET_KEY');
  expect(wf).toContain("permissions:\n  contents: read");
});

test('core browser targets include known dynamic and social gaps',()=>{
  const cfg=JSON.parse(fs.readFileSync('.github/hoy-menu-discovery-trigger.json','utf8'));
  expect(cfg.scope).toBe('core');
  for(const id of ['4','11','14','151','152','205'])expect(cfg.extra_urls[id]?.length).toBeGreaterThan(0);
  expect(cfg.extra_urls['11'].some(x=>x.includes('playachicalamanga'))).toBeTruthy();
  expect(cfg.extra_urls['151'].some(x=>x.includes('myrestoo'))).toBeTruthy();
  expect(cfg.extra_urls['152'].some(x=>x.includes('instagram.com'))).toBeTruthy();
});

test('discovery inspects dynamic menu controls and captures evidence',()=>{
  const js=fs.readFileSync('scripts/menu-browser-discovery.mjs','utf8');
  expect(js).toContain("page.locator('button,[role=\"tab\"],a')");
  expect(js).toContain('page.screenshot');
  expect(js).toContain('iframes');
  expect(js).toContain('images');
  expect(js).toContain('dynamic');
});

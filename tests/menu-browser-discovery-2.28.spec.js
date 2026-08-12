const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('browser discovery is evidence-only and needs no privileged secret',()=>{
  const js=fs.readFileSync('scripts/menu-browser-discovery.mjs','utf8');
  const focus=fs.readFileSync('scripts/menu-browser-focus.mjs','utf8');
  const wf=fs.readFileSync('.github/workflows/menu-browser-discovery.yml','utf8');
  for(const code of [js,focus]){
    expect(code).toMatch(/evidence-only discovery complete/i);
    expect(code).not.toMatch(/service_role|SUPABASE_SECRET|venue_sales_pipeline|menu_discovery_checks/);
    expect(code).not.toMatch(/method\s*:\s*['"](?:POST|PATCH|DELETE)/i);
  }
  expect(wf).not.toContain('HOY_SUPABASE_SECRET_KEY');
  expect(wf).toContain("permissions:\n  contents: read");
});

test('focused deep-dive can inspect all official Chibichanga card sections',()=>{
  const cfg=JSON.parse(fs.readFileSync('.github/hoy-menu-discovery-trigger.json','utf8'));
  expect(cfg.scope).toBe('core');
  expect(cfg.focus_ids).toEqual([97]);
  expect(cfg.limit).toBe(1);
  expect(cfg.extra_urls['97']).toHaveLength(18);
  for(const path of ['/desayunos/','/tostadas/','/cafes/','/gofres-y-creps/','/zumos-naturales/','/batidos-naturales/','/tapas/','/refrescos-de-verano/','/refrescos/','/cervezas/','/vinos/','/licores/','/ginebras/','/rones/','/whiskies/','/vodka/','/cocktails/'])expect(cfg.extra_urls['97'].some(x=>x.includes(path)),path).toBeTruthy();
});

test('workflow switches to focused collector only when focus_ids are explicitly configured',()=>{
  const wf=fs.readFileSync('.github/workflows/menu-browser-discovery.yml','utf8');
  expect(wf).toContain("focus=$(node -e");
  expect(wf).toContain('node scripts/menu-browser-focus.mjs');
  expect(wf).toContain('node scripts/menu-browser-discovery.mjs');
});

test('focused discovery captures full page evidence without database access',()=>{
  const code=fs.readFileSync('scripts/menu-browser-focus.mjs','utf8');
  expect(code).toContain('body_excerpt');
  expect(code).toContain('page.screenshot');
  expect(code).toContain('anchors');
  expect(code).toContain('images');
  expect(code).toContain('iframes');
  expect(code).not.toMatch(/SUPABASE|\.insert\(|\.upsert\(|\.update\(/);
});

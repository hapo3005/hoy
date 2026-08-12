const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('HOY Control 2.24 wires the language audit after menu integrity',async({request})=>{
  const [html,js,css]=await Promise.all([request.get('./admin.html'),request.get('./admin-menu-language-2.24.js'),request.get('./admin-menu-language-2.24.css')]);
  for(const r of [html,js,css])expect(r.ok()).toBeTruthy();
  const page=await html.text();
  expect(page).toContain('HOY Control Center · 2.24.0');
  expect(page).toContain('admin-menu-language-2.24.css?v=2.24.0');
  expect(page).toContain('admin-menu-language-2.24.js?v=2.24.0');
  expect(page.indexOf('admin-menu-language-2.24.js')).toBeGreaterThan(page.indexOf('admin-menu-integrity-2.23.js'));
});

test('admin menu audit replaces truncated menu items with paginated full-catalog data',()=>{
  const code=fs.readFileSync('admin-menu-language-2.24.js','utf8');
  expect(code).toContain('PAGE_SIZE=500');
  expect(code).toContain('.range(from,from+PAGE_SIZE-1)');
  expect(code).toContain('state.menuItems=items');
  expect(code).toContain('state.menuTranslations=translations');
  expect(code).toContain('await baseLoadData224();await hydrate224()');
});

test('admin language audit is read-only and enforces 100 percent German coverage',()=>{
  const code=fs.readFileSync('admin-menu-language-2.24.js','utf8');
  expect(code).toContain("READY=new Set(['curated','operator_confirmed'])");
  expect(code).toContain("'Speisekarte DE'");
  expect(code).toContain('Deutsch vollständig');
  expect(code).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|functions\.invoke/);
});

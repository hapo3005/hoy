const fs=require('node:fs');
const {test,expect}=require('@playwright/test');

test('HOY Control 2.25 wires the official menu-source release gate',async({request})=>{
  const [html,js,css]=await Promise.all([
    request.get('./admin.html'),request.get('./admin-menu-source-truth-2.25.js'),request.get('./admin-menu-source-truth-2.25.css')
  ]);
  for(const r of [html,js,css])expect(r.ok()).toBeTruthy();
  const page=await html.text();
  expect(page).toContain('HOY Control Center · 2.25.0');
  expect(page).toContain('admin-menu-source-truth-2.25.css?v=2.25.0');
  expect(page).toContain('admin-menu-source-truth-2.25.js?v=2.25.0');
  expect(page.indexOf('admin-menu-source-truth-2.25.js')).toBeGreaterThan(page.indexOf('admin-menu-language-2.24.js'));
});

test('source-only official core menus are explicit release blockers',()=>{
  const code=fs.readFileSync('admin-menu-source-truth-2.25.js','utf8');
  expect(code).toContain('RELEASE-BLOCKER');
  expect(code).toContain('hoyMenuSourceReleaseGate225');
  expect(code).toContain("clean225(s.completeness_status)==='source_only'");
  expect(code).toContain("'Offizielle Speisekarte in HOY'");
});

test('verified official embeds are normalized as complete in-app representations only in Control memory',()=>{
  const code=fs.readFileSync('admin-menu-source-truth-2.25.js','utf8');
  expect(code).toContain("clean225(p.mode)==='official_embed'");
  expect(code).toContain("s.completeness_status='image_complete'");
  expect(code).toContain('production DB remains semantically `complete`');
});

test('admin source-truth layer is read-only',()=>{
  const code=fs.readFileSync('admin-menu-source-truth-2.25.js','utf8');
  expect(code).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|functions\.invoke/);
});

const fs=require('node:fs');
const {test,expect}=require('@playwright/test');
const {CURRENT_RELEASE}=require('./helpers/current-release');

test('HOY Control menu discovery remains wired after source truth in the current release',async({request})=>{
  const [html,legacyJs,css,currentJs]=await Promise.all([request.get('./admin.html'),request.get('./admin-menu-social-2.26.js'),request.get('./admin-menu-social-2.26.css'),request.get('./admin-menu-social-2.27.js')]);
  for(const r of [html,legacyJs,css,currentJs])expect(r.ok()).toBeTruthy();
  const page=await html.text();
  expect(page).toContain(`HOY Control Center · ${CURRENT_RELEASE}`);
  expect(page).toContain('admin-menu-social-2.26.css?v=2.26.0');
  expect(page).toContain('admin-menu-social-2.27.js?v=2.27.0');
  expect(page.indexOf('admin-menu-social-2.27.js')).toBeGreaterThan(page.indexOf('admin-menu-source-truth-2.25.js'));
});

test('all published venues are forced into one deterministic discovery stage',()=>{
  const code=fs.readFileSync('admin-menu-social-2.26.js','utf8');
  expect(code).toContain("filter(r=>r.is_published)");
  for(const stage of ['ready','integrate_source','audit_social','audit_website','operator_needed'])expect(code).toContain(`'${stage}'`);
  expect(code).toContain('hoyAdminMenuSocialRows226');
  expect(code).toContain('hoyAdminMenuSocialSummary226');
});

test('social discovery uses official contact/profile references but does not promote them directly to menu truth',()=>{
  const code=fs.readFileSync('admin-menu-social-2.26.js','utf8');
  expect(code).toContain('contact_instagram');
  expect(code).toContain('instagram226');
  expect(code).toContain('facebook226');
  expect(code).toContain('Social Media zählt nur als Menübeleg');
  expect(code).toContain('keine Nutzeruploads');
  expect(code).not.toMatch(/menu_sources[^\n]{0,80}\.insert\(|\.upsert\(|functions\.invoke/);
});

test('known official source outranks social and website discovery',()=>{
  const code=fs.readFileSync('admin-menu-social-2.26.js','utf8');
  const source=code.indexOf("stage='integrate_source'");
  const social=code.indexOf("stage='audit_social'");
  const website=code.indexOf("stage='audit_website'");
  expect(source).toBeGreaterThan(-1);expect(social).toBeGreaterThan(source);expect(website).toBeGreaterThan(social);
});

test('menu discovery remains read-only and never changes outreach state',()=>{
  const code=fs.readFileSync('admin-menu-social-2.26.js','utf8');
  expect(code).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|functions\.invoke|send_lock\s*=/);
});

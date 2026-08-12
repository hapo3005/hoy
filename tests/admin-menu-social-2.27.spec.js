const {test,expect}=require('@playwright/test');

test('Control 2.27 wires persistent discovery and preserves read-only operations',async({request})=>{
  const [admin,module,migration]=await Promise.all([
    request.get('./admin.html'),
    request.get('./admin-menu-social-2.27.js'),
    request.get('./supabase/migrations/20260812093348_menu_discovery_checks.sql')
  ]);
  for(const r of [admin,module,migration])expect(r.ok()).toBeTruthy();
  const html=await admin.text(),js=await module.text(),sql=await migration.text();
  expect(html).toContain('HOY Control Center · 2.27.0');
  expect(html).toContain('admin-menu-social-2.27.js?v=2.27.0');
  expect(html).not.toContain('admin-menu-social-2.26.js');
  expect(js).toContain("sb.from('menu_discovery_checks').select");
  expect(js).not.toMatch(/menu_discovery_checks'\)\.insert|menu_discovery_checks'\)\.update|menu_discovery_checks'\)\.delete/);
  expect(js).not.toMatch(/send_lock\s*=|send_authorized|functions\.invoke\([^)]*send/i);
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('revoke all on table public.menu_discovery_checks from anon');
  expect(sql).toContain('grant select on table public.menu_discovery_checks to authenticated');
  expect(sql).toContain('private.is_hoy_admin()');
});

test('discovery order is website/QR, then official social, then operator',async({request})=>{
  const r=await request.get('./admin-menu-social-2.27.js');expect(r.ok()).toBeTruthy();
  const js=await r.text();
  const website=js.indexOf("stage='audit_website'");
  const social=js.indexOf("stage='audit_social'");
  expect(website).toBeGreaterThan(0);
  expect(social).toBeGreaterThan(website);
  expect(js).toContain("CLOSED_CHECKS=new Set(['checked_no_menu','blocked','unavailable'])");
  expect(js).toContain("webCheck.found||socialCheck.found");
  expect(js).toContain('next_review_at');
});

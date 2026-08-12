const {test,expect}=require('@playwright/test');

test('Control 2.30 wires the core-region workbench after editorial review',async({request})=>{
  const [admin,js,css]=await Promise.all([
    request.get('./admin.html'),
    request.get('./admin-menu-workbench-2.30.js?v=2.30.0'),
    request.get('./admin-menu-workbench-2.30.css?v=2.30.0')
  ]);
  for(const r of [admin,js,css])expect(r.ok()).toBeTruthy();
  const html=await admin.text(),code=await js.text(),style=await css.text();
  expect(html).toContain('HOY Control Center · 2.30.0');
  expect(html).toContain('admin-menu-editorial-2.29.js?v=2.29.1');
  expect(html).toContain('admin-menu-workbench-2.30.js?v=2.30.0');
  expect(html.indexOf('admin-menu-workbench-2.30.js')).toBeGreaterThan(html.indexOf('admin-menu-editorial-2.29.js'));
  expect(html).toContain('admin-menu-workbench-2.30.css?v=2.30.0');
  expect(code).toContain("new Set(['La Manga del Mar Menor','Cabo de Palos'])");
  expect(code).toContain('window.hoyAdminMenuWorkbenchRows230=rows230');
  expect(code).toContain('window.hoyAdminMenuWorkbenchMetrics230=metrics230');
  expect(style).toContain('.mwb230');
  expect(style).toContain('@media(max-width:800px)');
});

test('workbench replaces the truncated admin menu-item window with a complete paginated catalog',async({request})=>{
  const r=await request.get('./admin-menu-workbench-2.30.js?v=2.30.0');expect(r.ok()).toBeTruthy();
  const code=await r.text();
  expect(code).toContain('PAGE_SIZE230=500');
  expect(code).toContain("sb.from('menu_items').select('id,restaurant_id,source_id,is_active,source_checked_at')");
  expect(code).toContain('.range(from,from+PAGE_SIZE230-1)');
  expect(code).toContain('state.menuItems=items');
  expect(code).toContain('hoyAdminMenuWorkbenchCatalog230');
  expect(code).toContain("integrity:'ready'");
});

test('one operational lane is assigned without lowering menu trust',async({request})=>{
  const r=await request.get('./admin-menu-workbench-2.30.js?v=2.30.0');expect(r.ok()).toBeTruthy();
  const code=await r.text();
  for(const lane of ['ready','editorial','website_recheck_due','website_first','social_manual','direct_contact_later','website_waiting','research_route'])expect(code).toContain(lane);
  expect(code).toContain("status==='image_complete'");
  expect(code).toContain("clean230(p.mode)==='official_embed'");
  expect(code).toContain("status==='complete'&&sourceItems230(s.id)>0");
  expect(code).toContain("['source_only','partial'].includes");
  expect(code).toContain("clean230(s.completeness_status)==='insufficient'");
  expect(code).toContain('next_review_at');
  expect(code).toContain('!!insufficient&&!webCheck');
  expect(code).toContain('Social manuell verifizieren');
  expect(code).toContain('noch nicht als Menü-Evidenz freigegeben');
  expect(code).toContain('kein Versand');
  expect(code).not.toContain('working_language');
});

test('first discovery and due rechecks deliberately use different missing-source contracts',async({request})=>{
  const r=await request.get('./admin-menu-workbench-2.30.js?v=2.30.0');expect(r.ok()).toBeTruthy();
  const code=await r.text();
  expect(code).toContain("runDiscovery230(rows230().filter(x=>x.lane==='website_first'),true");
  expect(code).toContain("runDiscovery230(rows230().filter(x=>x.lane==='website_recheck_due'),false");
  expect(code).toContain('for(let i=0;i<rows.length;i+=4)');
  expect(code).toContain("sb.functions.invoke('menu-discovery'");
  expect(code).toContain("sb.functions.invoke('menu-social-handoff'");
  expect(code).not.toMatch(/sb\.from\(['"](?:restaurants|menu_sources|menu_items|venue_sales_pipeline)['"]\)\.(?:insert|update|upsert|delete)/);
  expect(code).not.toMatch(/send_authorized|send_lock\s*=|unlock|functions\.invoke\([^)]*(?:send|outreach)/i);
});

test('social and direct-contact lanes stay manual and non-sending',async({request})=>{
  const r=await request.get('./admin-menu-workbench-2.30.js?v=2.30.0');expect(r.ok()).toBeTruthy();
  const code=await r.text();
  expect(code).toContain('target="_blank" rel="noopener noreferrer">Social öffnen');
  expect(code).toContain('Kontaktweg für spätere Aktivierung vorbereitet · kein Versand');
  expect(code).not.toMatch(/instagram.*functions\.invoke|facebook.*functions\.invoke/i);
  expect(code).not.toMatch(/mailto:|tel:/i);
});

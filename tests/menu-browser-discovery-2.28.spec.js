const {test,expect}=require('@playwright/test');

test('browser discovery is evidence-only and uses the private read credential only in Actions',async({request})=>{
  const [script,workflow,trigger]=await Promise.all([
    request.get('./scripts/menu-browser-discovery.mjs'),
    request.get('./.github/workflows/menu-browser-discovery.yml'),
    request.get('./.github/hoy-menu-discovery-trigger.json')
  ]);
  for(const r of [script,workflow,trigger])expect(r.ok()).toBeTruthy();
  const js=await script.text(),yml=await workflow.text(),cfg=await trigger.json();
  expect(js).toContain("import {chromium} from '@playwright/test'");
  expect(js).toContain('menu-discovery-report.json');
  expect(js).toContain('Discovery is evidence-only: no Supabase writes were performed.');
  expect(js).not.toMatch(/method\s*:\s*['\"](?:POST|PATCH|PUT|DELETE)['\"]/i);
  expect(js).not.toMatch(/menu_sources[^\n]{0,100}(?:insert|update|delete|upsert)/i);
  expect(js).not.toMatch(/menu_discovery_checks[^\n]{0,100}(?:insert|update|delete|upsert)/i);
  expect(yml).toContain('secrets.HOY_SUPABASE_SECRET_KEY');
  expect(yml).toContain('npx playwright install --with-deps chromium');
  expect(yml).toContain('actions/upload-artifact@v5');
  expect(yml).not.toMatch(/contents:\s*write/);
  expect(cfg.scope).toBe('core');
  expect(cfg.limit).toBeGreaterThanOrEqual(1);
  expect(cfg.limit).toBeLessThanOrEqual(50);
});

test('dynamic discovery actively inspects menu controls and official assets',async({request})=>{
  const r=await request.get('./scripts/menu-browser-discovery.mjs');expect(r.ok()).toBeTruthy();
  const js=await r.text();
  expect(js).toContain("document.querySelectorAll('button,[role=\"tab\"],a')");
  expect(js).toContain('CONTROL_TERMS.test(x.text)');
  expect(js).toContain("document.querySelectorAll('iframe[src]')");
  expect(js).toContain("document.querySelectorAll('img')");
  expect(js).toContain('dynamic_states');
  expect(js).toContain("SOCIAL_HOST=/\\b(instagram\\.com|facebook\\.com|tiktok\\.com)\\b/i");
});

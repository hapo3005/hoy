const {test,expect}=require('@playwright/test');

test('service worker never opts generic cross-origin API traffic into the PWA cache',async({request})=>{
  const res=await request.get('./service-worker.js');
  expect(res.ok()).toBeTruthy();
  const text=await res.text();
  expect(text).toContain("const sameOrigin=url.origin===self.location.origin");
  expect(text).toContain('if(!sameOrigin&&!approvedCdn)return');
  expect(text).toContain('const PUBLIC_CDN=new Set(OPTIONAL)');
  expect(text).not.toContain("if(e.request.method!=='GET')return;e.respondWith(fetch(e.request)");
});

test('2.39 service worker keeps the offline app shell while restricting cross-origin caching',async({request})=>{
  const [worker,index,pkg]=await Promise.all([
    request.get('./service-worker.js'),request.get('./index.html'),request.get('./package.json')
  ]);
  const text=await worker.text(),html=await index.text(),meta=await pkg.json();
  const supabaseUrl='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js';
  expect(meta.version).toBe('2.39.0');
  expect(text).toContain("const CACHE='hoy-v2.39.0'");
  expect(text).toContain("'./live-decision-2.39.js'");
  expect(text).toContain("'./live-decision-2.39.css'");
  expect(text).toContain("e.request.mode==='navigate'");
  expect(text).toContain("caches.match('./index.html')");
  expect(text).toContain(supabaseUrl);
  expect(html).toContain(supabaseUrl);
});

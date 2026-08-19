const CACHE='hoy-v2.39.0';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg','./styles.css','./hotfix-1.2.1.css','./polish-1.3.css','./polish-1.4.css','./polish-1.5.css','./polish-1.6.css','./polish-1.7.css','./operator-media-1.9.css','./consumer-polish-2.0.css','./showcase-2.1.css','./ui-polish-2.2.css','./map-2.0.css','./guest-journey-2.3.css','./qa-2.4.css','./menu-i18n-2.5.css','./experience-2.7.css','./menu-intake-2.8.css','./operator-cockpit-2.10.css','./profile-design-2.11.css','./profile-design-fix-2.11.1.css','./profile-premium-2.12.css','./menu-signature-2.13.css','./release-polish-2.13.5.css','./journey-signature-2.14.css','./map-journey-2.15.css','./events-2.16.css','./promotion-2.17.css','./promotion-insights-2.18.css','./now-status-2.19.css','./hours-trust-2.22.css','./simplicity-2.23.css','./operator-simplicity-2.24.css','./operator-flow-simplicity-2.25.css','./operator-premium-2.26.css','./operator-onboarding-2.27.css','./operator-onboarding-entry-2.27.css','./operator-data-confirmation-2.29.css','./operator-invite-2.30.css','./menu-inapp-2.31.css','./menu-integrity-2.32.css','./menu-language-integrity-2.33.css','./menu-source-truth-2.34.css','./menu-authority-2.38.css','./guest-decision-core-2.28.css','./live-decision-2.39.css','./release-hardening-2.39.css','./profile-location-2.39.css','./family-playgrounds-2.40.css','./family-audited-preview-2.40.css','./family-card-consistency-2.40.css','./family-profile-enrichment-2.40.css','./accessibility-2.43.css','./app-1.js','./app-2.js','./app-3-1.js','./app-3-2.js','./app-3-3.js','./app-3-4.js','./app-3-5.js','./signature-1.6.js','./decision-1.7.js','./mar-menor-1.8.js','./founding-media-1.8.2.js','./analytics-rpc-1.8.1.js','./operator-media-1.9.js','./consumer-polish-2.0.js','./map-2.0.js','./showcase-2.1.js','./menu-i18n-2.5.js','./menu-provenance-2.7.js','./ui-polish-2.2.js','./guest-journey-2.3.js','./qa-2.4.js','./operator-hours-2.7.js','./profile-flow-2.7.js','./profile-premium-2.12.js','./profile-media-2.13.js','./menu-signature-2.13.js','./release-polish-2.13.5.js','./journey-signature-2.14.js','./map-journey-2.15.js','./profile-location-2.39.js','./menu-intake-2.9.js','./operator-cockpit-2.10.js','./events-2.16.js','./promotion-2.17.1.js','./promotion-insights-2.18.js','./profile-open-stability-2.18.1.js','./hours-quality-2.21.js','./now-status-2.19.js','./hours-trust-2.22.js','./simplicity-2.23.js','./operator-simplicity-2.24.js','./operator-flow-simplicity-2.25.js','./operator-premium-2.26.js','./operator-onboarding-2.27.js','./operator-onboarding-entry-2.27.js','./operator-data-confirmation-2.29.js','./guest-decision-core-2.28.js','./live-decision-2.39.js','./release-hardening-2.39.js','./menu-inapp-2.31.js','./menu-integrity-2.32.js','./menu-core-scope-2.36.js','./menu-language-integrity-2.33.js','./menu-source-truth-2.34.js','./menu-authority-2.38.js','./menu-native-standard-2.48.js','./open-ended-events-2.39.js','./event-provenance-2.39.js','./family-playgrounds-2.40.js','./family-preview-session-2.40.js','./family-playgrounds-hardening-2.40.js','./family-audited-preview-2.40.js','./family-card-consistency-2.40.js','./family-profile-enrichment-2.40.js','./family-research-standard-2.41.js','./family-data-completion-2.42.js','./data/family-profile-completion-2026-08-17.json','./data/family-profile-completion-sources-2026-08-17.json','./accessibility-2.43.js','./app-3-6.js','./operator-invite-2.30.js'];
const OPTIONAL=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0/dist/umd/supabase.js','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css','https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'];
const PUBLIC_CDN=new Set(OPTIONAL);

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(url=>c.add(url)));
  }));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const approvedCdn=PUBLIC_CDN.has(e.request.url);

  // Security boundary: never place Supabase/API/auth/personalized cross-origin responses
  // in the PWA cache. Unhandled requests continue through the browser network stack.
  if(!sameOrigin&&!approvedCdn)return;

  e.respondWith((async()=>{
    try{
      const response=await fetch(e.request);
      if(response&&(response.ok||response.type==='opaque')){
        const copy=response.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      }
      return response;
    }catch(_){
      const cached=await caches.match(e.request,sameOrigin?{ignoreSearch:true}:undefined);
      if(cached)return cached;
      if(sameOrigin&&e.request.mode==='navigate')return await caches.match('./index.html')||Response.error();
      return Response.error();
    }
  })());
});
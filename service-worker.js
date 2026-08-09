const CACHE='hoy-v1.5';
const CORE=['./','./index.html','./manifest.webmanifest','./styles.css','./hotfix-1.2.1.css','./polish-1.3.css','./polish-1.4.css','./polish-1.5.css','./app-1.js','./app-2.js','./app-3-1.js','./app-3-2.js','./app-3-3.js','./app-3-4.js','./app-3-5.js','./app-3-6.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});

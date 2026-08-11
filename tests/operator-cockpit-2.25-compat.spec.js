const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers:'block' });

test('2.25 keeps the 2.24 cockpit as one next step plus a calm management list', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    document.getElementById('view').innerHTML=`<section class="operator-command-center"><div class="hub-hero"><h2>Chiringuito Beispiel</h2><p>Verifiziertes Profil · PRO</p></div><div class="hub-readiness"><button class="hub-next" data-hub-action="hours">Öffnungszeiten prüfen →</button></div><div class="hub-grid"><article class="hub-module"><span class="hub-status good">ÜBERNOMMEN</span><h3>Basisdaten</h3><small>Aktuell.</small><button data-hub-action="profile">Daten korrigieren</button></article><article class="hub-module"><span class="hub-status warn">OFFEN</span><h3>Öffnungszeiten</h3><small>Bitte prüfen.</small><button data-hub-action="hours">Live-Zeiten verwalten</button></article><article class="hub-module"><span class="hub-status good">AKTIV</span><h3>Speisekarte</h3><small>Aktiv.</small><button data-hub-action="menu">Speisekarte verwalten</button></article><article class="hub-module"><span class="hub-status good">AKTIV</span><h3>Bilder</h3><small>Aktiv.</small><button data-hub-action="media">Bilder prüfen</button></article><article class="hub-module"><span class="hub-status good">BESTÄTIGT</span><h3>Services</h3><small>Bestätigt.</small><button data-hub-action="services">Services verwalten</button></article><article class="hub-module"><span class="hub-status locked">PRO</span><h3>Aktuelles</h3><small>Optional.</small><button data-hub-action="offers">Aktuelles verwalten</button></article></div><div class="hub-plan-strip"><button data-hub-action="plans">Tarife & Funktionen</button></div></section>`;
    window.hoySimplifyOperatorCockpit(document.querySelector('.operator-command-center'));
  });
  const root=page.locator('.operator-simple-center');
  await expect(root.locator('.operator-simple-focus')).toContainText('Als Nächstes: Öffnungszeiten prüfen.');
  await expect(root.locator('.operator-simple-row')).toHaveCount(6);
  await expect(root.locator('.hub-readiness,.hub-grid,.hub-plan-strip')).toHaveCount(0);
  await expect(root.locator('.operator-simple-row').filter({hasText:'Öffnungszeiten'})).toContainText('Prüfen');
  await expect(root.locator('.operator-simple-row').filter({hasText:'Aktuelles'})).toContainText('Optional');
  const metrics=await root.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,docClient:document.documentElement.clientWidth,docScroll:document.documentElement.scrollWidth}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  expect(metrics.docScroll).toBeLessThanOrEqual(metrics.docClient+1);
});

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });

test.use({ serviceWorkers: 'block' });

const legacyFixture = `
<section class="operator-command-center">
  <div class="hub-hero"><div><div class="eyebrow">BETREIBER-COCKPIT</div><h2>Chiringuito Beispiel</h2><p>Verifiziertes Profil · PRO</p></div><span class="hub-verified">✓ Verifiziert</span></div>
  <div class="hub-readiness"><div class="hub-readiness-copy"><strong>67%</strong><div><b>Profilbereitschaft</b><span>4 von 6 Kernbereichen sind vorbereitet.</span></div></div><div class="hub-progress"><span style="width:67%"></span></div><button type="button" class="hub-next" data-hub-action="hours">Öffnungszeiten prüfen →</button></div>
  <div class="hub-grid">
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">01</span><span class="hub-status good">ÜBERNOMMEN</span></div><h3>Basisdaten</h3><p>Adresse, Telefon, Website und Beschreibung.</p><small>Letzte Korrektur wurde von HOY übernommen.</small><button data-hub-action="profile">Daten korrigieren</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">02</span><span class="hub-status warn">OFFEN</span></div><h3>Öffnungszeiten</h3><p>Wochenzeiten und Sondertage.</p><small>Öffnungszeiten sollten geprüft werden.</small><button data-hub-action="hours">Live-Zeiten verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">03</span><span class="hub-status good">AKTIV</span></div><h3>Speisekarte</h3><p>Strukturierte Karte für Gäste.</p><small>Strukturierte HOY-Speisekarte ist im Profil verfügbar.</small><button data-hub-action="menu">Speisekarte verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">04</span><span class="hub-status good">3 LIVE</span></div><h3>Bilder</h3><p>Freigegebene Betreiberbilder.</p><small>Freigegebene Betreiberbilder werden verwendet.</small><button data-hub-action="media">Bilder prüfen</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">05</span><span class="hub-status warn">2/3</span></div><h3>Services</h3><p>Reservierung, Abholung und Lieferung.</p><small>Ein Service ist noch unklar.</small><button data-hub-action="services">Services verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-num">06</span><span class="hub-status locked">PRO</span></div><h3>Aktuelles</h3><p>Angebote, Events und Tagesgerichte.</p><small>Aktuelle Inhalte vorbereiten.</small><button data-hub-action="offers">Aktuelles verwalten</button></article>
  </div>
  <div class="hub-bottom-actions"><button class="primary" data-hub-action="preview">So sehen Gäste mein Profil</button><button data-hub-action="plans">Tarif vergleichen</button></div>
  <div class="hub-plan-strip"><div><small>AKTUELLER TARIF</small><b>PRO</b><span>49 € / Monat</span></div><button data-hub-action="plans">Tarife & Funktionen</button></div>
</section>`;

test('HOY 2.24 deploys the operator simplicity layer and keeps it in the PWA core', async ({ page, request }) => {
  const [js, css, pkg, index, worker] = await Promise.all([
    request.get('./operator-simplicity-2.24.js'),
    request.get('./operator-simplicity-2.24.css'),
    request.get('./package.json'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for (const res of [js, css, pkg, index, worker]) expect(res.ok()).toBeTruthy();
  const { version } = await pkg.json();
  expect(version).toBe('2.24.0');
  const indexText = await index.text();
  const workerText = await worker.text();
  expect(indexText).toContain('App 2.24.0');
  expect(indexText).toContain('operator-simplicity-2.24.js?v=2.24.0');
  expect(indexText).toContain('operator-simplicity-2.24.css?v=2.24.0');
  expect(workerText).toContain("const CACHE='hoy-v2.24.0'");
  expect(workerText).toContain('./operator-simplicity-2.24.js');
  expect(workerText).toContain('./operator-simplicity-2.24.css');

  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(await page.evaluate(() => window.hoyOperatorSimplicityVersion)).toBe('2.24.0');
  expect(errors).toEqual([]);
});

test('operator cockpit defaults to one next step and a calm management list instead of dashboard complexity', async ({ page }, testInfo) => {
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.evaluate(fixture => {
    const view=document.getElementById('view');
    view.innerHTML=fixture;
    window.hoySimplifyOperatorCockpit(view.querySelector('.operator-command-center'));
  }, legacyFixture);

  const root=page.locator('.operator-simple-center');
  await expect(root).toBeVisible();
  await expect(root.locator('.operator-simple-hero')).toContainText('DEIN HOY PROFIL');
  await expect(root.locator('.operator-simple-focus')).toContainText('Als Nächstes: Öffnungszeiten prüfen.');
  await expect(root.locator('.operator-simple-focus')).toContainText('Alles andere kann warten.');
  await expect(root.locator('.operator-simple-focus [data-hub-action="hours"]')).toHaveText('Öffnungszeiten prüfen');
  await expect(root.locator('.operator-simple-row')).toHaveCount(6);
  await expect(root.locator('.operator-simple-row').filter({hasText:'Öffnungszeiten'})).toContainText('Prüfen');
  await expect(root.locator('.operator-simple-row').filter({hasText:'Speisekarte'})).toContainText('Aktuell');
  await expect(root.locator('.operator-simple-row').filter({hasText:'Aktuelles'})).toContainText('Optional');
  await expect(root.locator('.hub-readiness,.hub-grid,.hub-plan-strip')).toHaveCount(0);
  await expect(root.locator('[data-hub-action="preview"]')).toHaveCount(1);
  await expect(root.locator('[data-hub-action="plans"]')).toContainText('PRO · Tarif & Funktionen');

  const metrics=await root.evaluate(el=>({clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,docClient:document.documentElement.clientWidth,docScroll:document.documentElement.scrollWidth}));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth+1);
  expect(metrics.docScroll).toBeLessThanOrEqual(metrics.docClient+1);

  await page.screenshot({path:path.join(SCREEN_DIR,`${testInfo.project.name}-operator-simple-2.24.png`),fullPage:false});
  expect(errors).toEqual([]);
});

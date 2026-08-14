const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { CURRENT_RELEASE } = require('./helpers/current-release');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
test.use({ serviceWorkers: 'block' });

const legacyFixture = `
<section class="operator-command-center">
  <div class="hub-hero"><div><div class="eyebrow">BETREIBER-COCKPIT</div><h2>Chiringuito Beispiel</h2><p>Verifiziertes Profil · PRO</p></div><span class="hub-verified">✓ Verifiziert</span></div>
  <div class="hub-readiness"><button type="button" class="hub-next" data-hub-action="hours">Öffnungszeiten prüfen →</button></div>
  <div class="hub-grid">
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status good">ÜBERNOMMEN</span></div><h3>Basisdaten</h3><small>Letzte Korrektur wurde von HOY übernommen.</small><button data-hub-action="profile">Daten korrigieren</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status warn">OFFEN</span></div><h3>Öffnungszeiten</h3><small>Öffnungszeiten sollten geprüft werden.</small><button data-hub-action="hours">Live-Zeiten verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status good">AKTIV</span></div><h3>Speisekarte</h3><small>Strukturierte HOY-Speisekarte ist im Profil verfügbar.</small><button data-hub-action="menu">Speisekarte verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status good">3 LIVE</span></div><h3>Bilder</h3><small>Freigegebene Betreiberbilder werden verwendet.</small><button data-hub-action="media">Bilder prüfen</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status warn">2/3</span></div><h3>Services</h3><small>Ein Service ist noch unklar.</small><button data-hub-action="services">Services verwalten</button></article>
    <article class="hub-module"><div class="hub-module-top"><span class="hub-status locked">PRO</span></div><h3>Aktuelles</h3><small>Aktuelle Inhalte vorbereiten.</small><button data-hub-action="offers">Aktuelles verwalten</button></article>
  </div>
</section>`;

async function inject(page, html){
  await page.evaluate(markup=>{
    const holder=document.createElement('div');
    holder.innerHTML=markup;
    const dialog=holder.querySelector('dialog');
    if(dialog&&!dialog.hasAttribute('open'))dialog.setAttribute('open','');
    while(holder.firstChild)document.body.appendChild(holder.firstChild);
    window.hoyEnhanceOperatorFlows?.();
  }, html);
}

test('HOY 2.25 operator flow layer remains deployed and cached', async ({ page, request }) => {
  const [js, css, pkg, index, worker] = await Promise.all([
    request.get('./operator-flow-simplicity-2.25.js'),
    request.get('./operator-flow-simplicity-2.25.css'),
    request.get('./package.json'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for (const res of [js, css, pkg, index, worker]) expect(res.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const indexText=await index.text();const workerText=await worker.text();
  expect(indexText).toContain(`App ${CURRENT_RELEASE}`);
  expect(indexText).toContain('operator-flow-simplicity-2.25.js?v=2.25.0');
  expect(indexText).toContain('operator-flow-simplicity-2.25.css?v=2.25.0');
  expect(workerText).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(workerText).toContain('./operator-flow-simplicity-2.25.js');
  expect(workerText).toContain('./operator-flow-simplicity-2.25.css');
  await page.goto('./', { waitUntil:'domcontentloaded' });
  expect(await page.evaluate(()=>window.hoyOperatorFlowSimplicityVersion)).toBe('2.25.0');
});

test('2.24 priority semantics remain intact after the 2.25 flow layer', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await page.evaluate(fixture=>{
    const view=document.getElementById('view');view.innerHTML=fixture;
    const root=view.querySelector('.operator-command-center');
    const profile=[...root.querySelectorAll('.hub-module')].find(x=>x.querySelector('h3')?.textContent==='Basisdaten');
    profile.querySelector('.hub-status').className='hub-status bad';
    profile.querySelector('.hub-status').textContent='RÜCKFRAGE';
    window.hoySimplifyOperatorCockpit(root);
  }, legacyFixture);
  const focus=page.locator('.operator-simple-focus');
  await expect(focus).toContainText('Als Nächstes: Daten korrigieren.');
  await expect(focus).toContainText('HOY hat hier eine Rückfrage.');
});

test('services become three direct choices instead of three dropdown decisions', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await inject(page, `<dialog id="operatorServicesFlow"><div class="operator-flow"><p class="claim-lead">Alt</p><div class="hub-services-edit">
    ${['reservation','pickup','delivery'].map((k,i)=>`<label class="hub-service-row"><span><b>${i===0?'Reservierung':i===1?'Abholung':'Lieferung'}</b></span><select data-hub-service="${k}"><option value="available">Ja</option><option value="unavailable">Nein</option><option value="unknown" selected>Noch prüfen</option></select></label>`).join('')}
  </div><button data-op-services-save>Bestätigen & speichern</button></div></dialog>`);
  await expect(page.locator('#operatorServicesFlow .op-choice')).toHaveCount(9);
  await page.locator('#operatorServicesFlow .hub-service-row').nth(1).getByRole('button',{name:'Ja'}).click();
  expect(await page.locator('#operatorServicesFlow [data-hub-service="pickup"]').inputValue()).toBe('available');
  await expect(page.locator('#operatorServicesFlow .op-service-summary')).toContainText('1 von 3 beantwortet');
  await expect(page.locator('#operatorServicesFlow [data-op-services-save]')).toHaveText('Services speichern');
});

test('hours can copy typical days and keep special days optional', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  const days=['mon','tue','wed','thu','fri','sat','sun'];
  await inject(page, `<dialog id="liveHoursFlow"><div class="live-hours-flow"><div class="live-week">${days.map(k=>`<div class="live-day" data-live-day="${k}"><input type="checkbox" data-day-closed><input type="time" data-open-1><input type="time" data-close-1><input type="time" data-open-2><input type="time" data-close-2></div>`).join('')}</div><div class="special-editor"><input type="date" data-special-date><input type="checkbox" data-special-closed><input type="time" data-special-open-1><input type="time" data-special-close-1><input data-special-note></div><button data-live-save>Live speichern</button></div></dialog>`);
  await page.locator('#liveHoursFlow [data-live-day="mon"] [data-open-1]').fill('12:00');
  await page.locator('#liveHoursFlow [data-live-day="mon"] [data-close-1]').fill('23:00');
  await page.getByRole('button',{name:'Mo–Fr wie Montag'}).click();
  expect(await page.locator('#liveHoursFlow [data-live-day="fri"] [data-open-1]').inputValue()).toBe('12:00');
  expect(await page.locator('#liveHoursFlow [data-live-day="fri"] [data-close-1]').inputValue()).toBe('23:00');
  await page.getByRole('button',{name:'Heute geschlossen'}).click();
  await expect(page.locator('#liveHoursFlow .op-special-details')).toHaveAttribute('open','');
  expect(await page.locator('#liveHoursFlow [data-special-closed]').isChecked()).toBeTruthy();
  expect(await page.locator('#liveHoursFlow [data-special-date]').inputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('menu intake reveals one source method at a time and tucks history away', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await inject(page, `<dialog id="menuIntakeFlow"><div class="menu-intake-flow"><p class="claim-lead">Alt</p><div class="menu-intake-methods"><section><h3>Datei</h3></section><section><h3>Link</h3></section><section><h3>Direkt</h3></section></div><div class="menu-intake-dialog-history"><h3>Letzte Einreichungen</h3></div></div></dialog>`);
  const sections=page.locator('#menuIntakeFlow .menu-intake-methods > section');
  await expect(sections.nth(0)).not.toHaveClass(/op-method-hidden/);
  await expect(sections.nth(1)).toHaveClass(/op-method-hidden/);
  await page.getByRole('button',{name:'Offizieller Link'}).click();
  await expect(sections.nth(0)).toHaveClass(/op-method-hidden/);
  await expect(sections.nth(1)).not.toHaveClass(/op-method-hidden/);
  await expect(page.locator('#menuIntakeFlow .op-history-details')).toHaveCount(1);
  await expect(page.locator('#menuIntakeFlow .claim-lead')).toContainText('Nichts wird ungeprüft veröffentlicht');
});

test('offers start with type and title while detail fields stay progressive', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await inject(page, `<dialog id="operatorOffersFlow"><div class="operator-flow"><div class="hub-offer-form"><div class="claim-field"><select data-hub-offer-type><option>Angebot</option></select></div><div class="claim-field"><input data-hub-offer-title></div><div class="claim-field"><textarea data-hub-offer-description></textarea></div><div class="claim-field"><input data-hub-offer-price></div><div class="hub-offer-dates"><input data-hub-offer-start><input data-hub-offer-end></div><div class="claim-field"><input data-hub-offer-time></div><div class="hub-offer-form-actions"><button data-hub-offer-save>Entwurf speichern</button></div></div></div></dialog>`);
  await expect(page.locator('#operatorOffersFlow .op-offer-details')).toHaveCount(1);
  await expect(page.locator('#operatorOffersFlow .op-offer-details')).not.toHaveAttribute('open','');
  expect(await page.locator('#operatorOffersFlow [data-hub-offer-title]').evaluate(el=>el.closest('.op-offer-details')===null)).toBeTruthy();
  expect(await page.locator('#operatorOffersFlow [data-hub-offer-description]').evaluate(el=>!!el.closest('.op-offer-details'))).toBeTruthy();
  await expect(page.locator('#operatorOffersFlow .op-fast-intro')).toContainText('Typ und Titel');
});

test('media review communicates three steps and never auto-confirms rights', async ({ page }) => {
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await inject(page, `<dialog id="mediaReview"><div class="media-review-flow"><div class="media-review-title"><p>Alt</p></div><div class="media-review-card"><div class="media-decisions"><button class="active">Freigeben</button></div></div><div class="media-review-card"><div class="media-decisions"><button>Freigeben</button></div></div><label><input type="checkbox" data-media-rights>Rechte</label><button data-media-all>Alle freigeben</button><button data-media-save>Auswahl speichern</button></div></dialog>`);
  await expect(page.locator('#mediaReview .op-media-steps')).toContainText('1/2 entschieden');
  await expect(page.locator('#mediaReview [data-media-all]')).toHaveText('Alle Bilder passen');
  expect(await page.locator('#mediaReview [data-media-rights]').isChecked()).toBeFalsy();
  await page.locator('#mediaReview [data-media-all]').click();
  expect(await page.locator('#mediaReview [data-media-rights]').isChecked()).toBeFalsy();
  await expect(page.locator('#mediaReview .media-review-title p')).toContainText('verwenden, nicht verwenden oder ersetzen');
});

test('flow layer stays horizontally safe on a narrow viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./', { waitUntil:'domcontentloaded' });
  await inject(page, `<dialog id="operatorServicesFlow" open><div class="operator-flow"><div class="hub-services-edit"><label class="hub-service-row"><span><b>Reservierung</b></span><select data-hub-service="reservation"><option value="unknown" selected>Noch prüfen</option><option value="available">Ja</option><option value="unavailable">Nein</option></select></label></div><button data-op-services-save>Speichern</button></div></dialog>`);
  const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  await page.screenshot({path:path.join(SCREEN_DIR,`${testInfo.project.name}-operator-flows-2.25.png`),fullPage:false});
});

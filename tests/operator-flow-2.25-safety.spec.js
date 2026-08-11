const { test, expect } = require('@playwright/test');
test.use({ serviceWorkers:'block' });

async function inject(page, html){
  await page.evaluate(markup=>{document.body.insertAdjacentHTML('beforeend',markup);window.hoyEnhanceOperatorFlows?.()},html);
}

test('passive in-review state still creates no artificial operator work', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    document.getElementById('view').innerHTML=`<section class="operator-command-center"><div class="hub-hero"><h2>Beispiel</h2><p>Verifiziert · PRO</p></div><div class="hub-readiness"><button class="hub-next" data-hub-action="preview">Gastansicht ansehen →</button></div><div class="hub-grid"><article class="hub-module"><span class="hub-status warn">IN PRÜFUNG</span><h3>Basisdaten</h3><small>Korrektur eingereicht.</small><button data-hub-action="profile">Korrektur ansehen</button></article><article class="hub-module"><span class="hub-status good">AKTIV</span><h3>Speisekarte</h3><button data-hub-action="menu">Speisekarte verwalten</button></article></div></section>`;
    window.hoySimplifyOperatorCockpit(document.querySelector('.operator-command-center'));
  });
  await expect(page.locator('.operator-simple-focus')).toContainText('Für dich ist gerade nichts zu tun.');
  await expect(page.locator('.operator-simple-row').filter({hasText:'Basisdaten'})).toContainText('In Prüfung');
});

test('today-closed shortcut is withheld until a weekly live schedule exists', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await inject(page,`<dialog id="liveHoursFlow"><div class="live-hours-flow"><div class="live-week"><div class="live-day" data-live-day="mon"><input type="checkbox" data-day-closed checked><input type="time" data-open-1><input type="time" data-close-1><input type="time" data-open-2><input type="time" data-close-2></div><div class="live-day" data-live-day="tue"><input type="checkbox" data-day-closed checked><input type="time" data-open-1><input type="time" data-close-1><input type="time" data-open-2><input type="time" data-close-2></div></div><div class="special-editor"><input type="date" data-special-date><input type="checkbox" data-special-closed><input data-special-note></div><button data-live-save>Speichern</button></div></dialog>`);
  await expect(page.locator('#liveHoursFlow .op-special-details')).toHaveCount(1);
  await expect(page.locator('#liveHoursFlow .op-today-closed')).toHaveCount(0);
});

test('menu intake reopens on the latest used source method', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await inject(page,`<dialog id="menuIntakeFlow"><div class="menu-intake-flow"><p class="claim-lead"></p><div class="menu-intake-methods"><section>Datei</section><section>Link</section><section>Direkt</section></div><div class="menu-intake-dialog-history"><div class="menu-intake-history-row"><div><b>Offizieller Link</b></div></div></div></div></dialog>`);
  const sections=page.locator('#menuIntakeFlow .menu-intake-methods > section');
  await expect(sections.nth(0)).toHaveClass(/op-method-hidden/);
  await expect(sections.nth(1)).not.toHaveClass(/op-method-hidden/);
  await expect(page.locator('#menuIntakeFlow .op-method-tabs button').nth(1)).toHaveAttribute('aria-pressed','true');
});

test('service choice buttons expose pressed state while the legacy select leaves the tab order', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await inject(page,`<dialog id="operatorServicesFlow"><div class="operator-flow"><div class="hub-services-edit"><label class="hub-service-row"><span><b>Reservierung</b></span><select data-hub-service="reservation"><option value="available">Ja</option><option value="unavailable">Nein</option><option value="unknown" selected>Noch prüfen</option></select></label></div><button data-op-services-save>Speichern</button></div></dialog>`);
  const select=page.locator('#operatorServicesFlow select');
  await expect(select).toHaveAttribute('aria-hidden','true');
  await expect(select).toHaveAttribute('tabindex','-1');
  await expect(page.getByRole('button',{name:'Noch prüfen'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Ja'}).click();
  await expect(page.getByRole('button',{name:'Ja'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Noch prüfen'})).toHaveAttribute('aria-pressed','false');
});

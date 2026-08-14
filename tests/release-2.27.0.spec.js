const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { CURRENT_RELEASE, gotoReady } = require('./helpers/current-release');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
test.use({ serviceWorkers:'block' });

test('HOY 2.27 onboarding layer remains deployed and cached in the current release', async ({ page, request }) => {
  const [js, css, pkg, index, worker] = await Promise.all([
    request.get('./operator-onboarding-2.27.js'),
    request.get('./operator-onboarding-2.27.css'),
    request.get('./package.json'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for(const res of [js,css,pkg,index,worker])expect(res.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const indexText=await index.text();const workerText=await worker.text();
  expect(indexText).toContain(`App ${CURRENT_RELEASE}`);
  expect(indexText).toContain('operator-onboarding-2.27.css?v=2.27.0');
  expect(indexText).toContain('operator-onboarding-2.27.js?v=2.27.0');
  expect(workerText).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(workerText).toContain('./operator-onboarding-2.27.css');
  expect(workerText).toContain('./operator-onboarding-2.27.js');
  await gotoReady(page);
  expect(await page.evaluate(()=>window.hoyOperatorOnboardingVersion)).toBe('2.27.0');
});

test('restaurant claim is three focused phases with enrichment and pricing removed', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>openClaimFlow(DATA[0].id,1));
  const flow=page.locator('#claimFlow');
  await expect(flow).toHaveClass(/operator-onboarding-dialog/);
  await expect(flow.locator('.onboarding-step-count')).toHaveText('1/3');
  await expect(flow.locator('h2')).toContainText('Ist das dein Restaurant?');
  await expect(flow).toContainText('Kostenlos starten');
  await expect(flow.locator('[data-owner-files],[data-s-reservation],[data-o-title],.plan-switch')).toHaveCount(0);

  await flow.locator('[data-c-name]').fill('María Beispiel');
  await flow.locator('[data-c-email]').fill('maria@example.com');
  await flow.locator('[data-c-authorized]').check();
  await flow.locator('[data-claim-next]').click();

  await expect(flow.locator('.onboarding-step-count')).toHaveText('2/3');
  await expect(flow.locator('h2')).toContainText('Stimmen die wichtigsten Angaben?');
  await expect(flow).toContainText('HOY hat vorgearbeitet');
  await expect(flow).toContainText('Services, Bilder, Speisekarte und Specials kommen später');
  await expect(flow.locator('[data-owner-files],[data-s-reservation],[data-o-title],.plan-switch')).toHaveCount(0);
  await expect(flow.locator('[data-p-address]')).not.toHaveValue('');
  await flow.locator('[data-claim-next]').click();

  await expect(flow.locator('.onboarding-step-count')).toHaveText('3/3');
  await expect(flow.locator('h2')).toContainText('Das war’s schon.');
  await expect(flow.locator('[data-claim-next]')).toHaveText('Kostenlos zur Prüfung senden');
  await expect(flow).toContainText('Es wird kein Abo abgeschlossen');
  await expect(flow).toContainText('HOY zeigt dir genau einen nächsten Schritt');
  await expect(flow.locator('[data-owner-files],[data-s-reservation],[data-o-title],.plan-switch')).toHaveCount(0);
});

test('legacy six-step drafts migrate safely to the new review step', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>{
    openClaimFlow(DATA[0].id,1);
    claimDraft.contact={name:'Altbestand',email:'alt@example.com',role:'Inhaber/in'};
    claimDraft.verified=true;
    claimDraft.step=6;
    saveClaim();
    renderClaimFlow();
  });
  await expect(page.locator('#claimFlow .onboarding-step-count')).toHaveText('3/3');
  expect(await page.evaluate(()=>claimDraft.step)).toBe(3);
  await expect(page.locator('#claimFlow')).toContainText('Das war’s schon.');
});

test('pending verification becomes a calm read-only success state', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>{
    openClaimFlow(DATA[0].id,1);
    const d=document.getElementById('claimFlow');d.close();
    claimDraft.contact={name:'María Beispiel',email:'maria@example.com',role:'Inhaber/in'};
    claimDraft.verified=false;
    claimDraft.verification={status:'pending',submittedAt:new Date().toISOString()};
    saveClaim();
    d.showModal();renderClaimFlow();
  });
  const flow=page.locator('#claimFlow');
  await expect(flow).toContainText('HOY ist jetzt am Zug.');
  await expect(flow).toContainText('Verifizierung läuft');
  await expect(flow).toContainText('Bis dahin musst du nichts weiter einrichten');
  await expect(flow.locator('[data-c-name],[data-p-address],[data-claim-next]')).toHaveCount(0);
  await expect(flow.locator('[data-onboarding-partner]')).toHaveText('Zum Partnerbereich');
});

test('onboarding remains horizontally safe at 390px', async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await gotoReady(page);
  await page.evaluate(()=>openClaimFlow(DATA[0].id,1));
  const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,dialog:document.getElementById('claimFlow').scrollWidth}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  expect(metrics.dialog).toBeLessThanOrEqual(metrics.client+1);
  await page.screenshot({path:path.join(SCREEN_DIR,`${testInfo.project.name}-operator-onboarding-2.27.png`),fullPage:false});
});

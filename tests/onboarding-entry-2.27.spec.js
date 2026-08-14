const { test, expect } = require('@playwright/test');
const { gotoReady } = require('./helpers/current-release');
test.use({ serviceWorkers:'block' });

test('2.27 claim-entry assets are loaded and cached', async ({ request }) => {
  const [js,css,index,worker]=await Promise.all([
    request.get('./operator-onboarding-entry-2.27.js'),
    request.get('./operator-onboarding-entry-2.27.css'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for(const res of [js,css,index,worker])expect(res.ok()).toBeTruthy();
  const indexText=await index.text();const workerText=await worker.text();
  expect(indexText).toContain('operator-onboarding-entry-2.27.css?v=2.27.0');
  expect(indexText).toContain('operator-onboarding-entry-2.27.js?v=2.27.0');
  expect(workerText).toContain('./operator-onboarding-entry-2.27.css');
  expect(workerText).toContain('./operator-onboarding-entry-2.27.js');
});

test('restaurant profile presents one clear free three-step claim CTA', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>openDetail(DATA[0].id));
  const claim=page.locator('#detail .onboarding-claim-entry');
  await expect(claim).toBeVisible();
  await expect(claim.locator('h3')).toHaveText('Betreibst du dieses Restaurant?');
  await expect(claim).toContainText('Drei kurze Schritte, keine Vertragsbindung');
  await expect(claim.locator('[data-claim]')).toHaveText('Kostenlos in 3 Schritten übernehmen');
});

test('pre-verification partner landing focuses on claim instead of pricing', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>{
    localStorage.removeItem(CLAIM_KEY);claimDraft=blankClaim();
    state.view='partner';render();
  });
  await expect(page.locator('.onboarding-partner-steps')).toBeVisible();
  await expect(page.locator('.onboarding-partner-steps')).toContainText('Betrieb bestätigen');
  await expect(page.locator('.onboarding-partner-steps')).toContainText('Kein Abo, keine Zahlung');
  await expect(page.locator('.plans')).toHaveClass(/onboarding-preclaim-hidden/);
  await expect(page.locator('.real-metrics')).toHaveClass(/onboarding-preclaim-hidden/);
  await expect(page.locator('.partner-hero')).toContainText('Erst übernehmen. Dann verbessern.');
});

test('a newly verified operator gets one clear first-success welcome', async ({ page }) => {
  await gotoReady(page);
  await page.evaluate(()=>{
    const p=DATA[0];p.operator_verified=true;p.active_plan='free';
    claimDraft=normalizeClaim({...blankClaim(),restaurantId:p.id,claimed:true,verified:true,verification:{status:'verified',verifiedAt:new Date().toISOString()}});saveClaim();
    sessionStorage.removeItem(`hoy-onboarding-welcome-${p.id}`);
    state.view='partner';render();
  });
  const welcome=page.locator('.onboarding-verified-welcome');
  await expect(welcome).toBeVisible();
  await expect(welcome).toContainText('Dein Profil ist bestätigt.');
  await expect(welcome.getByRole('button',{name:'Gastansicht ansehen'})).toBeVisible();
  await expect(welcome.getByRole('button',{name:'Profil prüfen'})).toBeVisible();
  await welcome.getByRole('button',{name:'Später'}).click();
  await expect(page.locator('.onboarding-verified-welcome')).toHaveCount(0);
  expect(await page.evaluate(()=>sessionStorage.getItem(`hoy-onboarding-welcome-${DATA[0].id}`))).toBe('1');
});

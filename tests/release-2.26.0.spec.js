const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { CURRENT_RELEASE } = require('./helpers/current-release');

const SCREEN_DIR = path.join(process.cwd(), 'qa-screenshots');
fs.mkdirSync(SCREEN_DIR, { recursive: true });
test.use({ serviceWorkers:'block' });

const operatorDialogs = [
  ['operatorServicesFlow','operator-flow'],
  ['liveHoursFlow','live-hours-flow'],
  ['menuIntakeFlow','menu-intake-flow'],
  ['operatorOffersFlow','operator-flow'],
  ['mediaReview','media-review-flow']
];

async function injectOperatorDialogs(page){
  await page.evaluate(defs=>{
    for(const [id,rootClass] of defs){
      document.getElementById(id)?.remove();
      document.body.insertAdjacentHTML('beforeend',`<dialog id="${id}" class="dialog" open><div class="${rootClass}"><div class="claim-head"><button class="round">←</button><span class="claim-step">HOY · TEST</span></div><h2>Test</h2><p class="claim-lead">Premium operator test.</p><button class="primary">Speichern</button></div></dialog>`);
    }
    window.hoyEnhanceOperatorPremium?.();
  },operatorDialogs);
}

test('HOY 2.26 premium operator presentation remains deployed and cached', async ({ page, request }) => {
  const [js, css, pkg, index, worker] = await Promise.all([
    request.get('./operator-premium-2.26.js'),
    request.get('./operator-premium-2.26.css'),
    request.get('./package.json'),
    request.get('./index.html'),
    request.get('./service-worker.js')
  ]);
  for(const res of [js,css,pkg,index,worker])expect(res.ok()).toBeTruthy();
  expect((await pkg.json()).version).toBe(CURRENT_RELEASE);
  const indexText=await index.text();
  const workerText=await worker.text();
  const cssText=await css.text();
  expect(indexText).toContain(`App ${CURRENT_RELEASE}`);
  expect(indexText).toContain('operator-premium-2.26.css?v=2.26.0');
  expect(indexText).toContain('operator-premium-2.26.js?v=2.26.0');
  expect(workerText).toContain(`const CACHE='hoy-v${CURRENT_RELEASE}'`);
  expect(workerText).toContain('./operator-premium-2.26.css');
  expect(workerText).toContain('./operator-premium-2.26.js');
  expect(cssText).toContain('@media(prefers-reduced-motion:reduce)');
  expect(cssText).toContain('button:focus-visible');

  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('./',{waitUntil:'domcontentloaded'});
  expect(await page.evaluate(()=>window.hoyOperatorPremiumVersion)).toBe('2.26.0');
  expect(errors).toEqual([]);
});

test('premium styling is scoped to the five operator dialogs and leaves guest flows untouched', async ({ page }) => {
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await injectOperatorDialogs(page);

  for(const [id] of operatorDialogs){
    const dialog=page.locator(`#${id}`);
    await expect(dialog).toHaveClass(/op-premium-dialog/);
    await expect(dialog).toHaveAttribute('data-op-premium','2.26.0');
  }

  await expect(page.locator('#detail')).not.toHaveClass(/op-premium-dialog/);
  await expect(page.locator('#reservation')).not.toHaveClass(/op-premium-dialog/);
  await expect(page.locator('#claimFlow')).not.toHaveClass(/op-premium-dialog/);
  await expect(page.locator('#authFlow')).not.toHaveClass(/op-premium-dialog/);
});

test('premium operator motion respects reduced-motion preferences', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await injectOperatorDialogs(page);
  const durations=await page.locator('#operatorServicesFlow .primary').evaluate(el=>{
    const s=getComputedStyle(el);
    return {transition:parseFloat(s.transitionDuration)||0,animation:parseFloat(s.animationDuration)||0};
  });
  expect(durations.transition).toBeLessThanOrEqual(.001);
  expect(durations.animation).toBeLessThanOrEqual(.001);
});

test('premium operator surfaces remain horizontally safe at 390px', async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('./',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    document.getElementById('operatorServicesFlow')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<dialog id="operatorServicesFlow" class="dialog" open><div class="operator-flow"><div class="claim-head"><button class="round">←</button><span class="claim-step">FREE · SERVICES</span></div><h2>Was können Gäste nutzen?</h2><div class="op-fast-intro"><b>In etwa 30 Sekunden erledigt</b><span>Drei kurze Antworten.</span></div><div class="hub-services-edit"><label class="hub-service-row"><span><b>Reservierung</b><small>Vom Betrieb bestätigt</small></span><div class="op-choice-group"><button class="op-choice active">Ja</button><button class="op-choice">Nein</button><button class="op-choice">Noch prüfen</button></div></label></div><div class="operator-flow-actions"><button>Abbrechen</button><button class="primary">Services speichern</button></div></div></dialog>`);
    window.hoyEnhanceOperatorPremium?.();
  });
  const metrics=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,dialog:document.getElementById('operatorServicesFlow').getBoundingClientRect().width}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  expect(metrics.dialog).toBeLessThanOrEqual(metrics.client);
  await page.screenshot({path:path.join(SCREEN_DIR,`${testInfo.project.name}-operator-premium-2.26.png`),fullPage:false});
});

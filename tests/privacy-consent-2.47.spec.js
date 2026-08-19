const { test, expect } = require('@playwright/test');

const CONSENT='hoy-analytics-consent-v1';
const PREF='hoy-privacy-preference-v1';

async function resetPrivacy(page){
  await page.goto('/?privacy_qa=1');
  await page.evaluate(({CONSENT,PREF})=>{
    [CONSENT,PREF,'hoy-anonymous-id-v1','hoy-proof-pilot-code-v1','hoy-proof-pilot-enrolled-v1','hoy-analytics-v1'].forEach(k=>localStorage.removeItem(k));
    sessionStorage.removeItem('hoy-session-id-v1');
  },{CONSENT,PREF});
  await page.reload();
}

test('privacy choice is explicit and accept/reject are co-located', async ({ page }) => {
  await resetPrivacy(page);
  const banner=page.locator('.hoy-privacy-banner');
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button',{name:'Analytics ablehnen'})).toBeVisible();
  await expect(banner.getByRole('button',{name:'Analytics zustimmen'})).toBeVisible();
  await banner.getByRole('button',{name:'Analytics zustimmen'}).click();
  await expect(banner).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.hoyPrivacyChoice247?.())).toBe('granted');
  const pref=await page.evaluate(PREF=>JSON.parse(localStorage.getItem(PREF)),PREF);
  expect(pref.choice).toBe('granted');
  expect(pref.noticeVersion).toBe('rt008-draft-2026-08-19');
  expect(pref.decidedAt).toBeTruthy();
});

test('withdrawal is available from persistent privacy settings and clears analytics identifiers', async ({ page }) => {
  await resetPrivacy(page);
  await page.getByRole('button',{name:'Analytics zustimmen'}).click();
  await page.evaluate(()=>{
    localStorage.setItem('hoy-anonymous-id-v1','qa-anon');
    localStorage.setItem('hoy-proof-pilot-code-v1','P01');
    localStorage.setItem('hoy-proof-pilot-enrolled-v1','P01');
    localStorage.setItem('hoy-analytics-v1','[{"qa":true}]');
    sessionStorage.setItem('hoy-session-id-v1','qa-session');
  });
  await page.getByRole('button',{name:'Datenschutz'}).click();
  const dialog=page.locator('#privacyFlow247');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Ablehnen / widerrufen'}).click();
  await expect.poll(()=>page.evaluate(()=>window.hoyPrivacyChoice247?.())).toBe('rejected');
  const values=await page.evaluate(()=>({
    consent:localStorage.getItem('hoy-analytics-consent-v1'),
    anon:localStorage.getItem('hoy-anonymous-id-v1'),
    pilot:localStorage.getItem('hoy-proof-pilot-code-v1'),
    sent:localStorage.getItem('hoy-proof-pilot-enrolled-v1'),
    history:localStorage.getItem('hoy-analytics-v1'),
    session:sessionStorage.getItem('hoy-session-id-v1')
  }));
  expect(values).toEqual({consent:'rejected',anon:null,pilot:null,sent:null,history:null,session:null});
});

test('production release gate stays false while controller and retention are incomplete', async ({ page }) => {
  await resetPrivacy(page);
  const gate=await page.evaluate(()=>({
    ready:window.hoyPrivacyProductionReady247?.(),
    releaseReady:window.HOY_PRIVACY_CONFIG?.releaseReady,
    analyticsEnabled:window.HOY_PRIVACY_CONFIG?.analyticsEnabled,
    controllerName:window.HOY_PRIVACY_CONFIG?.controllerName,
    retention:window.HOY_PRIVACY_CONFIG?.analyticsRetentionDays
  }));
  expect(gate).toEqual({ready:false,releaseReady:false,analyticsEnabled:false,controllerName:'',retention:null});
});

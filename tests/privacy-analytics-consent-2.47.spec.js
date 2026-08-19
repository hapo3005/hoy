import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const source = fs.readFileSync(path.join(process.cwd(), 'analytics-rpc-1.8.1.js'), 'utf8');

test('production analytics require explicit consent before identifiers or local history', async () => {
  expect(source).toContain("const CONSENT_KEY='hoy-privacy-analytics-consent-v1'");
  expect(source).toMatch(/function analyticsConsentGranted\(\)[\s\S]*?===['"]granted['"]/);
  expect(source).toMatch(/PRODUCTION_HOSTS\.has\(host\)[\s\S]*?analyticsConsentGranted\(\)/);
  expect(source).toMatch(/trackEvent=function[\s\S]*?if\(!analyticsStorageAllowed\(\)\)return Promise\.resolve\(false\);[\s\S]*?readEvents\(\)/);
  expect(source).toMatch(/trackEvent=function[\s\S]*?analyticsStorageAllowed\(\)[\s\S]*?buildPayload/);
});

test('pilot attribution is not persisted without analytics storage permission', async () => {
  const match=source.match(/function capturePilotEnrollment\(\)\{([\s\S]*?)\n\s*\}\n\s*function schedulePilotEnrollment/);
  expect(match, 'capturePilotEnrollment source must remain inspectable').toBeTruthy();
  const capture=match[1];

  expect(capture).toContain('const storageAllowed=analyticsStorageAllowed();');
  const gateIndex=capture.indexOf('if(storageAllowed){');
  expect(gateIndex, 'pilot storage must have an explicit permission gate').toBeGreaterThan(-1);

  const beforeGate=capture.slice(0,gateIndex);
  expect(beforeGate).not.toContain('localStorage.getItem(PILOT_KEY)');
  expect(beforeGate).not.toContain('localStorage.setItem(PILOT_KEY');

  const gatedBlock=capture.slice(gateIndex);
  expect(gatedBlock).toMatch(/if\(storageAllowed\)\{[\s\S]*?localStorage\.getItem\(PILOT_KEY\)[\s\S]*?if\(incoming\)[\s\S]*?localStorage\.setItem\(PILOT_KEY,incoming\)/);
  expect(capture).toMatch(/return storageAllowed\?\(selected\|\|incoming\|\|null\):null/);
  expect(source).toMatch(/schedulePilotEnrollment\(code,attempt=0\)[\s\S]*?if\(!code\|\|!analyticsStorageAllowed\(\)\)return/);
  expect(capture).toMatch(/if\(hasPilotParam\)[\s\S]*?params\.delete\('pilot'\)/);
});

test('deny or withdrawal clears analytics identifiers and history', async () => {
  expect(source).toMatch(/deny:\(\)=>[\s\S]*?clearAnalyticsIdentifiers\(\)/);
  expect(source).toMatch(/withdraw:\(\)=>[\s\S]*?clearAnalyticsIdentifiers\(\)/);
  expect(source).toMatch(/localStorage\.removeItem\(ANON_KEY\)/);
  expect(source).toMatch(/sessionStorage\.removeItem\(SESSION_KEY\)/);
  expect(source).toMatch(/localStorage\.removeItem\(PILOT_KEY\)/);
  expect(source).toMatch(/localStorage\.removeItem\(PILOT_SENT_KEY\)/);
});

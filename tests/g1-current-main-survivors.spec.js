const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'docs/investor-ready/g1-current-main-survivor-map-v1.json'), 'utf8'));
const byDomain = Object.fromEntries(map.authorities.map(a => [a.domain, a]));

test('G1 current-main survivor map checker passes fail-closed', async () => {
  const output = execFileSync(process.execPath, [path.join(root, 'scripts/check-g1-current-main-survivors.cjs')], { cwd: root, encoding: 'utf8' });
  expect(output).toContain('PASS_FAIL_CLOSED');
});

test('merged main authorities cannot regress to historical green branches', async () => {
  expect(map.baseMainSha).toBe('88bb9e77d50ccb9db96306f5e737e27bad6237ab');
  expect(byDomain.base_supply_chain.status).toBe('MERGED_AUTHORITY');
  expect(byDomain.analytics_privacy_runtime.status).toBe('MERGED_AUTHORITY');
  expect(byDomain.analytics_privacy_runtime.authority).toContain('main@88bb9e77');
  expect(byDomain.analytics_privacy_runtime.supersedesAsFinalAuthority.join(' ')).toContain('#120');
});

test('overlapping privacy, security, rights and public-runtime candidates require reconciliation', async () => {
  expect(byDomain.privacy_operating_controls.authority).toBe('hapo3005/hoy#127');
  expect(byDomain.privacy_operating_controls.status).toBe('RECOMPOSE_REQUIRED');
  expect(byDomain.security_hardening.authority).toBe('hapo3005/hoy#125');
  expect(byDomain.security_hardening.status).toBe('RECOMPOSE_REQUIRED');
  expect(byDomain.data_rights_core.authority).toBe('hapo3005/hoy#106');
  expect(byDomain.data_rights_core.status).toBe('RECOMPOSE_REQUIRED');
  expect(byDomain.public_runtime.authority).toBe('hapo3005/hoy#130');
  expect(byDomain.public_runtime.status).toBe('RECOMPOSE_REQUIRED');
});

test('rights and platform claim boundaries survive integration planning', async () => {
  expect(byDomain.data_rights_core.mustPreserve).toContain('AMBER is not transfer-clear');
  expect(byDomain.data_rights_core.mustPreserve).toContain('no whole-profile clearance claim');
  expect(byDomain.platform_core_transferability.mustPreserve).toContain('non-founder handoff remains NOT_TESTED');
});

test('historical and overlapping branches cannot be wholesale merge sources', async () => {
  for (const pr of ['hapo3005/hoy#102','hapo3005/hoy#103','hapo3005/hoy#105','hapo3005/hoy#120','hapo3005/hoy#121','hapo3005/hoy#125','hapo3005/hoy#127','hapo3005/hoy#130','hapo3005/hoy#106','hapo3005/hoy#115']) {
    expect(map.explicitDoNotWholesaleMerge).toContain(pr);
  }
  expect(map.finalIntegrationAuthorized).toBe(false);
  expect(map.productionAuthorized).toBe(false);
  expect(map.outreachAuthorized).toBe(false);
});

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const register = JSON.parse(fs.readFileSync(path.join(root, 'docs/investor-ready/g1-external-decision-register-v1.json'), 'utf8'));
const byId = Object.fromEntries(register.decisions.map(d => [d.id, d]));

test('G1 external decision pack passes fail-closed checker', async () => {
  const output = execFileSync(process.execPath, [path.join(root, 'scripts/check-g1-external-decision-pack.cjs')], { cwd: root, encoding: 'utf8' });
  expect(output).toContain('PASS_FAIL_CLOSED');
});

test('external decision register contains no fabricated approvals', async () => {
  expect(register.overallStatus).toBe('EXTERNAL_DECISIONS_REQUIRED');
  expect(register.decisions).toHaveLength(16);
  expect(register.decisions.filter(d => d.status === 'ADVISER_REQUIRED')).toHaveLength(15);
  expect(register.decisions.filter(d => d.status === 'INDEPENDENT_TEST_REQUIRED')).toHaveLength(1);
  expect(register.decisions.some(d => d.status === 'CLOSED_WITH_EVIDENCE')).toBe(false);
  expect(register.decisions.every(d => d.executionAuthorized === false)).toBe(true);
});

test('private founder facts stay outside the public repository contract', async () => {
  expect(register.publicRepositoryPrivacyRule).toMatch(/Do not store private founder/i);
  for (const id of ['A1','A2','A3','A4']) expect(byId[id].privateInputRequired).toBe(true);
});

test('privacy and data-rights advice must preserve current technical boundaries', async () => {
  expect(byId.B3.publicInputs.join(' ')).toContain('main merged #128');
  expect(byId.B7.publicInputs.join(' ')).toContain('PR #106');
  expect(byId.B7.expectedOutput).toMatch(/third-party rights/i);
});

test('trademark and non-founder gates require real external evidence', async () => {
  expect(byId.C1.expectedOutput).toMatch(/Official-registry-backed/);
  expect(byId.D1.status).toBe('INDEPENDENT_TEST_REQUIRED');
  expect(byId.D1.expectedOutput).toMatch(/no founder self-certification/i);
});

test('external decision pack authorizes neither operational execution nor outreach', async () => {
  expect(register.noAuthorization).toContain('production DDL/DML');
  expect(register.noAuthorization).toContain('personal tax-residency changes');
  expect(register.noAuthorization).toContain('trademark filing or rights-holder contact');
  expect(register.noAuthorization).toContain('paid infrastructure');
  expect(register.noAuthorization).toContain('business/partner/investor outreach');
});

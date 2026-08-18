import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { test, expect } from '@playwright/test';

test('RT-001/RT-002 current-state reconciliation blocks stale hardening and preserves privacy gate', async () => {
  const output=execFileSync(process.execPath,['scripts/check-rt001-rt002-current-state.mjs'],{
    cwd:process.cwd(),encoding:'utf8'
  });
  expect(output).toContain('"ok": true');
  expect(output).toContain('"migrationCount": 95');
  expect(output).toContain('"securityAdvisorWarnings": 7');
  expect(output).toContain('"analyticsAnonExecute": false');
  expect(output).toContain('"analyticsAuthenticatedExecute": false');
  expect(output).toContain('"oldPr103DirectApply": "BLOCKED_RECOMPOSE_REQUIRED"');
});

test('RT-001/RT-002 snapshot reflects current accessibility/privacy baseline without authorizing mutation', async () => {
  const s=JSON.parse(fs.readFileSync('supabase/release/rt001-rt002-current-state-2026-08-19.json','utf8'));
  expect(s.schemaState.accessibilityFeatureRegistry).toBe(true);
  expect(s.schemaState.restaurantAccessibilityFacts).toBe(true);
  expect(s.schemaState.accessibilityCounts.registryFeatures).toBe(24);
  expect(s.schemaState.accessibilityCounts.canonicalFacts).toBe(668);
  expect(s.boundaries.productionMutationPerformed).toBe(false);
  expect(s.boundaries.analyticsReactivationAuthorized).toBe(false);
  expect(s.boundaries.securityAdvisorWarningsClosed).toBe(false);
  expect(s.boundaries.migrationReconciliationClosed).toBe(false);
});

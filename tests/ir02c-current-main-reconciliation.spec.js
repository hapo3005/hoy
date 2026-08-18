import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const root=process.cwd();

test('IR-02C restored history and draft claim boundary stay exact', async () => {
  const output=execFileSync(process.execPath,['scripts/check-ir02c-current-main-reconciliation.mjs'],{
    cwd:root,encoding:'utf8'
  });
  expect(output).toContain('"ok": true');
  expect(output).toContain('"restoredExactBlobs": 8');
  expect(output).toContain('"appliedMigrationHistory": 5');
  expect(output).toContain('"termsStatus": "draft"');
  expect(output).toContain('"acceptances": 0');
  expect(output).toContain('"businessConfirmations": 0');
});

test('IR-02C live reconciliation forbids converting infrastructure into traction', async () => {
  const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/ir-02c-live-reconciliation-2026-08-19.json'),'utf8'));
  expect(snapshot.interpretation.termsActive).toBe(false);
  expect(snapshot.interpretation.marketProof).toBe(false);
  expect(snapshot.interpretation.businessConfirmedProof).toBe(false);
  expect(snapshot.interpretation.legalClearanceComplete).toBe(false);
  expect(snapshot.counts.businessTermsAcceptances).toBe(0);
  expect(snapshot.counts.businessDataConfirmations).toBe(0);
});

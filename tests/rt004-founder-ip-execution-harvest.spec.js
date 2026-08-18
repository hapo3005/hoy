import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const root=process.cwd();

test('RT-004 founder IP execution harvest preserves exact drafts without claiming transfer', async () => {
  const output=execFileSync(process.execPath,['scripts/check-rt004-founder-ip-execution-harvest.mjs'],{
    cwd:root,encoding:'utf8'
  });
  expect(output).toContain('"ok": true');
  expect(output).toContain('"preservedExactBlobs": 4');
  expect(output).toContain('"founderCompanyExecution": "PENDING"');
  expect(output).toContain('"ipTransferAuthorized": false');
});

test('current founder IP register supersedes only the census status, not the historical draft evidence', async () => {
  const historical=JSON.parse(fs.readFileSync(path.join(root,'data/ir-02a-founder-ip-schedule-2026-08-18.json'),'utf8'));
  const current=JSON.parse(fs.readFileSync(path.join(root,'data/rt004-founder-ip-execution-register-2026-08-19.json'),'utf8'));
  expect(historical.repositories.every(x=>x.census_status==='PARTIAL_SAMPLE_NOT_FULL_HISTORY')).toBe(true);
  expect(current.currentContributorEvidence.status).toBe('TECHNICAL_CENSUS_GREEN');
  expect(current.currentContributorEvidence.canonicalPr).toBe(104);
  expect(current.executionState.founderToCompanyRightsInstrumentExecuted).toBe(false);
  expect(current.executionState.coveredAssetsClassifiedAsCompanyOwned).toBe(false);
});

import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('RT-005 clean candidate contains no RT-006 coupling', async () => {
  const register=JSON.parse(read('docs/investor-ready/rt005-control-register.json'));
  const workflow=read('.github/workflows/investor-ready-rt005-secret-history-audit.yml');

  expect(register.overallStatus).toBe('IN_PROGRESS');
  expect(register.boundaries.containsRt006).toBe(false);
  expect(register.boundaries.productionChangesAuthorized).toBe(false);
  expect(register.boundaries.assetTransfersAuthorized).toBe(false);
  expect(register.boundaries.outreachAuthorized).toBe(false);

  expect(workflow).not.toContain('rt006');
  expect(workflow).not.toContain('ops/rt-005-rt-006-assets-sbom-ai');
  expect(workflow).toContain('github.event.pull_request.head.sha || github.sha');
});

test('RT-005 secret classification remains exact and fail-closed', async () => {
  const registry=JSON.parse(read('docs/investor-ready/rt005-secret-findings-classification.json'));
  const workflow=read('.github/workflows/investor-ready-rt005-secret-history-audit.yml');

  expect(registry.policy.default).toBe('REVIEW_REQUIRED');
  expect(registry.classifications.length).toBeGreaterThan(0);
  expect(new Set(registry.classifications.map(x=>`${x.repository}:${x.fingerprint}`)).size).toBe(registry.classifications.length);
  expect(workflow).toContain("rec['classification']='REVIEW_REQUIRED'");
  expect(workflow).toContain("x['unclassified_findings'] != 0");
});

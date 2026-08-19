import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('RT-005 clean candidate contains no RT-006 coupling', async () => {
  const register=JSON.parse(read('docs/investor-ready/rt005-control-register.json'));
  const workflow=read('.github/workflows/investor-ready-rt005-secret-history-audit.yml');

  expect(register.schemaVersion).toBe('1.1.0');
  expect(register.overallStatus).toBe('IN_PROGRESS');
  expect(register.boundaries.containsRt006).toBe(false);
  expect(register.boundaries.productionChangesAuthorized).toBe(false);
  expect(register.boundaries.assetTransfersAuthorized).toBe(false);
  expect(register.boundaries.outreachAuthorized).toBe(false);

  expect(workflow).not.toContain('rt006');
  expect(workflow).not.toContain('ops/rt-005-rt-006-assets-sbom-ai');
  expect(workflow).toContain('github.event.pull_request.head.sha || github.sha');
});

test('RT-005 secret classification remains exact, fail-closed and current-snapshot evidenced', async () => {
  const register=JSON.parse(read('docs/investor-ready/rt005-control-register.json'));
  const registry=JSON.parse(read('docs/investor-ready/rt005-secret-findings-classification.json'));
  const workflow=read('.github/workflows/investor-ready-rt005-secret-history-audit.yml');
  const evidence=read('docs/investor-ready/rt005-secret-history-evidence.md');

  expect(registry.policy.default).toBe('REVIEW_REQUIRED');
  expect(registry.classifications.length).toBeGreaterThan(0);
  expect(new Set(registry.classifications.map(x=>`${x.repository}:${x.fingerprint}`)).size).toBe(registry.classifications.length);
  expect(workflow).toContain("rec['classification']='REVIEW_REQUIRED'");
  expect(workflow).toContain("x['unclassified_findings'] != 0");

  expect(register.canonicalTechnicalEvidence.cleanImplementationHead).toBe('014194e7c7e817d92c973442e87dbae06c97ae92');
  expect(register.canonicalTechnicalEvidence.cleanCurrentMainRun).toBe(32194760001);
  expect(register.canonicalTechnicalEvidence.cleanCurrentMainStatus).toBe('GREEN');
  expect(register.canonicalTechnicalEvidence.totalFindings).toBe(14);
  expect(register.canonicalTechnicalEvidence.classifiedFindings).toBe(14);
  expect(register.canonicalTechnicalEvidence.unclassifiedFindings).toBe(0);
  expect(register.canonicalTechnicalEvidence.staleClassificationEntries).toBe(0);
  expect(register.canonicalTechnicalEvidence.sanitizedArtifactId).toBe(9345455439);
  expect(register.canonicalTechnicalEvidence.sanitizedArtifactSha256).toMatch(/^[0-9a-f]{64}$/);

  const byId=new Map(register.controls.map(item=>[item.id,item]));
  expect(byId.get('RT005-01').status).toBe('CLOSED_TECHNICAL_SNAPSHOT');
  for(const id of ['RT005-02','RT005-03','RT005-04','RT005-05','RT005-06','RT005-07','RT005-08']){
    expect(byId.get(id).status).toBe('OPEN');
  }

  expect(evidence).toContain('CLEAN CURRENT-MAIN TECHNICAL SNAPSHOT GREEN');
  expect(evidence).toContain('Before final merge or external acquired-state circulation, the workflow must run again on the then-current exact head.');
});

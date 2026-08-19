const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const jsonPath=path.join(root,'docs/investor-ready/rt007-source-url-first-party-wave1-candidate-2026-08-19.json');
const sqlPath=path.join(root,'scripts/investor-ready/rt007-source-url-first-party-wave1-dry-run.sql');
const snapshotPath=path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json');
const read=p=>fs.readFileSync(p,'utf8');

test('RT-007 source-url wave 1 is a non-persistent 12-row first-party replacement candidate', async () => {
  const x=JSON.parse(read(jsonPath));
  const sql=read(sqlPath);
  const live=JSON.parse(read(snapshotPath));

  expect(x.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(x.productionMutationPerformed).toBe(false);
  expect(x.restaurants).toHaveLength(12);
  expect(new Set(x.restaurants.map(r=>r.id)).size).toBe(12);
  expect(x.baseline.hardDirectProvenanceQueue).toBe(live.direct_restaurant_provenance.hard_queue.field_references);
  expect(x.baseline.hardDirectProvenanceQueue).toBe(329);
  expect(x.baseline.firstPartyRightsState).toBe('AMBER');
  expect(x.baseline.firstPartySourceClass).toBe('FIRST_PARTY_BUSINESS_REFERENCE');
  expect(x.baseline.firstPartyFactualVerificationAllowed).toBe(true);
  expect(x.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(x.baseline.businessTermsStillRequired).toBe(true);

  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
  expect(sql).toContain('expected 12 exact source_url/website pairs');
  expect(sql).toContain('expected 12 conservative first-party AMBER hosts');
  expect(sql).toContain('expected 329 before dry-run');
  expect(sql).toContain('expected hard queue 317 after dry-run');
});

test('RT-007 source-url wave 1 reduces hard provenance but does not create transfer-clear rights', async () => {
  const x=JSON.parse(read(jsonPath));
  const e=x.expectedIfLaterApprovedAndAppliedAlone;

  expect(e.hardDirectProvenanceQueueBefore).toBe(329);
  expect(e.hardDirectProvenanceQueueAfter).toBe(317);
  expect(e.hardQueueReduction).toBe(12);
  expect(e.newFirstPartyAmberReferences).toBe(12);
  expect(e.transferClearReferencesCreated).toBe(0);

  expect(x.combinedWavePotential.independentCandidatesMustBeRebasedBeforeCombinedApply).toBe(true);
  expect(x.combinedWavePotential.projectedHardQueueIfBothWereReconciledAndApproved).toBe(314);
  expect(x.combinedWavePotential.projectedTotalReduction).toBe(15);
  expect(x.approvalBoundary.legalClearanceClaimed).toBe(false);
  expect(x.approvalBoundary.businessTermsActivated).toBe(false);
  expect(x.approvalBoundary.canonicalMigrationCreated).toBe(false);
  expect(x.approvalBoundary.productionApplyAuthorized).toBe(false);
  expect(x.approvalBoundary.outreachAuthorized).toBe(false);
});

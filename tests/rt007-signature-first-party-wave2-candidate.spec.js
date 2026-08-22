const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-signature-first-party-wave2-candidate-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-signature-first-party-wave2-dry-run.sql'),'utf8');

test('RT-007 signature wave 2 is bounded to nine evidence-backed rewrites', async()=>{
  expect(candidate.schemaVersion).toBe('1.0.0');
  expect(candidate.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(candidate.productionMutationPerformed).toBe(false);
  expect(candidate.baseline.liveHardDirectReferences).toBe(329);
  expect(candidate.baseline.candidateSignatureReferences).toBe(9);
  expect(candidate.baseline.exactProductionRowsVerified).toBe(9);
  expect(candidate.baseline.conservativeFirstPartyHostsVerified).toBe(9);
  expect(candidate.baseline.firstPartyRightsState).toBe('AMBER');
  expect(candidate.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(candidate.baseline.businessTermsStillRequired).toBe(true);

  expect(candidate.replacements).toHaveLength(9);
  expect(new Set(candidate.replacements.map(x=>x.restaurantId)).size).toBe(9);
  expect(candidate.excludedFromWave2).toHaveLength(4);

  for(const row of candidate.replacements){
    expect(row.newSourceUrl).toMatch(/^https:\/\//);
    expect(row.newSourceHost).toBeTruthy();
    expect(row.newTitle).toBeTruthy();
    expect(row.newText).toBeTruthy();
    expect(Array.isArray(row.newTags)).toBe(true);
    expect(row.newTags.length).toBeGreaterThan(0);
    expect(row.claimScope).toBeTruthy();
    expect(row.newText).not.toMatch(/Tripadvisor|Bewertung|Gästestimme|reviews?/i);
  }
});

test('RT-007 signature wave 2 cannot masquerade as transfer clearance or applied state', async()=>{
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.hardDirectProvenanceQueueBefore).toBe(329);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.hardDirectProvenanceQueueAfter).toBe(320);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.hardQueueReduction).toBe(9);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.newFirstPartyAmberReferences).toBe(9);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.transferClearReferencesCreated).toBe(0);

  expect(candidate.combinedPreparedPotential.totalPreparedReferences).toBe(34);
  expect(candidate.combinedPreparedPotential.projectedHardQueueAfterRequiredRebase).toBe(295);
  expect(candidate.combinedPreparedPotential.rebaseRequired).toBe(true);

  expect(candidate.approvalBoundary.copyPreservedWithoutSourceSupport).toBe(false);
  expect(candidate.approvalBoundary.pageContentRecheckBeforeApplyRequired).toBe(true);
  expect(candidate.approvalBoundary.legalClearanceClaimed).toBe(false);
  expect(candidate.approvalBoundary.businessTermsActivated).toBe(false);
  expect(candidate.approvalBoundary.canonicalMigrationCreated).toBe(false);
  expect(candidate.approvalBoundary.productionApplyAuthorized).toBe(false);
  expect(candidate.approvalBoundary.outreachAuthorized).toBe(false);
});

test('RT-007 signature wave 2 SQL is fail-closed and rollback-only', async()=>{
  expect(sql).toContain('expected 9 exact Production rows');
  expect(sql).toContain('expected 9 conservative first-party AMBER hosts');
  expect(sql).toContain('expected 329 before dry-run');
  expect(sql).toContain('expected hard queue 320 after dry-run');
  expect(sql.match(/update public\.restaurants/g)?.length).toBe(9);
  expect(sql).toMatch(/rollback\s*;\s*$/i);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
});

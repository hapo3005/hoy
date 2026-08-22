const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-location-first-party-wave4-candidate-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-location-first-party-wave4-dry-run.sql'),'utf8');

test('RT-007 location wave 4 is limited to two exact published first-party address matches', async()=>{
  expect(candidate.schemaVersion).toBe('1.0.0');
  expect(candidate.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(candidate.productionMutationPerformed).toBe(false);
  expect(candidate.baseline.liveHardDirectReferences).toBe(329);
  expect(candidate.baseline.candidateLocationReferences).toBe(2);
  expect(candidate.baseline.publishedCandidateReferences).toBe(2);
  expect(candidate.baseline.unpublishedCandidateReferences).toBe(0);
  expect(candidate.baseline.firstPartyRightsState).toBe('AMBER');
  expect(candidate.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(candidate.baseline.businessTermsStillRequired).toBe(true);

  expect(candidate.replacements).toHaveLength(2);
  expect(candidate.replacements.map(x=>x.restaurantId).sort((a,b)=>a-b)).toEqual([192,203]);
  for(const row of candidate.replacements){
    expect(row.oldLocationHost).toBe('www.google.com');
    expect(row.newLocationSourceUrl).toMatch(/^https:\/\//);
    expect(row.officialPageEvidence).toBeTruthy();
    expect(row.evidenceCheckedAt).toBe('2026-08-19');
  }
});

test('RT-007 location wave 4 improves only published hard refs and creates no transfer-clear claim', async()=>{
  const expected=candidate.expectedIfLaterApprovedAndAppliedAlone;
  expect(expected.hardDirectProvenanceQueueBefore).toBe(329);
  expect(expected.hardDirectProvenanceQueueAfter).toBe(327);
  expect(expected.publishedHardQueueBefore).toBe(324);
  expect(expected.publishedHardQueueAfter).toBe(322);
  expect(expected.hardQueueReduction).toBe(2);
  expect(expected.newFirstPartyAmberReferences).toBe(2);
  expect(expected.transferClearReferencesCreated).toBe(0);

  const combined=candidate.combinedPreparedPotential;
  expect(combined.totalPreparedReferences).toBe(36);
  expect(combined.publishedPreparedReferences).toBe(34);
  expect(combined.unpublishedPreparedReferences).toBe(2);
  expect(combined.projectedHardQueueAfterRequiredRebase).toBe(293);
  expect(combined.projectedPublishedHardQueueAfterRequiredRebase).toBe(290);
  expect(combined.projectedUnpublishedHardQueueAfterRequiredRebase).toBe(3);
  expect(combined.rebaseRequired).toBe(true);
});

test('RT-007 location wave 4 SQL is exact-baseline and rollback-only', async()=>{
  expect(sql).toContain('expected 2 exact published Production rows');
  expect(sql).toContain('expected 2 conservative first-party AMBER hosts');
  expect(sql).toContain('expected total/published 329/324');
  expect(sql).toContain('expected total/published hard queue 327/322');
  expect(sql.match(/update public\.restaurants/g)?.length).toBe(2);
  expect(sql).toMatch(/rollback\s*;\s*$/i);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
});

test('RT-007 location wave 4 keeps execution and legal approval closed', async()=>{
  expect(candidate.approvalBoundary.pageContentRecheckBeforeApplyRequired).toBe(true);
  expect(candidate.approvalBoundary.legalClearanceClaimed).toBe(false);
  expect(candidate.approvalBoundary.businessTermsActivated).toBe(false);
  expect(candidate.approvalBoundary.canonicalMigrationCreated).toBe(false);
  expect(candidate.approvalBoundary.productionApplyAuthorized).toBe(false);
  expect(candidate.approvalBoundary.outreachAuthorized).toBe(false);
});

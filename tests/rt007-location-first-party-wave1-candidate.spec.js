const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-location-first-party-wave1-candidate-2026-08-19.json'),'utf8'));
const live=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-location-first-party-wave1-dry-run.sql'),'utf8');

test('RT-007 location wave 1 contains only exact first-party address matches', async()=>{
  expect(candidate.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(candidate.productionMutationPerformed).toBe(false);
  expect(candidate.baseline.hardDirectProvenanceQueue).toBe(live.direct_restaurant_provenance.hard_queue.field_references);
  expect(candidate.replacements).toHaveLength(2);
  expect(new Set(candidate.replacements.map(x=>x.restaurantId))).toEqual(new Set([98,135]));
  expect(candidate.excludedExamples.map(x=>x.restaurantId)).toEqual(expect.arrayContaining([111,116,144]));

  for(const x of candidate.replacements){
    expect(x.oldHost).toBe('www.google.com');
    expect(x.newSourceUrl).toMatch(/^https:\/\//);
    expect(x.officialPageEvidence.length).toBeGreaterThan(10);
  }

  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
  expect(sql).toContain('expected 2 exact HOY rows');
  expect(sql).toContain('expected 2 conservative first-party AMBER hosts');
  expect(sql).toContain('expected 329 before dry-run');
  expect(sql).toContain('expected hard queue 327 after dry-run');
});

test('RT-007 location wave 1 improves provenance without claiming transfer-clear rights', async()=>{
  const e=candidate.expectedIfLaterApprovedAndAppliedAlone;
  expect(e.hardDirectProvenanceQueueBefore).toBe(329);
  expect(e.hardDirectProvenanceQueueAfter).toBe(327);
  expect(e.hardQueueReduction).toBe(2);
  expect(e.newFirstPartyAmberReferences).toBe(2);
  expect(e.transferClearReferencesCreated).toBe(0);

  expect(candidate.baseline.firstPartyRightsState).toBe('AMBER');
  expect(candidate.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(candidate.baseline.businessTermsStillRequired).toBe(true);
  expect(candidate.combinedPreparedPotential.totalPreparedReferences).toBe(17);
  expect(candidate.combinedPreparedPotential.projectedHardQueueAfterRequiredRebase).toBe(312);
  expect(candidate.combinedPreparedPotential.rebaseRequired).toBe(true);
  expect(candidate.approvalBoundary.productionApplyAuthorized).toBe(false);
});

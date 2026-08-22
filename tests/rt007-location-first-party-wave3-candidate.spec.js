const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-location-first-party-wave3-candidate-2026-08-19.json'),'utf8'));
const live=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-location-first-party-wave3-dry-run.sql'),'utf8');

test('RT-007 location wave 3 contains only current first-party page-backed location matches', async()=>{
  expect(candidate.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(candidate.productionMutationPerformed).toBe(false);
  expect(candidate.baseline.hardDirectProvenanceQueue).toBe(live.direct_restaurant_provenance.hard_queue.field_references);
  expect(candidate.replacements).toHaveLength(4);
  expect(new Set(candidate.replacements.map(x=>x.restaurantId))).toEqual(new Set([181,185,187,202]));

  for(const x of candidate.replacements){
    expect(x.oldLocationHost).toBe('www.google.com');
    expect(x.newLocationSourceUrl).toMatch(/^https:\/\//);
    expect(x.officialPageEvidence.length).toBeGreaterThan(12);
    expect(x.evidenceCheckedAt).toBe('2026-08-19');
  }

  expect(candidate.excludedBoundaryExamples.map(x=>x.restaurantId)).toEqual(expect.arrayContaining([105,111,116,132,216]));
  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
  expect(sql).toContain('expected 4 exact Production rows');
  expect(sql).toContain('expected 4 conservative first-party AMBER hosts');
  expect(sql).toContain('expected 329 before dry-run');
  expect(sql).toContain('expected hard queue 325 after dry-run');
});

test('RT-007 location wave 3 improves provenance without changing location facts or rights class', async()=>{
  const e=candidate.expectedIfLaterApprovedAndAppliedAlone;
  expect(e.hardDirectProvenanceQueueBefore).toBe(329);
  expect(e.hardDirectProvenanceQueueAfter).toBe(325);
  expect(e.hardQueueReduction).toBe(4);
  expect(e.newFirstPartyAmberReferences).toBe(4);
  expect(e.transferClearReferencesCreated).toBe(0);

  expect(candidate.baseline.firstPartyRightsState).toBe('AMBER');
  expect(candidate.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(candidate.baseline.businessTermsStillRequired).toBe(true);
  expect(candidate.combinedPreparedPotential.totalPreparedReferences).toBe(25);
  expect(candidate.combinedPreparedPotential.projectedHardQueueAfterRequiredRebase).toBe(304);
  expect(candidate.combinedPreparedPotential.rebaseRequired).toBe(true);
  expect(candidate.approvalBoundary.pageContentRecheckBeforeApplyRequired).toBe(true);
  expect(candidate.approvalBoundary.productionApplyAuthorized).toBe(false);

  expect(sql).not.toMatch(/\bset\s+(address|latitude|longitude|location_status|location_precision)\s*=/i);
});

const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const pass=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-first-party-verification-pass2-2026-08-19.json'),'utf8'));
const live=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json'),'utf8'));
const candidate=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-location-first-party-wave2-candidate-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-location-first-party-wave2-dry-run.sql'),'utf8');

test('RT-007 verification pass 2 reconciles live drift without inventing buyer-queue improvement', async()=>{
  expect(pass.status).toBe('VERIFICATION_PASS_COMPLETE_CANDIDATES_NOT_APPLIED');
  expect(pass.productionMutationPerformed).toBe(false);
  expect(live.direct_restaurant_provenance.NO_REGISTRY.field_references).toBe(0);
  expect(live.direct_restaurant_provenance.REVIEW_REQUIRED.field_references).toBe(16);
  expect(live.direct_restaurant_provenance.hard_queue.field_references).toBe(329);
  expect(pass.registryDrift.hardQueueChanged).toBe(false);

  const total=Object.values(pass.liveScreening.byField).reduce((n,x)=>n+x,0);
  expect(total).toBe(67);
  expect(pass.liveScreening.totalCandidateReferences).toBe(67);
  expect(pass.hoursReview.candidateReferencesReviewed).toBe(13);
  expect(pass.hoursReview.newPreparedReferences).toBe(0);
  expect(pass.hoursReview.decision).toBe('NO_NEW_HOURS_REPLACEMENTS');
});

test('RT-007 location wave 2 is narrow, rollback-only and AMBER-not-transfer-clear', async()=>{
  expect(candidate.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(candidate.replacements).toHaveLength(2);
  expect(new Set(candidate.replacements.map(x=>x.restaurantId))).toEqual(new Set([208,211]));
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.hardDirectProvenanceQueueBefore).toBe(329);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.hardDirectProvenanceQueueAfter).toBe(327);
  expect(candidate.expectedIfLaterApprovedAndAppliedAlone.transferClearReferencesCreated).toBe(0);
  expect(candidate.combinedPreparedPotential.totalPreparedReferences).toBe(21);
  expect(candidate.combinedPreparedPotential.projectedHardQueueAfterRequiredRebase).toBe(308);
  expect(candidate.approvalBoundary.pageContentRecheckBeforeApplyRequired).toBe(true);
  expect(candidate.approvalBoundary.productionApplyAuthorized).toBe(false);

  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
  expect(sql).toContain('expected 2 exact Production rows');
  expect(sql).toContain('expected 2 conservative first-party AMBER hosts');
  expect(sql).toContain('expected 329 before dry-run');
  expect(sql).toContain('expected hard queue 327 after dry-run');
});

test('RT-007 prepared-state arithmetic stays fail-closed after drift', async()=>{
  const p=pass.preparedStateAfterPass;
  expect(p.genericSourceUrlWave1+p.signatureWave1+p.locationWave1+p.locationWave2).toBe(21);
  expect(p.totalPreparedReferences).toBe(21);
  expect(p.remainingCandidateReferences).toBe(46);
  expect(p.projectedHardQueueAfterRequiredRebaseIfAllPreparedWereLaterApproved).toBe(308);
  expect(p.isCurrentProductionState).toBe(false);
  expect(p.isForecast).toBe(false);
  expect(pass.rightsBoundary.preparedReplacementRightsStatus).toBe('AMBER');
  expect(pass.rightsBoundary.transferability).toBe('UNKNOWN');
  expect(pass.rightsBoundary.transferClearReferencesCreated).toBe(0);
});

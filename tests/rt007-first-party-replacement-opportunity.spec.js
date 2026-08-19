const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const summary=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-first-party-replacement-opportunity-2026-08-19.json'),'utf8'));
const live=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-19.json'),'utf8'));
const audit=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-first-party-replacement-opportunity-audit.sql'),'utf8');

test('RT-007 first-party opportunity is screened, bounded and reconciled to current hard queue', async()=>{
  expect(summary.schemaVersion).toBe('1.2.0');
  expect(summary.status).toBe('SCREENED_NOT_APPROVED');
  expect(summary.liveHardDirectReferences).toBe(live.direct_restaurant_provenance.hard_queue.field_references);
  expect(summary.liveHardDirectReferences).toBe(329);

  const total=Object.values(summary.byField).reduce((n,x)=>n+x.candidateReferences,0);
  const prepared=Object.values(summary.byField).reduce((n,x)=>n+x.preparedDryRunReferences,0);
  expect(total).toBe(67);
  expect(prepared).toBe(25);
  expect(summary.screenedCandidateReferences).toBe(total);
  expect(summary.preparedDryRunReferences).toBe(prepared);
  expect(summary.factVerificationStillRequired).toBe(total-prepared);
  expect(summary.factVerificationStillRequired).toBe(42);

  expect(summary.byField.source_url.candidateReferences).toBe(13);
  expect(summary.byField.source_url.preparedDryRunReferences).toBe(12);
  expect(summary.byField.location_source_url.candidateReferences).toBe(25);
  expect(summary.byField.location_source_url.preparedDryRunReferences).toBe(10);
  expect(summary.byField.location_source_url.remainingReferences).toBe(15);
  expect(summary.byField.hours_source_url.candidateReferences).toBe(13);
  expect(summary.byField.hours_source_url.preparedDryRunReferences).toBe(0);
  expect(summary.byField.hours_source_url.pass2Decision).toBe('NO_NEW_HOURS_REPLACEMENTS');
  expect(summary.byField.signature_source_url.candidateReferences).toBe(16);
  expect(summary.byField.signature_source_url.preparedDryRunReferences).toBe(3);
});

test('RT-007 opportunity ceiling cannot masquerade as approved rights or completed replacements', async()=>{
  expect(summary.preparedCandidates.locationWave3.references).toBe(4);
  expect(summary.preparedCandidates.locationWave3.projectedHardQueueIfAppliedAlone).toBe(325);
  expect(summary.preparedCandidates.combinedAfterRequiredRebase.references).toBe(25);
  expect(summary.preparedCandidates.combinedAfterRequiredRebase.projectedHardQueue).toBe(304);
  expect(summary.preparedCandidates.combinedAfterRequiredRebase.rebaseRequired).toBe(true);
  expect(summary.opportunityCeiling.ifAll67CandidatesWereIndividuallyVerifiedAndApproved).toBe(262);
  expect(summary.opportunityCeiling.isForecast).toBe(false);
  expect(summary.opportunityCeiling.isPromise).toBe(false);
  expect(summary.verificationPasses.pass3).toBe('docs/investor-ready/rt007-first-party-verification-pass3-2026-08-19.json');

  expect(summary.rightsBoundary.candidateRightsStatus).toBe('AMBER');
  expect(summary.rightsBoundary.transferability).toBe('UNKNOWN');
  expect(summary.rightsBoundary.businessTermsRequired).toBe(true);
  expect(summary.rightsBoundary.transferClearReferencesCreatedByScreening).toBe(0);

  expect(summary.safetyBoundary.productionMutationPerformed).toBe(false);
  expect(summary.safetyBoundary.automaticReplacementAuthorized).toBe(false);
  expect(summary.safetyBoundary.legalClearanceClaimed).toBe(false);
  expect(summary.safetyBoundary.businessTermsActivated).toBe(false);
  expect(summary.safetyBoundary.outreachAuthorized).toBe(false);

  expect(audit).toContain('GENERIC_FIRST_PARTY_SWAP_CANDIDATE');
  expect(audit).toContain('VERIFY_OFFICIAL_PAGE_SHOWS_LOCATION_OR_ADDRESS');
  expect(audit).toContain('VERIFY_OFFICIAL_PAGE_SHOWS_CURRENT_HOURS');
  expect(audit).toContain('VERIFY_AND_REWRITE_SIGNATURE_TO_SUPPORTED_FACTS');
});

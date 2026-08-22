const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const jsonPath=path.join(root,'docs/investor-ready/rt007-no-registry-resolution-candidate-2026-08-19.json');
const sqlPath=path.join(root,'scripts/investor-ready/rt007-no-registry-resolution-dry-run.sql');

function read(p){ return fs.readFileSync(p,'utf8'); }

test('RT-007 no-registry candidate is restrictive and non-persistent', async () => {
  const x=JSON.parse(read(jsonPath));
  const sql=read(sqlPath);

  expect(x.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(x.productionMutationPerformed).toBe(false);
  expect(x.baseline.sourceRightsRegistryExistingCandidateHosts).toBe(0);
  expect(x.baseline.directNoRegistryFieldReferences).toBe(3);
  expect(x.candidates).toHaveLength(2);
  expect(new Set(x.candidates.map(c=>c.host))).toEqual(new Set(['www.thefork.es','elpais.com']));

  for(const c of x.candidates){
    expect(c.rightsStatus).toBe('RED');
    expect(c.useAsLead).toBe(true);
    expect(c.factualVerificationAllowed).toBe(false);
    expect(c.persistentCopyAllowed).toBe(false);
    expect(c.publicReuseAllowed).toBe(false);
    expect(c.derivativeUseAllowed).toBe(false);
    expect(c.commercialUseAllowed).toBe(false);
    expect(c.automatedCollectionAllowed).toBe(false);
    expect(c.replacementRequired).toBe(true);
    expect(c.transferability).toBe('NO');
    expect(c.legalReviewStatus).toBe('TERMS_REVIEWED_RESTRICTED');
    expect(c.termsReference).toMatch(/^https:\/\//);
    expect(c.termsCheckedAt).toBe('2026-08-19');
  }

  expect(x.expectedIfLaterApprovedAndApplied.candidateHostNoRegistryReferences).toBe(0);
  expect(x.expectedIfLaterApprovedAndApplied.candidateHostRedReferences).toBe(3);
  expect(x.expectedIfLaterApprovedAndApplied.overallProblemQueueReduction).toBe(0);
  expect(x.approvalBoundary.legalClearanceClaimed).toBe(false);
  expect(x.approvalBoundary.canonicalMigrationCreated).toBe(false);
  expect(x.approvalBoundary.productionApplyAuthorized).toBe(false);
  expect(x.approvalBoundary.sourceReplacementPerformed).toBe(false);

  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).toContain("expected both candidate hosts absent from registry");
  expect(sql).toContain("expected 3 candidate refs");
  expect(sql).toContain("'www.thefork.es','PLATFORM_RESTRICTED','RED'");
  expect(sql).toContain("'elpais.com','PUBLISHER_RESTRICTED','RED'");
  expect(sql).not.toMatch(/\bcommit\s*;/i);
});

test('RT-007 candidate does not pretend classification coverage reduces the restricted buyer queue', async () => {
  const x=JSON.parse(read(jsonPath));
  expect(x.expectedIfLaterApprovedAndApplied.overallProblemQueueReduction).toBe(0);
  expect(x.expectedIfLaterApprovedAndApplied.reason).toContain('remain restricted/replacement-required');

  const affected=x.candidates.reduce((n,c)=>n+c.affectedDirectReferences,0);
  expect(affected).toBe(3);
  expect(new Set(x.candidates.flatMap(c=>c.affectedRestaurants))).toEqual(new Set([8,9,22]));
});

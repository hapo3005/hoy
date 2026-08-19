const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root=path.resolve(__dirname,'..');
const jsonPath=path.join(root,'docs/investor-ready/rt007-signature-first-party-replacement-candidate-2026-08-19.json');
const sqlPath=path.join(root,'scripts/investor-ready/rt007-signature-first-party-replacement-dry-run.sql');
const snapshotPath=path.join(root,'docs/investor-ready/rt007-live-rights-snapshot-2026-08-18.json');
const read=p=>fs.readFileSync(p,'utf8');

test('RT-007 first-party replacement removes unsupported signature framing rather than source-swapping blindly', async () => {
  const x=JSON.parse(read(jsonPath));
  const sql=read(sqlPath);

  expect(x.status).toBe('DRY_RUN_CANDIDATE_NOT_APPLIED');
  expect(x.productionMutationPerformed).toBe(false);
  expect(x.replacements).toHaveLength(3);
  expect(new Set(x.replacements.map(r=>r.restaurantId))).toEqual(new Set([8,9,22]));

  for(const r of x.replacements){
    expect(r.oldClaimRemoved.length).toBeGreaterThan(5);
    expect(r.newSourceUrl).toMatch(/^https:\/\//);
    expect(r.newSourceHost).not.toBe('elpais.com');
    expect(r.newSourceHost).not.toBe('www.thefork.es');
    expect(r.newTitle.length).toBeGreaterThan(5);
    expect(r.newTags.length).toBeGreaterThanOrEqual(3);
  }

  expect(sql.trim().toLowerCase().endsWith('rollback;')).toBe(true);
  expect(sql).not.toMatch(/\bcommit\s*;/i);
  expect(sql).toContain('expected 3 exact restricted source rows');
  expect(sql).toContain('expected 3 conservative AMBER factual-reference hosts');
  expect(sql).toContain('expected hard queue 340 after dry-run');
  expect(sql).toContain("signature_title='Dünenformen, Beach Club & Mittelmeer'");
  expect(sql).toContain("signature_title='Terrasse mit Sonnenuntergang'");
  expect(sql).toContain("signature_title='Seafood, Fisch & Arroces'");
  expect(sql).not.toContain('Das „UFO“ von La Manga');
  expect(sql).not.toContain('gelegentliche Live-Musik');
});

test('RT-007 first-party replacement reduces hard provenance queue without pretending AMBER is transfer-clear', async () => {
  const x=JSON.parse(read(jsonPath));
  const live=JSON.parse(read(snapshotPath));

  const currentHard=(live.direct_restaurant_provenance.RED?.field_references||0)
    +(live.direct_restaurant_provenance.REVIEW_REQUIRED?.field_references||0)
    +(live.direct_restaurant_provenance.NO_REGISTRY?.field_references||0);

  expect(currentHard).toBe(343);
  expect(x.expectedIfLaterApprovedAndApplied.hardDirectProvenanceQueueBefore).toBe(currentHard);
  expect(x.expectedIfLaterApprovedAndApplied.hardDirectProvenanceQueueAfter).toBe(340);
  expect(x.expectedIfLaterApprovedAndApplied.hardQueueReduction).toBe(3);
  expect(x.expectedIfLaterApprovedAndApplied.noRegistryDirectReferencesAfter).toBe(0);
  expect(x.expectedIfLaterApprovedAndApplied.newFirstPartyAmberReferences).toBe(3);
  expect(x.expectedIfLaterApprovedAndApplied.transferClearReferencesCreated).toBe(0);

  expect(x.baseline.firstPartyRightsState).toBe('AMBER');
  expect(x.baseline.firstPartyFactualVerificationAllowed).toBe(true);
  expect(x.baseline.firstPartyTransferability).toBe('UNKNOWN');
  expect(x.baseline.businessTermsStillRequired).toBe(true);
  expect(x.approvalBoundary.legalClearanceClaimed).toBe(false);
  expect(x.approvalBoundary.businessTermsActivated).toBe(false);
  expect(x.approvalBoundary.productionApplyAuthorized).toBe(false);
});

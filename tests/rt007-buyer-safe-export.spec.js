const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-buyer-safe-export-snapshot-2026-08-19.json'),'utf8'));
const sql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-buyer-safe-export.sql'),'utf8');
const executableSql=sql.replace(/--[^\n]*/g,' ');

test('RT-007 buyer-safe snapshot reconciles active, conditional and archived risk', async()=>{
  expect(snapshot.schemaVersion).toBe('1.2.0');
  expect(snapshot.status).toBe('READ_ONLY_BUYER_DD_SNAPSHOT');
  expect(snapshot.productionMutationPerformed).toBe(false);
  expect(snapshot.restaurantPopulation).toEqual({published:166,unpublished:3,total:169});
  expect(snapshot.hardDirectReferences.all).toBe(329);
  expect(snapshot.hardDirectReferences.published).toBe(324);
  expect(snapshot.hardDirectReferences.unpublished).toBe(5);
  expect(snapshot.hardDirectReferences.published + snapshot.hardDirectReferences.unpublished).toBe(snapshot.hardDirectReferences.all);

  const byBucket=Object.fromEntries(snapshot.restaurantBuyerBuckets.map(x=>[x.bucket,x]));
  expect(byBucket.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY.restaurants).toBe(146);
  expect(byBucket.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY.hardRestrictedReferences).toBe(324);
  expect(byBucket.PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR.restaurants).toBe(18);
  expect(byBucket.PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW.restaurants).toBe(2);
  expect(byBucket.ARCHIVED_UNPUBLISHED_CARVEOUT.restaurants).toBe(3);
  expect(byBucket.ARCHIVED_UNPUBLISHED_CARVEOUT.hardRestrictedReferences).toBe(5);
  expect(
    byBucket.PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY.restaurants+
    byBucket.PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR.restaurants+
    byBucket.PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW.restaurants
  ).toBe(166);
});

test('RT-007 provenance-clear examples cannot become whole-profile clearance claims', async()=>{
  expect(snapshot.publishedProvenanceReferenceExamples).toHaveLength(2);
  expect(new Set(snapshot.publishedProvenanceReferenceExamples.map(x=>x.restaurantId))).toEqual(new Set([150,168]));
  for(const row of snapshot.publishedProvenanceReferenceExamples){
    expect(row.bucket).toBe('PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW');
    expect(row.qualification).toMatch(/Source-reference classification only/i);
    expect(row.qualification).toMatch(/not a whole-profile/i);
  }
  expect(snapshot.buyerExportRules.greenSourceMeansWholeProfileClean).toBe(false);
  expect(snapshot.buyerExportRules.provenanceRefsTransferableMeansWholeProfileClean).toBe(false);
  expect(snapshot.buyerExportRules.amberMeansTransferClear).toBe(false);
  expect(snapshot.buyerExportRules.personalOrUserEventDataIncluded).toBe(false);
  expect(snapshot.buyerExportRules.privacyGate).toBe('RT-008');
});

test('RT-007 archived hard refs remain visible and are not silently discarded', async()=>{
  expect(snapshot.unpublishedHardReferenceCarveout).toHaveLength(5);
  const ids=snapshot.unpublishedHardReferenceCarveout.map(x=>x.restaurantId);
  expect(ids.filter(x=>x===19)).toHaveLength(3);
  expect(ids.filter(x=>x===202)).toHaveLength(1);
  expect(ids.filter(x=>x===240)).toHaveLength(1);
  for(const row of snapshot.unpublishedHardReferenceCarveout){
    expect(row.host).toBeTruthy();
    expect(['RED','REVIEW_REQUIRED']).toContain(row.rightsStatus);
    expect(row.replacementRequired).toBe(true);
  }
  expect(snapshot.buyerExportRules.unpublishedRowsExcludedFromActiveBuyerDataset).toBe(true);
  expect(snapshot.buyerExportRules.unpublishedRowsRetainedInRightsReconciliation).toBe(true);
});

test('RT-007 prepared replacements separate active buyer impact from archive cleanup', async()=>{
  const impact=snapshot.preparedReplacementImpact;
  expect(impact.status).toBe('PROJECTED_AFTER_REQUIRED_REBASE_REVIEW_AND_APPLY');
  expect(impact.currentHardReferences).toEqual({all:329,published:324,unpublished:5});
  expect(impact.preparedReferences).toEqual({all:36,published:34,unpublished:2});
  expect(impact.projectedHardReferences).toEqual({all:293,published:290,unpublished:3});
  expect(impact.currentHardReferences.all-impact.preparedReferences.all).toBe(impact.projectedHardReferences.all);
  expect(impact.currentHardReferences.published-impact.preparedReferences.published).toBe(impact.projectedHardReferences.published);
  expect(impact.currentHardReferences.unpublished-impact.preparedReferences.unpublished).toBe(impact.projectedHardReferences.unpublished);

  const waveTotals=impact.byWave.reduce((a,x)=>({all:a.all+x.all,published:a.published+x.published,unpublished:a.unpublished+x.unpublished}),{all:0,published:0,unpublished:0});
  expect(waveTotals).toEqual(impact.preparedReferences);
  expect(impact.byWave.find(x=>x.wave==='location_wave4')).toEqual({wave:'location_wave4',all:2,published:2,unpublished:0});
  expect(impact.unpublishedPreparedTargets).toHaveLength(2);
  expect(impact.unpublishedPreparedTargets.map(x=>`${x.restaurantId}:${x.field}`).sort()).toEqual(['19:source_url','202:location_source_url']);
  expect(impact.rebaseRequired).toBe(true);
  expect(impact.reviewRequired).toBe(true);
  expect(impact.productionApplyAuthorized).toBe(false);
});

test('RT-007 buyer-safe export is SELECT-only and omits raw URLs from buyer result columns', async()=>{
  expect(sql).toContain('ARCHIVED_UNPUBLISHED_CARVEOUT');
  expect(sql).toContain('PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW');
  expect(sql).toContain('SOURCE_REFERENCES_ONLY_NOT_WHOLE_PROFILE_CLEARANCE');
  expect(sql).toContain('PASS_2026_08_19_BUYER_SAFE_SNAPSHOT');
  expect(sql).toContain('RT-008');
  expect(sql).toContain('false as whole_profile_clearance_claimed');
  expect(sql).toContain('false as personal_or_user_event_data_included');
  expect(executableSql).not.toMatch(/\b(insert|update|delete|merge|create|alter|drop|truncate|grant|revoke|commit|rollback)\b/i);
  expect(snapshot.buyerExportRules.rawSourceUrlsRequiredInBuyerFacingRows).toBe(false);
  expect(snapshot.buyerExportRules.sourceHostAndFieldAreSufficientForSegregationEvidence).toBe(true);
});

test('RT-007 Buyer-Safe Export remains a prepared contract, not commercialization approval', async()=>{
  expect(snapshot.gate.buyerSafeExportContract).toBe('PREPARED_NOT_EXECUTED');
  expect(snapshot.gate.rt007Overall).toBe('IN_PROGRESS');
  expect(snapshot.gate.productionExportAuthorized).toBe(false);
  expect(snapshot.gate.dataCommercializationAuthorized).toBe(false);
});

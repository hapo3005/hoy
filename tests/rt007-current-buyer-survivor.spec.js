const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const state=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-current-buyer-state-2026-08-19.json'),'utf8'));
const plan=JSON.parse(fs.readFileSync(path.join(root,'docs/investor-ready/rt007-prepared-replacements-v2.json'),'utf8'));
const exportSql=fs.readFileSync(path.join(root,'scripts/investor-ready/rt007-buyer-safe-export.sql'),'utf8');

test('RT-007 current buyer snapshot keeps hard/conditional/archive boundaries exact', async()=>{
  expect(state.productionMutationPerformed).toBe(false);
  expect(state.hardDirectReferences).toEqual({all:329,restaurants:149,published:324,publishedRestaurants:146,unpublished:5,unpublishedRestaurants:3});
  expect(state.restaurantBuyerBuckets).toEqual({
    PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY:146,
    PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR:18,
    PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW:2,
    ARCHIVED_UNPUBLISHED_CARVEOUT:3
  });
  expect(state.sourceUsage.NO_REGISTRY).toEqual({hosts:0,refs:0});
  expect(state.sourceUsage.redPolicyFailures).toBe(0);
  expect(state.businessTerms.acceptances).toBe(0);
  expect(state.businessTerms.businessDataConfirmations).toBe(0);
  expect(state.accessibility).toEqual({facts:668,verificationLevel:'external_unverified',confirmed:0});
});

test('RT-007 replacement manifest contains exactly 36 unique current targets', async()=>{
  expect(plan.productionMutationPerformed).toBe(false);
  expect(plan.productionApplyAuthorized).toBe(false);
  expect(plan.targets).toHaveLength(36);
  expect(plan.targets.filter(t=>t.published)).toHaveLength(34);
  expect(plan.targets.filter(t=>!t.published)).toHaveLength(2);
  const keys=plan.targets.map(t=>`${t.restaurantId}:${t.field}`);
  expect(new Set(keys).size).toBe(36);
  const counts={}; for(const t of plan.targets) counts[t.wave]=(counts[t.wave]||0)+1;
  expect(counts).toEqual({source_url_wave1:12,signature_wave1:3,signature_wave2:9,location_wave1:4,location_wave2:2,location_wave3:4,location_wave4:2});
  for(const t of plan.targets){
    expect(['source_url','signature_source_url','location_source_url']).toContain(t.field);
    expect(t.currentUrl).toMatch(/^https:\/\//);
    expect(t.proposedUrl).toMatch(/^https:\/\//);
    expect(t.currentUrl).not.toBe(t.proposedUrl);
    if(t.field==='signature_source_url'){
      expect(t.proposedCopy?.title?.length).toBeGreaterThan(5);
      expect(t.proposedCopy?.text?.length).toBeGreaterThan(30);
      expect(t.proposedCopy?.tags?.length).toBeGreaterThan(0);
    }else expect(t.proposedCopy).toBeUndefined();
  }
});

test('RT-007 projected improvement is separated between active dataset and archive', async()=>{
  expect(plan.projectedHardRefs).toEqual({before:{all:329,published:324,unpublished:5},after:{all:293,published:290,unpublished:3}});
  expect(plan.rightsAfterReplacement).toBe('AMBER_FIRST_PARTY_FACTUAL_REFERENCE_NOT_TRANSFER_CLEAR');
  expect(plan.businessTermsStillRequired).toBe(true);
  expect(state.preparedReplacementProgram.transferClearReferencesCreated).toBe(0);
  expect(state.claimBoundaries.amberMeansTransferClear).toBe(false);
  expect(state.claimBoundaries.provenanceRefsTransferableMeansWholeProfileClean).toBe(false);
});

test('Buyer-safe export remains SELECT-only and does not expose personal/user-event domain', async()=>{
  const executable=exportSql.split(/\r?\n/).filter(line=>!line.trimStart().startsWith('--')).join('\n');
  expect(executable).not.toMatch(/\b(update|insert|delete|alter|create|drop|truncate)\b/i);
  expect(exportSql).toContain('false as personal_or_user_event_data_included');
  expect(exportSql).toContain("'RT-008'::text as privacy_gate");
  expect(exportSql).toContain('AMBER is conditional and is not transfer-clear by default');
});

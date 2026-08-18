import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const snapshotPath=path.join(root,'supabase/release/rt001-rt002-current-state-2026-08-19.json');
const docPath=path.join(root,'docs/investor-ready/rt001-rt002-current-state-reconciliation.md');
const fail=message=>{throw new Error(`RT-001/002 current-state reconciliation failed: ${message}`)};

for(const file of [snapshotPath,docPath]){
  if(!fs.existsSync(file)||fs.statSync(file).size<500)fail(`missing/small artifact: ${path.relative(root,file)}`);
}
const s=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
const doc=fs.readFileSync(docPath,'utf8');

if(s.schemaVersion!=='1.0.0')fail('unexpected snapshot schema');
if(s.project.inspectionMode!=='read_only')fail('snapshot must be read-only');
if(s.migrationState.registeredCount!==95)fail(`expected 95-migration snapshot, got ${s.migrationState.registeredCount}`);
if(s.migrationState.latest.version!=='20260818210527')fail('latest migration baseline drifted');
if(s.migrationState.oldPr103MigrationSnapshotSuperseded!==true)fail('old PR #103 migration snapshot must be marked superseded');

for(const [key,expected] of Object.entries({
  restaurantAccessibility:true,
  accessibilityFeatureRegistry:true,
  restaurantAccessibilityFacts:true,
  restaurantFamilyFeatures:false,
  sourceRightsRegistry:true,
  businessTermsVersions:true,
  privacyNoticeVersions:true
})){
  if(s.schemaState[key]!==expected)fail(`schema-state mismatch ${key}`);
}
if(s.schemaState.accessibilityCounts.legacyRows!==166||s.schemaState.accessibilityCounts.registryFeatures!==24||s.schemaState.accessibilityCounts.canonicalFacts!==668){
  fail('accessibility current-state counts drifted from captured snapshot');
}

if(s.analyticsState.logAnalyticsEvent.anonExecute!==false||s.analyticsState.logAnalyticsEvent.authenticatedExecute!==false){
  fail('captured analytics privacy gate must keep anon/authenticated EXECUTE revoked');
}
if(s.analyticsState.evidenceTrustColumn!==false)fail('evidence_trust must remain recorded as not-yet-live at snapshot');
if(s.oldPr103Hardening.directApplyStatus!=='BLOCKED_RECOMPOSE_REQUIRED')fail('historical PR #103 direct apply must remain blocked');
if(s.oldPr103Hardening.gitBlob!=='aaa76eb3211933a4306d9668136d41e5c0ca1d72')fail('historical #103 hardening blob reference drifted');

if(s.securityAdvisor.warningCount!==7||s.securityAdvisor.functions.length!==7)fail('expected seven current SECURITY DEFINER advisor warnings');
if(new Set(s.securityAdvisor.functions).size!==7)fail('advisor function list contains duplicates');
if(s.outreachState.salesPipelineRows!==168||s.outreachState.sendLockTrueRows!==168||s.outreachState.allLocked!==true)fail('contact/outreach lock snapshot drifted');

if(s.boundaries.productionMutationPerformed!==false||s.boundaries.oldPr103ScriptSafeToApplyUnchanged!==false||s.boundaries.analyticsReactivationAuthorized!==false||s.boundaries.outreachAuthorized!==false){
  fail('safety boundary drifted');
}

for(const phrase of [
  '95 registered migrations',
  'PR #103 must not be applied unchanged.',
  'BLOCKED_RECOMPOSE_REQUIRED',
  'preserve analytics RPC revocation',
  'No blind `db push` is permitted.',
  'performs no Production DDL/DML'
]){
  if(!doc.includes(phrase))fail(`decision document lost guardrail: ${phrase}`);
}

console.log(JSON.stringify({
  ok:true,
  migrationCount:s.migrationState.registeredCount,
  latestMigration:s.migrationState.latest.version,
  securityAdvisorWarnings:s.securityAdvisor.warningCount,
  analyticsAnonExecute:s.analyticsState.logAnalyticsEvent.anonExecute,
  analyticsAuthenticatedExecute:s.analyticsState.logAnalyticsEvent.authenticatedExecute,
  oldPr103DirectApply:s.oldPr103Hardening.directApplyStatus,
  productionMutationPerformed:false
},null,2));

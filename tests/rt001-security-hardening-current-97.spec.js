const { test, expect } = require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sql=fs.readFileSync(path.join(root,'supabase/release/rt001-security-hardening-current-97.sql'),'utf8');
const control=JSON.parse(fs.readFileSync(path.join(root,'supabase/release/rt001-security-hardening-current-97.json'),'utf8'));
const executable=sql.split(/\r?\n/).filter(line=>!line.trimStart().startsWith('--')).join('\n');

test('RT-001 v3 pins the actual 97-migration Production baseline', async()=>{
  expect(control.status).toBe('CANDIDATE_NOT_APPLIED');
  expect(control.selectedIntegrationHead).toBe('cceb87e757fe9ec95e61cc8be734ed978c927c63');
  expect(control.productionReadOnlySnapshot.registeredMigrations).toBe(97);
  expect(control.productionReadOnlySnapshot.latestMigration).toBe('20260819031220');
  expect(control.productionReadOnlySnapshot.recentMigrations).toEqual([
    {version:'20260819014248',name:'add_private_dd_transferability_exports'},
    {version:'20260819031220',name:'rt008_private_dsar_retention_controls'}
  ]);
  expect(executable).toContain('expected 97 migrations/latest 20260819031220');
  expect(executable).toContain('add_private_dd_transferability_exports');
  expect(executable).toContain('rt008_private_dsar_retention_controls');
});

test('RT-001 v3 remains body-preserving and privacy fail-closed', async()=>{
  expect(control.design.functionBodyRewrite).toBe(false);
  expect(control.design.targetCount).toBe(10);
  expect(control.design.analyticsReactivation).toBe(false);
  expect(control.design.productionMutationPerformed).toBe(false);
  expect(control.closeRules.productionApplyAuthorized).toBe(false);
  expect(control.closeRules.privacyGateMayBeWeakened).toBe(false);
  expect(executable).not.toMatch(/create\s+or\s+replace\s+function/i);
  expect((executable.match(/alter function /gi)||[])).toHaveLength(10);
  expect((executable.match(/set search_path to pg_catalog, public, pg_temp;/gi)||[])).toHaveLength(10);
  expect(executable).toMatch(/revoke all on function public\.log_analytics_event\(text,bigint,uuid,uuid,jsonb\) from PUBLIC,anon,authenticated;/i);
  expect(executable).not.toMatch(/grant execute on function public\.log_analytics_event/i);
});

test('RT-001 v3 pins all ten unchanged function definitions', async()=>{
  const hashes=Object.values(control.baselineDefinitionMd5);
  expect(hashes).toHaveLength(10);
  expect(new Set(hashes).size).toBe(10);
  for(const hash of hashes){expect(hash).toMatch(/^[0-9a-f]{32}$/);expect(executable).toContain(hash)}
  expect(executable).toContain("has_schema_privilege(r.role_name,n.oid,'CREATE')");
  expect(executable).toContain('md5(p.prosrc) body_md5');
});

test('RT-001 v3 cannot claim closure before isolated execution evidence', async()=>{
  expect(control.requiredIsolatedEvidence.candidateSqlExecution).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.readOnlyAudit).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.authorizationIdorNegativeTests).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.securityAdvisorAfter).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.analyticsExecuteRevocationAfter).toBe('NOT_RUN');
  expect(control.closeRules.rt001Closed).toBe(false);
});

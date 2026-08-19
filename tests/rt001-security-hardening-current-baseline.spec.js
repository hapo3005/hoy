const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sqlPath = path.join(root, 'supabase', 'release', 'rt001-security-hardening-current-baseline.sql');
const auditPath = path.join(root, 'supabase', 'release', 'rt001-security-hardening-current-baseline-audit.sql');
const controlPath = path.join(root, 'supabase', 'release', 'rt001-security-hardening-current-baseline.json');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('RT-001 current-baseline hardening is body-preserving and privacy fail-closed', async () => {
  const sql = read(sqlPath);
  const control = JSON.parse(read(controlPath));

  expect(control.schemaVersion).toBe('1.0.1');
  expect(control.status).toBe('CANDIDATE_NOT_APPLIED');
  expect(control.base.pr).toBe(124);
  expect(control.base.headSha).toBe('4a405dda51e7cb82a0ecc2e1e992c6e00e6580d6');
  expect(control.base.registeredMigrations).toBe(95);
  expect(control.base.latestMigration).toBe('20260818210527');
  expect(control.design.functionBodyRewrite).toBe(false);
  expect(control.design.analyticsReactivation).toBe(false);
  expect(control.design.productionMutationPerformed).toBe(false);
  expect(control.design.searchPath).toBe('pg_catalog, public, pg_temp');
  expect(control.closeRules.rt001Closed).toBe(false);
  expect(control.closeRules.productionApplyAuthorized).toBe(false);
  expect(control.closeRules.privacyGateMayBeWeakened).toBe(false);

  expect(sql).not.toMatch(/create\s+or\s+replace\s+function/i);
  expect((sql.match(/alter function /gi) || [])).toHaveLength(10);
  expect((sql.match(/set search_path to pg_catalog, public, pg_temp;/gi) || [])).toHaveLength(10);
  expect(sql).not.toMatch(/set search_path to pg_catalog, public;/i);
  expect(sql).toContain("expected 95 migrations/latest 20260818210527");
  expect(sql).toContain("analytics EXECUTE is no longer fully revoked");
  expect(sql).toContain("analytics privacy revocation was weakened");

  expect(sql).toMatch(/revoke all on function public\.log_analytics_event\(text,bigint,uuid,uuid,jsonb\)[\s\S]*?from PUBLIC, anon, authenticated;/i);
  expect(sql).not.toMatch(/grant execute on function public\.log_analytics_event/i);
});

test('RT-001 hardening pins all ten verified function definitions before changing config', async () => {
  const sql = read(sqlPath);
  const control = JSON.parse(read(controlPath));
  const md5s = Object.values(control.baselineDefinitionMd5);

  expect(Object.keys(control.baselineDefinitionMd5)).toHaveLength(10);
  expect(new Set(md5s).size).toBe(10);
  for (const md5 of md5s) {
    expect(md5).toMatch(/^[0-9a-f]{32}$/);
    expect(sql).toContain(md5);
  }

  expect(sql).toContain("has_schema_privilege(r.role_name, n.oid, 'CREATE')");
  expect(sql).toContain('md5(p.prosrc) as body_md5');
  expect(sql).toContain("cfg='search_path=pg_catalog, public, pg_temp'");
  expect(sql).toContain('pg_temp is explicitly listed LAST');
});

test('RT-001 isolated-evidence requirements remain open until actually executed', async () => {
  const audit = read(auditPath);
  const control = JSON.parse(read(controlPath));

  expect(control.requiredIsolatedEvidence.candidateSqlExecution).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.readOnlyAudit).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.authorizationIdorNegativeTests).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.securityAdvisorAfter).toBe('NOT_RUN');
  expect(control.requiredIsolatedEvidence.analyticsExecuteRevocationAfter).toBe('NOT_RUN');

  expect(audit).toContain("has_schema_privilege('authenticated',n.oid,'CREATE')");
  expect(audit).toContain("public.log_analytics_event(text,bigint,uuid,uuid,jsonb)");
  expect(audit).toContain('authorization/IDOR negative-test evidence');
});

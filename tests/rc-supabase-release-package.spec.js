const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'supabase', 'release', 'rc1-manifest.json');
const runbookPath = path.join(root, 'docs', 'RC1_SUPABASE_RELEASE_RUNBOOK.md');
const ir02cReconciliationPath = path.join(root, 'data', 'ir-02c-live-reconciliation-2026-08-19.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function loadIr02cReconciliation() {
  return JSON.parse(fs.readFileSync(ir02cReconciliationPath, 'utf8'));
}

test('RC1 Supabase manifest is fail-closed for production deployment', async () => {
  const m = loadManifest();

  expect(m.status).toBe('PREPARED_NOT_DEPLOYED');
  expect(m.target.project_ref).toBe('zlscptisdxzxuvllogza');

  // Schema-v1 calls this source.main_sha, but it is the package-generation
  // application baseline, not a self-referential requirement that the Git ref
  // containing the manifest itself must equal this SHA forever.
  expect(m.source.main_sha).toBe('888b525eff280e7c6ed9eaa98ab9807a56cb21e1');
  expect(m.source.main_sha).toBe(m.source.accessible_integration_commit);

  expect(m.source.accessible_code_integrated).toBe(true);
  expect(m.source.accessible_database_applied).toBe(false);
  expect(m.release_policy.production_mutations_during_preparation).toBe(false);
  expect(m.release_policy.blind_db_push_include_all_allowed).toBe(false);
  expect(m.release_policy.auto_apply_seeds_to_production).toBe(false);
  expect(m.release_policy.auto_redeploy_edge_functions).toBe(false);
  expect(m.release_policy.outreach_send_lock_must_remain_true).toBe(true);
  expect(m.seeds.production_auto_apply).toBe(false);
});

test('RC1 snapshot semantics are non-self-referential and require final scope refresh', async () => {
  const m = loadManifest();
  const runbook = fs.readFileSync(runbookPath, 'utf8');

  expect(runbook).toContain('Snapshot semantics — important');
  expect(runbook).toContain('must **not** be interpreted as a requirement that the repository\'s current `main` ref forever equals that SHA');
  expect(runbook).toContain('regenerate/verify the manifest against the current Production baseline and the frozen RC scope');
  expect(runbook).toContain('do **not** require an embedded file to equal the commit that contains that same file');

  // The manifest still has to fail closed when release-relevant scope changes.
  expect(m.release_order[0]).toMatch(/regenerate this manifest/i);
  expect(m.release_policy.migration_success_requires_no_new_advisor_regressions).toBe(true);
});

test('every repo migration is classified by the historical RC1 manifest or exact applied IR-02C reconciliation', async () => {
  const m = loadManifest();
  const ir02c = loadIr02cReconciliation();
  const migrationDir = path.join(root, 'supabase', 'migrations');
  const repoPaths = fs.readdirSync(migrationDir)
    .filter(name => name.endsWith('.sql'))
    .map(name => `supabase/migrations/${name}`)
    .sort();
  const manifestPaths = m.migrations.map(x => x.repo_path);
  const restoredAppliedPaths = ir02c.migrationHistory.map(x => {
    expect(x.applied).toBe(true);
    expect(x.repoBlob).toMatch(/^[0-9a-f]{40}$/);
    const match = fs.readdirSync(migrationDir).find(name => name.startsWith(`${x.version}_`) && name.endsWith('.sql'));
    expect(match, `restored applied migration ${x.version} must exist exactly once in repo`).toBeTruthy();
    return `supabase/migrations/${match}`;
  });
  const classifiedPaths = [...new Set([...manifestPaths, ...restoredAppliedPaths])].sort();

  // Do not rewrite the historical RC1 snapshot merely because later already-live
  // migration source files were restored into Git. The separate read-only
  // reconciliation is allowed to extend classification only for its exact five
  // applied, blob-pinned IR-02C migration versions.
  expect(ir02c.inspectionMode).toBe('read_only');
  expect(restoredAppliedPaths).toHaveLength(5);
  expect(classifiedPaths).toEqual(repoPaths);
});

test('RC1 database delta is exactly the curated HOY Accessible migration', async () => {
  const m = loadManifest();
  const pending = m.migrations.filter(x => x.status === 'PENDING_PRODUCTION_DB_GATE');

  expect(pending).toHaveLength(1);
  expect(pending[0]).toMatchObject({
    repo_path: 'supabase/migrations/20260818093100_hoy_accessible_v1.sql',
    source: 'MAIN_PR_89',
    apply_order: 1,
  });
  expect(fs.existsSync(path.join(root, pending[0].repo_path))).toBe(true);
  expect(pending[0].expected_after_initial_apply).toMatchObject({
    feature_registry_rows: 24,
    facts_total: 668,
    facts_yes: 300,
    facts_no: 11,
    facts_unknown: 357,
    facts_external_unverified: 668,
    sync_function_security: 'INVOKER',
  });
});

test('historical mirrors and rolled-back Family schema cannot enter RC1 pending set', async () => {
  const m = loadManifest();
  const byPath = new Map(m.migrations.map(x => [x.repo_path, x]));

  expect(byPath.get('supabase/migrations/20260815084500_public_event_provenance_select.sql').status)
    .toBe('LIVE_EQUIVALENT_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260818090000_hoy_245_analytics_contract.sql').status)
    .toBe('LIVE_EQUIVALENT_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260816_family_playgrounds_240.sql').status)
    .toBe('ROLLED_BACK_BY_DESIGN_DO_NOT_APPLY');

  const forbiddenPending = m.migrations.filter(x =>
    x.status === 'PENDING_PRODUCTION_DB_GATE' &&
    (x.repo_path.includes('family_playgrounds') || x.repo_path.includes('public_event_provenance') || x.repo_path.includes('analytics_contract'))
  );
  expect(forbiddenPending).toEqual([]);
});

test('RC1 never auto-deploys seeds or unrelated Edge Functions', async () => {
  const m = loadManifest();

  expect(m.seeds.paths.length).toBeGreaterThan(0);
  expect(m.edge_functions.current_rc_redeploy_required).toEqual([]);
  expect(m.edge_functions.source_parity_verified).toContain('operator-accessibility-confirm');
  expect(m.edge_functions.production_only_or_not_currently_repo_owned_do_not_touch).toContain('mobility-resolve');
});

test('RC1 safety snapshot locks outreach and expected accessibility transform', async () => {
  const m = loadManifest();

  expect(m.production_snapshot).toMatchObject({
    legacy_accessibility_rows: 166,
    legacy_accessibility_missing_restaurant_id: 0,
    legacy_accessibility_missing_checked_at: 0,
    expected_accessible_initial_facts: 668,
    expected_accessible_yes: 300,
    expected_accessible_no: 11,
    expected_accessible_unknown: 357,
    expected_accessible_external_unverified: 668,
    sales_pipeline_rows: 168,
    sales_pipeline_send_lock_true: 168,
    family_features_table_present: false,
    accessibility_feature_registry_present: false,
    restaurant_accessibility_facts_present: false,
  });
});

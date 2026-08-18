const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'supabase', 'release', 'rc1-manifest.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

test('RC1 Supabase manifest is fail-closed for production deployment', async () => {
  const m = loadManifest();

  expect(m.status).toBe('PREPARED_NOT_DEPLOYED');
  expect(m.target.project_ref).toBe('zlscptisdxzxuvllogza');
  expect(m.source.main_sha).toBe('888b525eff280e7c6ed9eaa98ab9807a56cb21e1');
  expect(m.source.accessible_code_integrated).toBe(true);
  expect(m.source.accessible_database_applied).toBe(false);
  expect(m.release_policy.production_mutations_during_preparation).toBe(false);
  expect(m.release_policy.blind_db_push_include_all_allowed).toBe(false);
  expect(m.release_policy.auto_apply_seeds_to_production).toBe(false);
  expect(m.release_policy.auto_redeploy_edge_functions).toBe(false);
  expect(m.release_policy.outreach_send_lock_must_remain_true).toBe(true);
  expect(m.seeds.production_auto_apply).toBe(false);
});

test('RC1 manifest classifies every migration file currently in main', async () => {
  const m = loadManifest();
  const migrationDir = path.join(root, 'supabase', 'migrations');
  const repoPaths = fs.readdirSync(migrationDir)
    .filter(name => name.endsWith('.sql'))
    .map(name => `supabase/migrations/${name}`)
    .sort();
  const manifestPaths = m.migrations.map(x => x.repo_path).sort();

  expect(manifestPaths).toEqual(repoPaths);
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

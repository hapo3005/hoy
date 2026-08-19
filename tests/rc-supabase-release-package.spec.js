const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'supabase', 'release', 'rc1-manifest.json');
const runbookPath = path.join(root, 'docs', 'RC1_SUPABASE_RELEASE_RUNBOOK.md');

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

test('RC1 Supabase manifest remains fail-closed after current Production reconciliation', async () => {
  const m = loadManifest();

  expect(m.status).toBe('PREPARED_NOT_DEPLOYED');
  expect(m.snapshot_date).toBe('2026-08-19');
  expect(m.target.project_ref).toBe('zlscptisdxzxuvllogza');
  expect(m.source.main_sha).toBe('96b8083aba9a226194ed13f133ec77c6bddf1e32');
  expect(m.source.accessible_integration_commit).toBe('888b525eff280e7c6ed9eaa98ab9807a56cb21e1');
  expect(m.source.accessible_code_integrated).toBe(true);
  expect(m.source.accessible_database_applied).toBe(true);

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
  expect(m.release_order[0]).toMatch(/regenerate this manifest/i);
  expect(m.release_policy.migration_success_requires_no_new_advisor_regressions).toBe(true);
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

test('current Production reconciliation leaves no unreviewed pending database delta', async () => {
  const m = loadManifest();
  const pending = m.migrations.filter(x => x.status === 'PENDING_PRODUCTION_DB_GATE');
  const byPath = new Map(m.migrations.map(x => [x.repo_path, x]));

  expect(pending).toEqual([]);
  expect(byPath.get('supabase/migrations/20260818093100_hoy_accessible_v1.sql').status)
    .toBe('LIVE_STATE_CONFIRMED_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260816_family_playgrounds_240.sql').status)
    .toBe('LIVE_STATE_CONFIRMED_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260819104500_menu_translation_human_verification_v1.sql').status)
    .toBe('LIVE_STATE_CONFIRMED_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260819110000_menu_translation_human_verification_rpc_hardening_v1.sql').status)
    .toBe('LIVE_STATE_CONFIRMED_DO_NOT_APPLY');
});

test('historical mirrors stay do-not-apply while Family is now explicitly live', async () => {
  const m = loadManifest();
  const byPath = new Map(m.migrations.map(x => [x.repo_path, x]));

  expect(byPath.get('supabase/migrations/20260815084500_public_event_provenance_select.sql').status)
    .toBe('LIVE_EQUIVALENT_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260818090000_hoy_245_analytics_contract.sql').status)
    .toBe('LIVE_EQUIVALENT_DO_NOT_APPLY');
  expect(byPath.get('supabase/migrations/20260816_family_playgrounds_240.sql').production_evidence.join(' '))
    .toContain('17 verified Family rows');

  const forbiddenPending = m.migrations.filter(x =>
    x.status === 'PENDING_PRODUCTION_DB_GATE' &&
    (x.repo_path.includes('family_playgrounds') || x.repo_path.includes('public_event_provenance') || x.repo_path.includes('analytics_contract'))
  );
  expect(forbiddenPending).toEqual([]);
});

test('RC1 never converts the authorized Family import into generic auto-seeding', async () => {
  const m = loadManifest();

  expect(m.seeds.production_auto_apply).toBe(false);
  expect(m.seeds.paths.length).toBeGreaterThan(0);
  expect(m.seeds.manual_production_actions).toContainEqual(expect.objectContaining({
    date: '2026-08-19',
    scope: 'HOY Family activation',
    staging_profiles: 18,
    staging_published: 0,
    family_rows: 17,
    family_rows_publicly_visible: 4,
    family_rows_on_unpublished_drafts: 13,
  }));
  expect(m.edge_functions.current_rc_redeploy_required).toEqual([]);
  expect(m.edge_functions.source_parity_verified).toContain('operator-accessibility-confirm');
  expect(m.edge_functions.production_only_or_not_currently_repo_owned_do_not_touch).toContain('mobility-resolve');
});

test('RC1 current Production snapshot records Family, Accessible and review-layer truth', async () => {
  const m = loadManifest();

  expect(m.production_snapshot).toMatchObject({
    legacy_accessibility_rows: 166,
    legacy_accessibility_missing_restaurant_id: 0,
    legacy_accessibility_missing_checked_at: 0,
    accessibility_feature_registry_present: true,
    accessibility_feature_registry_rows: 24,
    restaurant_accessibility_facts_present: true,
    accessibility_facts_total: 668,
    accessibility_facts_yes: 300,
    accessibility_facts_no: 11,
    accessibility_facts_unknown: 357,
    accessibility_facts_external_unverified: 668,
    venue_sales_pipeline_rows: 168,
    venue_sales_pipeline_send_lock_true: 168,
    family_features_table_present: true,
    family_features_rows: 17,
    family_published_rows: 4,
    family_draft_rows: 13,
    menu_translation_reviews_present: true,
    menu_translation_review_rows: 0,
    restaurants_total: 187,
    restaurants_published: 166,
  });
});
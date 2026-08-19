import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const migration = read('supabase/migrations/20260819104500_menu_translation_human_verification_v1.sql');
const admin = read('admin-menu-translation-review-2.49.js');
const operator = read('operator-menu-translation-review-2.49.js');
const adminHtml = read('admin.html');
const indexHtml = read('index.html');

function requireText(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`missing ${label}: ${needle}`);
}

function forbidText(haystack, needle, label) {
  if (haystack.includes(needle)) throw new Error(`forbidden ${label}: ${needle}`);
}

for (const [needle, label] of [
  ['private.menu_translation_reviews', 'private audit table'],
  ["reviewer_kind in ('hoy_editor','restaurant_operator')", 'reviewer separation'],
  ["if v_t.translation_status<>'machine' then raise exception 'machine_translation_required'", 'machine-only transition'],
  ["raise exception 'stale_translation'", 'optimistic lock'],
  ['rm.verified_at is not null', 'verified membership gate'],
  ['e.operator_verified=true', 'verified operator entitlement gate'],
  ["translation_status='curated'", 'admin curated transition'],
  ["translation_status='operator_confirmed'", 'operator confirmed transition'],
  ["'confirmation_scope','translation_factual_only'", 'factual-only evidence'],
  ["'rights_effect','none'", 'no rights implication'],
  ['revoke all on private.menu_translation_reviews from public, anon, authenticated', 'audit privacy'],
  ['revoke all on function public.operator_review_menu_translation', 'operator RPC anon revoke'],
  ['revoke all on function public.admin_review_menu_translation', 'admin RPC anon revoke'],
]) requireText(migration, needle, label);

requireText(admin, "sb.rpc('admin_review_menu_translation'", 'admin review RPC');
requireText(admin, 'Bitte tatsächlich lesen – kein Bulk-Freigeben.', 'admin no-bulk UX');
requireText(admin, 'Keine Rechte-/Lizenz-/Business-Terms-Freigabe.', 'admin rights boundary');
forbidText(admin, "operator_review_menu_translation", 'admin operator-confirmed path');

requireText(operator, "sb.rpc('operator_review_menu_translation'", 'operator review RPC');
requireText(operator, 'Keine Sammelfreigabe', 'operator no-bulk UX');
requireText(operator, 'Keine Rechte-, Lizenz- oder Vertragsfreigabe.', 'operator rights boundary');
forbidText(operator, "admin_review_menu_translation", 'operator curated path');

for (const asset of ['admin-menu-translation-review-2.49.css', 'admin-menu-translation-review-2.49.js']) {
  requireText(adminHtml, asset, `admin asset ${asset}`);
}
for (const asset of ['operator-menu-translation-review-2.49.css', 'operator-menu-translation-review-2.49.js']) {
  requireText(indexHtml, asset, `operator asset ${asset}`);
}

console.log('menu translation human-review contract: GREEN');

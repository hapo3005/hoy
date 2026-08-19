import fs from 'node:fs';
import path from 'node:path';

const manifestPath = 'docs/investor-ready/rt007-prepared-replacements-v2.json';
const rollbackPath = 'docs/investor-ready/rt007-rollback-before-state-2026-08-19.json';
const contractPath = 'docs/investor-ready/rt007-apply-rollback-candidate-v1.json';
const outDir = process.argv[2] || '.rt007-generated';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const rollback = JSON.parse(fs.readFileSync(rollbackPath, 'utf8'));
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

function fail(message) {
  throw new Error(`RT-007 MATERIALIZER FAIL: ${message}`);
}
function ok(value, message) {
  if (!value) fail(message);
}
function q(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}
function arr(values) {
  ok(Array.isArray(values), 'text array expected');
  return `ARRAY[${values.map(q).join(', ')}]::text[]`;
}
function bool(value) {
  return value ? 'TRUE' : 'FALSE';
}
function date(value) {
  return value == null ? 'NULL' : `DATE ${q(value)}`;
}
function cmp(column, value, kind = 'text') {
  const rhs = kind === 'array' ? arr(value) : kind === 'date' ? date(value) : q(value);
  return `${column} IS NOT DISTINCT FROM ${rhs}`;
}
function marker(target) {
  return `restaurant=${target.restaurantId} field=${target.field} wave=${target.wave}`;
}

ok(contract.role === 'G1-CB-14_EXACT_GUARDED_APPLY_ROLLBACK_CANDIDATE', 'wrong contract role');
ok(contract.executionSafety?.productionMutationPerformed === false, 'mutation flag must remain false');
ok(contract.executionSafety?.productionApplyAuthorized === false, 'apply must remain unauthorized');
ok(contract.executionSafety?.rollbackExecutionAuthorized === false, 'rollback must remain unauthorized');
ok(manifest.productionMutationPerformed === false, 'manifest mutation flag changed');
ok(manifest.productionApplyAuthorized === false, 'manifest apply authorization changed');
ok(Array.isArray(manifest.targets) && manifest.targets.length === 36, '36 targets required');
ok(rollback.sourceManifest?.gitBlobSha === contract.sourceManifest?.gitBlobSha, 'manifest blob pin mismatch');
ok(rollback.sourceManifest?.exactProductionMatchAtCapture === 36, '36 exact matches required');
ok(rollback.sourceManifest?.driftAtCapture === 0, 'captured drift must be zero');
ok(Array.isArray(rollback.signatureBeforeState) && rollback.signatureBeforeState.length === 12, '12 signature before states required');

const allowedFields = new Set(['source_url', 'location_source_url', 'signature_source_url']);
const signatureBefore = new Map(rollback.signatureBeforeState.map((row) => [Number(row.restaurantId), row]));
const waveOrder = [
  'source_url_wave1',
  'signature_wave1',
  'signature_wave2',
  'location_wave1',
  'location_wave2',
  'location_wave3',
  'location_wave4'
];
const expectedCounts = new Map([
  ['source_url_wave1', 12],
  ['signature_wave1', 3],
  ['signature_wave2', 9],
  ['location_wave1', 4],
  ['location_wave2', 2],
  ['location_wave3', 4],
  ['location_wave4', 2]
]);

for (const target of manifest.targets) {
  ok(allowedFields.has(target.field), `unapproved field ${target.field}`);
  ok(typeof target.restaurantId === 'number', 'numeric restaurant id required');
  ok(typeof target.currentUrl === 'string' && target.currentUrl.length > 0, `current URL missing for ${target.restaurantId}`);
  ok(typeof target.proposedUrl === 'string' && target.proposedUrl.length > 0, `proposed URL missing for ${target.restaurantId}`);
  if (target.field === 'signature_source_url') {
    ok(target.proposedCopy && typeof target.proposedCopy.title === 'string', `signature title missing for ${target.restaurantId}`);
    ok(typeof target.proposedCopy.text === 'string', `signature text missing for ${target.restaurantId}`);
    ok(Array.isArray(target.proposedCopy.tags), `signature tags missing for ${target.restaurantId}`);
    const before = signatureBefore.get(target.restaurantId);
    ok(before, `signature before-state missing for ${target.restaurantId}`);
    ok(before.signature_source_url === target.currentUrl, `signature before URL drift for ${target.restaurantId}`);
  }
}

const grouped = new Map(waveOrder.map((wave) => [wave, []]));
for (const target of manifest.targets) {
  ok(grouped.has(target.wave), `unknown wave ${target.wave}`);
  grouped.get(target.wave).push(target);
}
for (const [wave, count] of expectedCounts) ok(grouped.get(wave).length === count, `wrong target count for ${wave}`);

const FIRST_PARTY_LABEL = contract.signatureApplyPolicy.sourceLabelAfter;
const CHECKED_AT = contract.signatureApplyPolicy.checkedAtAfter;

function authGuard(mode) {
  const key = mode === 'apply' ? 'hoy.rt007_apply_authorized' : 'hoy.rt007_rollback_authorized';
  const expected = mode === 'apply' ? 'EXPLICIT_REVIEWED_APPLY' : 'EXPLICIT_REVIEWED_ROLLBACK';
  return [
    `  IF current_setting(${q(key)}, true) IS DISTINCT FROM ${q(expected)} THEN`,
    `    RAISE EXCEPTION 'RT007_${mode.toUpperCase()}_NOT_AUTHORIZED';`,
    '  END IF;',
    `  IF current_setting('hoy.rt007_preflight_rechecked', true) IS DISTINCT FROM 'EXACT_36_0_DRIFT' THEN`,
    `    RAISE EXCEPTION 'RT007_FRESH_PREFLIGHT_REQUIRED';`,
    '  END IF;'
  ].join('\n');
}

function exactBeforeWhere(target) {
  const clauses = [
    `id = ${target.restaurantId}`,
    `is_published IS ${bool(target.published)}`,
    cmp(target.field, target.currentUrl)
  ];
  if (target.field === 'signature_source_url') {
    const before = signatureBefore.get(target.restaurantId);
    clauses.push(cmp('signature_title', before.signature_title));
    clauses.push(cmp('signature_text', before.signature_text));
    clauses.push(cmp('signature_tags', before.signature_tags, 'array'));
    clauses.push(cmp('signature_status', before.signature_status));
    clauses.push(cmp('signature_source_label', before.signature_source_label));
    clauses.push(cmp('signature_checked_at', before.signature_checked_at, 'date'));
    clauses.push(cmp('signature_confidence', before.signature_confidence));
  }
  return clauses.map((line) => `      AND ${line}`).join('\n').replace('      AND id', '      id');
}

function exactAfterWhere(target) {
  const clauses = [
    `id = ${target.restaurantId}`,
    `is_published IS ${bool(target.published)}`,
    cmp(target.field, target.proposedUrl)
  ];
  if (target.field === 'signature_source_url') {
    const before = signatureBefore.get(target.restaurantId);
    clauses.push(cmp('signature_title', target.proposedCopy.title));
    clauses.push(cmp('signature_text', target.proposedCopy.text));
    clauses.push(cmp('signature_tags', target.proposedCopy.tags, 'array'));
    clauses.push(cmp('signature_status', before.signature_status));
    clauses.push(cmp('signature_source_label', FIRST_PARTY_LABEL));
    clauses.push(cmp('signature_checked_at', CHECKED_AT, 'date'));
    clauses.push(cmp('signature_confidence', before.signature_confidence));
  }
  return clauses.map((line) => `      AND ${line}`).join('\n').replace('      AND id', '      id');
}

function applySet(target) {
  if (target.field !== 'signature_source_url') return `${target.field} = ${q(target.proposedUrl)}`;
  return [
    `signature_source_url = ${q(target.proposedUrl)}`,
    `signature_title = ${q(target.proposedCopy.title)}`,
    `signature_text = ${q(target.proposedCopy.text)}`,
    `signature_tags = ${arr(target.proposedCopy.tags)}`,
    `signature_source_label = ${q(FIRST_PARTY_LABEL)}`,
    `signature_checked_at = ${date(CHECKED_AT)}`
  ].join(',\n        ');
}

function rollbackSet(target) {
  if (target.field !== 'signature_source_url') return `${target.field} = ${q(target.currentUrl)}`;
  const before = signatureBefore.get(target.restaurantId);
  return [
    `signature_source_url = ${q(before.signature_source_url)}`,
    `signature_title = ${q(before.signature_title)}`,
    `signature_text = ${q(before.signature_text)}`,
    `signature_tags = ${arr(before.signature_tags)}`,
    `signature_status = ${q(before.signature_status)}`,
    `signature_source_label = ${q(before.signature_source_label)}`,
    `signature_checked_at = ${date(before.signature_checked_at)}`,
    `signature_confidence = ${q(before.signature_confidence)}`
  ].join(',\n        ');
}

function targetBlock(target, mode) {
  const setClause = mode === 'apply' ? applySet(target) : rollbackSet(target);
  const whereClause = mode === 'apply' ? exactBeforeWhere(target) : exactAfterWhere(target);
  return `-- ${marker(target)}\nDO $rt007$\nDECLARE\n  v_affected integer;\nBEGIN\n${authGuard(mode)}\n  UPDATE public.restaurants\n     SET ${setClause}\n   WHERE ${whereClause};\n  GET DIAGNOSTICS v_affected = ROW_COUNT;\n  IF v_affected <> 1 THEN\n    RAISE EXCEPTION 'RT007_${mode.toUpperCase()}_ROWCOUNT ${marker(target)} expected=1 got=%', v_affected;\n  END IF;\nEND\n$rt007$;`;
}

function document(mode) {
  const header = [
    '-- HOY RT-007 36-target exact-guarded candidate',
    `-- mode=${mode}`,
    '-- GENERATED. REVIEWABLE CANDIDATE ONLY. NOT EXECUTED BY CI.',
    '-- Requires explicit reviewed mode authorization AND fresh 36/36 zero-drift preflight session gate.',
    '-- Business Terms remain required; these replacements do not create transfer or whole-profile clearance.',
    ''
  ].join('\n');
  const chunks = [header];
  for (const wave of waveOrder) {
    chunks.push(`-- BEGIN WAVE ${wave} count=${grouped.get(wave).length}`);
    chunks.push('BEGIN;');
    for (const target of grouped.get(wave)) chunks.push(targetBlock(target, mode));
    chunks.push('COMMIT;');
    chunks.push(`-- END WAVE ${wave}`);
    chunks.push('');
  }
  return chunks.join('\n');
}

fs.mkdirSync(outDir, { recursive: true });
const apply = document('apply');
const rollbackSql = document('rollback');
fs.writeFileSync(path.join(outDir, contract.generatedArtifacts.apply), apply);
fs.writeFileSync(path.join(outDir, contract.generatedArtifacts.rollback), rollbackSql);
console.log(`RT-007 candidate materialized: ${manifest.targets.length} targets / ${waveOrder.length} waves`);

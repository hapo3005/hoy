const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const boardPath = path.join(root, 'docs/investor-ready/g1-closing-board-v1.json');
const narrativePath = path.join(root, 'docs/investor-ready/g1-closing-board-v1.md');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
const narrative = fs.readFileSync(narrativePath, 'utf8');

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const classes = new Set(['PROVEN', 'READY_TO_EXECUTE', 'EXTERNAL_REQUIRED', 'BLOCKED']);
const priorities = new Set(['P0', 'P1']);

assert(board.schemaVersion === '1.0.0', 'schemaVersion must remain 1.0.0 for G1 Closing Board v1');
assert(board.snapshotDate === '2026-08-19', 'snapshotDate drifted');
assert(board.baseMainSha === '88bb9e77d50ccb9db96306f5e737e27bad6237ab', 'board must remain pinned to privacy-hardened current main until explicitly refreshed');
assert(board.gate === 'G1_ACQUISITION_CLEAN', 'wrong gate');
assert(board.overallStatus === 'IN_PROGRESS', 'G1 must remain IN_PROGRESS on this snapshot');
assert(Array.isArray(board.controls) && board.controls.length === 25, 'expected exactly 25 scoped closing controls');

const ids = new Set();
const controls = new Map();
for (const c of board.controls || []) {
  assert(/^G1-CB-\d{2}$/.test(c.id || ''), `invalid control id ${c.id}`);
  assert(!ids.has(c.id), `duplicate control id ${c.id}`);
  ids.add(c.id);
  controls.set(c.id, c);
  assert(classes.has(c.closingClass), `${c.id}: invalid closingClass ${c.closingClass}`);
  assert(priorities.has(c.priority), `${c.id}: invalid priority ${c.priority}`);
  assert(typeof c.domain === 'string' && c.domain.length > 0, `${c.id}: domain required`);
  assert(typeof c.control === 'string' && c.control.length > 0, `${c.id}: control required`);
  assert(typeof c.scope === 'string' && c.scope.length > 20, `${c.id}: scoped claim required`);
  assert(typeof c.nextAction === 'string' && c.nextAction.length > 10, `${c.id}: nextAction required`);
  if (c.closingClass === 'PROVEN') assert(Array.isArray(c.evidence) && c.evidence.length > 0, `${c.id}: PROVEN requires evidence`);
  if (c.closingClass === 'READY_TO_EXECUTE') assert(c.productionAuthorized !== true, `${c.id}: READY_TO_EXECUTE cannot authorize Production`);
  if (c.closingClass === 'EXTERNAL_REQUIRED') assert(typeof c.externalRequirement === 'string' && c.externalRequirement.length > 15, `${c.id}: EXTERNAL_REQUIRED needs externalRequirement`);
  if (c.closingClass === 'BLOCKED') assert(Array.isArray(c.blockedBy) && c.blockedBy.length > 0, `${c.id}: BLOCKED needs blockedBy`);
}
for (const c of board.controls || []) {
  for (const dep of c.blockedBy || []) {
    assert(ids.has(dep), `${c.id}: unknown blockedBy ${dep}`);
    assert(dep !== c.id, `${c.id}: self-blocking control`);
  }
}

const requireClass = (id, klass) => {
  assert(controls.has(id), `missing mandatory control ${id}`);
  assert(controls.get(id)?.closingClass === klass, `${id} must remain ${klass} on this snapshot`);
};
requireClass('G1-CB-01', 'PROVEN');
requireClass('G1-CB-04', 'PROVEN');
requireClass('G1-CB-05', 'READY_TO_EXECUTE');
requireClass('G1-CB-06', 'PROVEN');
requireClass('G1-CB-07', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-08', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-09', 'PROVEN');
requireClass('G1-CB-10', 'BLOCKED');
requireClass('G1-CB-11', 'BLOCKED');
requireClass('G1-CB-12', 'PROVEN');
requireClass('G1-CB-13', 'PROVEN');
requireClass('G1-CB-14', 'READY_TO_EXECUTE');
requireClass('G1-CB-16', 'PROVEN');
requireClass('G1-CB-17', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-18', 'PROVEN');
requireClass('G1-CB-19', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-21', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-22', 'PROVEN');
requireClass('G1-CB-23', 'EXTERNAL_REQUIRED');
requireClass('G1-CB-24', 'BLOCKED');
requireClass('G1-CB-25', 'BLOCKED');

const mainBaseline = controls.get('G1-CB-01');
assert((mainBaseline.evidence || []).some(v => v.includes('88bb9e77')), 'current-main baseline must reference merged #128 main SHA');
assert((mainBaseline.evidence || []).some(v => v.includes('PR #128 merged')), 'current-main baseline must record #128 merge');

const privacyRuntime = controls.get('G1-CB-18');
assert((privacyRuntime.evidence || []).some(v => v.includes('PR #128 merged')), 'current-main privacy runtime must record merged PR #128');
assert(privacyRuntime.scope.includes('Current main includes merged PR #128'), 'privacy runtime must be a main-state claim');
assert(!privacyRuntime.scope.includes('PR #120'), 'historical #120 cannot be current-main authority');
const privacyOps = controls.get('G1-CB-19');
assert((privacyOps.evidence || []).some(v => v.includes('PR #127')), 'privacy operating candidate must reference #127');
const publicRuntime = controls.get('G1-CB-20');
assert((publicRuntime.evidence || []).some(v => v.includes('PR #130')), 'public-runtime candidate must reference #130');

const dataRights = controls.get('G1-CB-14');
assert(dataRights.scope.includes('36 rollback-only replacements'), 'RT-007 prepared count must remain 36');
assert(dataRights.scope.includes('34 active'), 'RT-007 active/archive split missing');
assert((dataRights.evidence || []).some(v => v.includes('329 to 293')), 'RT-007 projected impact missing');
assert(dataRights.productionAuthorized === false, 'RT-007 package cannot authorize Production');

const security = controls.get('G1-CB-05');
assert((security.evidence || []).some(v => v.includes('32201248716 GREEN')), 'RT-001 browser GREEN evidence missing');
assert(security.productionAuthorized === false, 'RT-001 cannot authorize Production');
const handoff = controls.get('G1-CB-23');
assert(handoff.scope.includes('no independent non-founder execution has passed'), 'non-founder handoff must remain unproven');
const contactFreeze = controls.get('G1-CB-25');
assert((contactFreeze.blockedBy || []).includes('G1-CB-24'), 'Contact Freeze must be blocked by acquired-state evidence');
assert(/Contact Freeze/i.test(contactFreeze.scope), 'Contact Freeze scope missing');

assert(Array.isArray(board.sequence) && board.sequence.length === 4, 'expected four closing phases');
const phases = board.sequence.map(v => v.phase);
assert(JSON.stringify(phases) === JSON.stringify(['A_INTERNAL_RECONCILIATION','B_EXTERNAL_DECISIONS','C_CONTROLLED_EXECUTION','D_ACQUIRED_STATE_AND_G2_RELEASE']), 'closing phase order drifted');
for (const phase of board.sequence || []) {
  assert(Array.isArray(phase.controls) && phase.controls.length > 0, `${phase.phase}: controls required`);
  for (const id of phase.controls || []) assert(ids.has(id), `${phase.phase}: unknown control ${id}`);
}

assert(typeof board.g1DoneRule === 'string' && board.g1DoneRule.includes('every P0 control'), 'G1 done rule must remain P0 fail-closed');
assert(board.g1DoneRule.includes('acquired-state evidence'), 'G1 done rule must require acquired-state evidence');
assert(Array.isArray(board.noAuthorization) && board.noAuthorization.includes('business/partner/investor outreach'), 'outreach must remain unauthorized');
assert(board.noAuthorization.includes('paid infrastructure creation'), 'paid infrastructure must remain unauthorized');

for (const phrase of ['G1 Acquisition Clean','READY_TO_EXECUTE','EXTERNAL_REQUIRED','BLOCKED','Current-main corrections','Only then','Contact Freeze','does **not** claim']) {
  assert(narrative.includes(phrase), `narrative missing required phrase: ${phrase}`);
}

// Class totals are snapshot observability, not immutable business rules.
// Controls are allowed to progress between classes when their individually pinned evidence rules are satisfied.
const summary = { PROVEN: 0, READY_TO_EXECUTE: 0, EXTERNAL_REQUIRED: 0, BLOCKED: 0 };
for (const c of board.controls || []) summary[c.closingClass] += 1;
assert(Object.values(summary).reduce((sum, n) => sum + n, 0) === board.controls.length, 'closing class totals must reconcile to all controls');
for (const klass of classes) assert(summary[klass] > 0, `closing board lost required class ${klass}`);

console.log(JSON.stringify({ gate: board.gate, baseMainSha: board.baseMainSha, controls: board.controls.length, classes: summary, overallStatus: board.overallStatus, status: errors.length ? 'FAIL' : 'PASS_FAIL_CLOSED' }, null, 2));
if (errors.length) {
  for (const error of errors) console.error(`G1 CLOSING BOARD FAIL: ${error}`);
  process.exit(1);
}

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const board = JSON.parse(fs.readFileSync(path.join(root, 'docs/investor-ready/g1-closing-board-v1.json'), 'utf8'));
const byId = Object.fromEntries(board.controls.map(c => [c.id, c]));

test('G1 Closing Board fail-closed checker passes', async () => {
  const output = execFileSync(process.execPath, [path.join(root, 'scripts/check-g1-closing-board.cjs')], {
    cwd: root,
    encoding: 'utf8'
  });
  expect(output).toContain('PASS_FAIL_CLOSED');
});

test('G1 Closing Board separates proof, executable packages, external decisions and blockers', async () => {
  const counts = board.controls.reduce((acc, c) => {
    acc[c.closingClass] = (acc[c.closingClass] || 0) + 1;
    return acc;
  }, {});
  expect(counts).toEqual({
    PROVEN: 9,
    READY_TO_EXECUTE: 5,
    EXTERNAL_REQUIRED: 6,
    BLOCKED: 5
  });
  expect(board.overallStatus).toBe('IN_PROGRESS');
});

test('G1 current-main authority does not regress to historical privacy/runtime survivors', async () => {
  expect(byId['G1-CB-18'].closingClass).toBe('PROVEN');
  expect(byId['G1-CB-18'].evidence.join(' ')).toContain('PR #128');
  expect(byId['G1-CB-19'].evidence.join(' ')).toContain('PR #127');
  expect(byId['G1-CB-20'].evidence.join(' ')).toContain('PR #130');
  expect(byId['G1-CB-02'].scope).toContain('predates current-main Privacy #127/#128 and Public Runtime #130');
});

test('G1 legal and founder-independence controls cannot masquerade as technically proven', async () => {
  expect(byId['G1-CB-07'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-08'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-17'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-19'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-21'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-23'].closingClass).toBe('EXTERNAL_REQUIRED');
  expect(byId['G1-CB-23'].scope).toContain('no independent non-founder execution has passed');
});

test('G1 execution candidates remain bounded and do not authorize Production', async () => {
  for (const id of ['G1-CB-05', 'G1-CB-14', 'G1-CB-20']) {
    expect(byId[id].closingClass).toBe('READY_TO_EXECUTE');
    expect(byId[id].productionAuthorized).toBe(false);
  }
  expect(byId['G1-CB-14'].scope).toContain('36 rollback-only replacements');
  expect(byId['G1-CB-14'].evidence.join(' ')).toContain('329 to 293');
});

test('G1 Contact Freeze cannot release before acquired-state evidence', async () => {
  expect(byId['G1-CB-24'].closingClass).toBe('BLOCKED');
  expect(byId['G1-CB-25'].closingClass).toBe('BLOCKED');
  expect(byId['G1-CB-25'].blockedBy).toContain('G1-CB-24');
  expect(board.noAuthorization).toContain('business/partner/investor outreach');
  expect(board.noAuthorization).toContain('paid infrastructure creation');
});

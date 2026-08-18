import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';

const root=process.cwd();
const registerPath=path.join(root,'docs/investor-ready/g1-integration-reconciliation.json');

function loadRegister(){
  return JSON.parse(fs.readFileSync(registerPath,'utf8'));
}

test('G1 integration reconciliation stays fail-closed', async () => {
  const output=execFileSync(process.execPath,['scripts/check-g1-integration-reconciliation.cjs'],{cwd:root,encoding:'utf8'});
  expect(output).toContain('"ok": true');

  const register=loadRegister();
  expect(register.overallStatus).toBe('IN_PROGRESS');
  expect(register.canonical.rt006TechnicalDdPr).toBe(116);
  expect(register.canonical.privacyFinalPr).toBeNull();
  expect(register.canonical.rt005FinalPr).toBeNull();

  const byPr=new Map(register.dispositions.map(item=>[item.pr,item]));
  expect(byPr.get(102).disposition).toBe('REFERENCE_HARVEST_ONLY');
  expect(byPr.get(105).disposition).toBe('SPLIT_RT005_ONLY');
  expect(byPr.get(107).disposition).toBe('COMPOSE_PRIVACY_SURVIVOR');
  expect(byPr.get(109).disposition).toBe('HARVEST_PRIVACY_API_TESTS');
  expect([102,105,107,109].every(pr=>byPr.get(pr).mergeWhole===false)).toBe(true);
});

test('known material overlaps keep one explicit resolution', async () => {
  const register=loadRegister();
  const byId=new Map(register.materialOverlaps.map(item=>[item.id,item]));

  expect(byId.get('OV-105-116').paths).toContain('package-lock.json');
  expect(byId.get('OV-105-116').resolution).toContain('PR 116');
  expect(byId.get('OV-107-109').paths).toContain('analytics-rpc-1.8.1.js');
  expect(byId.get('OV-107-109').resolution).toContain('one clean privacy survivor');

  const incomplete=register.requiredSuccessors.filter(item=>item.status!=='COMPLETE');
  expect(incomplete.length).toBeGreaterThan(0);
  expect(register.overallStatus).not.toBe('DONE');
});

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
  expect(register.schemaVersion).toBe('1.1.0');
  expect(register.overallStatus).toBe('IN_PROGRESS');
  expect(register.canonical.rt006TechnicalDdPr).toBe(116);
  expect(register.canonical.securityHistoricalPr).toBe(103);
  expect(register.canonical.securityCurrentStatePr).toBe(124);
  expect(register.canonical.securityHardeningCandidatePr).toBe(125);
  expect(register.canonical.privacyCandidatePr).toBe(120);
  expect(register.canonical.privacyFinalPr).toBeNull();
  expect(register.canonical.rt005FinalPr).toBeNull();
  expect(register.canonical.securityFinalPr).toBeNull();

  const byPr=new Map(register.dispositions.map(item=>[item.pr,item]));
  expect(byPr.get(102).disposition).toBe('REFERENCE_HARVEST_ONLY');
  expect(byPr.get(103).disposition).toBe('REFERENCE_SECURITY_SUPERSEDED');
  expect(byPr.get(105).disposition).toBe('SPLIT_RT005_ONLY');
  expect(byPr.get(107).disposition).toBe('COMPOSE_PRIVACY_SURVIVOR');
  expect(byPr.get(109).disposition).toBe('HARVEST_PRIVACY_API_TESTS');
  expect(byPr.get(124).disposition).toBe('SECURITY_CURRENT_STATE_AUTHORITY');
  expect(byPr.get(125).disposition).toBe('RT001_HARDENING_CANDIDATE');
  expect([102,103,105,107,109].every(pr=>byPr.get(pr).mergeWhole===false)).toBe(true);
});

test('known material overlaps keep one explicit current resolution', async () => {
  const register=loadRegister();
  const byId=new Map(register.materialOverlaps.map(item=>[item.id,item]));

  expect(byId.get('OV-105-116').paths).toContain('package-lock.json');
  expect(byId.get('OV-105-116').resolution).toContain('PR 116');

  const privacy=byId.get('OV-107-109');
  expect(privacy.paths).toContain('analytics-rpc-1.8.1.js');
  expect(privacy.prs).toContain(120);
  expect(privacy.resolution).toContain('PR 120');
  expect(privacy.resolution).toContain('one current-main privacy composition survivor');

  const security=byId.get('OV-103-124-125');
  expect(security.prs).toEqual([103,124,125]);
  expect(security.resolution).toContain('PR 103 is historical reference only');
  expect(security.resolution).toContain('PR 124 owns current-state evidence');
  expect(security.resolution).toContain('PR 125 is the only current hardening candidate');

  const incomplete=register.requiredSuccessors.filter(item=>item.status!=='COMPLETE');
  expect(incomplete.length).toBeGreaterThan(0);
  expect(register.overallStatus).not.toBe('DONE');
});

test('technical green cannot silently become closing complete', async () => {
  const register=loadRegister();
  const byId=new Map(register.requiredSuccessors.map(item=>[item.id,item]));

  for(const id of ['SC-RT005','SC-PRIVACY','SC-IR02C','SC-IR02E','SC-IP-HARVEST']){
    expect(byId.get(id).technicalQa).toBe('GREEN');
    expect(byId.get(id).status).toBe('IN_PROGRESS');
  }

  expect(byId.get('SC-RT001').candidatePr).toBe(125);
  expect(byId.get('SC-RT001').status).toBe('IN_PROGRESS');
  expect(byId.get('SC-RT001').technicalQa).toBe('IN_PROGRESS');
  expect(byId.get('SC-RT001').qualification).toContain('isolated execution');
});

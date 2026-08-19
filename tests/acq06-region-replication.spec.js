import assert from 'node:assert/strict';
import fs from 'node:fs';

const m = JSON.parse(fs.readFileSync('docs/investor-ready/acq06-region2-replication-proof-v1.json','utf8'));

assert.equal(m.status, 'DESIGN_READY_NOT_PROVEN');
assert.equal(m.claimBoundary.regionalRepeatabilityClaimed, false);
assert.equal(m.claimBoundary.contactFreeze, true);

assert.equal(m.region1T0.population.restaurantsTotal, 169);
assert.equal(m.region1T0.population.restaurantsPublished, 166);
assert.equal(m.region1T0.areas.length, 9);
assert.equal(m.region1T0.areas.reduce((n,x)=>n+x.total,0), 169);
assert.equal(m.region1T0.areas.reduce((n,x)=>n+x.published,0), 166);
assert.match(m.region1T0.scopeRule, /not limited to La Manga del Mar Menor and Cabo de Palos/i);

for (const k of ['calendarDaysToCurrentState','founderHoursToCurrentState','localOperatorHoursToCurrentState','cashSpendToCurrentState']) {
  assert.equal(m.region1T0.historicalEfficiency[k], 'UNKNOWN_RECONSTRUCT_REQUIRED');
}

const stages = Object.fromEntries(m.proofDesign.stages.map(s=>[s.id,s]));
assert.equal(stages['R2-0'].status, 'PROVEN');
for (const id of ['R2-1','R2-2','R2-3','R2-4','R2-5','R2-6','R2-7']) assert.equal(stages[id].status, 'NOT_STARTED');
assert.ok(stages['R2-2'].criteria.includes('zero region-specific core forks'));
assert.ok(stages['R2-2'].criteria.includes('zero region-specific schema forks'));
assert.ok(stages['R2-3'].criteria.some(v=>v.includes('50 published businesses')));
assert.ok(stages['R2-4'].criteria.some(v=>v.includes('10 distinct businesses')));
assert.ok(stages['R2-5'].criteria.some(v=>v.includes('3 distinct external businesses')));
assert.ok(stages['R2-5'].criteria.some(v=>v.includes('1 independent renewal')));

assert.equal(m.region2Candidate.dataIngestAuthorized, false);
assert.equal(m.region2Candidate.outreachAuthorized, false);
assert.equal(m.proofDesign.thresholdDisclaimer, 'INTERNAL_TEST_THRESHOLDS_NOT_MARKET_STANDARD');

const ratchet = m.proofDesign.qualityRatchet.join('\n');
assert.match(ratchet, /No region-specific core fork/);
assert.match(ratchet, /database-schema fork/);
assert.match(ratchet, /Privacy, consent, security and public-runtime gates may not be weakened/);
assert.match(ratchet, /reducing data quality, rights discipline or QA/);

console.log('ACQ-06 tests: GREEN');

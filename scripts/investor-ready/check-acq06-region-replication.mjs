import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'docs/investor-ready/acq06-region2-replication-proof-v1.json');
const sqlPath = path.join(root, 'scripts/investor-ready/acq06-region1-baseline-readiness-audit.sql');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sqlRaw = fs.readFileSync(sqlPath, 'utf8');

const fail = (msg) => { throw new Error(`ACQ-06 gate failed: ${msg}`); };
const assert = (condition, msg) => { if (!condition) fail(msg); };

assert(manifest.control === 'ACQ-06', 'control must be ACQ-06');
assert(manifest.status === 'DESIGN_READY_NOT_PROVEN', 'status must remain DESIGN_READY_NOT_PROVEN before Region-2 execution');
assert(manifest.claimBoundary.regionalRepeatabilityClaimed === false, 'regional repeatability must not be claimed');
assert(manifest.claimBoundary.region2Launched === false, 'Region 2 must not be marked launched');
assert(manifest.claimBoundary.efficiencyClaimed === false, 'efficiency must not be claimed');
assert(manifest.claimBoundary.buyerInterestClaimed === false, 'buyer interest must not be claimed');
assert(manifest.claimBoundary.contactFreeze === true, 'Contact Freeze must remain active');
assert(manifest.claimBoundary.productionMutationAuthorized === false, 'Production mutation must not be authorized');

const r1 = manifest.region1T0;
assert(r1.scopeName === 'HOY Region 1 — Mar Menor', 'Region-1 scope name must be Mar Menor');
assert(/not limited to La Manga del Mar Menor and Cabo de Palos/i.test(r1.scopeRule), 'scope must explicitly reject La Manga+Cabo-only framing');
assert(Array.isArray(r1.areas) && r1.areas.length === 9, 'Region 1 must contain exactly nine frozen area buckets');
const expectedAreas = [
  'Cabo de Palos',
  'La Manga Club / Atamaría',
  'La Manga del Mar Menor',
  'Los Alcázares / Los Narejos',
  'Los Belones',
  'Los Urrutias / Estrella de Mar / Los Nietos',
  'Mar de Cristal / Islas Menores',
  'San Pedro del Pinatar / Lo Pagán',
  'Santiago de la Ribera / San Javier'
];
assert(JSON.stringify(r1.areas.map(x => x.area).sort()) === JSON.stringify([...expectedAreas].sort()), 'frozen Region-1 area set drifted');
assert(r1.population.restaurantsTotal === 169, 'T0 total must be 169');
assert(r1.population.restaurantsPublished === 166, 'T0 published must be 166');
assert(r1.areas.reduce((sum, x) => sum + x.total, 0) === 169, 'area totals must reconcile to 169');
assert(r1.areas.reduce((sum, x) => sum + x.published, 0) === 166, 'area published counts must reconcile to 166');
assert(r1.dataQuality.publishedWithCoordinates === 166, 'T0 coordinates must reconcile to all 166 published businesses');
assert(r1.dataQuality.restaurantsWithAccessibilityRow === 166, 'accessibility-row coverage must reconcile to all published businesses');
assert(r1.dataQuality.currentAccessibilityFacts === 668, 'T0 accessibility facts must remain frozen at 668');

for (const key of ['calendarDaysToCurrentState','founderHoursToCurrentState','localOperatorHoursToCurrentState','cashSpendToCurrentState']) {
  assert(r1.historicalEfficiency[key] === 'UNKNOWN_RECONSTRUCT_REQUIRED', `${key} must remain unknown until auditable reconstruction`);
}
assert(r1.historicalEfficiency.firstSettledRecurringBusinessPayment === 'NOT_YET_OBSERVED', 'Region-1 recurring payment baseline must not be invented');

const r2 = manifest.region2Candidate;
assert(r2.status === 'PRESELECTED_INTERNAL_BOUNDARY_NOT_FROZEN', 'Region-2 boundary must remain not frozen');
assert(r2.dataIngestAuthorized === false, 'Region-2 ingest must not be authorized');
assert(r2.outreachAuthorized === false, 'Region-2 outreach must not be authorized');

const proof = manifest.proofDesign;
assert(proof.thresholdDisclaimer === 'INTERNAL_TEST_THRESHOLDS_NOT_MARKET_STANDARD', 'threshold disclaimer is mandatory');
assert(Array.isArray(proof.stages) && proof.stages.length === 8, 'R2-0..R2-7 stages required');
assert(proof.stages.map(x => x.id).join(',') === 'R2-0,R2-1,R2-2,R2-3,R2-4,R2-5,R2-6,R2-7', 'stage sequence must remain R2-0..R2-7');
assert(proof.stages[0].status === 'PROVEN', 'only pre-registration stage R2-0 may be proven now');
assert(proof.stages.slice(1).every(x => x.status === 'NOT_STARTED'), 'R2-1..R2-7 must remain NOT_STARTED');
assert(proof.stages.find(x => x.id === 'R2-3').criteria.some(x => /at least 50 published businesses/i.test(x)), 'pre-registered 50-business cohort threshold missing');
assert(proof.stages.find(x => x.id === 'R2-4').criteria.some(x => /at least 10 distinct businesses/i.test(x)), 'merchant-confirmation threshold missing');
assert(proof.stages.find(x => x.id === 'R2-5').criteria.some(x => /at least 3 distinct external businesses/i.test(x)), 'economic-proof threshold missing');
assert(proof.stages.find(x => x.id === 'R2-5').criteria.some(x => /at least 1 independent renewal/i.test(x)), 'renewal threshold missing');
assert(proof.qualityRatchet.some(x => /No region-specific core fork/i.test(x)), 'core-fork prohibition missing');
assert(proof.qualityRatchet.some(x => /database-schema fork/i.test(x)), 'schema-fork prohibition missing');
assert(proof.qualityRatchet.some(x => /Privacy, consent, security and public-runtime gates may not be weakened/i.test(x)), 'security/privacy quality ratchet missing');
assert(proof.qualityRatchet.some(x => /reducing data quality, rights discipline or QA/i.test(x)), 'anti-speed-at-quality-expense rule missing');
assert(proof.claimRules.PORTABLE.includes('R2-2'), 'PORTABLE claim must require R2-2');
assert(proof.claimRules.REPLICATED.includes('R2-3') && proof.claimRules.REPLICATED.includes('R2-5'), 'REPLICATED claim boundary incomplete');
assert(proof.claimRules.BUYER_GRADE_REPEATABILITY.includes('R2-7'), 'buyer-grade claim must require R2-7');

const stripSqlComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
const sql = stripSqlComments(sqlRaw).toLowerCase();
assert(/^\s*with\b|^\s*select\b/.test(sql), 'readiness audit must start with SELECT/CTE');
for (const forbidden of ['insert ', 'update ', 'delete ', 'create ', 'alter ', 'drop ', 'truncate ', 'grant ', 'revoke ', 'call ', 'merge ']) {
  assert(!sql.includes(forbidden), `readiness audit must be read-only; found ${forbidden.trim()}`);
}
for (const area of expectedAreas) {
  assert(sqlRaw.includes(`('${area}')`), `readiness audit missing Region-1 area ${area}`);
}
assert(sqlRaw.includes('169::bigint as frozen_t0_total'), 'SQL must expose frozen T0 total');
assert(sqlRaw.includes('166::bigint as frozen_t0_published'), 'SQL must expose frozen T0 published count');

console.log('ACQ-06 region replication contract: GREEN');

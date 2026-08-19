import fs from 'node:fs';

const c=JSON.parse(fs.readFileSync('docs/investor-ready/rt001-isolated-postgres-proof-v1.json','utf8'));
const fail=(ok,msg)=>{ if(!ok){ console.error(`RT-001 ISOLATED CONTRACT FAIL: ${msg}`); process.exit(1); } };

fail(c.role==='RT001_ISOLATED_POSTGRES_EXECUTION_PROOF','wrong role');
fail(c.parentCandidate?.pr===140,'must descend from #140');
fail(c.parentCandidate?.head==='484d5ff29fd37b72e2502ea6e1bb45f79b52a9ac','parent head changed');
fail(c.engine?.productionObservedServerVersion==='17.6','Production server version pin changed');
fail(c.engine?.isolatedCiImage==='postgres:17.6','isolated image must match Production 17.6');
fail(c.engine?.fixtureFunctionSource==='READ_ONLY_PRODUCTION_PG_GET_FUNCTIONDEF_CAPTURE','exact read-only function capture required');
fail(c.engine?.candidateMd5PreflightMustPass===true,'candidate MD5 preflight must pass');

for(const [key,value] of Object.entries(c.plannedEvidence||{})) fail(value===true,`planned evidence ${key} must be true`);
const b=c.claimBoundary||{};
for(const key of ['productionMutationPerformed','productionApplyAuthorized','paidSupabaseBranchCreated','paidInfrastructureUsed','securityAdvisorBeforeAfterClaimed','canonicalProductionMigrationCreated','rt001Closed','contactFreezeChanged','outreachAuthorized']) fail(b[key]===false,`${key} must remain false`);
fail(b.securityAdvisorStillRequiredSeparately===true,'Security Advisor must remain separately required');

console.log('RT-001 isolated PostgreSQL proof contract: PASS');

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const fail=message=>{throw new Error(`IR-02C reconciliation failed: ${message}`)};
const gitBlobSha=buffer=>{
  const header=Buffer.from(`blob ${buffer.length}\0`);
  return crypto.createHash('sha1').update(Buffer.concat([header,buffer])).digest('hex');
};
const expected={
  'supabase/migrations/20260818201632_ir02c_business_terms_acceptance_infrastructure.sql':'2f4f7243948bc3730a1cb0bdd5a029b04c8c6242',
  'supabase/migrations/20260818201740_ir02c_business_terms_rpc_security_hardening.sql':'3ea288cd937b4d9fbbc1d382805846bf6cd59396',
  'supabase/migrations/20260818201831_ir02c_business_confirmation_ledger.sql':'31937c3f35c44dc364f56bf06cadfed68b332624',
  'supabase/migrations/20260818202531_ir02c_register_spanish_terms_draft.sql':'e91fb1bb5f52115e88af6070f0fc4c8f9309cc08',
  'supabase/migrations/20260818203021_ir02c_reconcile_de_terms_draft_blob.sql':'84ab99f092162cf380e334d2d6bfae36844b81e3',
  'docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md':'a3d6ce5bb442667e1ec3ff9fc42939397e675a0a',
  'docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md':'abc9634727e7c1b577a8a90b68bc61b03c2893e8',
  'docs/legal/HOY_BUSINESS_TERMS_ACCEPTANCE_SPEC_v1.0.md':'51afec2321c03b7ee2a4e0fda66acf9234b8f039'
};
for(const [rel,sha] of Object.entries(expected)){
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs))fail(`required restored file missing: ${rel}`);
  const actual=gitBlobSha(fs.readFileSync(abs));
  if(actual!==sha)fail(`restored historical blob drift for ${rel}: expected ${sha}, got ${actual}`);
}

const historical=spawnSync(process.execPath,['scripts/check-ir02c-business-terms.mjs'],{cwd:root,encoding:'utf8'});
if(historical.status!==0)fail(historical.stderr||historical.stdout||'historical IR-02C contract check failed');

const snapshotPath=path.join(root,'data/ir-02c-live-reconciliation-2026-08-19.json');
if(!fs.existsSync(snapshotPath))fail('live reconciliation snapshot missing');
const snapshot=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
if(snapshot.inspectionMode!=='read_only')fail('production reconciliation evidence must be read-only');
if(snapshot.migrationHistory.length!==5||snapshot.migrationHistory.some(x=>x.applied!==true))fail('all five restored migrations must be recorded as already applied in Production snapshot');
if(snapshot.publicRpcs.length!==3||snapshot.publicRpcs.some(x=>x.securityDefiner!==false))fail('public Terms RPC snapshot must remain SECURITY INVOKER');
if(snapshot.termsV1.status!=='draft'||snapshot.termsV1.activatedAt!==null||snapshot.termsV1.counselReviewedAt!==null)fail('Terms v1 must remain draft/unactivated/unreviewed in snapshot');
if(snapshot.termsV1.documentGitBlobSha!==expected['docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md'])fail('Production Terms row must point to restored DE draft blob');
if(snapshot.termsV1.documentSha256!==null||snapshot.termsV1.spanishDocumentSha256!==null)fail('draft Terms must not carry final document hashes in snapshot');
if(snapshot.counts.businessTermsAcceptances!==0||snapshot.counts.businessDataConfirmations!==0)fail('current snapshot must not fabricate acceptance or Business Confirmed proof');
if(snapshot.interpretation.repoAction!=='restore already-applied migration source files; do not re-run them as new migrations')fail('repo-history restoration boundary drifted');
if(snapshot.interpretation.termsActive!==false||snapshot.interpretation.marketProof!==false||snapshot.interpretation.businessConfirmedProof!==false||snapshot.interpretation.legalClearanceComplete!==false)fail('claim boundary drifted');

console.log(JSON.stringify({
  ok:true,
  restoredExactBlobs:Object.keys(expected).length,
  appliedMigrationHistory:5,
  termsStatus:'draft',
  acceptances:0,
  businessConfirmations:0,
  databaseMutationPerformedByThisGate:false
},null,2));

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required=[
  'privacy-config-2.47.js','privacy-consent-2.47.js','edge-region-policy-2.48.js',
  'docs/investor-ready/rt008-privacy-evidence-2026-08-19.md',
  'docs/investor-ready/rt008-edge-region-policy-2026-08-19.md',
  'docs/investor-ready/g1-edge-live-source-manifest-2026-08-19.json',
  'docs/investor-ready/g1-edge-full-live-reconciliation-2026-08-19.json',
  'scripts/investor-ready/check-g1-edge-source-parity.mjs',
  'scripts/investor-ready/check-g1-edge-full-reconciliation.mjs',
  'tests/edge-region-policy-2.48.spec.js',
  'supabase/release/rt008-dsar-retention-controls.sql'
];
for(const p of required) if(!fs.existsSync(p)) throw new Error(`final survivor missing required file: ${p}`);

const privacy=fs.readFileSync('privacy-config-2.47.js','utf8');
for(const probe of ["releaseReady:false","analyticsEnabled:false","controllerName:''","privacyContact:''","analyticsRetentionDays:null"]){
  if(!privacy.includes(probe)) throw new Error(`privacy fail-closed probe missing: ${probe}`);
}

const region=fs.readFileSync('edge-region-policy-2.48.js','utf8');
for(const probe of ["eu-central-1","unknownFunctionBehavior:'BLOCK'","mobility-resolve"]){
  if(!region.includes(probe)) throw new Error(`region policy probe missing: ${probe}`);
}

const regionTest=fs.readFileSync('tests/edge-region-policy-2.48.spec.js','utf8');
for(const probe of ['callCountAfterUnknown:1','hoy_edge_region_mismatch:mobility-resolve:us-east-1','finalCallCount:2']){
  if(!regionTest.includes(probe)) throw new Error(`latest region transport regression probe missing: ${probe}`);
}

execFileSync(process.execPath,['scripts/investor-ready/check-g1-edge-source-parity.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/investor-ready/check-g1-edge-full-reconciliation.mjs'],{stdio:'inherit'});

const manifest=JSON.parse(fs.readFileSync('docs/investor-ready/g1-edge-full-live-reconciliation-2026-08-19.json','utf8'));
if(manifest.accounting?.captured_exact_in_repo!==10 || manifest.accounting?.repo_desired_state_ahead_of_live!==9 || manifest.accounting?.unaccounted!==0){
  throw new Error('final survivor 19/19 accounting changed');
}
if(manifest.boundary?.no_production_deploy!==true || manifest.boundary?.no_supabase_redeploy!==true || manifest.boundary?.no_database_mutation!==true || manifest.boundary?.no_automatic_merge!==true){
  throw new Error('final survivor safety boundary weakened');
}

console.log('G1 EDGE FINAL SURVIVOR GREEN: privacy fail-closed + EU region enforcement + latest transport regressions + 19/19 acquired-state reconciliation composed in one candidate.');

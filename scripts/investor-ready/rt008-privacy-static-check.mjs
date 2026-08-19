import fs from 'node:fs';

const analyticsPath='analytics-rpc-1.8.1.js';
const controlsPath='supabase/release/rt008-dsar-retention-controls.sql';
const analytics=fs.readFileSync(analyticsPath,'utf8');
const controls=fs.readFileSync(controlsPath,'utf8');
const fail=(msg)=>{console.error(`RT-008 FAIL: ${msg}`);process.exitCode=1};
const pass=(msg)=>console.log(`RT-008 PASS: ${msg}`);

const analyticsRequired=[
  ["CONSENT_KEY='hoy-analytics-consent-v1'",'dedicated analytics consent key exists'],
  ["localStorage.getItem(CONSENT_KEY)==='granted'",'production consent requires explicit granted value'],
  ["if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false)",'production trackEvent exits before payload/identifier creation'],
  ["if(!productionHost())",'raw local event history is restricted to non-production'],
  ["localStorage.removeItem(ANON_KEY)",'legacy persistent analytics identifier cleanup exists'],
  ["sessionStorage.removeItem(SESSION_KEY)",'legacy session analytics identifier cleanup exists'],
  ["window.hoyAnalyticsConsentGranted181=analyticsConsentGranted",'consent state is testable'],
];
for(const [needle,label] of analyticsRequired){
  if(analytics.includes(needle))pass(label); else fail(label);
}

if(/return productionHost\(\)&&!qaRuntimeDetected\(\)&&analyticsConsentGranted\(\)/.test(analytics)){
  pass('server transport gate includes analytics consent');
}else{
  fail('server transport gate does not prove analytics consent');
}

const controlRequired=[
  ['create or replace function private.dd_subject_data_locator','private DSAR subject locator exists'],
  ['revoke all on function private.dd_subject_data_locator(uuid) from public, anon, authenticated','subject locator is not executable by public browser roles'],
  ['grant execute on function private.dd_subject_data_locator(uuid) to service_role','subject locator is service-role gated'],
  ['create or replace function private.dd_analytics_retention_preview','retention dry-run preview exists'],
  ['create table if not exists private.analytics_retention_policy','explicit private retention policy gate exists'],
  ['check (not enabled or (','enabled retention requires approval evidence'],
  ["raise exception 'analytics_retention_policy_not_enabled'",'purge fails closed with no enabled policy'],
  ["raise exception 'analytics_retention_policy_not_approved'",'purge fails closed without approval metadata'],
  ['delete from public.analytics_events where occurred_at < v_cutoff','purge scope is limited to analytics rows older than approved cutoff'],
  ['revoke all on function private.execute_approved_analytics_retention(text) from public, anon, authenticated','purge is not executable by public browser roles'],
  ['grant execute on function private.execute_approved_analytics_retention(text) to service_role','purge is service-role gated'],
];
for(const [needle,label] of controlRequired){
  if(controls.includes(needle))pass(label); else fail(label);
}

if(/insert\s+into\s+private\.analytics_retention_policy/i.test(controls)){
  fail('release file must not seed or auto-enable a retention policy');
}else{
  pass('no retention policy is seeded by the release file');
}

if(/delete\s+from\s+auth\.users/i.test(controls)){
  fail('DSAR control file must not implement automatic hard-delete of auth users');
}else{
  pass('DSAR control file contains no automatic auth-user hard delete');
}

if(process.exitCode)process.exit(process.exitCode);
console.log('RT-008 privacy static check complete.');

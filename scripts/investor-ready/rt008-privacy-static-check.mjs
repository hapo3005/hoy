import fs from 'node:fs';

const analyticsPath='analytics-rpc-1.8.1.js';
const controlsPath='supabase/release/rt008-dsar-retention-controls.sql';
const configPath='privacy-config-2.47.js';
const consentPath='privacy-consent-2.47.js';
const indexPath='index.html';
const testPath='tests/privacy-consent-2.47.spec.js';
const processorEvidencePath='docs/investor-ready/rt008-processor-transfer-evidence-2026-08-19.md';
const analytics=fs.readFileSync(analyticsPath,'utf8');
const controls=fs.readFileSync(controlsPath,'utf8');
const config=fs.readFileSync(configPath,'utf8');
const consent=fs.readFileSync(consentPath,'utf8');
const index=fs.readFileSync(indexPath,'utf8');
const browserTest=fs.readFileSync(testPath,'utf8');
const processorEvidence=fs.readFileSync(processorEvidencePath,'utf8');
const fail=(msg)=>{console.error(`RT-008 FAIL: ${msg}`);process.exitCode=1};
const pass=(msg)=>console.log(`RT-008 PASS: ${msg}`);

const analyticsRequired=[
  ["CONSENT_KEY='hoy-analytics-consent-v1'",'dedicated analytics consent key exists'],
  ["localStorage.getItem(CONSENT_KEY)==='granted'",'production consent requires explicit granted value'],
  ["window.hoyPrivacyProductionReady247?.()===true",'analytics reads independent privacy release gate'],
  ["if(productionHost()&&(!privacyReleaseReady()||!analyticsConsentGranted()))return Promise.resolve(false)",'production trackEvent exits before payload/identifier creation if release or consent is absent'],
  ["if(!productionHost())",'raw local event history is restricted to non-production'],
  ["localStorage.removeItem(ANON_KEY)",'legacy persistent analytics identifier cleanup exists'],
  ["sessionStorage.removeItem(SESSION_KEY)",'legacy session analytics identifier cleanup exists'],
  ["window.hoyAnalyticsConsentGranted181=analyticsConsentGranted",'consent state is testable'],
  ["window.hoyClearProductionAnalyticsStorage181=clearProductionAnalyticsStorage",'withdrawal can invoke deterministic analytics cleanup'],
];
for(const [needle,label] of analyticsRequired){
  if(analytics.includes(needle))pass(label); else fail(label);
}

if(/return privacyReleaseReady\(\)&&productionHost\(\)&&!qaRuntimeDetected\(\)&&analyticsConsentGranted\(\)/.test(analytics)){
  pass('server transport requires both privacy release and explicit consent');
}else{
  fail('server transport gate does not prove privacy release plus explicit consent');
}

const configRequired=[
  ["noticeVersion:'rt008-draft-2026-08-19'",'versioned notice contract exists'],
  ["releaseReady:false",'Production privacy release is fail-closed'],
  ["analyticsEnabled:false",'Production analytics feature release is fail-closed'],
  ["controllerName:''",'controller placeholder is not silently invented'],
  ["privacyContact:''",'privacy-contact placeholder is not silently invented'],
  ["analyticsRetentionDays:null",'retention period remains unset until approved'],
  ["Number.isInteger(config.analyticsRetentionDays)", 'release readiness requires an explicit numeric retention period'],
];
for(const [needle,label] of configRequired){
  if(config.includes(needle))pass(label); else fail(label);
}

if(/releaseReady\s*:\s*true/.test(config)||/analyticsEnabled\s*:\s*true/.test(config)){
  fail('draft privacy config must not enable Production analytics');
}else{
  pass('draft privacy config contains no Production enablement');
}

const consentRequired=[
  ["PREF_KEY='hoy-privacy-preference-v1'",'versioned privacy-preference record exists'],
  ["choice,noticeVersion:cfg.noticeVersion",'choice is tied to notice version'],
  ["decidedAt:new Date().toISOString()",'choice stores decision timestamp'],
  ["class=\"hoy-privacy-choice\" data-privacy-reject",'reject is a first-level consent choice'],
  ["class=\"hoy-privacy-choice\" data-privacy-accept",'accept is a first-level consent choice with the same prominence class'],
  ["data-privacy-reject",'withdraw/reject control remains available in settings'],
  ["clearAnalytics()",'rejection invokes local analytics cleanup'],
  ["window.hoyPrivacyOpen247",'persistent privacy settings entry point is testable'],
  ["window.hoyPrivacyChoice247",'privacy choice is testable'],
];
for(const [needle,label] of consentRequired){
  if(consent.includes(needle))pass(label); else fail(label);
}

const configPos=index.indexOf('privacy-config-2.47.js?v=2.47.0');
const analyticsPos=index.indexOf('analytics-rpc-1.8.1.js?v=2.47.1');
const consentPos=index.indexOf('privacy-consent-2.47.js?v=2.47.0');
if(configPos>=0&&analyticsPos>configPos&&consentPos>analyticsPos){
  pass('privacy config loads before analytics and consent UI loads after analytics');
}else{
  fail('privacy script load order is not fail-closed');
}
if(index.includes('privacy-consent-2.47.css?v=2.47.0'))pass('privacy consent stylesheet is wired');else fail('privacy consent stylesheet is missing');

for(const needle of ['Analytics ablehnen','Analytics zustimmen','Ablehnen / widerrufen','hoyPrivacyProductionReady247']){
  if(browserTest.includes(needle))pass(`browser regression covers ${needle}`);else fail(`browser regression missing ${needle}`);
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

const processorEvidenceRequired=[
  ['**Supabase**','Supabase is explicitly registered'],
  ['**OpenAI API**','OpenAI API is explicitly registered'],
  ['`background:true, store:false`','current OpenAI background/store configuration is evidenced'],
  ['not ZDR','OpenAI background mode is not mislabelled Zero Data Retention'],
  ['**GitHub / GitHub Pages**','GitHub Pages is explicitly registered'],
  ['**jsDelivr CDN**','jsDelivr browser recipient is explicitly registered'],
  ['**OpenStreetMap Foundation standard tiles**','OSMF browser recipient is explicitly registered'],
  ['**Wikimedia Commons / Wikimedia Foundation**','Wikimedia browser recipient is explicitly registered'],
  ['**Independent Data Controller**','independent-controller classification is explicit where provider evidence supports it'],
  ['current plan: `free`','current Supabase plan is captured rather than inferred'],
  ['`eu-central-1`','active HOY Supabase project region is captured'],
  ['No provider is marked contractually closed','public provider documentation is not confused with HOY-specific contract execution'],
  ['Investor/business/user outreach remains blocked','processor evidence does not release outreach'],
];
for(const [needle,label] of processorEvidenceRequired){
  if(processorEvidence.includes(needle))pass(label);else fail(label);
}

if(/OpenAI[^\n]{0,120}GREEN CONTRACTUAL/i.test(processorEvidence)||/Supabase[^\n]{0,120}GREEN CONTRACTUAL/i.test(processorEvidence)){
  fail('provider register must not claim account-specific contractual closure without archived evidence');
}else{
  pass('provider register avoids unsupported contractual-green claims');
}

if(process.exitCode)process.exit(process.exitCode);
console.log('RT-008 privacy static check complete.');

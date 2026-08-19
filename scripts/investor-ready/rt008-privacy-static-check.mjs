import fs from 'node:fs';

const analyticsPath='analytics-rpc-1.8.1.js';
const controlsPath='supabase/release/rt008-dsar-retention-controls.sql';
const configPath='privacy-config-2.47.js';
const consentPath='privacy-consent-2.47.js';
const indexPath='index.html';
const testPath='tests/privacy-consent-2.47.spec.js';
const processorEvidencePath='docs/investor-ready/rt008-processor-transfer-evidence-2026-08-19.md';
const currentEvidencePath='docs/investor-ready/rt008-privacy-evidence-2026-08-19.md';
const canonicalKey='hoy-privacy-analytics-consent-v1';
const staleKey='hoy-analytics-consent-v1';

const analytics=fs.readFileSync(analyticsPath,'utf8');
const controls=fs.readFileSync(controlsPath,'utf8');
const config=fs.readFileSync(configPath,'utf8');
const consent=fs.readFileSync(consentPath,'utf8');
const index=fs.readFileSync(indexPath,'utf8');
const browserTest=fs.readFileSync(testPath,'utf8');
const processorEvidence=fs.readFileSync(processorEvidencePath,'utf8');
const currentEvidence=fs.readFileSync(currentEvidencePath,'utf8');
const fail=(msg)=>{console.error(`RT-008 FAIL: ${msg}`);process.exitCode=1};
const pass=(msg)=>console.log(`RT-008 PASS: ${msg}`);
const requireText=(text,needle,label)=>text.includes(needle)?pass(label):fail(label);

for(const [name,text] of [['analytics runtime',analytics],['consent UI',consent]]){
  requireText(text,canonicalKey,`${name} uses canonical #128 consent key`);
  if(text.includes(staleKey))fail(`${name} reintroduces stale #127 consent key`);else pass(`${name} contains no stale #127 consent key`);
}
requireText(browserTest,canonicalKey,'browser test uses canonical #128 consent key');
requireText(browserTest,staleKey,'browser test retains stale key only as a negative sentinel');
requireText(browserTest,"stale:localStorage.getItem(STALE)",'browser test observes stale key without writing it');
requireText(browserTest,'expect(state.stale).toBeNull()','browser test requires stale key to remain absent after consent');
requireText(browserTest,"expect(values).toEqual({consent:'rejected',stale:null",'browser withdrawal test requires stale key to remain absent');
if(/localStorage\.setItem\([^\n]{0,80}(?:STALE|hoy-analytics-consent-v1)/.test(browserTest))fail('browser test must never write the stale key');else pass('browser test never writes the stale key');

requireText(currentEvidence,canonicalKey,'current evidence records canonical consent key');
requireText(currentEvidence,staleKey,'current evidence explicitly records stale key as prohibited historical value');

const analyticsRequired=[
  ["window.hoyPrivacyProductionReady247?.()===true",'analytics reads independent privacy release gate'],
  ["if(productionHost()&&(!privacyReleaseReady()||!analyticsConsentGranted()))return Promise.resolve(false)",'Production exits before payload/identifier work if either gate is absent'],
  ["if(!analyticsStorageAllowed())return Promise.resolve(false)",'storage gate remains fail-closed'],
  ["if(!productionHost())",'raw local event history is restricted to non-Production'],
  ["window.hoyAnalyticsPrivacy181",'#128 compatibility privacy API remains present'],
  ["clearAnalyticsIdentifiers()",'withdrawal cleanup remains wired'],
  ["window.hoyClearProductionAnalyticsStorage181=clearProductionAnalyticsStorage",'deterministic Production cleanup export remains present']
];
for(const [needle,label] of analyticsRequired)requireText(analytics,needle,label);
if(/return privacyReleaseReady\(\)&&productionHost\(\)&&!qaRuntimeDetected\(\)&&analyticsConsentGranted\(\)/.test(analytics))pass('server transport requires release gate plus explicit consent');else fail('server transport gate is incomplete');

const configRequired=[
  ["noticeVersion:'rt008-draft-2026-08-19'",'versioned notice contract exists'],
  ["releaseReady:false",'Production privacy release is fail-closed'],
  ["analyticsEnabled:false",'Production analytics feature release is fail-closed'],
  ["controllerName:''",'controller is not invented'],
  ["privacyContact:''",'privacy contact is not invented'],
  ["analyticsRetentionDays:null",'retention remains unset']
];
for(const [needle,label] of configRequired)requireText(config,needle,label);
if(/releaseReady\s*:\s*true/.test(config)||/analyticsEnabled\s*:\s*true/.test(config))fail('draft config must not enable Production analytics');else pass('draft config contains no Production enablement');

for(const [needle,label] of [
  ["PREF_KEY='hoy-privacy-preference-v1'",'versioned privacy preference exists'],
  ['data-privacy-reject','reject/withdraw control exists'],
  ['data-privacy-accept','accept control exists'],
  ['clearAnalytics()','rejection invokes local analytics cleanup'],
  ['window.hoyPrivacyOpen247','persistent privacy settings entry point exists']
])requireText(consent,needle,label);

const configPos=index.indexOf('privacy-config-2.47.js?v=2.47.0');
const analyticsPos=index.indexOf('analytics-rpc-1.8.1.js?v=2.47.1');
const consentPos=index.indexOf('privacy-consent-2.47.js?v=2.47.0');
if(configPos>=0&&analyticsPos>configPos&&consentPos>analyticsPos)pass('privacy config loads before analytics and consent UI after analytics');else fail('privacy script load order is unsafe');
requireText(index,'privacy-consent-2.47.css?v=2.47.0','privacy consent stylesheet is wired');

for(const needle of ['Analytics ablehnen','Analytics zustimmen','Ablehnen / widerrufen'])requireText(browserTest,needle,`browser regression covers ${needle}`);

for(const [needle,label] of [
  ['create or replace function private.dd_subject_data_locator','private DSAR locator exists'],
  ['revoke all on function private.dd_subject_data_locator(uuid) from public, anon, authenticated','DSAR locator is blocked from browser roles'],
  ['grant execute on function private.dd_subject_data_locator(uuid) to service_role','DSAR locator is service-role gated'],
  ['create table if not exists private.analytics_retention_policy','explicit retention policy gate exists'],
  ["raise exception 'analytics_retention_policy_not_enabled'",'purge fails closed with no enabled policy'],
  ["raise exception 'analytics_retention_policy_not_approved'",'purge fails closed without approval metadata'],
  ['revoke all on function private.execute_approved_analytics_retention(text) from public, anon, authenticated','purge is blocked from browser roles']
])requireText(controls,needle,label);
if(/insert\s+into\s+private\.analytics_retention_policy/i.test(controls))fail('release SQL must not seed/enable retention policy');else pass('release SQL seeds no retention policy');
if(/delete\s+from\s+auth\.users/i.test(controls))fail('DSAR control must not implement automatic auth-user hard delete');else pass('no automatic auth-user hard delete');

for(const needle of ['**Supabase**','**OpenAI API**','**GitHub / GitHub Pages**','No provider is marked contractually closed'])requireText(processorEvidence,needle,`processor evidence covers ${needle}`);

if(process.exitCode)process.exit(process.exitCode);
console.log('RT-008 privacy current-main recomposition static check PASS.');

import fs from 'node:fs';

const file='analytics-rpc-1.8.1.js';
const text=fs.readFileSync(file,'utf8');
const fail=message=>{throw new Error(`RT-008 privacy invariant failed: ${message}`)};

const required=[
  ["const CONSENT_KEY='hoy-privacy-analytics-consent-v1'",'one canonical analytics consent key'],
  ["return productionHost()&&!qaRuntimeDetected()&&analyticsConsentGranted()",'production transport requires explicit consent'],
  ["if(productionHost()&&!analyticsConsentGranted())clearAnalyticsIdentifiers()",'legacy production analytics state is cleared before use'],
  ["if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false);",'production event path fails closed before payload creation'],
  ["if(!productionHost())",'raw local event history has a non-production guard'],
  ["withdraw:()=>",'withdrawal API exists'],
  ["deny:()=>",'denial API exists'],
  ["clearAnalyticsIdentifiers();",'identifier cleanup is wired'],
  ["if(!analyticsStorageAllowed())return null;",'pilot attribution cannot persist without storage permission'],
  ["out.client_version='1.8.4'",'composed runtime version is explicit']
];
for(const [needle,label] of required){
  if(!text.includes(needle))fail(label);
}

if(text.includes("CONSENT_KEY='hoy-analytics-consent-v1'")){
  fail('legacy competing consent key is present');
}

const trackStart=text.indexOf('trackEvent=function');
if(trackStart<0)fail('trackEvent override is missing');
const track=text.slice(trackStart);
const guard=track.indexOf("if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false);");
// Match executable statements, not explanatory comments that intentionally name
// readEvents()/buildPayload() while documenting the required order.
const readEvents=track.indexOf('const rows=readEvents();');
const buildPayload=track.indexOf('const payload=buildPayload(type,restaurantId,meta);');
if(guard<0||readEvents<0||buildPayload<0)fail('trackEvent executable guard/order statements missing');
if(!(guard<readEvents&&guard<buildPayload))fail('production no-consent guard must run before raw-history read and payload creation');

const historyBlock=track.slice(guard,buildPayload);
if(!historyBlock.includes('if(!productionHost())'))fail('raw event history is not visibly restricted away from production');
if(!historyBlock.includes('safeSet(localStorage,ANALYTICS_KEY'))fail('preview/QA bounded history path unexpectedly disappeared');

const qaFn=text.slice(text.indexOf('function qaRuntimeDetected()'),text.indexOf('function analyticsStorageAllowed()'));
if(!qaFn.includes('if(productionHost())return false'))fail('production must not inspect QA localStorage marker');
if(qaFn.indexOf('if(productionHost())return false')>qaFn.indexOf("safeGet(localStorage,'hoy-qa-runtime')")){
  fail('QA localStorage marker is read before production guard');
}

const pilotFn=text.slice(text.indexOf('function capturePilotEnrollment()'),text.indexOf('function schedulePilotEnrollment'));
if(pilotFn.indexOf('stripPilotQuery')<0||pilotFn.indexOf('if(!analyticsStorageAllowed())return null')<0){
  fail('pilot query must be stripped while persistence remains consent/storage gated');
}
if(pilotFn.indexOf('stripPilotQuery')>pilotFn.indexOf('if(!analyticsStorageAllowed())return null')){
  fail('pilot query must be stripped before no-consent exit');
}

console.log(JSON.stringify({
  ok:true,
  runtime:'1.8.4',
  consentKey:'hoy-privacy-analytics-consent-v1',
  productionDefault:'off_without_explicit_grant',
  rawProductionEventHistory:false,
  withdrawalCleanup:true,
  sourceOrderCheck:'executable-statements-only'
},null,2));

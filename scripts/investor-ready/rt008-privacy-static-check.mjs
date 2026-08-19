import fs from 'node:fs';

const path='analytics-rpc-1.8.1.js';
const text=fs.readFileSync(path,'utf8');
const fail=(msg)=>{console.error(`RT-008 FAIL: ${msg}`);process.exitCode=1};
const pass=(msg)=>console.log(`RT-008 PASS: ${msg}`);

const required=[
  ["CONSENT_KEY='hoy-analytics-consent-v1'",'dedicated analytics consent key exists'],
  ["localStorage.getItem(CONSENT_KEY)==='granted'",'production consent requires explicit granted value'],
  ["if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false)",'production trackEvent exits before payload/identifier creation'],
  ["if(!productionHost())",'raw local event history is restricted to non-production'],
  ["localStorage.removeItem(ANON_KEY)",'legacy persistent analytics identifier cleanup exists'],
  ["sessionStorage.removeItem(SESSION_KEY)",'legacy session analytics identifier cleanup exists'],
  ["window.hoyAnalyticsConsentGranted181=analyticsConsentGranted",'consent state is testable'],
];
for(const [needle,label] of required){
  if(text.includes(needle))pass(label); else fail(label);
}

if(/return productionHost\(\)&&!qaRuntimeDetected\(\)&&analyticsConsentGranted\(\)/.test(text)){
  pass('server transport gate includes analytics consent');
}else{
  fail('server transport gate does not prove analytics consent');
}

if(process.exitCode)process.exit(process.exitCode);
console.log('RT-008 privacy static check complete.');

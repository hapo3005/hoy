import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';

const source=fs.readFileSync(path.join(process.cwd(),'analytics-rpc-1.8.1.js'),'utf8');

function storage(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    getItem:key=>values.has(String(key))?values.get(String(key)):null,
    setItem:(key,value)=>values.set(String(key),String(value)),
    removeItem:key=>values.delete(String(key)),
    snapshot:()=>Object.fromEntries(values)
  };
}

function boot({host='hapo3005.github.io',search='',local={},session={}}={}){
  const localStorage=storage(local);
  const sessionStorage=storage(session);
  let readEventsCalls=0;
  const replaced=[];
  const context={
    console:{warn:()=>{}},
    Promise,
    setTimeout:()=>{},
    URLSearchParams,
    Date,
    Math,
    JSON,
    localStorage,
    sessionStorage,
    navigator:{webdriver:false},
    state:{lang:'de',view:'list'},
    DATA:[],
    ANALYTICS_KEY:'hoy-analytics-v1',
    readEvents:()=>{readEventsCalls++;return []},
    sb:null,
    cloud:{status:'offline'},
    trackEvent:()=>Promise.resolve(false),
    window:{
      crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},
      location:{hostname:host,search,pathname:'/app',hash:''},
      history:{replaceState:(...args)=>replaced.push(args)}
    }
  };
  context.window.window=context.window;
  context.window.localStorage=localStorage;
  context.window.sessionStorage=sessionStorage;
  context.window.navigator=context.navigator;
  context.window.URLSearchParams=URLSearchParams;
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'analytics-rpc-1.8.1.js'});
  return {context,localStorage,sessionStorage,replaced,getReadEventsCalls:()=>readEventsCalls};
}

test('RT-008 static privacy invariants pass', async () => {
  const output=execFileSync(process.execPath,['scripts/investor-ready/rt008-privacy-static-check.mjs'],{
    cwd:process.cwd(),encoding:'utf8'
  });
  expect(output).toContain('"ok": true');
  expect(output).toContain('"rawProductionEventHistory": false');
  expect(output).toContain('"sourceOrderCheck": "executable-statements-only"');
});

test('production without consent clears legacy analytics state and exits before event/payload storage', async () => {
  const app=boot({
    local:{
      'hoy-anonymous-id-v1':'legacy-anon',
      'hoy-proof-pilot-code-v1':'P01',
      'hoy-proof-pilot-enrolled-v1':'P01',
      'hoy-analytics-v1':'[{"legacy":true}]'
    },
    session:{'hoy-session-id-v1':'legacy-session'}
  });

  expect(app.context.window.hoyAnalyticsPrivacy181.status()).toBe('unset');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-anonymous-id-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-proof-pilot-code-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-proof-pilot-enrolled-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-analytics-v1');
  expect(app.sessionStorage.snapshot()).not.toHaveProperty('hoy-session-id-v1');

  const sent=await app.context.trackEvent('venue_open',12,{source:'test'});
  expect(sent).toBe(false);
  expect(app.getReadEventsCalls()).toBe(0);
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-anonymous-id-v1');
  expect(app.sessionStorage.snapshot()).not.toHaveProperty('hoy-session-id-v1');
});

test('production pilot parameter is stripped but not persisted without consent', async () => {
  const app=boot({search:'?pilot=P07&keep=1'});
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-proof-pilot-code-v1');
  expect(app.replaced.length).toBe(1);
  expect(app.replaced[0][2]).toBe('/app?keep=1');
});

test('explicit grant enables bounded production payload state but never raw local event history', async () => {
  const app=boot();
  expect(app.context.window.hoyAnalyticsPrivacy181.grant()).toBe('granted');
  expect(app.context.window.hoyProductionAnalyticsAllowed181()).toBe(true);

  const sent=await app.context.trackEvent('venue_open',12,{source:'test'});
  expect(sent).toBe(false); // cloud is deliberately offline in this harness
  expect(app.getReadEventsCalls()).toBe(0);
  expect(app.localStorage.snapshot()['hoy-anonymous-id-v1']).toBeTruthy();
  expect(app.sessionStorage.snapshot()['hoy-session-id-v1']).toBeTruthy();
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-analytics-v1');
});

test('deny and withdrawal remove analytics identifiers, pilot state and raw history', async () => {
  const app=boot();
  app.context.window.hoyAnalyticsPrivacy181.grant();
  await app.context.trackEvent('venue_open',12,{});
  app.localStorage.setItem('hoy-proof-pilot-code-v1','P02');
  app.localStorage.setItem('hoy-proof-pilot-enrolled-v1','P02');
  app.localStorage.setItem('hoy-analytics-v1','[]');

  expect(app.context.window.hoyAnalyticsPrivacy181.withdraw()).toBe('denied');
  expect(app.localStorage.snapshot()['hoy-privacy-analytics-consent-v1']).toBe('denied');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-anonymous-id-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-proof-pilot-code-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-proof-pilot-enrolled-v1');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-analytics-v1');
  expect(app.sessionStorage.snapshot()).not.toHaveProperty('hoy-session-id-v1');

  app.context.window.hoyAnalyticsPrivacy181.grant();
  await app.context.trackEvent('venue_open',12,{});
  expect(app.context.window.hoyAnalyticsPrivacy181.deny()).toBe('denied');
  expect(app.localStorage.snapshot()).not.toHaveProperty('hoy-anonymous-id-v1');
});

test('source contract has one canonical consent key and production-only raw-history prohibition', async () => {
  expect(source).toContain("const CONSENT_KEY='hoy-privacy-analytics-consent-v1'");
  expect(source).not.toContain("CONSENT_KEY='hoy-analytics-consent-v1'");

  const trackStart=source.indexOf('trackEvent=function');
  const guard=source.indexOf("if(productionHost()&&!analyticsConsentGranted())return Promise.resolve(false);",trackStart);
  const read=source.indexOf('const rows=readEvents();',trackStart);
  const payload=source.indexOf('const payload=buildPayload(type,restaurantId,meta);',trackStart);
  expect(guard).toBeGreaterThan(trackStart);
  expect(guard).toBeLessThan(read);
  expect(guard).toBeLessThan(payload);
  expect(source.slice(guard,payload)).toContain('if(!productionHost())');
});

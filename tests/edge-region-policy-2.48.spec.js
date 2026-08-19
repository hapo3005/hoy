const { test, expect } = require('@playwright/test');

const EXPECTED=[
  'claim-submit','publish-offer','venue-media-approve','admin-ops',
  'location-geocode-once','cartociudad-geocode-once','cartociudad-debug',
  'address-fallback-geocode-once','cartociudad-find-fallback','cartociudad-locate-debug',
  'menu-intake-process','promotion-insights','menu-image-once','operator-hours-confirm',
  'mobility-resolve','menu-discovery','menu-editorial-import','menu-social-handoff',
  'operator-accessibility-confirm'
].sort();

async function policySnapshot(page){
  return await page.evaluate(()=>({
    version:window.HOY_EDGE_REGION_POLICY?.version,
    region:window.HOY_EDGE_REGION_POLICY?.pinnedRegion,
    count:window.HOY_EDGE_REGION_POLICY?.functionCount,
    names:Object.keys(window.HOY_EDGE_REGION_POLICY?.functions||{}).sort(),
    unknown:window.HOY_EDGE_REGION_POLICY?.unknownFunctionBehavior,
    factoryWrapped:window.supabase?.createClient?.__hoyEdgeRegionWrapped248===true,
    claimRegion:window.hoyEdgeRegionInvokeOptions248?.('claim-submit',{body:{qa:true}})?.region,
    mobilityRegion:window.hoyEdgeRegionInvokeOptions248?.('mobility-resolve',{body:{latitude:37.7,longitude:-0.7}})?.region,
  }));
}

for(const [label,path] of [['public','/'],['admin','/admin.html']]){
  test(`${label} shell installs fail-closed eu-central-1 Edge policy before client creation`, async ({ page }) => {
    await page.goto(path);
    await expect.poll(()=>page.evaluate(()=>Boolean(window.HOY_EDGE_REGION_POLICY))).toBe(true);
    const snap=await policySnapshot(page);
    expect(snap).toEqual({
      version:'2.48.0',
      region:'eu-central-1',
      count:19,
      names:EXPECTED,
      unknown:'BLOCK',
      factoryWrapped:true,
      claimRegion:'eu-central-1',
      mobilityRegion:'eu-central-1',
    });

    const unknown=await page.evaluate(()=>{
      try{window.hoyEdgeRegionInvokeOptions248('future-unclassified-function',{body:{}});return 'unexpected_allow'}
      catch(error){return String(error?.message||error)}
    });
    expect(unknown).toBe('hoy_edge_region_unclassified:future-unclassified-function');
  });
}

test('wrapped invoke forces region, blocks unknown slugs before transport and rejects contradictory observed region', async ({ page }) => {
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>Boolean(window.hoyInstallEdgeRegionPolicy248))).toBe(true);

  const result=await page.evaluate(async()=>{
    const calls=[];
    const headers=(region)=>({get:(name)=>String(name).toLowerCase()==='x-sb-edge-region'?region:null});
    const client={functions:{invoke:async(name,options)=>{
      calls.push({name,options});
      const observed=options?.body?.qaObservedRegion||'eu-central-1';
      return {data:{ok:true},error:null,response:{headers:headers(observed)}};
    }}};
    window.hoyInstallEdgeRegionPolicy248(client);

    const allowed=await client.functions.invoke('claim-submit',{body:{qa:true}});
    const unknown=await client.functions.invoke('future-unclassified-function',{body:{qa:true}});
    const callCountAfterUnknown=calls.length;
    const mismatch=await client.functions.invoke('mobility-resolve',{body:{qaObservedRegion:'us-east-1'}});

    return {
      wrapped:client.functions.invoke.__hoyEdgeRegionWrapped248===true,
      allowedError:allowed.error?String(allowed.error.message||allowed.error):null,
      allowedRegion:calls[0]?.options?.region||null,
      unknownError:String(unknown.error?.message||unknown.error||''),
      callCountAfterUnknown,
      mismatchError:String(mismatch.error?.message||mismatch.error||''),
      mismatchRegion:calls[1]?.options?.region||null,
      finalCallCount:calls.length,
    };
  });

  expect(result).toEqual({
    wrapped:true,
    allowedError:null,
    allowedRegion:'eu-central-1',
    unknownError:'hoy_edge_region_unclassified:future-unclassified-function',
    callCountAfterUnknown:1,
    mismatchError:'hoy_edge_region_mismatch:mobility-resolve:us-east-1',
    mismatchRegion:'eu-central-1',
    finalCallCount:2,
  });
});

const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const {webcrypto}=require('crypto');
const {TextEncoder}=require('util');

const src=fs.readFileSync('merchant-confirmation-receipt-2.48.js','utf8');

function load(rpc){
  const context={
    window:{},
    console:{warn:()=>{},log:()=>{}},
    crypto:webcrypto,
    TextEncoder,
    Uint8Array,
    Number,
    String,
    Object,
    Array,
    JSON,
    sb:{rpc},
    cloud:{user:{id:'qa-user'}}
  };
  vm.createContext(context);
  vm.runInContext(src,context);
  return context;
}

(async()=>{
  {
    const calls=[];
    const c=load(async(name,args)=>{calls.push([name,args]);return {data:{gate_configured:false,status:'not_active'},error:null}});
    const result=await c.window.hoyRecordRightsBackedBusinessConfirmation248({restaurantId:10,confirmationType:'hours',subjectType:'restaurant_live_hours',subjectRef:'restaurant:10:weekly_hours',payload:{restaurant_id:10,timezone:'Europe/Madrid',weekly_hours:{mon:[['10:00','18:00']]},display_text:'Mo 10:00–18:00'}});
    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)),{recorded:false,reason:'business_terms_not_active'});
    assert.strictEqual(calls.length,1);
    assert.strictEqual(calls[0][0],'get_business_terms_status');
  }

  {
    const calls=[];
    const c=load(async(name,args)=>{
      calls.push([name,args]);
      if(name==='get_business_terms_status')return {data:{gate_configured:true,status:'accepted',active_version:'v1'},error:null};
      if(name==='operator_record_business_confirmation')return {data:{ok:true,confirmation_id:'receipt-1',confirmed_at:'2026-08-19T00:00:00Z'},error:null};
      return {data:null,error:new Error('unexpected_rpc')};
    });
    const payloadA={restaurant_id:10,timezone:'Europe/Madrid',weekly_hours:{tue:[],mon:[['10:00','18:00']]},display_text:'Mo 10:00–18:00'};
    const payloadB={display_text:'Mo 10:00–18:00',weekly_hours:{mon:[['10:00','18:00']],tue:[]},timezone:'Europe/Madrid',restaurant_id:10};
    const hashA=await c.window.hoyMerchantConfirmationSha256Hex248(payloadA);
    const hashB=await c.window.hoyMerchantConfirmationSha256Hex248(payloadB);
    assert.strictEqual(hashA,hashB,'canonical object key order must be stable');
    assert.match(hashA,/^[0-9a-f]{64}$/);

    const result=await c.window.hoyRecordRightsBackedBusinessConfirmation248({
      restaurantId:10,
      confirmationType:'hours',
      subjectType:'restaurant_live_hours',
      subjectRef:'restaurant:10:weekly_hours',
      payload:payloadA,
      evidence:{confirmation_mode:'confirm',email:'blocked@example.com',operator_name:'blocked',factual_confirmed_at:'2026-08-19T00:00:00Z'}
    });
    assert.strictEqual(result.recorded,true);
    assert.strictEqual(calls.length,2);
    assert.strictEqual(calls[1][0],'operator_record_business_confirmation');
    const args=calls[1][1];
    assert.strictEqual(args.p_source_channel,'operator_dashboard');
    assert.strictEqual(args.p_payload_sha256,hashA);
    assert.strictEqual(args.p_confirmation_type,'hours');
    assert.strictEqual(args.p_subject_type,'restaurant_live_hours');
    assert.strictEqual(args.p_subject_ref,'restaurant:10:weekly_hours');
    assert.strictEqual(args.p_evidence.email,undefined);
    assert.strictEqual(args.p_evidence.operator_name,undefined);
    assert.strictEqual(args.p_evidence.confirmation_mode,'confirm');
    assert.strictEqual(args.p_evidence.payload_schema,'hoy-merchant-confirmation-v1');
  }

  {
    const c=load(async(name)=>{
      if(name==='get_business_terms_status')return {data:{gate_configured:true,status:'accepted'},error:null};
      return {data:null,error:new Error('write_failed')};
    });
    const result=await c.window.hoyRecordRightsBackedBusinessConfirmation248({restaurantId:9,confirmationType:'hours',subjectType:'restaurant_live_hours',subjectRef:'restaurant:9:weekly_hours',payload:{restaurant_id:9,timezone:'Europe/Madrid',weekly_hours:{mon:[['10:00','18:00']]},display_text:'Mo'}});
    assert.deepStrictEqual(JSON.parse(JSON.stringify(result)),{recorded:false,reason:'receipt_write_failed'});
  }

  const operator=fs.readFileSync('operator-data-confirmation-2.29.js','utf8');
  assert(operator.includes('hoyRecordRightsBackedBusinessConfirmation248'));
  assert(operator.includes("confirmationType:'hours'"));
  assert(operator.includes("subjectType:'restaurant_live_hours'"));
  assert(operator.includes("subjectRef:`restaurant:${Number(p.id)}:weekly_hours`"));
  assert(operator.includes('result?.live_hours'));

  const contract=JSON.parse(fs.readFileSync('docs/investor-ready/acq05-merchant-first-party-confirmation-v1.json','utf8'));
  assert.strictEqual(contract.claimBoundary.factualConfirmationImpliesRightsClearance,false);
  assert.strictEqual(contract.claimBoundary.rightsReceiptRequiresActiveAcceptedBusinessTerms,true);
  assert.strictEqual(contract.referenceImplementation.receiptFailureBlocksFreeFactualConfirmation,false);
  assert.strictEqual(contract.fieldRollout.filter(x=>x.rightsReceiptPath==='IMPLEMENTED_CANDIDATE_NOT_LIVE').length,1);

  console.log('ACQ-05 merchant confirmation tests: GREEN');
})().catch(err=>{console.error(err);process.exit(1)});

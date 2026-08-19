/* HOY 2.48.0 — terms-gated rights-backed merchant confirmation receipts */
(function(){
  if(window.__hoyMerchantConfirmationReceipt248)return;
  window.__hoyMerchantConfirmationReceipt248=true;
  window.hoyMerchantConfirmationReceiptVersion='2.48.0';

  const PII_KEY=/email|phone|name|address|note|message|user|contact|person/i;

  function canonicalJson(value){
    if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
    if(typeof value==='number'){
      if(!Number.isFinite(value))throw new Error('non_finite_number');
      return JSON.stringify(value);
    }
    if(Array.isArray(value))return `[${value.map(canonicalJson).join(',')}]`;
    if(value&&typeof value==='object'){
      const keys=Object.keys(value).filter(k=>value[k]!==undefined).sort();
      return `{${keys.map(k=>`${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
    }
    throw new Error('unsupported_canonical_value');
  }

  async function sha256Hex(value){
    const bytes=new TextEncoder().encode(canonicalJson(value));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  function safeEvidence(input={}){
    const out={payload_schema:'hoy-merchant-confirmation-v1',source_module:'merchant-confirmation-receipt-2.48'};
    for(const [key,value] of Object.entries(input||{})){
      if(PII_KEY.test(key))continue;
      if(['string','number','boolean'].includes(typeof value))out[key]=String(value).slice(0,120);
    }
    return out;
  }

  async function rpc(name,args){
    if(typeof sb==='undefined'||!sb||typeof sb.rpc!=='function')throw new Error('supabase_unavailable');
    const {data,error}=await sb.rpc(name,args);
    if(error)throw error;
    return data;
  }

  async function record({restaurantId,confirmationType,subjectType,subjectRef,payload,evidence={}}={}){
    const id=Number(restaurantId);
    if(!Number.isInteger(id)||id<1)return {recorded:false,reason:'invalid_restaurant'};
    if(typeof cloud==='undefined'||!cloud?.user)return {recorded:false,reason:'login_required'};
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return {recorded:false,reason:'invalid_payload'};

    let terms;
    try{terms=await rpc('get_business_terms_status',{p_restaurant_id:id})}
    catch(err){console.warn('HOY ACQ-05 terms status unavailable',err?.message||err);return {recorded:false,reason:'terms_status_unavailable'}}

    if(terms?.gate_configured!==true)return {recorded:false,reason:'business_terms_not_active'};
    if(terms?.status!=='accepted')return {recorded:false,reason:'business_terms_acceptance_required'};

    let hash;
    try{hash=await sha256Hex(payload)}catch(err){return {recorded:false,reason:err?.message||'payload_hash_failed'}}

    const args={
      p_restaurant_id:id,
      p_confirmation_type:String(confirmationType||''),
      p_subject_type:String(subjectType||''),
      p_subject_ref:String(subjectRef||''),
      p_payload_sha256:hash,
      p_source_channel:'operator_dashboard',
      p_evidence:safeEvidence(evidence)
    };

    try{
      const receipt=await rpc('operator_record_business_confirmation',args);
      if(!receipt?.ok||!receipt?.confirmation_id)return {recorded:false,reason:'receipt_not_acknowledged'};
      return {recorded:true,payload_sha256:hash,receipt};
    }catch(err){
      console.warn('HOY ACQ-05 rights receipt failed',err?.message||err);
      return {recorded:false,reason:'receipt_write_failed'};
    }
  }

  window.hoyMerchantConfirmationCanonicalJson248=canonicalJson;
  window.hoyMerchantConfirmationSha256Hex248=sha256Hex;
  window.hoyMerchantConfirmationSafeEvidence248=safeEvidence;
  window.hoyRecordRightsBackedBusinessConfirmation248=record;
})();

import { createClient } from 'npm:@supabase/supabase-js@2.111.0'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})
const STATES=new Set(['yes','no','unknown'])
const clean=(v:unknown)=>String(v??'').trim()
function state(v:unknown,allowUnknown=true){const x=clean(v);return STATES.has(x)&&(allowUnknown||x!=='unknown')?x:null}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return json({error:'method_not_allowed'},405)

  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
  if(!token)return json({error:'unauthorized'},401)
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const {data:{user},error:userError}=await admin.auth.getUser(token)
  if(userError||!user)return json({error:'unauthorized'},401)

  const body=await req.json().catch(()=>null)
  const action=clean(body?.action)
  const restaurantId=Number(body?.restaurant_id)
  if(!Number.isInteger(restaurantId)||restaurantId<1||!['confirm','correct'].includes(action))return json({error:'invalid_fields'},400)

  const [{data:membership,error:membershipError},{data:entitlement,error:entitlementError}]=await Promise.all([
    admin.from('restaurant_memberships').select('restaurant_id,user_id,verified_at').eq('restaurant_id',restaurantId).eq('user_id',user.id).maybeSingle(),
    admin.from('restaurant_entitlements').select('restaurant_id,operator_verified,active_plan').eq('restaurant_id',restaurantId).maybeSingle(),
  ])
  if(membershipError||entitlementError)return json({error:'authorization_lookup_failed'},500)
  if(!membership?.verified_at||!entitlement?.operator_verified)return json({error:'verified_operator_required'},403)

  const {data:restaurant,error:restaurantError}=await admin.from('restaurants').select('id,name,is_published').eq('id',restaurantId).eq('is_published',true).maybeSingle()
  if(restaurantError)return json({error:'restaurant_lookup_failed'},500)
  if(!restaurant)return json({error:'restaurant_not_found'},404)

  const {data:before,error:beforeError}=await admin.from('restaurant_accessibility').select('*').eq('restaurant_id',restaurantId).maybeSingle()
  if(beforeError)return json({error:'accessibility_lookup_failed'},500)

  let entrance:string|null,seating:string|null,toilet:string|null,parking:string|null,hearing:string|null
  if(action==='confirm'){
    if(!before)return json({error:'no_prepared_accessibility'},400)
    entrance=state(before.wheelchair_entrance_state,false)
    seating=state(before.wheelchair_seating_state,false)
    toilet=state(before.wheelchair_toilet_state,false)
    parking=state(before.accessible_parking_state,true)
    hearing=state(before.hearing_loop_state,true)
    if(!entrance||!seating||!toilet)return json({error:'accessibility_completion_required'},409)
  }else{
    const x=body?.states||{}
    entrance=state(x.wheelchair_entrance_state,false)
    seating=state(x.wheelchair_seating_state,false)
    toilet=state(x.wheelchair_toilet_state,false)
    parking=state(x.accessible_parking_state,true)
    hearing=state(x.hearing_loop_state,true)
    if(!entrance||!seating||!toilet||!parking||!hearing)return json({error:'invalid_accessibility_states'},400)
  }

  const note=clean(body?.note).slice(0,600)||null
  const now=new Date().toISOString()
  const payload={
    restaurant_id:restaurantId,
    wheelchair_entrance_state:entrance,
    wheelchair_seating_state:seating,
    wheelchair_toilet_state:toilet,
    accessible_parking_state:parking,
    hearing_loop_state:hearing,
    verification_source:'operator',
    source_url:null,
    source_label:'Vom verifizierten Betrieb bestätigt',
    evidence_type:'Direkte Betreiberbestätigung',
    secondary_note:null,
    accessibility_note:note,
    checked_at:now,
    operator_confirmed_at:now,
    updated_at:now,
  }
  const {data:saved,error:saveError}=await admin.from('restaurant_accessibility').upsert(payload,{onConflict:'restaurant_id'}).select('restaurant_id,wheelchair_entrance_state,wheelchair_seating_state,wheelchair_toilet_state,accessible_parking_state,hearing_loop_state,overall_status,verification_source,source_label,evidence_type,accessibility_note,checked_at,operator_confirmed_at,updated_at').single()
  if(saveError)return json({error:'accessibility_save_failed'},400)

  const {error:auditError}=await admin.from('audit_logs').insert({
    restaurant_id:restaurantId,
    actor_user_id:user.id,
    action:action==='confirm'?'operator_accessibility_confirmed_free':'operator_accessibility_corrected_free',
    entity_type:'restaurant_accessibility',
    entity_id:String(restaurantId),
    before_data:before||null,
    after_data:{...saved,confirmation_mode:action,plan_at_confirmation:entitlement.active_plan},
  })
  if(auditError)console.error('HOY accessibility audit failed',auditError)
  return json({ok:true,action,accessibility:saved,audit_logged:!auditError})
})

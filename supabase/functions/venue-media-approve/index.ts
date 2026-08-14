import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const allowedTypes=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
const MAX_IMAGE_BYTES=10*1024*1024;
const MAX_REDIRECTS=4;
const FETCH_TIMEOUT_MS=18000;
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}
function extFromPath(path:string){const m=path.toLowerCase().match(/\.(jpe?g|png|webp)$/);return m?(m[1]==="jpeg"?"jpg":m[1]):"jpg"}
function private4(h:string){
  const m=h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);if(!m)return false;
  const p=m.slice(1).map(Number);if(p.some(x=>x<0||x>255))return true;
  const[a,b,c]=p;
  return a===0||a===10||a===127||a>=224||
    (a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||
    (a===192&&b===0)||(a===192&&b===168)||(a===198&&(b===18||b===19))||
    (a===198&&b===51&&c===100)||(a===203&&b===0&&c===113);
}
function private6(h:string){
  h=h.toLowerCase().replace(/^\[|\]$/g,"");
  return h==="::"||h==="::1"||h.startsWith("::ffff:")||h.startsWith("fc")||h.startsWith("fd")||
    /^fe[89ab]/.test(h)||h.startsWith("ff")||h.startsWith("2001:db8:");
}
async function publicHttps(raw:string){
  let u:URL;try{u=new URL(raw)}catch{throw new Error("invalid_asset_url")}
  if(u.protocol!=="https:")throw new Error("https_required");
  const h=u.hostname.toLowerCase();
  if(!h||h==="localhost"||h.endsWith(".local")||h.endsWith(".internal")||private4(h)||private6(h))throw new Error("private_target");
  const resolved=await Promise.allSettled([Deno.resolveDns(h,"A"),Deno.resolveDns(h,"AAAA")]);
  const ips=resolved.flatMap(x=>x.status==="fulfilled"?x.value:[]);
  if(!ips.length)throw new Error("dns_unresolved");
  if(ips.some(ip=>private4(ip)||private6(ip)))throw new Error("private_dns_target");
  return u;
}
async function fetchPublicImage(raw:string){
  let u=await publicHttps(raw);
  for(let redirect=0;redirect<=MAX_REDIRECTS;redirect++){
    const response=await fetch(u,{redirect:"manual",headers:{"User-Agent":"HOY-Media-Ingest/1.1","Accept":"image/jpeg,image/png,image/webp"},signal:AbortSignal.timeout(FETCH_TIMEOUT_MS)});
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.get("location");await response.body?.cancel().catch(()=>{});
      if(!location)throw new Error("redirect_without_location");
      if(redirect===MAX_REDIRECTS)throw new Error("too_many_redirects");
      u=await publicHttps(new URL(location,u).href);continue;
    }
    if(!response.ok){await response.body?.cancel().catch(()=>{});throw new Error(`source_http_${response.status}`)}
    const declared=Number(response.headers.get("content-length")||0);
    if(declared>MAX_IMAGE_BYTES){await response.body?.cancel().catch(()=>{});throw new Error("invalid_image_size")}
    const contentType=(response.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();const ext=allowedTypes.get(contentType);
    if(!ext){await response.body?.cancel().catch(()=>{});throw new Error("unsupported_image_type")}
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)throw new Error("invalid_image_size");
    return {bytes,contentType,ext,url:u.href};
  }
  throw new Error("too_many_redirects");
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  try{
    const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!anon||!serviceKey)return json({error:"server_config_missing"},500);
    const authorization=req.headers.get("Authorization")||"";
    const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
    const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:authData,error:authError}=await userClient.auth.getUser();const user=authData?.user;
    if(authError||!user)return json({error:"unauthorized"},401);

    const body=await req.json().catch(()=>({}));
    const restaurantId=Number(body.restaurant_id);
    const approvedIds=Array.isArray(body.approved_ids)?body.approved_ids.map(Number).filter(Number.isFinite):[];
    const rejectedIds=Array.isArray(body.rejected_ids)?body.rejected_ids.map(Number).filter(Number.isFinite):[];
    const replaceIds=Array.isArray(body.replace_ids)?body.replace_ids.map(Number).filter(Number.isFinite):[];
    if(!Number.isFinite(restaurantId))return json({error:"invalid_restaurant"},400);

    const {data:review,error:reviewError}=await userClient.rpc("review_venue_media_candidates",{
      p_restaurant_id:restaurantId,p_approved_ids:approvedIds,p_rejected_ids:rejectedIds,p_replace_ids:replaceIds
    });
    if(reviewError)return json({error:reviewError.message},403);

    const published:Array<Record<string,unknown>>=[];
    const skipped:Array<Record<string,unknown>>=[];
    const allIds=[...new Set([...approvedIds,...replaceIds])];
    if(!allIds.length)return json({ok:true,review,published,skipped});

    const {data:candidates,error:candidateError}=await service.from("venue_media_candidates")
      .select("id,restaurant_id,asset_url,source_page_url,intended_role,candidate_rank,operator_decision,candidate_status,published_media_asset_id,published_storage_path")
      .eq("restaurant_id",restaurantId).in("id",allIds);
    if(candidateError)return json({error:candidateError.message},500);

    async function archivePrior(candidateId:number){
      const {data:oldRows}=await service.from("media_assets").select("id,storage_bucket,storage_path").eq("restaurant_id",restaurantId).eq("candidate_id",candidateId).eq("status","published");
      if(oldRows?.length){
        await service.from("media_assets").update({status:"archived"}).in("id",oldRows.map(x=>x.id));
        const publicPaths=oldRows.filter(x=>x.storage_bucket==="venue-media").map(x=>x.storage_path);
        if(publicPaths.length)await service.storage.from("venue-media").remove(publicPaths);
      }
    }
    async function publishBytes(candidate:any,bytes:Uint8Array,contentType:string,ext:string,rightsBasis:string,sourceUrl:string|null,suffix=""){
      const path=`${restaurantId}/${candidate.id}${suffix}.${ext}`;
      const {error:uploadError}=await service.storage.from("venue-media").upload(path,bytes,{contentType,upsert:true,cacheControl:"3600"});
      if(uploadError)throw new Error(`upload_failed:${uploadError.message}`);
      await archivePrior(Number(candidate.id));
      const {data:media,error:mediaError}=await service.from("media_assets").insert({
        restaurant_id:restaurantId,uploaded_by:user.id,storage_bucket:"venue-media",storage_path:path,kind:"restaurant",
        display_role:candidate.intended_role||"gallery",sort_order:Number(candidate.candidate_rank)||100,rights_basis:rightsBasis,
        rights_confirmed:true,attribution:null,source_url:sourceUrl,status:"published",candidate_id:Number(candidate.id)
      }).select("id").single();
      if(mediaError)throw new Error(`media_record_failed:${mediaError.message}`);
      await service.from("venue_media_candidates").update({
        is_public:true,candidate_status:suffix?"replaced":"published",rights_status:"operator_approved",operator_decision:"approved",
        published_storage_path:path,published_media_asset_id:media.id,updated_at:new Date().toISOString()
      }).eq("id",candidate.id).eq("restaurant_id",restaurantId);
      const publicUrl=service.storage.from("venue-media").getPublicUrl(path).data.publicUrl;
      return {candidate_id:candidate.id,public_url:publicUrl,reused:false,replacement:!!suffix};
    }

    for(const candidate of candidates||[]){
      const cid=Number(candidate.id);
      if(replaceIds.includes(cid)){
        const {data:replacement,error:replacementError}=await service.from("media_assets")
          .select("id,storage_bucket,storage_path,display_role,sort_order,rights_confirmed,status,created_at")
          .eq("restaurant_id",restaurantId).eq("candidate_id",cid).eq("uploaded_by",user.id).eq("status","pending").eq("rights_confirmed",true)
          .order("created_at",{ascending:false}).limit(1).maybeSingle();
        if(replacementError){skipped.push({candidate_id:cid,reason:`replacement_lookup_failed:${replacementError.message}`});continue}
        if(!replacement){skipped.push({candidate_id:cid,reason:"replacement_upload_missing"});continue}
        const {data:blob,error:downloadError}=await service.storage.from(replacement.storage_bucket||"owner-media").download(replacement.storage_path);
        if(downloadError||!blob){skipped.push({candidate_id:cid,reason:`replacement_download_failed:${downloadError?.message||"missing"}`});continue}
        const contentType=(blob.type||"image/jpeg").split(";")[0].toLowerCase();const ext=allowedTypes.get(contentType)||extFromPath(replacement.storage_path);
        const bytes=new Uint8Array(await blob.arrayBuffer());
        if(!bytes.length||bytes.length>MAX_IMAGE_BYTES){skipped.push({candidate_id:cid,reason:"invalid_replacement_size"});continue}
        try{
          const item=await publishBytes(candidate,bytes,contentType,ext,"operator_upload_confirmed",null,"-replacement");published.push(item);
          await service.from("media_assets").update({status:"archived"}).eq("id",replacement.id);
        }catch(error){skipped.push({candidate_id:cid,reason:error instanceof Error?error.message:String(error)})}
        continue;
      }

      if(!approvedIds.includes(cid))continue;
      if(candidate.published_media_asset_id&&candidate.published_storage_path){
        const publicUrl=service.storage.from("venue-media").getPublicUrl(candidate.published_storage_path).data.publicUrl;
        published.push({candidate_id:cid,public_url:publicUrl,reused:true});continue;
      }
      if(candidate.operator_decision!=="approved"){skipped.push({candidate_id:cid,reason:"not_approved"});continue}
      if(!candidate.asset_url){skipped.push({candidate_id:cid,reason:"source_approved_asset_selection_pending"});continue}

      try{
        const fetched=await fetchPublicImage(String(candidate.asset_url));
        published.push(await publishBytes(candidate,fetched.bytes,fetched.contentType,fetched.ext,"operator_approved_official_source",candidate.source_page_url||fetched.url));
      }catch(error){skipped.push({candidate_id:cid,reason:error instanceof Error?error.message:String(error)})}
    }

    return json({ok:true,review,published,skipped});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});

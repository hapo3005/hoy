import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const allowedTypes=new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"]]);
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:cors})}
function extFromPath(path:string){const m=path.toLowerCase().match(/\.(jpe?g|png|webp)$/);return m?(m[1]==="jpeg"?"jpg":m[1]):"jpg"}

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
        if(!bytes.length||bytes.length>10*1024*1024){skipped.push({candidate_id:cid,reason:"invalid_replacement_size"});continue}
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

      let asset:URL;try{asset=new URL(candidate.asset_url)}catch{skipped.push({candidate_id:cid,reason:"invalid_asset_url"});continue}
      if(asset.protocol!=="https:"){skipped.push({candidate_id:cid,reason:"https_required"});continue}
      const sourceResponse=await fetch(asset.toString(),{redirect:"follow",headers:{"User-Agent":"HOY-Media-Ingest/1.0"}});
      if(!sourceResponse.ok){skipped.push({candidate_id:cid,reason:`source_http_${sourceResponse.status}`});continue}
      const contentType=(sourceResponse.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();const ext=allowedTypes.get(contentType);
      if(!ext){skipped.push({candidate_id:cid,reason:"unsupported_image_type"});continue}
      const bytes=new Uint8Array(await sourceResponse.arrayBuffer());
      if(!bytes.length||bytes.length>10*1024*1024){skipped.push({candidate_id:cid,reason:"invalid_image_size"});continue}
      try{published.push(await publishBytes(candidate,bytes,contentType,ext,"operator_approved_official_source",candidate.source_page_url||null))}
      catch(error){skipped.push({candidate_id:cid,reason:error instanceof Error?error.message:String(error)})}
    }

    return json({ok:true,review,published,skipped});
  }catch(error){return json({error:error instanceof Error?error.message:String(error)},500)}
});

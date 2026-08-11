/* HOY 2.21.0 — provenance-aware opening-hours loading and conservative NOW gate */
(function(){
  const baseLoadCloudRestaurants=loadCloudRestaurants;

  loadCloudRestaurants=async function(){
    const {data,error}=await sb.from('restaurants').select('id,slug,name,area,description,address,phone,website,hours_text,hours_weekly,hours_status,hours_source_url,hours_source_label,hours_checked_at,hours_note,latitude,longitude,is_published,restaurant_services(reservation_state,pickup_state,delivery_state),restaurant_entitlements(operator_verified,active_plan)').eq('is_published',true).order('id');
    if(error){
      // Backward-compatible fallback for a deployment race where the schema migration is not visible yet.
      return baseLoadCloudRestaurants();
    }
    DATA=(data||[]).map(row=>{
      const base=LOCAL_DATA.find(x=>Number(x.id)===Number(row.id))||{};
      const svc=Array.isArray(row.restaurant_services)?row.restaurant_services[0]:row.restaurant_services||{};
      const ent=Array.isArray(row.restaurant_entitlements)?row.restaurant_entitlements[0]:row.restaurant_entitlements||{};
      const displayHours=row.hours_text||base.hours||'';
      const status=row.hours_status||'missing';
      // now-status-2.19 consumes p.hours_text. Only verified base schedules are exposed there.
      // Conditional, contradictory, missing and merely reviewed legacy data remain display-only.
      const nowHours=status==='verified'?(row.hours_text||''):'';
      return {
        ...base,
        id:Number(row.id),slug:row.slug,name:row.name,area:row.area,
        description:row.description||base.description||'',address:row.address||base.address||'',
        phone:row.phone||base.phone||'',website:row.website||base.website||'',
        hours:displayHours,hours_text:nowHours,hours_raw_text:row.hours_text||'',
        hours_weekly:row.hours_weekly||null,hours_status:status,
        hours_source_url:row.hours_source_url||'',hours_source_label:row.hours_source_label||'',
        hours_checked_at:row.hours_checked_at||null,hours_note:row.hours_note||'',
        latitude:row.latitude?Number(row.latitude):null,longitude:row.longitude?Number(row.longitude):null,
        reservation:legacyService(svc.reservation_state),pickup:legacyService(svc.pickup_state),delivery:legacyService(svc.delivery_state),
        operator_verified:!!ent.operator_verified,active_plan:ent.active_plan||'free',cloud:true
      };
    });
    cloud.restaurantCount=DATA.length;
  };
})();

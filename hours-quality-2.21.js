/* HOY 2.21.0 — provenance-aware opening-hours loading and conservative NOW gate */
(function(){
  const baseLoadCloudRestaurants=loadCloudRestaurants;

  loadCloudRestaurants=async function(){
    // Always preserve the complete loader chain first. Later feature releases (events,
    // promotions, etc.) wrap loadCloudRestaurants too and must never be bypassed.
    await baseLoadCloudRestaurants();
    if(!sb)return;

    const {data,error}=await sb.from('restaurants')
      .select('id,hours_text,hours_weekly,hours_status,hours_source_url,hours_source_label,hours_checked_at,hours_note')
      .eq('is_published',true)
      .order('id');

    if(error){
      // If provenance is temporarily unavailable, preserve all other cloud data but fail
      // closed for NOW: without a verified status we do not infer a live open/closed state.
      DATA=(DATA||[]).map(p=>({
        ...p,
        hours_raw_text:p.hours_raw_text||p.hours_text||p.hours||'',
        hours_text:'',
        hours_status:'missing'
      }));
      console.warn('HOY opening-hours provenance unavailable; NOW disabled',error);
      return;
    }

    const hoursById=new Map((data||[]).map(row=>[Number(row.id),row]));
    DATA=(DATA||[]).map(p=>{
      const row=hoursById.get(Number(p.id));
      if(!row)return p;
      const status=row.hours_status||'missing';
      const displayHours=row.hours_text||p.hours||'';
      // now-status-2.19 consumes p.hours_text. Only verified base schedules are exposed there.
      // Conditional, contradictory, missing and merely reviewed legacy data remain display-only.
      const nowHours=status==='verified'?(row.hours_text||''):'';
      return {
        ...p,
        hours:displayHours,
        hours_text:nowHours,
        hours_raw_text:row.hours_text||'',
        hours_weekly:row.hours_weekly||null,
        hours_status:status,
        hours_source_url:row.hours_source_url||'',
        hours_source_label:row.hours_source_label||'',
        hours_checked_at:row.hours_checked_at||null,
        hours_note:row.hours_note||''
      };
    });
    cloud.restaurantCount=DATA.length;
  };
})();
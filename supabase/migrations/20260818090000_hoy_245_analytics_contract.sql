-- HOY 2.45 — keep the anonymous analytics RPC fail-closed while aligning
-- the complete current client event vocabulary with the server allowlist.
--
-- This migration intentionally does NOT widen the RPC to arbitrary event names.
-- QA is blocked twice: the client should never call this RPC, and the RPC itself
-- silently discards explicitly marked QA traffic before any analytics insert.

create or replace function public.log_analytics_event(
  p_event_type text,
  p_restaurant_id bigint,
  p_anonymous_id uuid,
  p_session_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  request_qa text := lower(coalesce(request_headers->>'x-hoy-qa', ''));
  request_user_agent text := lower(coalesce(request_headers->>'user-agent', ''));
begin
  -- Defense in depth for automated QA. The Playwright client is expected not to
  -- call this RPC at all; this gate protects production metrics if that client
  -- invariant regresses. Headless Chromium is also discarded as a second guard.
  if request_qa in ('1','true','yes') or request_user_agent like '%headlesschrome%' then
    return;
  end if;

  if p_event_type is null or p_event_type not in (
    'profile_view','menu_view','route_start','service_open','call_click','website_open',
    'favorite_toggle','search','filter_change','map_open','reservation_start','qr_open',
    'live_plan_add','live_plan_remove','live_plan_clear','live_nearby_enabled',
    'map_focus','promotion_impression','promotion_open',
    'family_context_open','family_filter','family_situation_open'
  ) then
    raise exception 'Unsupported analytics event type';
  end if;

  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Analytics metadata must be an object';
  end if;

  if p_metadata is not null and pg_column_size(p_metadata) > 4096 then
    raise exception 'Analytics metadata too large';
  end if;

  if p_restaurant_id is not null and not exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id and r.is_published
  ) then
    raise exception 'Unknown or unpublished restaurant';
  end if;

  insert into public.analytics_events
    (restaurant_id,event_type,anonymous_id,session_id,metadata)
  values
    (p_restaurant_id,p_event_type,p_anonymous_id,p_session_id,coalesce(p_metadata,'{}'::jsonb));
end;
$$;

revoke all on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) from public;
grant execute on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) to anon, authenticated;

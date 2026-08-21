begin transaction read only;

with published as (
  select id
  from public.restaurants
  where is_published = true
),
prepared_hours as (
  select id
  from public.restaurants
  where is_published = true
    and hours_weekly is not null
    and jsonb_typeof(hours_weekly) = 'object'
),
verified_memberships as (
  select distinct restaurant_id
  from public.restaurant_memberships
  where verified_at is not null
),
live_hours as (
  select
    restaurant_id,
    confirmed_at,
    case
      when confirmed_at is null then 'unconfirmed'
      when confirmed_at >= now() - interval '30 days' then 'within_30d'
      else 'stale_30d'
    end as freshness_band
  from public.restaurant_live_hours
),
services as (
  select
    restaurant_id,
    confirmed_at,
    case
      when confirmed_at is null then 'unconfirmed'
      when confirmed_at >= now() - interval '30 days' then 'within_30d'
      else 'stale_30d'
    end as freshness_band
  from public.restaurant_services
),
accessibility as (
  select
    restaurant_id,
    operator_confirmed_at,
    case
      when operator_confirmed_at is null then 'unconfirmed'
      when operator_confirmed_at >= now() - interval '90 days' then 'within_90d'
      else 'stale_90d'
    end as freshness_band
  from public.restaurant_accessibility
),
summary as (
  select jsonb_build_object(
    'published_gastro_businesses', (select count(*) from published),
    'prepared_weekly_hours_businesses', (select count(*) from prepared_hours),
    'memberships', (select count(*) from public.restaurant_memberships),
    'verified_memberships', (select count(*) from public.restaurant_memberships where verified_at is not null),
    'verified_businesses', (select count(*) from verified_memberships),
    'live_hours_rows', (select count(*) from live_hours),
    'live_hours_confirmed', (select count(*) from live_hours where confirmed_at is not null),
    'live_hours_within_30d', (select count(*) from live_hours where freshness_band = 'within_30d'),
    'service_rows', (select count(*) from services),
    'services_confirmed', (select count(*) from services where confirmed_at is not null),
    'services_within_30d', (select count(*) from services where freshness_band = 'within_30d'),
    'accessibility_rows', (select count(*) from accessibility),
    'accessibility_operator_confirmed', (select count(*) from accessibility where operator_confirmed_at is not null),
    'business_terms_versions', (select count(*) from private.business_terms_versions),
    'active_business_terms_versions', (select count(*) from private.business_terms_versions where status = 'active'),
    'business_terms_acceptances', (select count(*) from private.business_terms_acceptances),
    'rights_backed_business_confirmations', (select count(*) from private.business_data_confirmations)
  ) as snapshot
)
select * from summary;

-- Operational queue. This does not authorize contact or membership creation.
select
  r.id as restaurant_id,
  r.name,
  (r.hours_weekly is not null and jsonb_typeof(r.hours_weekly) = 'object') as prepared_weekly_hours,
  (vm.restaurant_id is not null) as has_verified_membership,
  lh.confirmed_at as latest_hours_confirmation,
  case
    when vm.restaurant_id is null then 'BLOCKED_NO_VERIFIED_MEMBERSHIP'
    when lh.confirmed_at is null then 'READY_FOR_GENUINE_FIRST_CONFIRMATION'
    when lh.confirmed_at >= now() - interval '30 days' then 'CURRENT_WITHIN_30D'
    else 'RECONFIRMATION_DUE'
  end as confirmation_state
from public.restaurants r
left join verified_memberships vm on vm.restaurant_id = r.id
left join public.restaurant_live_hours lh on lh.restaurant_id = r.id
where r.is_published = true
order by
  case
    when vm.restaurant_id is not null and lh.confirmed_at is null then 1
    when vm.restaurant_id is not null and lh.confirmed_at < now() - interval '30 days' then 2
    when r.hours_weekly is not null then 3
    else 4
  end,
  r.name;

rollback;

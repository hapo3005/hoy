-- ACQ-05 merchant first-party confirmation readiness audit.
-- SELECT-only. No DDL/DML. Run against Production only for read-only verification.

select
  'terms_and_receipts' as section,
  (select count(*) from private.business_terms_versions) as terms_versions,
  (select count(*) from private.business_terms_versions where status='active' and effective_at is not null and effective_at<=now()) as active_terms_versions,
  (select count(*) from private.business_terms_acceptances where revoked_at is null and superseded_at is null) as active_terms_acceptances,
  (select count(*) from private.business_data_confirmations) as business_data_confirmations,
  (select count(*) from private.business_data_confirmations where status='active') as active_business_data_confirmations;

select
  'factual_confirmation' as section,
  (select count(*) from public.restaurant_live_hours where confirmed_at is not null) as live_hours_confirmed,
  (select count(*) from public.restaurant_services where confirmed_at is not null) as services_confirmed,
  (select count(*) from public.restaurant_profile_change_requests) as profile_change_requests,
  (select count(*) from public.restaurant_profile_change_requests where status='approved' and applied_at is not null) as profile_change_approved_applied;

select
  c.conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid=c.conrelid
join pg_namespace n on n.oid=t.relnamespace
where n.nspname='private'
  and t.relname='business_data_confirmations'
order by c.conname;

select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef,
  coalesce(array_to_string(p.proacl,E'\n'),'') as acl
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where p.proname in (
  'operator_record_business_confirmation',
  'operator_record_business_confirmation_internal',
  'get_business_terms_status',
  'get_business_terms_status_internal',
  'has_active_business_terms'
)
order by n.nspname,p.proname;

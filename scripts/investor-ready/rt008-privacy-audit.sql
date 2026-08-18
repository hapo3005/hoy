-- HOY RT-008 — READ ONLY privacy / GDPR DD audit.
-- Safe against the candidate privacy columns not existing yet by inspecting rows as jsonb.

-- 1) Current Gastro privacy-bearing data volumes.
select 'analytics_events' as dataset, count(*)::bigint as rows from public.analytics_events
union all select 'business_claims', count(*) from public.business_claims
union all select 'restaurant_memberships', count(*) from public.restaurant_memberships
union all select 'menu_intake_submissions', count(*) from public.menu_intake_submissions
union all select 'restaurant_profile_change_requests', count(*) from public.restaurant_profile_change_requests
union all select 'venue_sales_pipeline', count(*) from public.venue_sales_pipeline
order by dataset;

-- 2) Analytics pseudonymous identifier/time window.
select
  count(*)::bigint as events,
  count(distinct anonymous_id)::bigint as anonymous_ids,
  count(distinct session_id)::bigint as sessions,
  min(occurred_at) as earliest_event,
  max(occurred_at) as latest_event
from public.analytics_events;

-- 3) Analytics metadata key inventory — review every new key for minimisation.
select key, count(*)::bigint as events_with_key
from public.analytics_events
cross join lateral jsonb_object_keys(coalesce(metadata,'{}'::jsonb)) key
group by key
order by events_with_key desc, key;

-- 4) Indirect B2B contact inventory / Article 14 clock.
with p as (
  select *, to_jsonb(v) as j
  from public.venue_sales_pipeline v
), contacts as (
  select *,
    coalesce(nullif(btrim(contact_person),''),nullif(btrim(contact_phone),''),nullif(btrim(contact_email),'')) is not null as has_personal_contact,
    nullif(j->>'privacy_notice_at','')::timestamptz as privacy_notice_at_j,
    nullif(j->>'personal_contact_expires_at','')::timestamptz as personal_contact_expires_at_j,
    coalesce(nullif(j->>'privacy_suppressed','')::boolean,false) as privacy_suppressed_j
  from p
)
select
  count(*) filter (where has_personal_contact)::bigint as personal_contact_rows,
  min(contact_researched_at) filter (where has_personal_contact) as earliest_researched,
  min(contact_researched_at + interval '1 month') filter (where has_personal_contact) as earliest_one_month_control_date,
  count(*) filter (
    where has_personal_contact
      and contact_researched_at is not null
      and contact_researched_at + interval '1 month' <= now() + interval '7 days'
      and privacy_notice_at_j is null
      and not privacy_suppressed_j
  )::bigint as notice_or_purge_due_within_7d,
  count(*) filter (
    where has_personal_contact
      and contact_researched_at is not null
      and contact_researched_at + interval '1 month' < now()
      and privacy_notice_at_j is null
      and not privacy_suppressed_j
  )::bigint as overdue_without_notice_or_suppression,
  count(*) filter (where privacy_suppressed_j)::bigint as suppressed_rows,
  count(*) filter (where personal_contact_expires_at_j is not null and personal_contact_expires_at_j < now())::bigint as expired_personal_contacts
from contacts;

-- 5) Candidate privacy columns present?
select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='venue_sales_pipeline'
  and column_name in (
    'privacy_notice_at','privacy_notice_basis','privacy_objection_at',
    'privacy_suppressed','personal_contact_expires_at','privacy_reviewed_at','privacy_review_note'
  )
order by column_name;

-- 6) RLS coverage on key privacy-bearing application tables.
select c.relname as table_name, c.relrowsecurity as rls_enabled, count(p.policyname)::bigint as policy_count
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
left join pg_policies p on p.schemaname=n.nspname and p.tablename=c.relname
where n.nspname='public'
  and c.relname in (
    'analytics_events','audit_logs','business_claims','hoy_admin_accounts',
    'menu_intake_submissions','restaurant_memberships','restaurant_profile_change_requests',
    'venue_sales_pipeline'
  )
group by c.relname,c.relrowsecurity
order by c.relname;

-- 7) Send-lock/privacy invariant. Existing global send_lock remains binding.
select
  count(*)::bigint as total,
  count(*) filter (where send_lock is true)::bigint as locked,
  count(*) filter (where send_lock is false)::bigint as unlocked,
  count(*) filter (
    where coalesce(nullif(to_jsonb(v)->>'privacy_suppressed','')::boolean,false)
      and send_lock is false
  )::bigint as privacy_suppressed_but_unlocked
from public.venue_sales_pipeline v;

-- 8) No unexpected obvious PII keys in analytics metadata.
select distinct key as suspicious_metadata_key
from public.analytics_events
cross join lateral jsonb_object_keys(coalesce(metadata,'{}'::jsonb)) key
where lower(key) ~ '(email|phone|address|name|message|note|user_id|ip|user_agent)'
order by key;

-- PASS targets before F0-M:
-- - no privacy_suppressed_but_unlocked
-- - no overdue retained named contact without resolved Article 14 route or suppression/purge
-- - suspicious analytics metadata keys = 0 or explicitly privacy-reviewed
-- - all key tables RLS-enabled with intentional policies
-- - analytics production client is consent-gated and raw local history disabled

-- RT-008 read-only DSAR / retention control audit.
-- Returns metadata/counts only. Does not expose subject records or mutate data.

select
  now() as checked_at,
  (select count(*) from private.analytics_retention_policy) as policy_rows,
  (select count(*) from private.analytics_retention_policy where enabled=true) as enabled_policy_rows,
  (select count(*) from private.analytics_retention_runs) as retention_run_rows,
  has_function_privilege('anon','private.dd_subject_data_locator(uuid)','EXECUTE') as anon_locator_exec,
  has_function_privilege('authenticated','private.dd_subject_data_locator(uuid)','EXECUTE') as authenticated_locator_exec,
  has_function_privilege('service_role','private.dd_subject_data_locator(uuid)','EXECUTE') as service_locator_exec,
  has_function_privilege('anon','private.execute_approved_analytics_retention(text)','EXECUTE') as anon_purge_exec,
  has_function_privilege('authenticated','private.execute_approved_analytics_retention(text)','EXECUTE') as authenticated_purge_exec,
  has_function_privilege('service_role','private.execute_approved_analytics_retention(text)','EXECUTE') as service_purge_exec;

select
  count(*)::bigint as analytics_rows,
  count(distinct anonymous_id)::bigint as distinct_anonymous_ids,
  count(distinct session_id)::bigint as distinct_session_ids,
  min(occurred_at) as earliest_event,
  max(occurred_at) as latest_event
from public.analytics_events;

with cutoffs(days) as (values (1),(3),(7),(14),(30),(90))
select c.days,
       p.rows_before_cutoff,
       p.distinct_anonymous_ids,
       p.distinct_session_ids,
       p.earliest_event,
       p.latest_event_before_cutoff
from cutoffs c
cross join lateral private.dd_analytics_retention_preview(
  now() - make_interval(days=>c.days)
) p
order by c.days;

-- Subject-specific locator usage intentionally requires an explicit UUID and is not
-- embedded here. Run only for an authenticated/verified DSAR subject or a rollback
-- fixture; never bulk-enumerate subjects for DD reporting.

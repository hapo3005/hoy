-- HOY Investor Ready IR-02A — DD hardening
-- Safe-by-default migration prepared for coordinated RC deployment.
-- It does not fabricate provenance: external accessibility claims without a concrete
-- source URL remain stored for audit history but are marked review_needed and are
-- not exposed through the canonical fact layer as confirmed positive/negative facts.

begin;

-- 1) Internal menu eval tables: make the intended access model explicit.
-- Service role continues to bypass RLS. Authenticated HOY admins may inspect/manage
-- these tables; ordinary authenticated users and anon remain denied by RLS.
drop policy if exists "hoy admins manage menu eval cases" on public.menu_eval_cases;
create policy "hoy admins manage menu eval cases"
  on public.menu_eval_cases for all to authenticated
  using (private.is_hoy_admin())
  with check (private.is_hoy_admin());

drop policy if exists "hoy admins manage menu eval runs" on public.menu_eval_runs;
create policy "hoy admins manage menu eval runs"
  on public.menu_eval_runs for all to authenticated
  using (private.is_hoy_admin())
  with check (private.is_hoy_admin());

revoke all on public.menu_eval_cases from anon;
revoke all on public.menu_eval_runs from anon;

-- 2) Accessibility provenance gate.
-- Preserve legacy/audit rows, but visibly mark non-source-backed external claims as
-- requiring review. Never convert missing evidence to NO.
update public.restaurant_accessibility_facts
set review_state = 'review_needed',
    updated_at = now(),
    evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
      'dd_provenance_gate','source_url_required_for_external_non_unknown_fact',
      'dd_review_marked_at',now()
    )
where is_current = true
  and verification_level = 'external_unverified'
  and status <> 'unknown'
  and nullif(btrim(source_url),'') is null;

-- Future external yes/no/partial/temporary facts must carry a concrete evidence URL.
-- NOT VALID preserves historical rows for auditability while enforcing the rule for
-- new/updated rows immediately.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'accessibility_external_claim_requires_source_url'
      and conrelid = 'public.restaurant_accessibility_facts'::regclass
  ) then
    alter table public.restaurant_accessibility_facts
      add constraint accessibility_external_claim_requires_source_url
      check (
        verification_level <> 'external_unverified'
        or status = 'unknown'
        or nullif(btrim(source_url),'') is not null
      ) not valid;
  end if;
end $$;

-- Public canonical fact-layer reads are fail-closed. Directly verified facts may be
-- shown without an external URL; external facts need an evidence URL unless unknown.
drop policy if exists "anon reads current published accessibility facts" on public.restaurant_accessibility_facts;
create policy "anon reads current published accessibility facts"
  on public.restaurant_accessibility_facts for select to anon
  using (
    is_current = true
    and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_accessibility_facts.restaurant_id
        and r.is_published = true
    )
    and (
      verification_level in ('hoy_verified','business_confirmed','community_confirmed')
      or status = 'unknown'
      or nullif(btrim(source_url),'') is not null
    )
  );

drop policy if exists "authenticated reads published or admin accessibility facts" on public.restaurant_accessibility_facts;
create policy "authenticated reads published or admin accessibility facts"
  on public.restaurant_accessibility_facts for select to authenticated
  using (
    private.is_hoy_admin()
    or (
      is_current = true
      and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_accessibility_facts.restaurant_id
          and r.is_published = true
      )
      and (
        verification_level in ('hoy_verified','business_confirmed','community_confirmed')
        or status = 'unknown'
        or nullif(btrim(source_url),'') is not null
      )
    )
  );

-- 3) SECURITY DEFINER RPC contract: explicitly lock grants to intended roles.
-- These functions remain SECURITY DEFINER because their purpose is to expose a narrow,
-- validated operation over tables that must not be directly writable/readable by the
-- client. The source-level auth/membership checks are therefore part of the security
-- boundary and are covered by the IR-02A review record.
revoke all on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) from public;
grant execute on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) to anon, authenticated, service_role;

revoke all on function public.get_operator_workspace(bigint) from public, anon;
grant execute on function public.get_operator_workspace(bigint) to authenticated, service_role;

revoke all on function public.get_venue_media_review(bigint) from public, anon;
grant execute on function public.get_venue_media_review(bigint) to authenticated, service_role;

revoke all on function public.operator_archive_offer(uuid) from public, anon;
grant execute on function public.operator_archive_offer(uuid) to authenticated, service_role;

revoke all on function public.operator_publish_offer(uuid) from public, anon;
grant execute on function public.operator_publish_offer(uuid) to authenticated, service_role;

revoke all on function public.operator_request_upgrade(bigint,public.plan_code,text) from public, anon;
grant execute on function public.operator_request_upgrade(bigint,public.plan_code,text) to authenticated, service_role;

revoke all on function public.operator_submit_profile_change(bigint,jsonb,text) from public, anon;
grant execute on function public.operator_submit_profile_change(bigint,jsonb,text) to authenticated, service_role;

revoke all on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) from public, anon;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) to authenticated, service_role;

comment on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) is
  'IR-02A reviewed SECURITY DEFINER boundary: anonymous analytics ingestion with strict event allowlist, payload-size/type validation, published-restaurant check and QA isolation. Direct analytics_events writes remain unavailable to clients.';
comment on function public.get_operator_workspace(bigint) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid plus restaurant membership or HOY admin.';
comment on function public.get_venue_media_review(bigint) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid plus restaurant membership or eligible business claim.';
comment on function public.operator_archive_offer(uuid) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership.';
comment on function public.operator_publish_offer(uuid) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid, verified restaurant membership and eligible paid plan.';
comment on function public.operator_request_upgrade(bigint,public.plan_code,text) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; plan allowlist enforced.';
comment on function public.operator_submit_profile_change(bigint,jsonb,text) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; field allowlist and size validation enforced.';
comment on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) is
  'IR-02A reviewed SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; candidate ownership is checked before mutation.';

commit;

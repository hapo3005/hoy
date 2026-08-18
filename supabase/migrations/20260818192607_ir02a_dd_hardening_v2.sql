-- Applied to HOY La Manga production as migration 20260818192607.
-- IR-02A DD hardening after canonical accessibility fact-layer deployment.

-- Internal menu eval tables: explicit admin-only RLS intent.
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

-- Public canonical accessibility reads fail closed.
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

-- Reviewed intentional SECURITY DEFINER boundaries.
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
  'IR-02A reviewed intentional SECURITY DEFINER boundary: anonymous analytics ingestion with strict event allowlist, payload-size/type validation, published-restaurant check and QA isolation.';
comment on function public.get_operator_workspace(bigint) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid plus restaurant membership or HOY admin.';
comment on function public.get_venue_media_review(bigint) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid plus restaurant membership or eligible business claim.';
comment on function public.operator_archive_offer(uuid) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership.';
comment on function public.operator_publish_offer(uuid) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid, verified restaurant membership and eligible paid plan.';
comment on function public.operator_request_upgrade(bigint,public.plan_code,text) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; plan allowlist enforced.';
comment on function public.operator_submit_profile_change(bigint,jsonb,text) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; field allowlist and size validation enforced.';
comment on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) is
  'IR-02A reviewed intentional SECURITY DEFINER boundary: requires auth.uid and verified restaurant membership; candidate ownership is checked before mutation.';

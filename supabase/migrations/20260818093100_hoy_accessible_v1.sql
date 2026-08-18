-- HOY Accessible v1
-- Additive migration. Existing public.restaurant_accessibility remains untouched as rollback/fallback.
-- Critical invariant: unknown/stale is never converted to no.

create table if not exists public.accessibility_feature_registry (
  feature_key text primary key,
  label_de text not null,
  scope text not null,
  priority text not null check (priority in ('P0','P1','P2','P3')),
  data_type text not null,
  unit text,
  freshness_external_days integer not null default 180 check (freshness_external_days > 0),
  freshness_verified_days integer not null default 365 check (freshness_verified_days > 0),
  matching_mode text not null default 'Informational',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_accessibility_facts (
  fact_ref text primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  feature_key text not null references public.accessibility_feature_registry(feature_key),
  status text not null check (status in ('yes','no','partial','unknown','not_applicable','temporarily_unavailable')),
  value_number numeric,
  value_text text,
  unit text,
  source_type text not null,
  verification_level text not null check (verification_level in ('hoy_verified','business_confirmed','community_confirmed','external_unverified')),
  evidence_type text,
  source_url text,
  checked_at timestamptz not null,
  verified_at timestamptz,
  stale_after timestamptz,
  review_state text not null default 'clean' check (review_state in ('clean','review_needed','disputed')),
  legacy_class text check (legacy_class is null or legacy_class in ('A','B','C','D')),
  secondary_hint text,
  legacy_restrictions text,
  evidence jsonb not null default '{}'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists restaurant_accessibility_one_current_fact
  on public.restaurant_accessibility_facts (restaurant_id, feature_key)
  where is_current;
create index if not exists restaurant_accessibility_facts_restaurant_idx
  on public.restaurant_accessibility_facts (restaurant_id) where is_current;
create index if not exists restaurant_accessibility_facts_feature_idx
  on public.restaurant_accessibility_facts (feature_key, status) where is_current;

alter table public.accessibility_feature_registry enable row level security;
alter table public.restaurant_accessibility_facts enable row level security;

-- Keep exactly one permissive SELECT policy per role/action. This avoids the
-- Supabase multiple_permissive_policies advisor warning while preserving admin visibility.
drop policy if exists "public reads active accessibility features" on public.accessibility_feature_registry;
drop policy if exists "anon reads active accessibility features" on public.accessibility_feature_registry;
drop policy if exists "authenticated reads active or admin accessibility features" on public.accessibility_feature_registry;
drop policy if exists "hoy admins manage accessibility features" on public.accessibility_feature_registry;
drop policy if exists "hoy admins insert accessibility features" on public.accessibility_feature_registry;
drop policy if exists "hoy admins update accessibility features" on public.accessibility_feature_registry;
drop policy if exists "hoy admins delete accessibility features" on public.accessibility_feature_registry;

create policy "anon reads active accessibility features"
  on public.accessibility_feature_registry for select to anon
  using (is_active = true);
create policy "authenticated reads active or admin accessibility features"
  on public.accessibility_feature_registry for select to authenticated
  using (is_active = true or private.is_hoy_admin());
create policy "hoy admins insert accessibility features"
  on public.accessibility_feature_registry for insert to authenticated
  with check (private.is_hoy_admin());
create policy "hoy admins update accessibility features"
  on public.accessibility_feature_registry for update to authenticated
  using (private.is_hoy_admin()) with check (private.is_hoy_admin());
create policy "hoy admins delete accessibility features"
  on public.accessibility_feature_registry for delete to authenticated
  using (private.is_hoy_admin());

drop policy if exists "public reads current published accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "anon reads current published accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "authenticated reads published or admin accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "hoy admins read all accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "hoy admins insert accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "hoy admins update accessibility facts" on public.restaurant_accessibility_facts;
drop policy if exists "hoy admins delete accessibility facts" on public.restaurant_accessibility_facts;

create policy "anon reads current published accessibility facts"
  on public.restaurant_accessibility_facts for select to anon
  using (
    is_current = true and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_accessibility_facts.restaurant_id and r.is_published = true
    )
  );
create policy "authenticated reads published or admin accessibility facts"
  on public.restaurant_accessibility_facts for select to authenticated
  using (
    private.is_hoy_admin() or (
      is_current = true and exists (
        select 1 from public.restaurants r
        where r.id = restaurant_accessibility_facts.restaurant_id and r.is_published = true
      )
    )
  );
create policy "hoy admins insert accessibility facts"
  on public.restaurant_accessibility_facts for insert to authenticated
  with check (private.is_hoy_admin());
create policy "hoy admins update accessibility facts"
  on public.restaurant_accessibility_facts for update to authenticated
  using (private.is_hoy_admin()) with check (private.is_hoy_admin());
create policy "hoy admins delete accessibility facts"
  on public.restaurant_accessibility_facts for delete to authenticated
  using (private.is_hoy_admin());

-- Explicit Data API grants: new Supabase tables are no longer guaranteed to be exposed automatically.
revoke all on public.accessibility_feature_registry from anon, authenticated;
revoke all on public.restaurant_accessibility_facts from anon, authenticated;
grant select on public.accessibility_feature_registry to anon, authenticated;
grant select on public.restaurant_accessibility_facts to anon, authenticated;
grant insert, update, delete on public.accessibility_feature_registry to authenticated;
grant insert, update, delete on public.restaurant_accessibility_facts to authenticated;
grant all on public.accessibility_feature_registry to service_role;
grant all on public.restaurant_accessibility_facts to service_role;

insert into public.accessibility_feature_registry
(feature_key,label_de,scope,priority,data_type,unit,freshness_external_days,freshness_verified_days,matching_mode,notes)
values
('access.step_free','Stufenfreier Zugang','Core','P0','tri-state',null,180,365,'MUST/PREFER','Keine pauschale rechtliche Zertifizierung ableiten'),
('access.wheelchair_seating','Rollstuhlgerechter Sitzplatz','Gastro/Core','P0','tri-state',null,180,365,'MUST/PREFER','Mindestens ein sinnvoll nutzbarer Sitzplatz'),
('access.toilet','Barrierefreies WC','Core','P0','tri-state',null,180,365,'MUST/PREFER','Details später separat erfassen'),
('access.parking','Barrierefreier Parkplatz','Core','P0','tri-state',null,180,365,'MUST/PREFER','Distanz zum Eingang später strukturiert'),
('access.entrance_steps_count','Stufenanzahl Eingang','Core','P0','integer','count',365,365,'Comparator','Messwert statt Heuristik'),
('access.entrance_threshold_cm','Schwellenhöhe Eingang','Core','P0','decimal','cm',365,365,'Comparator','Messwert statt Heuristik'),
('access.entrance_door_width_cm','Lichte Türbreite','Core','P0','decimal','cm',365,365,'Comparator','Messwert statt Heuristik'),
('access.alternative_step_free','Alternativer stufenfreier Eingang','Core','P0','tri-state',null,180,365,'MUST/PREFER','Alternative Route separat beschreiben'),
('access.main_route_step_free','Stufenfreie Hauptroute innen','Core','P0','tri-state',null,180,365,'MUST/PREFER','Eingang allein reicht nicht'),
('access.lift','Aufzug verfügbar','Core','P0','tri-state',null,90,365,'MUST/PREFER','Temporäre Ausfälle zulassen'),
('access.terrace','Terrasse vorhanden','Gastro','P0','tri-state',null,180,180,'PREFER','Vorhandensein getrennt von Zugänglichkeit'),
('access.terrace_step_free','Terrasse stufenfrei erreichbar','Gastro','P0','tri-state',null,180,365,'MUST/PREFER','Nur relevant wenn Terrasse vorhanden'),
('access.dropoff_near_entrance','Drop-off nahe Eingang','Core','P1','tri-state',null,180,180,'PREFER','Distanz später numerisch'),
('access.assistance_dog','Assistenzhund akzeptiert','Core','P1','tri-state',null,90,90,'MUST/PREFER','Betriebliche Regel, nicht strukturell'),
('access.staff_assistance','Unterstützung durch Personal','Core','P1','tri-state',null,90,90,'PREFER','Voranmeldung gegebenenfalls separat'),
('access.digital_info','Digitale Informationen verfügbar','Core','P1','tri-state',null,90,90,'MUST/PREFER','Speisekarte oder Information konkret referenzieren'),
('access.written_communication','Schriftliche Kommunikation möglich','Core','P1','tri-state',null,90,90,'MUST/PREFER','Chat, E-Mail oder Notiz konkretisieren'),
('access.hearing_loop','Induktive Höranlage','Core','P1','tri-state',null,180,180,'MUST/PREFER','Nicht aus fehlender Erwähnung als no ableiten'),
('access.changing','Barrierefreie Umkleide/Dusche','Lifestyle','P1','tri-state',null,180,180,'MUST/PREFER','Sport, Beach und Water'),
('access.transfer_help','Hilfe beim Einstieg/Transfer','Lifestyle','P1','tri-state',null,90,90,'MUST/PREFER','Voranmeldung separat'),
('access.adaptive_equipment','Adaptive Ausrüstung','Lifestyle','P1','tri-state + text',null,180,180,'MUST/PREFER','Details als strukturierter Text'),
('access.sensory','Sehen/Hören/Kommunikationshilfen','Core/Lifestyle','P1','multi-select',null,180,180,'MUST/PREFER','Konkrete Hilfen, keine pauschalen Labels'),
('access.limitations','Relevante Einschränkungen','Core','P1','text',null,180,180,'Informational','Beobachtbare Fakten; positive und negative Angaben können koexistieren'),
('access.evidence','Nachweis','Core','P1','file/url',null,180,365,'Trust','Evidenz ersetzt strukturiertes Merkmal nicht')
on conflict (feature_key) do update set
  label_de=excluded.label_de,scope=excluded.scope,priority=excluded.priority,data_type=excluded.data_type,
  unit=excluded.unit,freshness_external_days=excluded.freshness_external_days,
  freshness_verified_days=excluded.freshness_verified_days,matching_mode=excluded.matching_mode,
  notes=excluded.notes,is_active=true,updated_at=now();

-- 664 canonical Gastro core facts: copy only explicit granular states, never infer from A/B/C/D.
insert into public.restaurant_accessibility_facts (
  fact_ref,restaurant_id,feature_key,status,source_type,verification_level,evidence_type,source_url,
  checked_at,stale_after,review_state,legacy_class,secondary_hint,legacy_restrictions,evidence,is_current
)
select
  'gastro-legacy-'||a.restaurant_id::text||'-'||replace(v.feature_key,'.','-'),
  a.restaurant_id,v.feature_key,v.status,
  case when v.status='unknown' then 'legacy_audit_no_granular_evidence' else 'public_structured_business_data' end,
  case a.verification_source when 'operator' then 'business_confirmed' when 'onsite' then 'hoy_verified' else 'external_unverified' end,
  a.evidence_type,a.source_url,a.checked_at,
  a.checked_at + case when a.verification_source='onsite' then interval '365 days' else interval '180 days' end,
  'clean',a.overall_status,a.secondary_note,a.accessibility_note,
  jsonb_build_object('migration_source','restaurant_accessibility','migrated_at',now()),true
from public.restaurant_accessibility a
cross join lateral (values
  ('access.step_free'::text,a.wheelchair_entrance_state::text),
  ('access.wheelchair_seating'::text,a.wheelchair_seating_state::text),
  ('access.toilet'::text,a.wheelchair_toilet_state::text),
  ('access.parking'::text,a.accessible_parking_state::text)
) as v(feature_key,status)
on conflict (fact_ref) do nothing;

-- Four audit rows mentioned a hearing loop only as "not publicly listed".
-- That is UNKNOWN, not NO. These rows preserve the 668-row migration footprint while fixing the semantic error.
insert into public.restaurant_accessibility_facts (
  fact_ref,restaurant_id,feature_key,status,source_type,verification_level,evidence_type,source_url,
  checked_at,stale_after,review_state,legacy_class,legacy_restrictions,evidence,is_current
)
select
  'gastro-legacy-'||a.restaurant_id::text||'-access-hearing_loop',a.restaurant_id,'access.hearing_loop','unknown',
  'public_research_missing_explicit_confirmation','external_unverified',a.evidence_type,a.source_url,
  a.checked_at,a.checked_at+interval '180 days','clean',a.overall_status,
  coalesce(a.accessibility_note,'Keine induktive Höranlage öffentlich bestätigt.'),
  jsonb_build_object('migration_source','HOY-Gastro_Barrierefreiheit_Audit_2026-08-18','semantic_correction','not publicly listed => unknown, not no','migrated_at',now()),true
from public.restaurant_accessibility a
where a.restaurant_id in (22,112,145,174)
on conflict (fact_ref) do nothing;

-- Keep the new fact layer synchronized with the existing operator workflow.
-- The trigger is SECURITY INVOKER and therefore preserves the caller's existing authorization model.
create or replace function public.hoy_sync_accessibility_facts_from_legacy()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_verification text;
  v_source_type text;
  v_checked_at timestamptz;
  v_verified_at timestamptz;
  v_revision text;
begin
  v_verification := case new.verification_source
    when 'operator' then 'business_confirmed'
    when 'onsite' then 'hoy_verified'
    else 'external_unverified'
  end;
  v_source_type := case new.verification_source
    when 'operator' then 'operator_confirmation'
    when 'onsite' then 'hoy_onsite_verification'
    else 'public_structured_business_data'
  end;
  v_checked_at := coalesce(new.checked_at, now());
  v_verified_at := case when v_verification in ('business_confirmed','hoy_verified') then v_checked_at else null end;
  v_revision := replace(extract(epoch from clock_timestamp())::numeric::text, '.', '');

  update public.restaurant_accessibility_facts
  set is_current = false, updated_at = now()
  where restaurant_id = new.restaurant_id
    and feature_key in ('access.step_free','access.wheelchair_seating','access.toilet','access.parking','access.hearing_loop')
    and is_current = true;

  insert into public.restaurant_accessibility_facts (
    fact_ref,restaurant_id,feature_key,status,source_type,verification_level,evidence_type,source_url,
    checked_at,verified_at,stale_after,review_state,legacy_class,secondary_hint,legacy_restrictions,evidence,is_current
  )
  select
    'gastro-sync-'||new.restaurant_id::text||'-'||replace(v.feature_key,'.','-')||'-'||v_revision,
    new.restaurant_id,
    v.feature_key,
    v.status,
    v_source_type,
    v_verification,
    new.evidence_type,
    new.source_url,
    v_checked_at,
    v_verified_at,
    v_checked_at + make_interval(days => case
      when v_verification in ('hoy_verified','business_confirmed','community_confirmed')
        then registry.freshness_verified_days
      else registry.freshness_external_days
    end),
    'clean',
    new.overall_status,
    new.secondary_note,
    new.accessibility_note,
    jsonb_build_object(
      'sync_source','restaurant_accessibility',
      'verification_source',new.verification_source,
      'synced_at',now()
    ),
    true
  from (values
    ('access.step_free'::text,new.wheelchair_entrance_state::text),
    ('access.wheelchair_seating'::text,new.wheelchair_seating_state::text),
    ('access.toilet'::text,new.wheelchair_toilet_state::text),
    ('access.parking'::text,new.accessible_parking_state::text),
    ('access.hearing_loop'::text,new.hearing_loop_state::text)
  ) as v(feature_key,status)
  join public.accessibility_feature_registry registry on registry.feature_key = v.feature_key;

  return new;
end;
$$;

revoke all on function public.hoy_sync_accessibility_facts_from_legacy() from public, anon, authenticated;

drop trigger if exists hoy_accessibility_fact_sync on public.restaurant_accessibility;
create trigger hoy_accessibility_fact_sync
after insert or update of wheelchair_entrance_state,wheelchair_seating_state,wheelchair_toilet_state,accessible_parking_state,hearing_loop_state,verification_source,source_url,evidence_type,checked_at,accessibility_note
on public.restaurant_accessibility
for each row execute function public.hoy_sync_accessibility_facts_from_legacy();

comment on table public.accessibility_feature_registry is 'Canonical HOY Accessible feature registry shared across HOY verticals.';
comment on table public.restaurant_accessibility_facts is 'Per-feature accessibility facts. Unknown is never interpreted as no; is_current selects the active fact while older rows are retained for audit/history.';
comment on function public.hoy_sync_accessibility_facts_from_legacy() is 'Synchronizes existing operator accessibility confirmations into versioned per-feature HOY Accessible facts.';
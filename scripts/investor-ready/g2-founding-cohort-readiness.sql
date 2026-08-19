-- G2 Founding Sales Kit v1.0
-- READ-ONLY cohort readiness audit. Returns aggregates only; no raw contact values.

with region1 as (
  select
    r.id,
    p.priority,
    p.review_status,
    p.send_readiness,
    p.founding_wave,
    p.founding_rank,
    p.preferred_outreach_language,
    coalesce(p.send_lock,true) as send_lock,
    p.send_authorized_at,
    (
      nullif(btrim(coalesce(p.contact_phone,'')),'') is not null or
      nullif(btrim(coalesce(p.contact_email,'')),'') is not null or
      nullif(btrim(coalesce(p.contact_instagram,'')),'') is not null or
      nullif(btrim(coalesce(p.contact_website,'')),'') is not null or
      nullif(btrim(coalesce(r.phone,'')),'') is not null or
      nullif(btrim(coalesce(r.website,'')),'') is not null
    ) as direct_contact
  from public.restaurants r
  left join public.venue_sales_pipeline p on p.restaurant_id=r.id
  where r.is_published = true
    and r.area in (
      'Cabo de Palos',
      'La Manga Club / Atamaría',
      'La Manga del Mar Menor',
      'Los Alcázares / Los Narejos',
      'Los Belones',
      'Los Urrutias / Estrella de Mar / Los Nietos',
      'Mar de Cristal / Islas Menores',
      'San Pedro del Pinatar / Lo Pagán',
      'Santiago de la Ribera / San Javier'
    )
)
select
  count(*)::int as published_region1,
  count(*) filter (where direct_contact)::int as with_direct_contact,
  count(*) filter (where send_lock)::int as send_locked,
  count(*) filter (where send_authorized_at is not null)::int as send_authorized,
  count(*) filter (where review_status='master_reviewed')::int as master_reviewed,
  count(*) filter (where send_readiness='master_ready')::int as master_ready,
  count(*) filter (
    where direct_contact
      and send_lock
      and send_authorized_at is null
      and review_status='master_reviewed'
      and send_readiness='master_ready'
  )::int as strict_master_ready_locked,
  count(*) filter (
    where direct_contact
      and send_lock
      and send_authorized_at is null
      and priority='A'
  )::int as priority_a_locked,
  count(*) filter (
    where direct_contact
      and send_lock
      and send_authorized_at is null
      and priority='A'
      and review_status='master_reviewed'
  )::int as priority_a_master_reviewed_locked,
  count(*) filter (where founding_rank is not null)::int as with_founding_rank,
  count(*) filter (where preferred_outreach_language is not null and btrim(preferred_outreach_language)<>'')::int as with_preferred_outreach_language
from region1;

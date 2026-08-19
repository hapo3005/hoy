-- HOY Investor Ready RT-007 — restricted signature-source replacement dry-run
-- Review only. Net effect ALWAYS rolls back.
-- Prepared 2026-08-19 from current Production rows + first-party source review.
--
-- Purpose: demonstrate a truthful path from 3 restricted/NO_REGISTRY signature
-- references to existing AMBER first-party business references WITHOUT retaining
-- claims that the first-party source does not support.

begin;

do $rt007_signature_preflight$
declare
  v_matches integer;
  v_rights integer;
begin
  select count(*) into v_matches
  from public.restaurants
  where (id=8 and signature_source_url='https://elpais.com/elviajero/lonely-planet/2025-07-31/brutalismo-made-in-spain-las-paradas-que-no-te-puedes-perder-en-la-geografia-espanola.html')
     or (id=9 and signature_source_url='https://www.thefork.es/restaurante/area-sunset-r28285/opiniones')
     or (id=22 and signature_source_url='https://elpais.com/gastronomia/el-comidista/2025-07-31/de-la-chipirona-al-el-saladero-20-chiringuitos-de-playa-y-montana-en-los-que-la-comida-no-defrauda.html');

  if v_matches <> 3 then
    raise exception 'RT-007 signature replacement baseline drift: expected 3 exact restricted source rows, found %',v_matches;
  end if;

  select count(*) into v_rights
  from private.source_rights_registry
  where (host='colladosbeach.com' or host='areasunset.es' or host='calareonabeach.com')
    and source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rights_status='AMBER'
    and factual_verification_allowed=true
    and persistent_copy_allowed=false
    and public_reuse_allowed=false
    and derivative_use_allowed=false
    and commercial_use_allowed=false
    and automated_collection_allowed=false
    and replacement_required=false
    and transferability='UNKNOWN'
    and legal_review_status='BUSINESS_TERMS_REQUIRED';

  if v_rights <> 3 then
    raise exception 'RT-007 first-party rights baseline drift: expected 3 conservative AMBER factual-reference hosts, found %',v_rights;
  end if;
end
$rt007_signature_preflight$;

-- Collados: remove unsupported historical "UFO / 1976" claim; retain only facts
-- explicitly supported by the official Collados site.
update public.restaurants
set signature_title='Dünenformen, Beach Club & Mittelmeer',
    signature_text='Collados Beach verbindet Beach Club, Restaurant und markante Architektur: Die offizielle Website beschreibt abgerundete, dünenartige Formen, die sich in die Umgebung einfügen, sowie gastronomische Angebote am Mittelmeer.',
    signature_tags=array['Architektur','Beach Club','Mittelmeer']::text[],
    signature_status='researched',
    signature_source_url='https://colladosbeach.com/',
    signature_source_label='Collados Beach · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=8;

-- Area Sunset: replace review-derived atmosphere claim with the venue's own
-- explicit restaurant/terrace/sunset description.
update public.restaurants
set signature_title='Terrasse mit Sonnenuntergang',
    signature_text='Area Sunset beschreibt auf seiner offiziellen Website mediterrane Küche und eine Terrasse, auf der Gäste das ganze Jahr Sonnenuntergänge genießen können.',
    signature_tags=array['Sonnenuntergang','Terrasse','Mediterran']::text[],
    signature_status='researched',
    signature_source_url='https://areasunset.es/restaurante/',
    signature_source_label='Area Sunset · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=9;

-- Cala Reona: remove the publisher-derived selection/nature/live-music framing;
-- keep only the menu proposition directly supported by the venue's own menu.
update public.restaurants
set signature_title='Seafood, Fisch & Arroces',
    signature_text='Die offizielle Karte des Cala Reona Beach Club setzt auf Seafood und Fisch sowie mehrere Reisgerichte, darunter A banda, Bogavante und Caldero mit Fisch.',
    signature_tags=array['Arroces','Fisch','Seafood']::text[],
    signature_status='researched',
    signature_source_url='https://calareonabeach.com/nuestra-carta/',
    signature_source_label='Cala Reona Beach Club · offizielle Karte',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=22;

-- Fail closed if the proposed replacement no longer maps exactly to conservative
-- AMBER first-party factual references.
do $rt007_signature_postflight$
declare
  v_replaced integer;
  v_hard_queue integer;
begin
  with refs as (
    select r.id,r.signature_source_url,
           lower(split_part(regexp_replace(r.signature_source_url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    where r.id in (8,9,22)
  )
  select count(*) into v_replaced
  from refs
  join private.source_rights_registry rr using(host)
  where rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false;

  if v_replaced <> 3 then
    raise exception 'RT-007 signature replacement postflight failed: %/3 first-party AMBER refs',v_replaced;
  end if;

  with refs as (
    select r.id as restaurant_id,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values
      (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)
    ) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_hard_queue
  from refs
  left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');

  -- Current live hard queue is 343 direct refs. This dry-run must reduce it by
  -- exactly the 3 replaced signature refs, not by reclassifying restricted hosts.
  if v_hard_queue <> 340 then
    raise exception 'RT-007 signature replacement expected hard queue 340 after dry-run, got %',v_hard_queue;
  end if;
end
$rt007_signature_postflight$;

-- Safety invariant: review simulation only.
rollback;

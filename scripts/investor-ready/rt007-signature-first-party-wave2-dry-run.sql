-- HOY Investor Ready RT-007 — signature first-party replacement wave 2
-- Review simulation only. Net effect ALWAYS rolls back.
-- Prepared 2026-08-19 from exact Production rows + current first-party page review.
--
-- Purpose: replace 9 restricted/review-required signature provenance references
-- with conservative AMBER first-party factual references. Every signature is rewritten
-- to remove review-derived, superlative or otherwise unsupported claims.

begin;

do $rt007_signature_wave2_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (id=7 and signature_source_url='https://www.tripadvisor.com/Restaurant_Review-g642228-d2225555-Reviews-Escuela_de_Pieter-La_Manga_del_Mar_Menor_Municipality_of_Cartagena.html')
     or (id=13 and signature_source_url='https://www.tripadvisor.co/Restaurant_Review-g1087580-d4027214-Reviews-El_Rancho_de_Cabo_de_Palos-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=15 and signature_source_url='https://www.tripadvisor.de/Restaurant_Review-g1087580-d6594520-Reviews-Gran_Torino-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=16 and signature_source_url='https://www.tripadvisor.co/Restaurant_Review-g1087580-d5864216-Reviews-Agua_Sala-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=17 and signature_source_url='https://www.tripadvisor.co/Restaurant_Review-g1087580-d4170522-Reviews-Restaurante_Miramar-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=18 and signature_source_url='https://www.tripadvisor.com/Restaurant_Review-g1087580-d23438095-Reviews-Cp8_Restaurante-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=20 and signature_source_url='https://www.tripadvisor.co/Restaurant_Review-g1087580-d1804887-Reviews-Restaurante_La_Tana-Cabo_de_Palos_Municipality_of_Cartagena.html')
     or (id=135 and signature_source_url='https://lasgastrocronicas.com/un-viaje-al-himalaya-en-el-mar-menor-annapurna-estrena-la-autentica-cocina-nepali-e-india-en-los-belones/')
     or (id=215 and signature_source_url='https://www.tripadvisor.com/Restaurant_Review-g1087580-d34554854-Reviews-Cabo_de_Sal-Cabo_de_Palos_Municipality_of_Cartagena.html');

  if v_exact <> 9 then
    raise exception 'RT-007 signature wave2 baseline drift: expected 9 exact Production rows, found %',v_exact;
  end if;

  select count(*) into v_rights
  from private.source_rights_registry
  where host in (
    'escueladepieter.com',
    'www.elranchodecabodepalos.com',
    'grantorino.es',
    'aguasalacabodepalos.com',
    'www.restaurantemiramar.net',
    'cp8restaurante.com',
    'restaurantelatana.es',
    'www.annapurnanepali.com',
    'cabodesal.com'
  )
    and rights_status='AMBER'
    and source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and factual_verification_allowed=true
    and replacement_required=false
    and transferability='UNKNOWN'
    and legal_review_status='BUSINESS_TERMS_REQUIRED';

  if v_rights <> 9 then
    raise exception 'RT-007 signature wave2 rights drift: expected 9 conservative first-party AMBER hosts, found %',v_rights;
  end if;

  with refs as (
    select r.id as restaurant_id,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_hard_before
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');

  if v_hard_before <> 329 then
    raise exception 'RT-007 signature wave2 hard-queue drift: expected 329 before dry-run, got %',v_hard_before;
  end if;
end
$rt007_signature_wave2_preflight$;

update public.restaurants
set signature_title='Mediterrane Küche am Mar Menor',
    signature_text='Escuela de Pieter kocht seit 1975 am Mar Menor. Die eigene Website beschreibt eine mediterrane Küche, die traditionelle und Fusionselemente verbindet, sowie eine Terrasse direkt am Strand.',
    signature_tags=array['Mar Menor','Mediterran','Seit 1975']::text[],
    signature_status='researched',
    signature_source_url='https://escueladepieter.com/',
    signature_source_label='Escuela de Pieter · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=7;

update public.restaurants
set signature_title='Argentinischer Asador mit Holzfeuer',
    signature_text='El Rancho positioniert sich als argentinischer Asador. Im Mittelpunkt stehen Rindfleisch aus Argentinien und Spanien sowie Fleisch- und Reisgerichte vom Holzfeuer.',
    signature_tags=array['Argentinischer Asador','Fleisch','Holzfeuer']::text[],
    signature_status='researched',
    signature_source_url='https://www.elranchodecabodepalos.com/',
    signature_source_label='El Rancho · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=13;

update public.restaurants
set signature_title='Italienisch & handwerklich',
    signature_text='Gran Torino setzt auf italienische Küche mit handwerklicher Zubereitung. Die eigene Karte führt frische Pasta und Pizza; Betreiber Roberto Chiale verweist auf seine piemontesischen Wurzeln.',
    signature_tags=array['Italienisch','Frische Pasta','Pizza']::text[],
    signature_status='researched',
    signature_source_url='https://grantorino.es/',
    signature_source_label='Gran Torino · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=15;

update public.restaurants
set signature_title='Eklektischer Restobar in Cabo de Palos',
    signature_text='Agua Salá beschreibt sich als Restobar mit eklektischer Karte. Sushi, Tapas, Burger und mediterrane Pasta gehören ausdrücklich zum eigenen Angebot.',
    signature_tags=array['Restobar','Eklektisch','Mediterrane Pasta']::text[],
    signature_status='researched',
    signature_source_url='https://aguasalacabodepalos.com/',
    signature_source_label='Agua Salá · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=16;

update public.restaurants
set signature_title='Arroces, Fisch & Meeresfrüchte',
    signature_text='Miramar führt Arroces als eine seiner Hausspezialitäten und bietet Caldero, Paellas, Meeresfrüchte und frischen Fisch. Der Familienbetrieb verweist auf seine Tradition seit 1969 in Cabo de Palos.',
    signature_tags=array['Arroces','Fisch','Meeresfrüchte']::text[],
    signature_status='researched',
    signature_source_url='https://www.restaurantemiramar.net/nuestra-carta',
    signature_source_label='Restaurante Miramar · offizielle Karte',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=17;

update public.restaurants
set signature_title='Mediterrane Küche mit Meerblick',
    signature_text='CP8 beschreibt seine Küche als mediterran, mit Produkten aus Region und Meer und einem innovativen Akzent. Die eigene Website hebt außerdem die Lage mit Blick auf das Mittelmeer hervor.',
    signature_tags=array['Mediterran','Regionale Produkte','Meerblick']::text[],
    signature_status='researched',
    signature_source_url='https://cp8restaurante.com/',
    signature_source_label='CP8 Restaurante · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=18;

update public.restaurants
set signature_title='Tradition, Arroces & Fisch',
    signature_text='La Tana führt Caldero, Paella, Fisch und Meeresfrüchte auf der eigenen Karte. Die Betreiberseite beschreibt eine lange Geschichte in Cabo de Palos und die Weiterentwicklung zum Restaurant ab 1965.',
    signature_tags=array['Caldero','Fisch','Tradition']::text[],
    signature_status='researched',
    signature_source_url='https://restaurantelatana.es/carta/',
    signature_source_label='Restaurante La Tana · offizielle Karte',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=20;

update public.restaurants
set signature_title='Nepalesisch & indisch in Los Belones',
    signature_text='Annapurna beschreibt seine Küche mit nepalesischen und indischen Aromen. Die eigene Karte führt unter anderem Tandoori-Gerichte sowie mehrere vegetarische Vorspeisen.',
    signature_tags=array['Nepalesisch','Indisch','Tandoori']::text[],
    signature_status='researched',
    signature_source_url='https://www.annapurnanepali.com/',
    signature_source_label='Annapurna · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=135;

update public.restaurants
set signature_title='Mediterrane Küche am Hafen',
    signature_text='Cabo de Sal liegt im Hafen von Cabo de Palos mit Blick auf das Mittelmeer. Die eigene Karte verbindet Fisch und Seafood mit Reisgerichten wie dem Arroz Cabo de Sal.',
    signature_tags=array['Hafen','Mediterran','Arroces']::text[],
    signature_status='researched',
    signature_source_url='https://cabodesal.com/',
    signature_source_label='Cabo de Sal · offizielle Website',
    signature_checked_at='2026-08-19',
    signature_confidence='high'
where id=215;

do $rt007_signature_wave2_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
begin
  with q as (
    select r.id,r.signature_source_url,
           lower(split_part(regexp_replace(r.signature_source_url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    where r.id in (7,13,15,16,17,18,20,135,215)
  )
  select count(*) into v_replaced
  from q join private.source_rights_registry rr using(host)
  where rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false
    and rr.transferability='UNKNOWN'
    and rr.legal_review_status='BUSINESS_TERMS_REQUIRED';

  if v_replaced <> 9 then
    raise exception 'RT-007 signature wave2 postflight failed: %/9 first-party AMBER refs',v_replaced;
  end if;

  with refs as (
    select r.id as restaurant_id,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_hard_after
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');

  if v_hard_after <> 320 then
    raise exception 'RT-007 signature wave2 expected hard queue 320 after dry-run, got %',v_hard_after;
  end if;
end
$rt007_signature_wave2_postflight$;

-- Safety invariant: review simulation only. No Production mutation persists.
rollback;

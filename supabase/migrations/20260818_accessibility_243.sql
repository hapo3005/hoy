-- HOY 2.43.0 — granular accessibility facts and provenance
begin;

create table if not exists public.restaurant_accessibility (
  restaurant_id bigint primary key references public.restaurants(id) on delete cascade,
  wheelchair_entrance_state text not null default 'unknown' check (wheelchair_entrance_state in ('yes','no','unknown')),
  wheelchair_seating_state text not null default 'unknown' check (wheelchair_seating_state in ('yes','no','unknown')),
  wheelchair_toilet_state text not null default 'unknown' check (wheelchair_toilet_state in ('yes','no','unknown')),
  accessible_parking_state text not null default 'unknown' check (accessible_parking_state in ('yes','no','unknown')),
  hearing_loop_state text not null default 'unknown' check (hearing_loop_state in ('yes','no','unknown')),
  overall_status text generated always as (
    case
      when 'no' = any (array[wheelchair_entrance_state, wheelchair_seating_state, wheelchair_toilet_state]) then 'C'
      when wheelchair_entrance_state = 'yes' and wheelchair_seating_state = 'yes' and wheelchair_toilet_state = 'yes' then 'A'
      when 'yes' = any (array[wheelchair_entrance_state, wheelchair_seating_state, wheelchair_toilet_state]) then 'B'
      else 'D'
    end
  ) stored,
  verification_source text not null default 'public_research' check (verification_source in ('public_research','operator','onsite')),
  source_url text,
  source_label text,
  evidence_type text,
  secondary_note text,
  accessibility_note text,
  checked_at timestamptz not null default now(),
  operator_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.restaurant_accessibility is
  'Granular HOY venue accessibility facts with provenance. Unknown means not publicly verified, never not-accessible.';
comment on column public.restaurant_accessibility.overall_status is
  'A=entrance+seating+toilet yes; B=partial positive core evidence; C=explicit core barrier; D=no granular core evidence.';

alter table public.restaurant_accessibility enable row level security;
revoke insert, update, delete on public.restaurant_accessibility from anon;
grant select on public.restaurant_accessibility to anon, authenticated;
grant insert, update, delete on public.restaurant_accessibility to authenticated;

drop policy if exists "public reads published restaurant accessibility" on public.restaurant_accessibility;
create policy "public reads published restaurant accessibility"
on public.restaurant_accessibility for select
to anon, authenticated
using (exists (
  select 1 from public.restaurants r
  where r.id = restaurant_accessibility.restaurant_id and r.is_published = true
));

drop policy if exists "hoy admins manage restaurant accessibility" on public.restaurant_accessibility;
create policy "hoy admins manage restaurant accessibility"
on public.restaurant_accessibility for all
to authenticated
using (private.is_hoy_admin())
with check (private.is_hoy_admin());

insert into public.restaurant_accessibility (
  restaurant_id, verification_source, source_label, evidence_type, checked_at, updated_at
)
select id, 'public_research', 'HOY Barrierefreiheits-Audit 2026-08-18',
       'Öffentliche Unternehmensdaten; granularer Rollstuhl-Audit',
       '2026-08-18T00:00:00+02:00'::timestamptz, now()
from public.restaurants where is_published=true
on conflict (restaurant_id) do nothing;

update public.restaurant_accessibility a set wheelchair_entrance_state='yes', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Agua Salá','Bocana de Palos','Bondi Beach Cabo de Palos','Cala Reona Beach Club','Chiringuito "El Faro"','Chiringuito Levante','El Rancho de Cabo de Palos','El Rincón de la Hormiga','La cangreja','La Taberna del Puerto de Cabo de Palos','Restaurante La Tana','Restaurante Miramar','Taberna Siroco','Angelo''s Pizzeria','Aquarium La Manga Club Resort','El Bistro - Bellaluz - La Manga Club','Flute Lounge Bar','Hatsune Japanese Bar','La Barra Tapas Bar','La Finca Restaurant','Mulligan''s Irish Pub','Paimans Asian Street Food','The Last Drop Bar','Velvet Lounge La Manga Club','AMONET Heladería & Coctelería','Barracuda Beach','Cafetería coctel bar Paraíso Puerto Tomás Maestre','Chiringuito de Lola','Chiringuito El Mirador','Coctelería Chibichanga','El Parador del Mar Menor','Estacio Playa','La Cangreja Galúa, La Manga','Malasombra','Mandacarú Cocktails & Coffee','Molly Malone Irish Tabern.','Soul Kitchen','Ya Te Vale indie bar La Manga','Belicioso','Boochies Breakfast, Brunch and Dinner','BT15 Irish Pub & Eatery','Camaleón Bar','Casa India Restaurante','Chiringuito La Sirena','chiringuito mar menor','Cocina asiática Run','Currys Nepali','Freiduría Don Pepe','Fusion','Marylimon','Masala cottage Indian Tandoori Restaurant','OASIS fusión, Oasis Bulevar','Penny Farthing','Pizzeria la Rucola','Restaurante Asia Star','Restaurante El Chato','Restaurante La Casa De Papel','Restaurante La Tropical','Restaurante Milo','Restaurante Ramón','Rico Mexican and Steak House Restaurant','Sonder Los Alcázares','Terraza La Ola','The New Sibarit Bar','Tipsy Thistle','BELONES BAR','Brasería Garnacha','los osos golosos','Pizzería Diavola','Curry Hut - Authentic Indian Restaurant & Takeaway','Restaurante Antonios','Restaurante Club de Regatas Los Urrutias','Restaurante La Playa','Restaurante Ruf-Mari','Chiringuito Punta de Lomas','La Oliva Restaurante','Restaurante Club Deportivo Mar de Cristal','Archi Music Bar','Chiringuito Campoamor','Chiringuito Veracruz','Freiduría Venécora','Maï Briza','Oishii Restaurante Fusión','Restaurante Alibaba','Restaurante El Portugués','Restaurante El Rubio 360º','Restaurante Puerto Marina','Restaurante Venezuela','Tommy''s pub','Vista del Mar Lo Pagan','Appalache La Ribera','Brother''s 6','Chiringuito Beach club la Reserva','Chiringuito Francis','Maorí Cocktail Bar','Pizzería Napoli','Pub Green','Restaurante El Señorío','Restaurante La Lonja','Restaurante La Plaza','Restaurante Miramar La Ribera','Sabor Urbano','Trovattore pizzeria','Vinissimo']);

update public.restaurant_accessibility a set wheelchair_entrance_state='no', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Gran Torino';

update public.restaurant_accessibility a set wheelchair_seating_state='yes', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Agua Salá','Bocana de Palos','El Rancho de Cabo de Palos','El Rincón de la Hormiga','Gran Torino','La cangreja','La Taberna del Puerto de Cabo de Palos','Restaurante La Tana','Restaurante Miramar','Angelo''s Pizzeria','Aquarium La Manga Club Resort','Hatsune Japanese Bar','La Barra Tapas Bar','La Finca Restaurant','Mulligan''s Irish Pub','Paimans Asian Street Food','Chiringuito El Mirador','El Parador del Mar Menor','Soul Kitchen','Boochies Breakfast, Brunch and Dinner','Camaleón Bar','Casa India Restaurante','Chiringuito La Sirena','Cocina asiática Run','Currys Nepali','Freiduría Don Pepe','Fusion','Masala cottage Indian Tandoori Restaurant','OASIS fusión, Oasis Bulevar','Penny Farthing','Pizzeria la Rucola','Restaurante Asia Star','Restaurante El Chato','Restaurante La Casa De Papel','Restaurante La Tropical','Restaurante Milo','Restaurante Ramón','Rico Mexican and Steak House Restaurant','Sonder Los Alcázares','Tipsy Thistle','BELONES BAR','Brasería Garnacha','los osos golosos','Pizzería Diavola','Curry Hut - Authentic Indian Restaurant & Takeaway','Restaurante Antonios','Restaurante Club de Regatas Los Urrutias','Restaurante La Playa','Restaurante Ruf-Mari','Chiringuito Punta de Lomas','La Oliva Restaurante','Restaurante Club Deportivo Mar de Cristal','Archi Music Bar','Freiduría Venécora','Maï Briza','Oishii Restaurante Fusión','Restaurante Alibaba','Restaurante Puerto Marina','Restaurante Venezuela','Rte. Cocteleria Estrella','Vista del Mar Lo Pagan','Chiringuito Beach club la Reserva','Pizzería Napoli','Restaurante El Señorío','Restaurante La Lonja','Restaurante La Plaza','Restaurante Miramar La Ribera','Sabor Urbano','Trovattore pizzeria','Vinissimo']);

update public.restaurant_accessibility a set wheelchair_seating_state='no', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Cala Reona Beach Club','Restaurante El Portugués','Restaurante El Rubio 360º']);

update public.restaurant_accessibility a set wheelchair_toilet_state='yes', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Agua Salá','Bocana de Palos','Bondi Beach Cabo de Palos','Cala Reona Beach Club','Chiringuito "El Faro"','Chiringuito Levante','El Rancho de Cabo de Palos','El Rincón de la Hormiga','Gran Torino','La cangreja','La Taberna del Puerto de Cabo de Palos','Restaurante La Tana','Restaurante Miramar','Taberna Siroco','Angelo''s Pizzeria','Aquarium La Manga Club Resort','Flute Lounge Bar','La Barra Tapas Bar','La Finca Restaurant','Mulligan''s Irish Pub','Paimans Asian Street Food','The Last Drop Bar','Cafetería coctel bar Paraíso Puerto Tomás Maestre','Chiringuito El Mirador','El Parador del Mar Menor','Mandacarú Cocktails & Coffee','Soul Kitchen','Boochies Breakfast, Brunch and Dinner','BT15 Irish Pub & Eatery','Camaleón Bar','Casa India Restaurante','Cocina asiática Run','Currys Nepali','Freiduría Don Pepe','Fusion','Marylimon','Masala cottage Indian Tandoori Restaurant','Penny Farthing','Pizzeria la Rucola','Restaurante Asia Star','Restaurante El Chato','Restaurante La Casa De Papel','Restaurante La Tropical','Restaurante Milo','Restaurante Ramón','Rico Mexican and Steak House Restaurant','Sonder Los Alcázares','The New Sibarit Bar','Tipsy Thistle','BELONES BAR','Brasería Garnacha','los osos golosos','Pizzería Diavola','Curry Hut - Authentic Indian Restaurant & Takeaway','Restaurante Antonios','Restaurante Club de Regatas Los Urrutias','Restaurante La Playa','Restaurante Ruf-Mari','Chiringuito Punta de Lomas','La Oliva Restaurante','Restaurante Club Deportivo Mar de Cristal','Archi Music Bar','Maï Briza','Oishii Restaurante Fusión','Restaurante Alibaba','Restaurante Puerto Marina','Restaurante Venezuela','Tommy''s pub','Vista del Mar Lo Pagan','Brother''s 6','Chiringuito Beach club la Reserva','Maorí Cocktail Bar','Pizzería Napoli','Pub Green','Restaurante El Señorío','Restaurante La Lonja','Restaurante La Plaza','Restaurante Miramar La Ribera','Sabor Urbano','Trovattore pizzeria','Vinissimo']);

update public.restaurant_accessibility a set wheelchair_toilet_state='no', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Restaurante El Rubio 360º';

update public.restaurant_accessibility a set accessible_parking_state='yes', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Cala Reona Beach Club','Chiringuito "El Faro"','Chiringuito Levante','Restaurante Miramar','Aquarium La Manga Club Resort','El Bistro - Bellaluz - La Manga Club','Flute Lounge Bar','La Barra Tapas Bar','La Finca Restaurant','Mulligan''s Irish Pub','The Last Drop Bar','Chiringuito de Lola','Chiringuito El Mirador','El Parador del Mar Menor','Casa India Restaurante','Chiringuito La Sirena','chiringuito mar menor','Currys Nepali','Marylimon','Masala cottage Indian Tandoori Restaurant','Penny Farthing','Restaurante Asia Star','Restaurante La Casa De Papel','Restaurante Ramón','Sonder Los Alcázares','Terraza La Ola','Tipsy Thistle','BELONES BAR','Brasería Garnacha','Curry Hut - Authentic Indian Restaurant & Takeaway','Restaurante Antonios','Restaurante La Playa','Restaurante Ruf-Mari','Restaurante Club Deportivo Mar de Cristal','Archi Music Bar','Chiringuito Campoamor','Maï Briza','Oishii Restaurante Fusión','Restaurante Alibaba','Restaurante Puerto Marina','Tommy''s pub','Restaurante El Señorío','Restaurante La Plaza','Restaurante Miramar La Ribera','Vinissimo']);

update public.restaurant_accessibility a set accessible_parking_state='no', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name = any(array['Camaleón Bar','Restaurante El Chato','Restaurante La Tropical','Restaurante El Portugués','Restaurante El Rubio 360º','Restaurante Venezuela']);

update public.restaurant_accessibility a set accessibility_note='Rollstuhlgerechter Eingang und WC bestätigt; rollstuhlgerechte Sitzplätze ausdrücklich nicht bestätigt. Höranlage nicht öffentlich ausgewiesen.', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Cala Reona Beach Club';
update public.restaurant_accessibility a set accessibility_note='Rollstuhlgerechte Sitzplätze und WC bestätigt; rollstuhlgerechter Eingang ausdrücklich nicht bestätigt.', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Gran Torino';
update public.restaurant_accessibility a set accessibility_note='Rollstuhlgerechter Eingang bestätigt; rollstuhlgerechte Sitzplätze und Parkplatz ausdrücklich nicht bestätigt.', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Restaurante El Portugués';
update public.restaurant_accessibility a set accessibility_note='Rollstuhlgerechter Eingang bestätigt; Sitzplätze, WC und Parkplatz ausdrücklich nicht rollstuhlgerecht dokumentiert.', updated_at=now()
from public.restaurants r where r.id=a.restaurant_id and r.name='Restaurante El Rubio 360º';

commit;

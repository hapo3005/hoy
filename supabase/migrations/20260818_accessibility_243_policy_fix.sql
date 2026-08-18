-- HOY 2.43.0 — singular public read policy + least-privilege table grants
begin;

-- Explicitly remove PostgreSQL/Supabase default table privileges that are not
-- required by the app (notably TRUNCATE, TRIGGER and REFERENCES).
revoke all privileges on table public.restaurant_accessibility from anon, authenticated;
grant select on table public.restaurant_accessibility to anon;
grant select, insert, update, delete on table public.restaurant_accessibility to authenticated;

drop policy if exists "hoy admins manage restaurant accessibility" on public.restaurant_accessibility;
drop policy if exists "hoy admins insert restaurant accessibility" on public.restaurant_accessibility;
drop policy if exists "hoy admins update restaurant accessibility" on public.restaurant_accessibility;
drop policy if exists "hoy admins delete restaurant accessibility" on public.restaurant_accessibility;

create policy "hoy admins insert restaurant accessibility"
on public.restaurant_accessibility for insert
to authenticated
with check (private.is_hoy_admin());

create policy "hoy admins update restaurant accessibility"
on public.restaurant_accessibility for update
to authenticated
using (private.is_hoy_admin())
with check (private.is_hoy_admin());

create policy "hoy admins delete restaurant accessibility"
on public.restaurant_accessibility for delete
to authenticated
using (private.is_hoy_admin());

commit;

-- HOY 2.43.0 — keep public read policy singular for authenticated users
begin;

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

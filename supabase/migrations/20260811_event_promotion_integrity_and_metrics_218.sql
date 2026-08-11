drop policy if exists "members request event promotions" on public.event_promotions;
create policy "members request event promotions"
on public.event_promotions
for insert
to authenticated
with check (
  event_promotions.requested_by = (select auth.uid())
  and event_promotions.status = 'requested'
  and event_promotions.billing_status = 'pending'
  and event_promotions.placement = 'home_highlight'
  and event_promotions.quoted_price_cents is null
  and event_promotions.approved_by is null
  and event_promotions.approved_at is null
  and event_promotions.rejection_reason is null
  and private.is_restaurant_member(event_promotions.restaurant_id)
  and event_promotions.starts_at < event_promotions.ends_at
  and event_promotions.ends_at > now()
  and exists (
    select 1
    from public.offers o
    where o.id = event_promotions.offer_id
      and o.restaurant_id = event_promotions.restaurant_id
      and o.offer_type = 'event'
      and o.status = 'published'
      and o.ends_at > now()
      and event_promotions.ends_at <= o.ends_at
      and event_promotions.starts_at >= greatest(now() - interval '5 minutes', o.starts_at - interval '24 hours')
  )
);

drop policy if exists "public reads active event promotions" on public.event_promotions;
create policy "public reads active event promotions"
on public.event_promotions
for select
to anon, authenticated
using (
  event_promotions.status = 'active'
  and event_promotions.billing_status in ('paid','comped')
  and event_promotions.starts_at <= now()
  and event_promotions.ends_at > now()
  and exists (
    select 1
    from public.offers o
    where o.id = event_promotions.offer_id
      and o.restaurant_id = event_promotions.restaurant_id
      and o.offer_type = 'event'
      and o.status = 'published'
      and o.ends_at > now()
      and event_promotions.ends_at <= o.ends_at
  )
);

create index if not exists analytics_promotion_event_time_idx
on public.analytics_events ((metadata->>'promotion_id'), occurred_at desc)
where metadata ? 'promotion_id';

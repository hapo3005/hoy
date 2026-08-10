-- HOY 2.10 follow-up indexes from Supabase performance audit.
create index if not exists idx_profile_change_requests_reviewer
  on public.restaurant_profile_change_requests(reviewed_by)
  where reviewed_by is not null;

create index if not exists idx_offers_restaurant_status_updated
  on public.offers(restaurant_id,status,updated_at desc);

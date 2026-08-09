-- HOY 1.9 hardening: media review RPCs are signed-in operator routes only.
revoke execute on function public.get_venue_media_review(bigint) from anon;
revoke execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) from anon;
grant execute on function public.get_venue_media_review(bigint) to authenticated;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) to authenticated;

# HOY Family 2.40 — Data integration gate

This branch is intentionally based on `agent/family-playgrounds-2.40` and contains data-integration work only.

## Current audited scope

- 169 restaurants existed in the HOY production database at the 2026-08-16 read-only snapshot.
- Existing exact Family matches: Restaurante La Plaza (#96), Restaurante Miramar La Ribera (#101), Aquarium La Manga Club Resort (#132), Chiringuito Campoamor (#163), Restaurante Club Deportivo Mar de Cristal (#218).
- 17 Family entries are currently seed-ready at `operator_confirmed`, `source_verified`, or `community_verified` level.
- 18 missing/current restaurant leads can be staged as unpublished draft profiles; no new profile is publishable from this branch by itself.
- Status-conflict, historical-only, outside-scope and closed leads are retained in the master dataset but excluded from import seeds.
- Spatial cluster leads remain verification backlog and do not receive Family badges.

## Safety gates

1. `family_restaurant_profiles_240_staging.sql` realigns `restaurants_id_seq` before any `nextval()` allocation because the read-only production snapshot showed `max(id)=241` while the sequence was at `240`.
2. Missing restaurant IDs are never guessed or hard-coded. New profiles use the sequence and Family rows resolve restaurants by stable slug.
3. All newly discovered base profiles are staged with `is_published=false`, `profile_quality='draft'`, `location_status='not_checked'` and `hours_status='missing'`.
4. `family_features_240_stage2_verified.sql` aborts if any expected restaurant slug is missing, preventing a partial Family import.
5. Research data cannot award `hoy_verified`; that status remains reserved for a real HOY on-site check.
6. No SQL in this branch has been executed against production.

## Required order later

1. Review/merge Family feature PR.
2. Apply/test Family schema in a non-production target.
3. Review/apply unpublished restaurant profile staging in that target.
4. Review/apply verified Family feature seed in that target.
5. Visual + data smoke test using real entries.
6. Independent review before any production migration/seed.

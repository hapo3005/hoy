-- Public guests already have column-level SELECT on the published offer fields used by HOY.
-- PR #54 introduced three intentionally public provenance fields, so grant only those columns.
-- Do not grant table-wide SELECT and do not expose created_by or other internal fields.

grant select (source_url, source_checked_at, source_label)
on public.offers
to anon;

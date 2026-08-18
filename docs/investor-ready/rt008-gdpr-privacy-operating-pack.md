# HOY Investor Ready — RT-008 GDPR / Privacy Operating Pack

Status: **IN PROGRESS / F0-M BLOCKED**  
Date: 2026-08-18  
Scope: HOY Gastro/Core + HOY Works. Lifestyle remains primarily a research/data-rights surface until personal-data features are introduced.

> Working compliance design, not final legal advice. Final controller identity, national-law choices, lawful-basis assessments, notices and processor terms require counsel validation before F0-M.

## 1. Binding privacy principles

1. Privacy-by-default and data minimisation.
2. Pseudonymous identifiers are treated as personal data unless robust anonymisation is demonstrated.
3. No sale of identifiable user/contact data. Future HOY BI/data products use rights-cleared aggregated/anonymised outputs.
4. Non-essential analytics/device storage is OFF until an informed, granular opt-in exists.
5. Unknown lawful basis, retention or recipient = fail closed.
6. Special-category data is not an intended HOY input. If it appears incidentally, minimise/remove and reassess risk.
7. ROPA is maintained even while HOY is small because the relevant processing is regular rather than occasional.
8. Data-subject rights, deletion and incident response are operating workflows, not privacy-policy text only.
9. Vendor selection requires role, DPA, subprocessor, transfer, retention and security review.
10. No F0-M market contact until the Article 14 / B2B-contact workflow is executable.

## 2. Live baseline — 2026-08-18

### Gastro/Core

- Active Supabase project: `zlscptisdxzxuvllogza`, region `eu-central-1` (Frankfurt).
- `auth.users`: 0; `auth.sessions`: 0.
- `analytics_events`: 28,897 rows; 19,855 distinct session IDs; 19,832 distinct anonymous IDs.
- Analytics observed period: 2026-08-09 through 2026-08-18.
- Current analytics metadata keys are bounded and contain no obvious name/email/phone/address keys in the live snapshot.
- `venue_sales_pipeline`: 168 rows; 57 contain a named person, phone or email. Earliest researched personal contact: 2026-08-09.
- `business_claims`, `restaurant_memberships`, `menu_intake_submissions`, `restaurant_profile_change_requests`: currently 0 rows.
- Relevant personal-data tables have RLS enabled. Admin-only/own-record/member-scoped policies are already present.

### Works

- Active Supabase project: `dqfouwyclvmpkunmxkun`, region `eu-central-1` (Frankfurt).
- Current `auth.users`, profiles, provider applications, provider memberships, work requests, request events/photos and storage objects: 0.
- Personal-data design surfaces already exist for profiles, provider applications, work-request descriptions, actors and photos.
- Relevant application tables have RLS enabled with owner/participant scoping.
- `request-photos` bucket is private, 8 MiB limit, image MIME allowlist.
- A DPIA screen is required before real Works users. Full DPIA becomes mandatory if the final processing is likely high risk (for example large-scale systematic monitoring/profiling or large-scale sensitive-data processing).

## 3. P0 finding — production analytics/device storage

The current main implementation creates a persistent `hoy-anonymous-id-v1` in `localStorage`, a session UUID in `sessionStorage`, pilot cohort storage and a bounded local raw event history before any explicit analytics-consent gate.

RT-008 candidate patch changes the rule:

- Production analytics default = OFF.
- No production analytics UUID/session UUID/pilot-code persistence/server transport before `hoy-analytics-consent-v1 = granted`.
- Production does not store raw analytics-event history in `localStorage`.
- Existing non-consented analytics identifiers/history are removed while consent is absent.
- Preview/QA retains deterministic test behavior but cannot write Production analytics.
- No consent banner/UI is invented in this PR. Until a compliant UI and notice exist, Production analytics simply stays off.

Before field testing, the consent UI must disclose at least purpose, device information/identifiers, recipients/vendors, duration and withdrawal path and must not condition the core service on optional analytics consent.

## 4. P0 finding — indirect B2B contact research / Article 14

Current pipeline: 57 named/direct contacts researched from public sources between 2026-08-09 and 2026-08-15. The current contact freeze means no first communication has occurred.

Operating rule:

- Controller/counsel must document the lawful basis and Article 14 transparency route before F0-M.
- If Article 14 applies and no exception is documented, provide the required information at the latest within the applicable one-month window or at first communication/disclosure if earlier.
- Earliest current one-month control date: **2026-09-09**.
- If the freeze continues and HOY cannot lawfully retain a named personal contact past the transparency deadline, minimise/purge the person-specific fields and retain only non-personal business routing information where lawful.
- Any objection/opt-out immediately suppresses future outreach. A minimal suppression record may be retained where legally justified to honour the objection.
- Marketing/e-communications rules are a separate RT-010/national-law gate; a GDPR lawful basis alone does not authorise a marketing email/DM.

A candidate schema adds `privacy_notice_at`, `privacy_notice_basis`, `privacy_objection_at`, `privacy_suppressed`, and `personal_contact_expires_at`; it is not deployed by RT-008.

## 5. Security/TOM baseline

Positive current controls:

- RLS on key Gastro and Works personal-data tables.
- `hoy_admin_accounts` explicit client deny.
- Works request/photo metadata scoped to request participants.
- Works photo bucket private.
- Supabase projects in Frankfurt.
- Analytics RPC uses an event allowlist, metadata size limit and QA/headless rejection.

Still required before F0-M / real users:

- RT-001 security closure and recovery/deploy evidence.
- Company-controlled admin/2FA/recovery from RT-005.
- Secret/key inventory and rotation policy.
- Backup/restore and deletion-cascade tests.
- Works photo retrieval/upload path authorization test and EXIF/sensitive-content handling.
- Vendor/CDN/tile-host privacy review.
- Incident-response tabletop.

## 6. Third-party/browser request surface

Current Core `index.html` loads Supabase JS and Leaflet via jsDelivr. The map uses OpenStreetMap tile servers when the map is rendered. These browser-to-third-party requests can expose network metadata such as IP address and must be reflected in the vendor/privacy assessment.

Preferred F0-M remediation:

1. self-host static JS/CSS dependencies where practical;
2. keep external map-tile loading lazy/action-linked;
3. document the tile provider role/terms and transparency;
4. do not add advertising/behavioral trackers in v1.

## 7. DPO / DPIA decision

Current working assessment:

- DPO: **not currently assumed mandatory**, because HOY has not yet demonstrated large-scale regular/systematic monitoring or large-scale sensitive-data processing as a core activity. Reassess at scale and whenever tracking/profiling scope expands.
- Gastro DPIA: document a risk screen; full DPIA if later feature scope creates likely high risk.
- Works: mandatory pre-launch DPIA **screen** because request text/photos/location context can contain sensitive information. Full DPIA if the screened final processing is likely high risk.

## 8. F0-M close conditions

RT-008 closes only when:

- analytics/device-storage default-off behavior is tested and deployed through the normal release gate;
- compliant consent/withdrawal UI exists before analytics-dependent field proof;
- Article 14 route/deadlines are resolved for every retained named indirect contact;
- final ROPA and lawful-basis/LIA records are signed off;
- retention/deletion jobs and DSAR export/delete runbook are tested;
- breach runbook/tabletop passes;
- processor/DPA/subprocessor/transfer register is complete for all active vendors;
- Works DPIA screen is completed before first real Works personal data;
- privacy notice matches the live product;
- no unresolved RED privacy blocker remains.

No business, partner, user or investor outreach is authorized by this pack.

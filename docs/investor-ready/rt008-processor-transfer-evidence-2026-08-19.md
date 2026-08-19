# RT-008 Processor / Recipient / International-Transfer Evidence — 2026-08-19

Status: **EVIDENCE PACK BUILT / CONTRACT- AND ENTITY-SPECIFIC CLOSE GATES REMAIN**

This register separates three concepts that must not be conflated in privacy or buyer due diligence:

1. **Processor / sub-processor** — a provider processes HOY-controlled personal data on HOY's instructions under an applicable DPA or equivalent contract.
2. **Independent controller / direct browser recipient** — the user's browser connects directly to another service which determines its own processing; a controller-processor DPA is not automatically the correct mechanism.
3. **Role not yet contractually verified** — technical use is evidenced, but HOY has not archived sufficient account/entity-specific contract evidence to assert the final GDPR role or transfer mechanism.

No provider is marked contractually closed merely because it publishes a DPA, SCCs, privacy policy, security certification or sub-processor list.

## 1. Current provider / recipient matrix

| Provider / service | HOY use | Data path | Working GDPR role | Location / transfer evidence | DPA / SCC / sub-processor evidence | HOY-specific evidence still missing | Current gate |
|---|---|---|---|---|---|---|---|
| **Supabase** | Core + Works database, Auth, Storage, APIs and Edge Functions | Browser/server → HOY Supabase projects | Processor relationship expected for hosted customer data, **contract execution/account evidence still to archive** | Both active HOY projects are `eu-central-1` (Frankfurt). Edge Function execution is a separate locality question and may route independently unless region is specified. | Public security/region documentation exists. Account-specific DPA/sub-processor/transfer package has not been archived in this DD pack. | Company/entity account owner, executed/applicable DPA evidence, current sub-processor record, backup/retention evidence, MFA/recovery/admin evidence; decide whether privacy-sensitive Edge calls should be region-pinned. | **AMBER — technical EU DB region / contractual evidence open** |
| **OpenAI API** | Menu extraction / evaluation from operator menu sources | Supabase Edge Function → OpenAI Responses API | Processor for Customer Data where the OpenAI business/API DPA applies; **HOY entity/account execution evidence not yet archived** | OpenAI publishes SCC/data-transfer terms and an API sub-processor list with processing in multiple jurisdictions. Eligible API customers can configure regional controls. | Current OpenAI DPA and sub-processor list publicly available. Business/API data is not used for model training by default. | Archive HOY company API project/billing/admin/DPA evidence after entity setup; record active data-control configuration. | **AMBER — public DPA available / HOY execution evidence open** |
| **OpenAI Responses `background` mode** | Current `menu-intake-process` uses `/v1/responses` with `background:true, store:false` | Supabase Edge Function → OpenAI | Same provider relationship as above, but retention/config must be described accurately | OpenAI's current data-control docs state background mode stores response data for roughly 10 minutes and is not compatible with Zero Data Retention. EU Responses requests cannot use `background=true`. | Code evidence: `supabase/functions/menu-intake-process/index.ts`. Provider docs: OpenAI API data controls. | Do **not** call current flow ZDR or EU-resident. If EU residency/ZDR becomes a requirement, redesign away from background mode and verify eligible account/project configuration. | **AMBER — correctly disclosed, not ZDR** |
| **GitHub / GitHub Pages** | Public source repository, CI, static production hosting | Browser → GitHub Pages; admin/dev → GitHub | Pages visitor logging is GitHub-controlled processing; final role for future company/organization services depends on the applicable GitHub contract/DPA. Do not label all GitHub processing as HOY processor processing today. | GitHub states that Pages visitor IP addresses are logged/stored for security. GitHub publishes privacy and sub-processor information for DPA-governed services. | GitHub Pages and privacy/sub-processor documentation publicly available. | HOY company organization/account, billing/admin/recovery evidence, applicable plan/DPA evidence, final hosting privacy role, custom-domain/hosting decision. | **AMBER / ENTITY-GATED** |
| **jsDelivr CDN** | Browser delivery of Leaflet CSS/JS and Supabase UMD library | Browser → jsDelivr/CDN providers | Direct browser recipient; processor/controller role relative to HOY **not contractually verified** | jsDelivr states its CDN providers receive IP address and other browser-sent information for analytics/security. It lists Cloudflare, Fastly, Gcore and legacy Bunny use. | Public privacy/sub-processor information available; no HOY-specific DPA/role evidence archived. | Either archive an applicable contractual/privacy basis and disclose the direct recipient, or self-host pinned browser libraries to remove the dependency. | **AMBER — self-host is preferred hardening option** |
| **OpenStreetMap Foundation standard tiles** | Map tiles when the user opens HOY's map | Browser → `tile.openstreetmap.org` / Fastly path | **Independent Data Controller**, per OSMF's own privacy FAQ; OSMF says use of its services does not create a controller-processor relationship and it will not sign a DPA on that basis. | OSMF states API/database locations include UK/Ireland/Netherlands and tiles are delivered through Fastly according to network routing. | OSMF privacy FAQ and Tile Usage Policy are public. | Layered privacy disclosure; continued compliance with tile attribution/usage/caching policy; commercial availability/SLA decision before scale. | **AMBER — role known / commercial dependency review open** |
| **Wikimedia Commons / Wikimedia Foundation** | Directly loaded open-licensed regional/profile images | Browser → Wikimedia-hosted image URL | Independent external content service / browser recipient; no HOY processor relationship established | Wikimedia's privacy policy states it automatically receives visitor IP addresses and related request/device information. | Public Wikimedia privacy policy; media licences/attribution are separately tracked in HOY media evidence. | Privacy-recipient disclosure or self-host rights-cleared copies while preserving licence/attribution metadata; buyer portability decision. | **AMBER — self-host is preferred portability/privacy hardening** |
| **Email provider** | Future auth/service mail and business communication | Not selected | To be determined | Not selected | None | Provider selection, DPA, sub-processors/transfers, retention, company account/recovery | **NOT SELECTED / BLOCKED BEFORE ACTIVATION** |
| **Payment provider** | Future paid plans / billing | Not selected | To be determined | Not selected | None | Provider selection, DPA/terms, PCI/data minimisation, company account, retention/transfer register | **NOT SELECTED / BLOCKED BEFORE ACTIVATION** |

## 2. Live HOY technical evidence

### Supabase

Connected account audit on 2026-08-19:

- organization: `znbomiyhpfziljpeprjq` / current display name `Jan`;
- current plan: `free`;
- active Core project `zlscptisdxzxuvllogza` / **HOY La Manga** / `eu-central-1` / `ACTIVE_HEALTHY`;
- active Works project `dqfouwyclvmpkunmxkun` / **HOY Works** / `eu-central-1` / `ACTIVE_HEALTHY`;
- an older inactive project in `eu-west-1` is not treated as an active HOY production project in this register.

Earlier RT-008 evidence remains binding: all public tables audited have RLS, public views use `security_invoker`, guarded Core RPCs passed 14/14 own/cross-tenant tests, and the private DSAR/retention controls are not executable by browser roles.

**Important locality boundary:** database project region and Edge Function execution region are not treated as the same evidence. Supabase documents that Edge Functions can run in a region chosen independently / closest to the user unless region is specified. Therefore the database/storage locality is currently **GREEN technical**, while privacy-sensitive Edge execution locality remains **AMBER until intentionally pinned or observed/audited**.

### OpenAI API

Current source evidence in `supabase/functions/menu-intake-process/index.ts`:

- API endpoint: `https://api.openai.com/v1/responses`;
- `background:true`;
- `store:false`;
- operator upload or approved official URL may be transformed into text/image/file input;
- output is schema-constrained and subject to HOY review/protection rules.

Provider data-control evidence requires a precise statement: `store:false` is **not** proof of Zero Data Retention. OpenAI's current API documentation states that background Responses retain response data for roughly 10 minutes for polling and background mode is not ZDR-compatible. The same documentation states that `background=true` cannot be used for Responses in the EU regional endpoint. Accordingly, current HOY menu extraction is classified **AMBER / non-ZDR** unless the implementation and account configuration are changed and re-audited.

The OpenAI business/API privacy baseline also states that API business inputs and outputs are not used for model training by default, absent an explicit opt-in.

### GitHub Pages

HOY's current production-host assumptions and authentication callback point at the personal GitHub Pages deployment under `hapo3005.github.io/hoy/`. GitHub's own Pages documentation states that visitor IP addresses are logged/stored for security. The repository itself is currently owned by the personal GitHub user `hapo3005`, not a HOY company organization. This is therefore a separate **account-control/entity gate** as well as a privacy-recipient disclosure item.

### jsDelivr

`index.html` directly loads at least:

- `@supabase/supabase-js@2.111.0` UMD bundle;
- Leaflet `1.9.4` CSS;
- Leaflet `1.9.4` JS.

The service worker also recognises these jsDelivr resources as allowed external cache resources. jsDelivr's own sub-processor page states that CDN providers serving traffic receive the visitor IP address and other browser-sent information for analytics/security. Self-hosting these already version-pinned libraries would remove this direct browser recipient and reduce a supply-chain/privacy dependency, but that is a separate controlled change and is not claimed as completed here.

### OpenStreetMap Foundation tiles

`map-2.0.js` loads OSM standard raster tiles when the interactive map is created. OSMF explicitly states it is an independent Data Controller for its services, not HOY's processor, and will not sign a DPA on a controller-processor theory. The Tile Usage Policy also states that the standard tile service is best-effort with no SLA and commercial access may be withdrawn if the policy/service constraints require it.

Therefore:

- disclose the browser connection in the privacy notice;
- keep visible OSM attribution;
- avoid hidden/background bulk tile downloads;
- treat production-scale/commercial tile availability as a vendor/operational decision, not as an unlimited free SLA.

### Wikimedia Foundation / Commons

`app-1.js` contains direct Wikimedia Commons URLs for open-licensed regional and venue-context images. This is good for media-rights provenance, but a direct browser image request also exposes request/network metadata to Wikimedia. Wikimedia's privacy policy states that it automatically receives the IP address of visitors to Wikimedia sites. A future self-hosted media pack can preserve the licence/author/source metadata while removing this runtime browser dependency, subject to each licence's attribution/share-alike requirements.

## 3. International-transfer decision rules

1. **Do not infer an international transfer solely from a provider's headquarters.** Use actual processing locations, account configuration and data path.
2. **Do not infer EU-only processing from a database project region.** Edge/CDN/sub-processor and browser-recipient paths are evaluated separately.
3. Where HOY uses a **processor** and personal data may be processed outside the EEA without an adequacy basis, retain the applicable transfer mechanism (for example EU SCCs) plus the provider/account evidence required by counsel.
4. For an **independent controller/browser recipient**, document the disclosure, purpose/data categories and that provider's own privacy/transfer framework; a processor DPA is not automatically the correct instrument.
5. No provider is called `GREEN contractual` until the HOY contracting entity/account, applicable contract/DPA and current sub-processor/transfer evidence are archived in the data room.

## 4. Processor / recipient close actions

| ID | Close action | Priority | Can close before entity? | Pass evidence |
|---|---|---:|---|---|
| PTR-01 | Add actual recipients to layered HOY privacy notice without turning Analytics on | P0 | YES | DE/EN/ES notice + regression/static gate |
| PTR-02 | Archive OpenAI DPA + sub-processor list + active API project/data-control configuration under HOY company account | P0 | PARTLY | DPA/account/project evidence + dated provider snapshot |
| PTR-03 | Record current OpenAI background-mode retention honestly; decide whether EU residency/ZDR is a future requirement | P0 | YES | Architecture decision; if required, non-background implementation + account evidence |
| PTR-04 | Archive Supabase applicable DPA/sub-processor/transfer evidence and company-control record | P0 | PARTLY | Company org/account + contract/evidence package |
| PTR-05 | Decide Edge Function regional-execution policy for privacy-sensitive workflows and verify runtime region evidence | P0 | YES | Region policy + code/config/log evidence |
| PTR-06 | Migrate GitHub ownership/recovery/billing to company-controlled organization/account and archive applicable privacy/DPA terms | P0 | NO — ENTITY | Company org + 2-admin/MFA/recovery/billing + applicable contract evidence |
| PTR-07 | Self-host pinned jsDelivr browser libraries or document/accept the direct CDN recipient | P1 | YES | Self-hosted integrity-checked assets OR approved recipient register |
| PTR-08 | Preserve OSM disclosure and choose a production-scale tile SLA/provider strategy before paid scale | P1 | YES | Privacy notice + tile-provider decision/SLA evidence |
| PTR-09 | Self-host rights-cleared Commons media where portability/privacy benefit justifies it | P1 | YES | Local assets + retained licence/author/source ledger |
| PTR-10 | Select email/payment vendors only through processor/recipient and transfer gate | P0 before activation | YES selection / entity execution later | Vendor contract/DPA/sub-processors/transfers + company account |

## 5. Official provider sources reviewed

### OpenAI
- Data Processing Addendum: https://openai.com/policies/data-processing-addendum/
- Sub-processor list: https://openai.com/policies/sub-processor-list/
- API data controls / retention / residency: https://platform.openai.com/docs/models/default-usage-policies-by-endpoint
- Business data privacy: https://openai.com/business-data/

### Supabase
- Regions: https://supabase.com/docs/guides/platform/regions
- Edge Function regional invocation: https://supabase.com/docs/guides/functions/regional-invocation
- Shared responsibility / security documentation: https://supabase.com/docs/guides/security/shared-responsibility

### GitHub
- GitHub Pages data collection: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement
- GitHub Subprocessors: https://docs.github.com/en/site-policy/privacy-policies/github-subprocessors

### jsDelivr
- Sub-processors / CDN traffic disclosure: https://www.jsdelivr.com/terms/sub-processors

### OpenStreetMap Foundation
- Services and tile users privacy FAQ: https://osmfoundation.org/wiki/Services_and_tile_users_privacy_FAQ
- Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/

### Wikimedia Foundation
- Privacy Policy: https://foundation.wikimedia.org/wiki/Policy:Privacy_policy/en

## 6. DD conclusion

**PR-07 Processor/Transfer Evidence is now structurally prepared, not contractually closed.**

Strong current evidence:
- active Supabase databases are in Frankfurt;
- current browser recipients are no longer treated as invisible;
- OSMF's independent-controller role is explicitly classified;
- OpenAI business/API DPA/sub-processor framework is identifiable;
- current OpenAI background-mode retention limitation is disclosed instead of being mislabelled ZDR;
- no future email/payment processor is invented before selection.

Remaining hard gate:
- final HOY entity/account ownership;
- account-specific DPA/contract/sub-processor/transfer snapshots;
- approved final layered notice;
- provider configuration evidence;
- processor/recipient choices that depend on commercial scale.

Investor/business/user outreach remains blocked. This evidence pack does not authorize Production analytics, a data purge, automatic erasure, or any provider migration.
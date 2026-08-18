# HOY Investor Ready — IR-02A OSS / Third-Party Dependency Register

**Audit date:** 2026-08-18  
**Purpose:** Evidence-backed dependency and licence baseline for investor DD.  
**Rule:** Exact runtime/build versions must be pinned where feasible. Licence status is based on the upstream project, not assumptions from package names.

| Component | HOY use | Version / reference | Upstream licence | DD status | Required notice/action |
|---|---|---:|---|---|---|
| `@playwright/test` | Gastro automated QA | `1.62.0` | Apache-2.0 | GREEN | Retain copyright/licence notices; keep NOTICE obligations in distribution review |
| `@supabase/supabase-js` | Gastro browser client | `2.111.0` | MIT | GREEN | Retain MIT copyright/licence notice where licence distribution applies |
| Leaflet | Gastro map client | `1.9.4` | BSD-2-Clause | GREEN | Retain copyright, conditions and disclaimer in source/binary distributions |
| `@supabase/supabase-js` | Works browser client | **`2.111.0` pinned in IR remediation branch** | MIT | GREEN after merge | Replace previous floating `@2` CDN reference; retain MIT notice |
| `@supabase/server` | Works Edge Functions | `1.4.1` observed | REVIEW_REQUIRED | AMBER | Capture exact package provenance/licence before Investor DD close |
| jsDelivr | CDN delivery for selected browser dependencies | external service | service terms, not OSS licence | AMBER | Record operational dependency, fallback/availability strategy and transferability |
| Supabase platform | Database/Auth/Edge Functions | managed service | contractual service dependency | AMBER | Capture account owner, billing owner, DPA/terms, export/transfer and change-of-control evidence |
| GitHub | Source control / CI / repository history | managed service | contractual service dependency | AMBER | Capture account/org ownership, admin recovery, 2FA, export/mirror and transfer path |

## Primary-source licence evidence checked on 2026-08-18

- Microsoft Playwright repository/source headers identify Playwright as **Apache License 2.0** and the repository carries a NOTICE file.
- Supabase `supabase-js` upstream repository identifies the project as **MIT licensed**.
- Leaflet upstream `LICENSE` identifies **BSD 2-Clause**.

## Policy

1. Production/browser dependencies use exact versions, not floating major tags, unless a written exception exists.
2. Every dependency record must distinguish **software licence** from **hosted-service terms**.
3. HOY does not claim ownership of third-party libraries; HOY owns/controls only its original integration code subject to Chain-of-Title completion.
4. Copyleft/restrictive licences require explicit review before introduction.
5. Automated dependency updates may not bypass regression, security and licence checks.
6. A buyer must be able to reproduce the dependency set and understand every material continuing service dependency.

## Current open item

`@supabase/server@1.4.1` remains **AMBER / REVIEW_REQUIRED** until exact upstream package provenance and licence text are captured. This is intentionally not guessed from the broader Supabase ecosystem.

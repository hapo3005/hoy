# HOY — Third-Party Notices Draft

This file is a **draft DD artefact**. It records known third-party software used by HOY and does **not** grant an open-source licence to HOY's own source code.

## Leaflet 1.9.4
- Use: HOY Core map runtime (browser/CDN)
- Upstream: Leaflet
- Licence: BSD 2-Clause
- Required action: retain upstream copyright/licence notice in distributed third-party notices where applicable.

## @supabase/supabase-js
- Use: HOY Core and HOY Works browser Supabase client
- Observed Core version: 2.111.0
- Observed Works selector: `@2` (must be pinned before launch)
- Upstream: Supabase
- Licence: MIT
- Required action: retain MIT copyright/licence notice in distributed third-party notices where applicable.

## @playwright/test 1.62.0
- Use: HOY Core development / QA only
- Upstream: Microsoft Playwright
- Licence: Apache License 2.0
- Required action: retain required licence/NOTICE material if redistributed; development-only use must still appear in the DD SBOM.

## @supabase/server 1.4.1
- Use: HOY Core Supabase Edge Function helper
- Upstream package metadata: `@supabase/server`
- Licence: MIT
- Required action: include in machine SBOM and retain MIT notice if bundled/distributed.

## Still to inventory before final notices
- Supabase JSR Edge runtime imports;
- all GitHub Actions `uses:` dependencies;
- any other Edge Function `npm:`, `jsr:` or HTTP imports;
- fonts, templates, images, icons or copied snippets with separate licences;
- any dependency discovered by the RT-006 scanner.

A final notices file may be generated only after the exhaustive RT-006 scan and legal review of every non-permissive or unknown item.

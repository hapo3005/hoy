# HOY Mobility v0.1

Status: backend deployed to the `HOY La Manga` Supabase project; consumer UI implemented on branch `agent/hoy-mobility-v0-1`; public consumer visibility is currently **OFF**.

## Product promise

HOY Mobility answers one narrow question safely: **Which verified taxi contact is appropriate for this pickup location?**

v0.1 does not dispatch a driver, charge the passenger, calculate fares, or act as a taxi operator. The passenger always starts the phone call explicitly after HOY has resolved the pickup jurisdiction.

## Release controls

Mobility has two independent runtime controls in `mobility_runtime_config`:

- `consumer_visible` — whether the guest UI may appear at all.
- `routing_enabled` — server-side kill switch checked before every resolver request.

Current state:

- `routing_enabled = true`
- `consumer_visible = false`
- `preview_visible = true`

The hidden preview can be exposed on the feature branch with `?mobility=preview`. A server-side kill switch still overrides preview mode.

The kill switch was tested end-to-end: with `routing_enabled = false`, the deployed Edge Function returned `status=disabled`, `code=mobility_kill_switch`, and no provider data. Routing was then restored while consumer visibility remained off.

## Fail-closed rule

No `tel:` action is exposed unless the resolver returns `status = resolved`.

HOY intentionally blocks automatic routing when:

- browser location is unavailable, denied, timed out, or worse than 120 m accuracy;
- the pickup point is outside the currently supported HOY region;
- the point cannot be assigned to exactly one supported municipality;
- the point is too close to the shared Cartagena ↔ San Javier boundary;
- there is no active, verified service area/provider assignment;
- a provider assignment exists but is still `pending` or `suspended`;
- the provider has no verified phone number;
- the resolver/backend is unavailable;
- the runtime kill switch is off.

For GPS pickup, the boundary safety radius is `max(80 m, GPS accuracy + 40 m)`. For a verified venue pickup it is 80 m. The extra 40 m reflects CNIG's published uncertainty caveat for many historic boundary geometries.

## Geographic source

The municipal geometries for Cartagena and San Javier are cached in PostGIS from the official Instituto Geográfico Nacional (IGN) `administrativeunit` OGC API Features collection.

Current cached dataset date: **2026-02-12**.

Source endpoints/reference:

- https://api-features.ign.es/collections/administrativeunit
- https://centrodedescargas.cnig.es/CentroDescargas/lineas-limite-municipales-provinciales-autonomicas

The resolver measures distance only to the **shared Cartagena/San Javier boundary**. It deliberately does not measure distance to the whole municipal perimeter, because the coastline lies very close to most points on the La Manga peninsula and would produce false uncertainty.

## Provider configuration

Provider assignments are data, not frontend constants. Each provider-area assignment now has a separate verification state: `pending`, `verified`, or `suspended`. The resolver only uses `verified` assignments.

### Cartagena

- Service area: `cartagena-coast`
- Provider record: `radio-taxi-la-manga`
- Primary: `968 145 000`
- Alternate: `968 563 863`
- Official source: Ayuntamiento de Cartagena transport directory
- https://www.cartagena.es/plantillas/1.asp?idPaginaOriginal=1483&pt_idpag=1482
- Provider-area verification: **PENDING**

Reason for pending status: the official source identifies Radio Taxi La Manga for `La Manga del Mar Menor (Cartagena)`, but HOY has not yet verified that this dispatch contact is the correct pickup contact for every Cartagena point inside the broader HOY coastal region, especially Cabo de Palos. Until that scope is confirmed or represented by a narrower verified coverage area, Cartagena returns `no_verified_provider` rather than guessing.

### San Javier

- Service area: `san-javier`
- Provider: `radio-taxi-san-javier`
- Primary: `968 573 300`
- Official source: Turismo Región de Murcia
- https://www.turismoregiondemurcia.es/es/taxi/radio-taxi-san-javier-833/
- Provider-area verification: **VERIFIED in configuration**, with operational reconfirmation still required before public launch.

If a joint La Manga taxi service area becomes legally effective, or operators confirm a different dispatch setup, the provider/service-area rows can be changed centrally without rewriting the consumer UI.

## Supabase components

- `mobility_runtime_config`
- `mobility_service_areas`
- `mobility_providers`
- `mobility_provider_areas`
- `mobility_municipal_boundaries`
- RPC: `mobility_resolve_local(lat, lon, accuracy, mode)`
- Edge Function: `mobility-resolve`

PostGIS is enabled in the `extensions` schema. Client-facing Mobility tables are RLS-protected and read-only for `anon` / `authenticated`; the resolver is `SECURITY INVOKER`.

## Consumer flow

In a restaurant profile, HOY can add a Mobility card with two pickup modes:

1. **Zu diesem Ort** — browser GPS is the pickup point, the open restaurant is the destination.
2. **Von diesem Ort** — the restaurant's verified coordinates are the pickup point.

The UI is runtime-gated. The card remains absent while `consumer_visible=false`, except when preview mode is explicitly requested and `preview_visible=true`.

Only a resolved result shows:

- `ZUSTÄNDIGKEIT GEPRÜFT`;
- municipality;
- verified provider and source;
- boundary-source/date proof;
- call button and optional alternate number.

## Analytics

The UI emits Mobility funnel events without raw coordinates or phone numbers:

- `mobility_cta_viewed`
- `mobility_cta_clicked`
- `mobility_location_resolved` (accuracy bucket only)
- `mobility_area_resolved`
- `mobility_provider_shown`
- `mobility_contact_clicked`

## QA findings and fixes

### External boundary lookup removed from the guest path

The first resolver implementation called IGN live and hit a request timeout. The production design now uses locally cached official geometries in PostGIS, removing that external dependency from each taxi click.

### Coastline false-positive fixed

The first distance check measured the point against the whole municipal perimeter. On La Manga that is wrong because the coastline is always nearby. The resolver now measures only the shared Cartagena/San Javier municipal boundary.

### Cloud initialization race fixed

`mobility-2.29.js` loads before `app-3-6.js`, while `initCloud()` starts in `app-3-6.js`. The runtime loader therefore no longer caches `sb === null` as a permanent disabled state; it retries lazily once the Supabase client exists.

### Public-role RLS test

The resolver was executed under the `anon` role and returned a valid resolved result for the verified San Javier configuration, confirming that the required read policies and `SECURITY INVOKER` path work for the public client.

## Current backend test cases

- `37.655050, -0.722400` → Cartagena → **uncertain / `no_verified_provider`** because the provider-area scope is intentionally pending.
- `37.705673, -0.742513` → San Javier → Radio Taxi San Javier → **resolved**.
- A point on the cached shared municipal boundary → uncertain / no provider.
- Madrid → unsupported / no provider.
- Runtime kill switch off → disabled / no provider.

## Public-launch gates

Before calling Mobility production-ready for guests:

1. Confirm directly with the Cartagena taxi operator/competent authority which dispatch contact covers the Cartagena part of La Manga and whether/how Cabo de Palos is covered; then either verify the existing assignment or create narrower verified service areas.
2. Reconfirm the San Javier dispatch contact and operational coverage.
3. Re-check whether an `Área de Prestación Conjunta` for La Manga has become legally effective and update service-area rules if necessary.
4. Run a real-device browser QA pass in La Manga: one Cartagena pickup, one San Javier pickup, and one pickup close to the municipal boundary.
5. Only after those gates pass, set `consumer_visible=true`.

The architecture treats these as data/verification gates rather than frontend code changes.

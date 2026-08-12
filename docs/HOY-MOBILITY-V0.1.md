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

Provider assignments are data, not frontend constants. Each provider-area assignment has a separate verification state: `pending`, `verified`, or `suspended`. The resolver only uses `verified` assignments.

### Cartagena · La Manga / Cabo de Palos

- Service area: `cartagena-coast`
- Verified broad provider: `radio-taxi-cartagena`
- Provider name: `Radio Taxi Cartagena`
- Primary: `968 311 515`
- Alternate: `968 520 404`
- Official municipal source: Ayuntamiento de Cartagena transport directory
- Operator source: https://radiotaxicartagena.es/
- Provider-area verification: **VERIFIED in configuration**, with direct operational reconfirmation still required before public launch.

Why the broad Cartagena contact changed: the Ayuntamiento de Cartagena lists Radio Taxi Cartagena among the municipal taxi operators, and the operator's own official site publishes the general Cartagena dispatch numbers while describing taxi service in Cartagena and La Manga. Cabo de Palos is inside Cartagena municipality. This gives HOY a defensible municipality-level routing contact without pretending that a La Manga-specific number has been verified for Cabo de Palos.

The existing `radio-taxi-la-manga` record remains in the data because its La Manga-specific numbers are officially listed:

- `968 145 000`
- `968 563 863`

However, its association with the broad `cartagena-coast` area is intentionally **SUSPENDED**. It must not be selected for Cabo de Palos merely because it is valid for La Manga del Mar Menor (Cartagena). A future narrower La Manga-only service area could use it if operational verification supports that design.

### San Javier

- Service area: `san-javier`
- Provider: `radio-taxi-san-javier`
- Primary: `968 573 300`
- Official source: Turismo Región de Murcia / San Javier public listings
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

The page now loads `app-3-6.js` before `mobility-2.29.js`. `initCloud()` therefore creates the Supabase client before Mobility reads its runtime gate, eliminating the startup race structurally rather than relying on timing retries.

### Public-role RLS test

The resolver was executed under the `anon` role and returned valid resolved results through the public client path, confirming that the required read policies and `SECURITY INVOKER` path work.

## Current backend test cases

- `37.655050, -0.722400` → La Manga (Cartagena) → Radio Taxi Cartagena `968 311 515` → **resolved**.
- `37.634690, -0.690290` → Faro de Cabo de Palos vicinity → Radio Taxi Cartagena `968 311 515` → **resolved**.
- `37.705673, -0.742513` → La Manga (San Javier) → Radio Taxi San Javier `968 573 300` → **resolved**.
- GPS accuracy `180 m` at the Cartagena test point → uncertain / `low_location_accuracy` → no provider action.
- A point on or inside the configured safety corridor around the cached shared municipal boundary → uncertain / no provider.
- Madrid → unsupported / no provider.
- Runtime kill switch off → disabled / no provider.

## Browser QA

The PR-local Playwright smoke suite covers:

- guest UI hidden while `consumer_visible=false`;
- preview mode;
- server-side routing kill switch behavior;
- fail-closed boundary response with no telephone action;
- resolved Cartagena/Cabo de Palos response using `Radio Taxi Cartagena` and the general dispatch number;
- resolved San Javier response using `Radio Taxi San Javier`;
- absence of raw GPS coordinates in local Mobility analytics;
- correct script order and PWA cache wiring.

## Public-launch gates

Official-source and technical provider verification is now complete for both configured municipality-level routes. Before calling Mobility production-ready for guests:

1. Reconfirm operationally with Radio Taxi Cartagena that `968 311 515` / `968 520 404` are appropriate dispatch numbers for pickups in the Cartagena part of La Manga **and Cabo de Palos**.
2. Reconfirm operationally with Radio Taxi San Javier that `968 573 300` is the appropriate dispatch contact for pickups in the San Javier part of La Manga.
3. Re-check whether an `Área de Prestación Conjunta` for La Manga has become legally effective and update service-area rules if necessary.
4. Run a real-device browser QA pass in La Manga: one Cartagena pickup, one San Javier pickup, one Cabo de Palos pickup, and one pickup close to the municipal boundary.
5. Only after those gates pass, set `consumer_visible=true`.

The architecture treats these as data/verification gates rather than frontend code changes.

# HOY Mobility — Outreach Status

Status date: 2026-08-12

## Decision

Taxi-provider outreach is intentionally **deferred** until HOY is otherwise release-ready.

No email, WhatsApp message, contact-form submission, or phone call should be sent before that point.

## Why this is safe to defer

The remaining issue is narrow and operational, not architectural. HOY Mobility already has:

- fail-closed routing;
- separate Cartagena and San Javier municipal boundary resolution;
- provider-area verification states;
- separate launch-gate state;
- a server-side kill switch;
- consumer visibility disabled;
- prepared verification questions and response handling.

The unresolved Cartagena/Cabo de Palos contact confirmation cannot leak into the guest experience because the provider launch gate remains pending until the final direct confirmation is recorded.

## Current release state

- `routing_enabled = true`
- `consumer_visible = false`
- `preview_visible = true`
- San Javier provider: verified and launch-clear.
- Cartagena/Cabo de Palos: technically verified but launch-gated pending final direct operational confirmation and real-device QA.

## Reopen this task when

HOY Gastro is otherwise functionally and visually release-ready and the team is preparing the final production checklist.

At that point:

1. Contact Radio Taxi Cartagena using the prepared Spanish verification message / phone script.
2. Confirm the correct pickup contact for Cabo de Palos and the Cartagena part of La Manga.
3. Re-check whether an Área de Prestación Conjunta has become legally effective.
4. Record the verification method, date, evidence, and answer.
5. Update the Cartagena provider launch gate accordingly.
6. Perform real-device QA in Cartagena-La Manga, San Javier-La Manga, Cabo de Palos, and near the municipal boundary.
7. Only after those checks, consider setting `consumer_visible = true`.

Until then: **do not contact providers and do not expose Mobility to normal guests.**

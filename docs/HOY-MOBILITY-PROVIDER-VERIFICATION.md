# HOY Mobility · Provider verification pack

Status: **prepared only — nothing sent**.

Purpose: remove the final operational uncertainty before `consumer_visible=true`.

## Current verified routing state

| Pickup area | HOY provider | Phone | Status |
|---|---|---:|---|
| La Manga (Cartagena) | Radio Taxi Cartagena | 968 311 515 | technically verified |
| Cabo de Palos | Radio Taxi Cartagena | 968 311 515 | technically verified; direct Cabo confirmation still desired |
| La Manga (San Javier) | Radio Taxi San Javier | 968 573 300 | verified, including whole-municipality scope |

The La Manga-specific Cartagena numbers `968 145 000` / `968 563 863` remain stored but are **suspended for the broad Cartagena/Cabo service area**. They must not be used for Cabo de Palos unless a narrower service-area rule is created later.

## Final Cartagena questions

HOY only needs clear answers to these three points:

1. For a pickup **in Cabo de Palos**, are `968 311 515` / `968 520 404` the correct Radio Taxi Cartagena dispatch numbers?
2. For a pickup **in the Cartagena part of La Manga**, should a visitor use the La Manga-specific numbers `968 145 000` / `968 563 863`, the general Cartagena numbers, or are both valid?
3. Is any **Área de Prestación Conjunta** between Cartagena and San Javier currently operational in La Manga in a way that changes which taxis may pick up passengers on each side?

A vague reply such as “we operate in the area” is not enough to change HOY routing. We need an explicit answer about the pickup contact / scope.

## Spanish email — prepared, not sent

**To:** `info@radiotaxicartagena.es`

**Subject:** `Consulta sobre el teléfono correcto de taxi en Cabo de Palos y La Manga`

Buenos días,

estamos preparando HOY, una guía local para La Manga del Mar Menor y Cabo de Palos, y queremos asegurarnos de mostrar a los usuarios el contacto de taxi correcto según el lugar exacto de recogida, sin hacer suposiciones.

¿Podrían confirmarnos, por favor, estos tres puntos?

1. Para una recogida que comienza en **Cabo de Palos**, ¿son correctos los teléfonos generales de Radio Taxi Cartagena **968 311 515 / 968 520 404**?

2. Para una recogida en la parte de **La Manga que pertenece al municipio de Cartagena**, ¿deben utilizarse los teléfonos específicos de La Manga **968 145 000 / 968 563 863**, o también son válidos los teléfonos generales de Cartagena?

3. ¿Está actualmente en funcionamiento algún **Área de Prestación Conjunta entre Cartagena y San Javier en La Manga** que cambie qué taxis pueden recoger pasajeros a cada lado del límite municipal?

HOY no pretende reservar ni intermediar servicios de taxi en esta fase; únicamente queremos indicar al visitante el contacto correcto para su lugar de recogida.

Muchas gracias por su ayuda.

Un saludo,
Jan · HOY

## Short Spanish phone script

> Buenos días. Estoy preparando una guía local llamada HOY para La Manga y Cabo de Palos. Solo quiero confirmar el teléfono correcto según el lugar de recogida. ¿Me puede ayudar con tres preguntas muy concretas?
>
> Primero: si el cliente está en **Cabo de Palos**, ¿debe llamar al **968 311 515** o al **968 520 404** de Radio Taxi Cartagena?
>
> Segundo: si está en **La Manga, pero en la parte de Cartagena**, ¿debe llamar a esos números generales o a **968 145 000 / 968 563 863** de Radio Taxi La Manga?
>
> Y tercero: ¿existe ya algún **Área de Prestación Conjunta con San Javier** que cambie esta regla de recogida?

If the person gives only a general answer, follow up with:

> Para asegurarme: si un turista está físicamente en Cabo de Palos y pulsa “Taxi” en HOY, ¿qué número exacto debemos mostrarle?

## Answer matrix → backend action

### Scenario A — Cabo = general Cartagena; La Manga Cartagena = general Cartagena too

Keep current v0.1 configuration:

- `radio-taxi-cartagena` → `cartagena-coast` = `verified`, priority `5`
- `radio-taxi-la-manga` → `cartagena-coast` = `suspended`

This is the simplest municipality-level model.

### Scenario B — Cabo = general Cartagena; La Manga Cartagena should use the La Manga-specific dispatch

Do **not** reactivate the La Manga number for the broad `cartagena-coast` area.

Instead create two narrower Cartagena service areas / geographic rules:

- `cartagena-cabo-de-palos` → Radio Taxi Cartagena
- `cartagena-la-manga` → Radio Taxi La Manga

The resolver must choose the narrower area by verified geometry/POI rule before provider selection.

### Scenario C — both numbers are valid in Cartagena La Manga, but Cabo uses general Cartagena

For v0.1 keep the general Cartagena provider as the single automatic contact. Optionally expose the La Manga-specific number later as a secondary local contact **only inside a verified La Manga-only area**.

### Scenario D — APC is legally/operationally active

Do not simply remove the municipal boundary rule. First record:

- effective date;
- legal/official source;
- exact geographic scope;
- whether both fleets may originate pickups anywhere inside the joint area;
- preferred dispatch contact(s).

Then update the service-area model and resolver centrally.

## Evidence checklist

For every provider-area verification keep:

- date checked;
- source type: municipality / regional authority / operator;
- URL or contact identity;
- exact phone confirmed;
- exact pickup geography confirmed;
- whether confirmation was written or verbal;
- name/role of person if voluntarily provided;
- any time/season restrictions;
- APC status if discussed.

Do **not** store customer GPS data as verification evidence.

## Real-device release QA

Before public activation test on a real phone with location permission:

1. La Manga — Cartagena side, well away from boundary → expected provider.
2. Cabo de Palos → expected provider.
3. La Manga — San Javier side → Radio Taxi San Javier `968 573 300`.
4. Near Cartagena/San Javier boundary → **no automatic phone action**.
5. Deny location permission → no automatic phone action.
6. Force poor location accuracy if reproducible → no automatic phone action.
7. Test alternate Cartagena number button.
8. Confirm `tel:` opens the dialer but does not place the call automatically.
9. Confirm the guest UI is still absent with `consumer_visible=false` before final activation.
10. Only after all gates pass, enable `consumer_visible=true` centrally.

## Release decision

`consumer_visible` must remain **false** until:

- the remaining Cabo de Palos dispatch question is directly confirmed or otherwise supported by an equally strong primary source;
- no current legally effective APC contradicts the routing model;
- real-device QA passes.

Until then the backend may remain active for preview/testing because the guest-facing UI is independently gated off.

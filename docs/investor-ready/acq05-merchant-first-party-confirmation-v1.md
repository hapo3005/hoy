# ACQ-05 — Merchant First-Party Confirmation v1

Status: **IMPLEMENTED CANDIDATE / NOT LIVE**

ACQ-05 turns HOY's existing operator-confirmation primitives into a buyer-auditable confirmation path without pretending that factual confirmation and commercial rights are the same thing.

## 1. The key distinction

HOY now treats merchant confirmation as two separate proof layers.

### F1 — factual operator confirmation

A verified operator confirms or corrects a concrete fact such as weekly opening hours. This improves product trust, freshness and first-party provenance.

F1 can exist without commercial Business Terms because a business must be able to correct its own data without being forced into a commercial licence grant.

**F1 does not mean:** transferable rights, a commercial licence, whole-profile clearance, paid demand or retention.

### R1 — rights-backed confirmation receipt

After a reviewed Business Terms version is active and the verified operator has accepted it, HOY may create a separate due-diligence receipt for the exact confirmed subject and canonical payload.

The receipt binds:

- restaurant;
- confirmation type;
- subject type/ref;
- SHA-256 of the canonical payload;
- Business Terms acceptance receipt;
- source channel;
- timestamp;
- active/superseded/revoked lifecycle;
- audit trail.

**R1 still does not mean:** every field in the merchant profile is transferable or that unrelated third-party data becomes clear.

## 2. Existing production trust root — read only

The production system already contains the primitives ACQ-05 needs:

- `operator-hours-confirm` requires a verified restaurant membership and `operator_verified` entitlement before writing weekly hours;
- `restaurant_live_hours` stores `confirmed_by` and `confirmed_at`;
- successful factual confirmation is written to `audit_logs`;
- `private.business_data_confirmations` already exists as the rights-receipt ledger;
- `operator_record_business_confirmation` requires a payload SHA-256 and delegates to a private terms-gated implementation;
- the private implementation requires an active Business Terms acceptance, supersedes an earlier active receipt for the same subject and writes an audit event.

Read-only Production baseline observed on 2026-08-19:

- Business Terms versions: 1;
- active Business Terms versions: 0;
- active Terms acceptances: 0;
- business-data confirmations: 0;
- active business-data confirmations: 0;
- operator-confirmed live-hours rows: 0;
- operator-confirmed service rows: 0;
- profile change requests: 0.

ACQ-05 performed **no Production mutation** to obtain this baseline.

## 3. Reference implementation: weekly hours

The first end-to-end candidate is deliberately narrow: **weekly opening hours only**.

After `operator-hours-confirm` successfully stores a factual confirmation, `merchant-confirmation-receipt-2.48.js` may attempt to create the second, rights-backed receipt.

The attempt is fail-closed:

1. no successful factual confirmation → no R1 attempt;
2. Business Terms gate not active → no R1 receipt;
3. active Terms but current operator has not accepted → no R1 receipt;
4. accepted Terms → canonicalise the exact hours payload;
5. calculate SHA-256 in the browser;
6. call `operator_record_business_confirmation` with fixed `operator_dashboard` source channel;
7. only a successful RPC response counts as an R1 receipt.

The free factual confirmation is never rolled back just because the rights receipt cannot be written. That separation is intentional: product truth and commercial-rights evidence are related, but they are not the same legal event.

### Canonical payload

The v1 hours payload contains only:

- `restaurant_id`;
- `timezone`;
- `weekly_hours`;
- `display_text`.

Dynamic actor identifiers are not part of the payload. User IDs remain server-side trust evidence and are not exposed in buyer-facing exports by default.

## 4. PII and evidence minimisation

The client receipt helper only allows small operational evidence values and strips evidence keys that look like personal data (`email`, `phone`, `name`, `address`, `note`, `message`, `user`, etc.).

This is not a replacement for server-side validation. The canonical rights ledger remains controlled by the existing authenticated RPC and private terms gate.

## 5. Coverage metrics

ACQ-05 defines three different metrics so DD cannot collapse them into one vanity percentage.

### Merchant factual confirmation coverage

Launch-critical fields with a current verified-operator factual confirmation / the frozen launch-critical field denominator.

This measures **first-party factual provenance**.

### Rights-backed confirmation coverage

Launch-critical fields whose current canonical payload has an active, non-revoked, non-superseded R1 receipt / the same denominator.

This measures **terms-linked receipt coverage**, not whole-profile clearance.

### Confirmation freshness within SLA

Confirmed launch-critical fields still inside their field-specific freshness window / confirmed launch-critical fields.

This measures **operational freshness**, not rights.

## 6. Rollout order

Weekly hours is the reference implementation because the verified operator flow already exists end-to-end.

Next fields are intentionally gated:

- **Services:** reconcile the actual operator write/confirmation path before wiring an R1 receipt.
- **Profile core (address/phone/website):** only receipt after an approved/applied change or a separate explicit no-change confirmation contract.
- **Menu/media/accessibility/offers/events/live status:** require field-specific authority, canonical-payload semantics and rights boundaries before wiring.

This avoids a generic `confirm everything` button that would be weak evidence in acquisition DD.

## 7. Buyer-safe DD rules

A buyer-facing confirmation export may include subject identifiers, payload hash, timestamps, source channel, Terms version and current receipt status. It should not expose raw user IDs or unrestricted Terms evidence by default.

A receipt only counts in current coverage when:

- status is active;
- it is not revoked or superseded;
- the payload hash still matches the current canonical subject state.

## 8. Anti-overclaim rules

- factual confirmation is not rights clearance;
- a rights receipt is not whole-profile transfer clearance;
- Terms acceptance is not payment proof;
- confirmation count is not merchant retention;
- stale confirmation is not current data;
- revoked/superseded receipt is not active coverage;
- no active accepted Terms means no rights receipt;
- receipt failure must not undo a free factual correction.

## 9. Release boundary

Before this candidate can be treated as a live rights-backed confirmation path, HOY still needs:

1. reviewed and active Business Terms;
2. current Privacy Notice linkage;
3. re-verification of the confirmation RPC and live hours response contract;
4. browser/security regression evidence;
5. versioned buyer-safe export query;
6. explicit release authorization.

No Business Terms activation, Production DML/DDL, Edge redeploy, buyer export, outreach or merge is authorized by ACQ-05.

# HOY Business Terms Acceptance & Evidence Specification v1.0

**Status:** IMPLEMENTED INFRASTRUCTURE / CONTRACT NOT ACTIVE  
**Date:** 2026-08-18  
**Applies to:** HOY operator/business onboarding and Business Confirmed data  

## 1. Objective

HOY must be able to prove not merely that a business account existed, but:

1. who was authenticated;
2. which business/venue they represented;
3. that their business authority was verified;
4. which exact Terms version was presented;
5. which exact document version/hash was accepted;
6. in which language it was presented;
7. when and by which acceptance method it was accepted;
8. which mandatory rights/privacy/change-of-control acknowledgements were made; and
9. which exact later data snapshot was Business Confirmed under that acceptance.

The chain is:

`Verified membership → active Terms version → exact-version acceptance → immutable receipt → operator action → exact-payload Business Confirmation → audit history`

## 2. Separation of controls

HOY deliberately separates:

- **Business identity / claim verification** — is this user authorized for this business?
- **Contract acceptance** — did this authorized user accept the active Business Terms?
- **Data confirmation** — what exact data snapshot did the business confirm?
- **Rights status** — what use is actually permitted?
- **Trust status** — is the fact Business Confirmed, HOY Verified, Community Confirmed or external/unverified?

No one control substitutes for another.

## 3. Version registry

Production table:

`private.business_terms_versions`

Each version records at least:

- immutable `terms_version`;
- title and master locale;
- document repository path;
- Git blob evidence;
- final document SHA-256;
- Spanish localization path + SHA-256;
- HOY legal entity and address;
- registration/VAT details where applicable;
- legal/privacy contact;
- privacy-notice version;
- governing law and jurisdiction;
- effective/activation timestamps;
- counsel-review timestamp/reference;
- supersession relationship.

### Activation fail-closed rule

A database constraint prevents `status='active'` unless all critical activation evidence is complete.

Version 1.0 is currently `draft` and therefore cannot trigger operator acceptance gates.

The Spanish localization draft is registered at `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md`; its final SHA-256 remains intentionally unset until legal review is complete.

A live negative activation test confirmed that incomplete v1.0 cannot be switched to `active`: PostgreSQL rejected the transition and retained `draft` status.

## 4. Electronic acceptance receipt

Production table:

`private.business_terms_acceptances`

A valid current receipt binds:

- `restaurant_id`;
- authenticated `user_id`;
- exact `terms_version`;
- exact `document_sha256`;
- acceptance timestamp;
- presented locale;
- stated authority role;
- acceptance method;
- mandatory acknowledgement flags;
- evidence metadata;
- revocation/supersession state.

Direct client-table access is denied. Acceptance is created only through controlled RPC logic.

## 5. Required acknowledgements

Acceptance fails unless all mandatory acknowledgements are affirmative:

- representative authority;
- Business Content/data permission to the extent of the Business's authority;
- media-rights responsibility;
- change-of-control continuity;
- privacy-notice acknowledgement.

Checkboxes must not be pre-selected in the future UI.

## 6. Operator RPC architecture

Public authenticated API wrappers are `SECURITY INVOKER`:

- `public.get_business_terms_status(restaurant_id)`
- `public.operator_accept_business_terms(...)`
- `public.operator_record_business_confirmation(...)`

Privileged access to private evidence tables lives in non-public `private` helper functions. This keeps privileged table access out of the exposed RPC surface while preserving explicit authentication/membership checks.

## 7. Dormant operator write gate

Production trigger function:

`private.enforce_business_terms_on_operator_write()`

The gate is attached to **10** operator-relevant write paths covering:

- profile changes;
- upgrades;
- offers/events;
- menu intake;
- live/special hours;
- services;
- media.

If **no active Terms version exists**, the gate is dormant and current behavior is unchanged.

If an active Terms version exists, a verified business member attempting an operator write must have a current acceptance matching the active document hash.

This allows the infrastructure to be deployed before legal activation without silently imposing a draft contract.

## 8. Business Confirmation Ledger

Production table:

`private.business_data_confirmations`

A Business Confirmation is separate from accepting the Terms.

Each confirmation binds:

- restaurant;
- authenticated representative;
- exact Terms acceptance receipt;
- confirmation type;
- subject type/ref;
- exact payload SHA-256;
- source channel;
- evidence metadata;
- confirmation timestamp.

A new confirmation for the same subject supersedes, rather than erases, the prior active confirmation.

Supported confirmation types include profile, hours, services, accessibility, menu, media, offer, event and live status.

## 9. Business Confirmed promotion rule

A data point may be promoted to **Business Confirmed** only when HOY can link the current material value/snapshot to a valid confirmation record.

Therefore:

`Business website observed` ≠ `Business Confirmed`

and

`Terms accepted` ≠ `all existing research confirmed`.

A representative must affirm the relevant current data snapshot.

## 10. Payload hashing

The confirmation client/service must canonicalize the material payload before calculating SHA-256. The canonicalization specification must be stable and versioned before production confirmation UI is enabled.

Recommended v1 rule:

- UTF-8 JSON;
- recursively sorted object keys;
- arrays remain ordered where order is semantically meaningful;
- no insignificant whitespace;
- explicit null handling;
- canonicalizer version stored in evidence metadata.

Until this canonicalizer is implemented and tested, the confirmation endpoint exists but no Business Confirmed production workflow should be declared complete.

## 11. Spanish electronic-contract UX requirements

Before activation, the operator UI must be able to:

- display the applicable general conditions before acceptance;
- provide them in a form the recipient can store/reproduce;
- state the language(s) available for contracting;
- provide a way to identify/correct input errors;
- preserve the applicable exact Terms version;
- provide a confirmation/receipt of acceptance capable of being archived.

The final flow should also provide a durable receipt reference and access to the accepted Terms version.

## 12. Privacy role separation

Acceptance of the Business Terms does not replace GDPR analysis.

HOY must separately document for each personal-data processing activity whether HOY is controller, joint controller or processor.

Where HOY acts as a processor on behalf of a Business, an Article 28-compliant DPA must be executed for that processing before launch where required.

## 13. Change-of-control evidence

The Business Terms contain continuity language for bona fide HOY mergers, share sales, asset sales and similar changes of control.

The acceptance receipt proves which version containing that provision was accepted.

This improves buyer DD because transferability is evidenced rather than inferred, but only within the rights the Business itself was entitled to grant.

## 14. Activation checklist

Version 1.0 must remain draft until all are complete:

- [ ] definitive HOY legal entity;
- [ ] registered address/registration identifiers;
- [ ] legal contact;
- [ ] governing law/jurisdiction;
- [ ] final German master counsel review;
- [ ] final Spanish legal localization counsel review;
- [ ] privacy notice version;
- [ ] separate DPA decision/template where needed;
- [ ] final DE SHA-256;
- [ ] final ES SHA-256;
- [ ] operator acceptance UI;
- [ ] pre-contract Terms download/archive mechanism;
- [ ] error-correction UX;
- [ ] receipt/archive UX;
- [ ] canonical payload hashing implementation;
- [ ] end-to-end acceptance/confirmation tests;
- [ ] activation migration/record approved.

## 15. Current DD statement

**Infrastructure live:** yes.  
**Business Terms legally active:** no.  
**Current acceptances:** none at implementation time.  
**Current verified restaurant memberships:** none at implementation time.  
**Business Confirmation ledger live:** yes, empty at implementation time.  
**Operator Terms triggers:** 10.  
**Activation negative test:** passed.  
**Impact on current operator behavior:** none while no active Terms version exists.

## 16. Source references for final legal review

- Spain LSSI, Ley 34/2002, Articles 23, 27 and 28 (electronic contracting): BOE-A-2002-13758.
- Spanish Intellectual Property Act, RDL 1/1996, Article 43 (exploitation rights, modes, time and territory): BOE-A-1996-8930.
- GDPR, Regulation (EU) 2016/679, Articles 5, 6 and 28.

**This specification is a product/DD control, not final legal advice.**
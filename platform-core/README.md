# HOY Platform Core v1.0

HOY Platform Core is the canonical source of cross-vertical decision truth for HOY Gastro, HOY Lifestyle and HOY Works.

## Why this exists

Before v1.0, each vertical implemented overlapping versions of trust, freshness, requirement matching and commercial rules. That creates drift and makes a later buyer or operator maintain the same business invariant several times.

Platform Core removes that duplication. Verticals keep their own domain data, UI, score weights and workflows, but they no longer own the meaning of:

- confirmed vs unconfirmed evidence;
- stale vs current evidence;
- `MUST` / `PREFER` / `IGNORE`;
- `MATCH` / `NO_MATCH` / `NEEDS_CONFIRMATION`;
- live availability expiry;
- hard safety suppression;
- commercial disclosure and organic-ranking independence.

## Runtime model

`hoy-platform-core-v1.js` is intentionally dependency-free UMD. The same file runs:

- in browsers as `window.HOYPlatformCore`;
- in Node tests through `require()`;
- as the immutable vendored runtime copied into a vertical release.

There is no second handwritten build artifact. A vertical vendor copy is generated from this file and pinned to an immutable Git commit + Git blob SHA.

## Vertical boundary

Vertical adapters MAY:

- translate domain field names into the canonical fact/request shape;
- add domain hard gates that do not weaken platform gates;
- calculate organic domain score signals (e.g. cuisine fit, family fit, distance, language, trade/service fit);
- render domain-specific reasons and labels.

Vertical adapters MUST NOT:

- treat research as operator confirmation;
- change the confirmed verification levels;
- make stale or unknown evidence positive;
- let `PREFER` rescue a failed `MUST`;
- let sponsorship change organic score/rank;
- bypass a platform safety block.

## Canonical matching semantics

Default `MUST=yes` behavior:

- confirmed `yes` -> `MATCH`;
- confirmed `no`, `partial`, `not_applicable`, `temporarily_unavailable` -> `NO_MATCH`;
- `unknown`, missing, stale, disputed or externally unverified -> `NEEDS_CONFIRMATION`.

Numeric facts support `gte` and `lte` comparisons. `PREFER` contributes only preference fit; it never changes a failed MUST into a match.

## Freshness

Public research uses a 180-day default maximum age and requires a usable research timestamp. A vertical can adopt a stricter maximum age, but must not silently make the canonical default weaker without a Platform Core contract version change.

Live availability is current only when both a confirmation timestamp and a future expiry exist.

## Commercial integrity

Sponsorship is decoration after organic ranking. An eligible placement must be active, approved and disclosure-enabled and is labelled `Anzeige`. Suppressed entities cannot be promoted.

## Release discipline

A Platform Core version change requires:

1. core contract tests green;
2. consumer contract updated when semantics change;
3. each vertical pin updated through its sync script;
4. vertical contract/unit/browser QA green;
5. no Production database or legal gate implicitly waived by a core release.

`PARITY_CODE_COMPLETE` never means legal, production, live-data or market-proof gates are complete.

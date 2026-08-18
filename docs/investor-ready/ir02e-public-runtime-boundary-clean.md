# HOY Investor Ready — IR-02E Public Runtime / Proprietary Source Boundary

Status: **GREEN CANDIDATE / LIVE CUTOVER NOT EXECUTED**  
Date: 2026-08-19  
Scope: deterministic public deployment artifact and fail-closed exclusion of internal source/DD assets.

## Buyer thesis

HOY must distinguish two facts that are often confused in technical DD:

1. JavaScript/CSS delivered to a browser is inherently inspectable and cannot be treated as confidential merely because the source repository is private.
2. Internal assets that do **not** need to ship to the browser — SQL/migrations, internal data, tests, scripts, DD/legal material and private operating artifacts — should not be bundled into the public deployment artifact.

IR-02E creates a reproducible boundary between those two surfaces.

## Candidate implementation

`deploy/public-runtime-policy.json` is an allowlist-first policy. It permits reviewed root runtime formats, reviewed public media directories and individual optional Platform Core browser runtimes.

It blocks internal directories such as `.github`, `data`, `docs`, `scripts`, `supabase` and `tests`; non-runtime formats such as SQL/Markdown/workflow source; secret/private-key filename fragments; and configured critical secret patterns inside copied runtime text.

Unknown top-level directories are not public by default.

## Platform Core compatibility

The policy intentionally does **not** allowlist the whole `platform-core` directory.

If Platform Core exists in the integration state, only these explicit browser runtimes are eligible:

- `platform-core/hoy-platform-core-v1.js`
- `platform-core/gastro-adapter-v1.js`

Internal Platform Core README, consumer/adoption contracts and tests remain excluded.

## Deterministic evidence

`scripts/build-public-runtime.mjs` creates a clean public artifact and a `public-release-manifest.json` containing exact path, byte count and SHA-256 per file.

The manifest deliberately contains no volatile generation timestamp. Workflow/run metadata can record time externally without changing the content-addressed runtime manifest.

`scripts/check-ir02e-public-runtime.mjs`:

1. builds the artifact;
2. verifies forbidden paths/extensions/names/patterns are absent;
3. verifies every local `index.html` runtime reference exists;
4. verifies public package metadata exposes only name/version;
5. verifies manifest counts, bytes and SHA-256;
6. rebuilds from identical source and requires byte-identical manifest output;
7. verifies optional Platform Core runtime inclusion without internal Platform Core leakage.

The check is executed by `tests/ir02e-public-runtime-contract.spec.js` in the existing full PR browser matrix.

## Defensible claim after exact-head QA

> HOY has a deterministic, fail-closed public-runtime packaging boundary that separates browser-delivered assets from internal source/DD surfaces and produces content-addressed release evidence.

This does **not** prove that historical public repository copies are retroactively confidential, source repositories are already company-owned/private, the live Pages/DNS target already serves only this artifact, or all IP/data/third-party rights are cleared.

## Live-cutover close conditions

IR-02E remains incomplete operationally until:

- the final integration head passes the IR-02E gate;
- the public deployment target is configured from the generated artifact only;
- live smoke testing confirms required browser assets work from that artifact;
- source repository visibility/ownership is an explicit company/IP decision;
- historical exposure is disclosed accurately;
- the acquired-state manifest is archived in the data room.

## Safety boundary

This candidate changes no GitHub Pages/DNS configuration, repository visibility/ownership, Production deployment or outreach.

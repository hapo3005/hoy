# RT-006 — Supply-Chain Hardening Evidence

Status: **candidate hardening technically verified; no Production deploy; no merge authorized**

## Scope

This evidence package covers the isolated draft branch `security/rt006-supply-chain-hardening` / PR #112. It hardens dependency reproducibility and GitHub Actions supply-chain references without changing HOY product logic, database state, Supabase configuration or Production deployment.

## Reproducible QA dependency graph

- Node used for materialization/verification: `v22.23.2`
- npm used: `10.9.8`
- committed lock format: npm lockfile v3
- exact direct QA dependency: `@playwright/test@1.62.0`
- `npm ci --ignore-scripts` succeeds from the committed `package-lock.json`
- package-lock SHA-256: `4ea84e81203520335e98734d5598c5ce8364c7af41bbb4c8bc4c2afb07742028`
- QA workflows that install the repository dependency graph use `npm ci --ignore-scripts` rather than resolving a fresh graph with `npm install`

## Immutable GitHub Actions

The controlled materialization run resolved the three mutable Action families used by HOY to immutable commit SHAs:

| Mutable ref | Immutable commit SHA |
|---|---|
| `actions/checkout@v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| `actions/setup-node@v6` | `249970729cb0ef3589644e2896645e5dc5ba9c38` |
| `actions/upload-artifact@v5` | `330a01c490aca151604b8cf639adc76d48f6c5d4` |

The final verify-only gate examined the candidate workflow set and reported **30 external `uses:` entries, all immutable-SHA pinned**.

## Materialization provenance

- controlled materialization run: `32188861714`
- materialized candidate artifact: `9343469686`
- artifact digest: `sha256:4d609362d52e106c754f250e5aea738fa5ed58abfbf44a97162c7d0cb01b15e7`
- the GitHub Actions token correctly refused to rewrite workflow files because it did not hold workflow-write permission
- the validated artifact was therefore applied through the authenticated GitHub connector
- the temporary write-back materializer workflow and script were removed after materialization
- the retained `rt006-supply-chain-hardening.yml` is read-only / verify-only with `contents: read`

## Verification gate

Successful verifier run `32189566067` established on the candidate at that stage that:

- the committed lock exists and `npm ci --ignore-scripts` succeeds
- `@playwright/test` resolves exactly to `1.62.0`
- every external GitHub Actions reference is an immutable 40-character commit SHA
- the recorded lock digest and the three approved Action commit SHAs match this evidence file

Subsequent branch changes only replace remaining QA `npm install` commands with `npm ci --ignore-scripts` and update this evidence record; the same fail-closed verifier is required to pass on the final PR head.

## Close boundary

This closes the **RT-006 supply-chain candidate** only when the verifier and normal PR QA are green on the final head. RT-006 overall remains open until the approved runtime-pin candidates are combined, a fresh release-candidate SBOM/licence review is generated, third-party notices are finalized, the AI Asset Register is completed, and no unresolved unknown/custom/copyleft licence issue remains.

F0-M / investor outreach remains blocked.

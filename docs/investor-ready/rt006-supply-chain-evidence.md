# RT-006 — Supply-Chain Hardening Evidence

Status: **materialized candidate; no Production deploy; no merge authorized**

- Branch: `security/rt006-supply-chain-hardening`
- Materializer source SHA: `d44a34b85df9c2aa022c8579917cc69d7b890051`
- Node: `v22.23.2`
- npm: `10.9.8`
- package-lock SHA-256: `4ea84e81203520335e98734d5598c5ce8364c7af41bbb4c8bc4c2afb07742028`
- Unique mutable external Action refs resolved: **3**
- Workflow files changed by pinning: **11**

## Action pin map

| Mutable ref | Immutable commit SHA |
|---|---|
| `actions/checkout@v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| `actions/setup-node@v6` | `249970729cb0ef3589644e2896645e5dc5ba9c38` |
| `actions/upload-artifact@v5` | `330a01c490aca151604b8cf639adc76d48f6c5d4` |

## Verification

- `npm ci --ignore-scripts` succeeds from committed package metadata.
- Every external `uses:` reference in `.github/workflows` is a 40-character immutable commit SHA after materialization.
- Product logic, database state and Production deployment are outside this candidate.
- Final RT-006 close still requires repository QA and a fresh release-candidate SBOM/licence review.

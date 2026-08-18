# HOY Investor Ready — IR-02A Exit / Transferability Checklist

**Audit date:** 2026-08-18  
**Status:** Operational checklist created; account/legal evidence still requires collection.

| Critical asset/service | Current evidence | Transferability status | Required evidence before DD close |
|---|---|---|---|
| `hapo3005/hoy` GitHub repo | active repository + version history | AMBER | legal owner; admin list; 2FA/recovery; export/mirror procedure; buyer/org transfer path |
| `hapo3005/hoy-works` | active repository + version history | AMBER | same as above |
| `hapo3005/hoy-lifestyle` | active repository + version history | AMBER | same as above |
| Supabase `HOY La Manga` | active project, EU region, schema/data/migrations | AMBER | organisation/legal owner; billing; admins; DPA/terms; secrets inventory; backup/export; ownership transfer/change-of-control path |
| Supabase `HOY Works` | active project, EU region, schema/functions | AMBER | same as above |
| Production domains / DNS | not established in this audit | REVIEW_REQUIRED | registrar, registrant/legal owner, DNS admin, renewal dates, transfer lock/auth-code procedure |
| Brand / trademark rights | not established in this audit | REVIEW_REQUIRED | marks, classes, jurisdictions, filing/registration owner, transferability |
| Analytics/history | live database exists | AMBER | privacy-compliant transfer basis; clean measurement cutoff; retention/deletion schedule |
| Business/operator agreements | not yet evidenced | REVIEW_REQUIRED | assignment/change-of-control clauses; data/media use rights; termination survival where needed |
| OSS dependencies | partial register created | AMBER → GREEN by dependency | notices/licence obligations reproducible in data room |
| Third-party data sources | source-rights triage created | AMBER/REVIEW_REQUIRED | domain/provider decisions and licences/permissions where required |
| Release/operations knowledge | Gastro has QA/release runbooks; Works docs exist | AMBER | consolidated buyer runbook, secrets rotation, deployment ownership, incident process |

## Buyer handover package — target contents

1. repository transfer/mirror and verified commit history;
2. database schema, migration history and clean export procedure;
3. environment variable / secret inventory without exposing secrets in the data room;
4. domain/DNS/registrar transfer procedure;
5. SaaS/vendor account ownership map;
6. current contracts, DPAs and material third-party terms;
7. Chain-of-Title schedule and signed evidence;
8. OSS notice/licence pack;
9. source-rights and data provenance registers;
10. privacy/retention/ROPA material;
11. release/rollback/backup/incident runbooks;
12. list of non-transferable or consent-dependent assets.

## Gate

HOY is not marked `EXIT_TRANSFER_READY` until the buyer could take control without relying on undocumented founder-only credentials, personal accounts or implied rights.

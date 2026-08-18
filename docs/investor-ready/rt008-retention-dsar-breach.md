# HOY RT-008 — Retention, DSAR & Personal Data Breach Runbook

Status: working operating standard; legal retention periods and controller/supervisory-authority details require final entity/counsel confirmation.

## A. Retention policy

Retention is purpose-based. “Keep forever because it may be valuable” is prohibited.

| Dataset | Proposed operational retention | End action | Notes |
|---|---|---|---|
| Raw pseudonymous analytics | max 90 days | delete/anonymise into approved aggregates | analytics remains off until consent gate is live |
| Analytics persistent UUID | max aligned to consent/raw analytics period | remove/reset on withdrawal/expiry | session UUID session-only |
| Proof pilot cohort code | cohort end + 30 days, max 90 days unless separately justified | delete from device/server mapping | no persistence before analytics consent |
| Local raw analytics history | Production: none | not stored | QA/preview only |
| Named indirect B2B contacts | Article 14 deadline first; then revalidate/delete at 12 months if lawful | purge/minimise person fields or refresh basis | objections create minimal suppression state if justified |
| Rejected/abandoned business claim/provider application | target 6 months | delete/minimise | validate dispute/fraud need |
| Active operator/provider relationship metadata | contract term + provisional 6 months | delete/minimise unless legal/tax hold | accounting records follow separate statutory schedule |
| App security/audit logs | provisional 12 months | delete/minimise | extend only for documented incident/legal hold |
| Works work request | active + provisional 6 months after closure | delete/anonymise | reassess dispute/service needs |
| Works photos | 30–90 days after closure | delete storage object + metadata | shorter than request record; legal hold exception |
| Deleted account operational data | target 30 days | purge/anonymise | provider backups/logs may follow documented vendor cycle |

All values above are HOY policy targets, not statements of mandatory statutory periods.

## B. DSAR workflow

1. **Intake:** central privacy email/form; record request date, scope and identity-confidence state.
2. **Clock:** respond without undue delay and in principle within one month. Escalate immediately if an extension may lawfully be required.
3. **Identity:** request only proportionate additional information where necessary to confirm identity. Do not create a larger identity dataset than the request requires.
4. **Search scope:**
   - Supabase Auth/user/session records;
   - Gastro claims/memberships/menu/profile requests/audit logs;
   - analytics events linked to supplied pseudonymous identifiers where technically/legally appropriate;
   - sales-pipeline contacts;
   - Works profiles/applications/work requests/events/photos/storage;
   - relevant processor systems/support records.
5. **Review third-party/confidential data:** redact only where legally justified; do not use third-party rights as a blanket refusal.
6. **Action:** access / rectification / erasure / restriction / portability / objection as applicable.
7. **Processor cascade:** send deletion/export instruction to processors where needed and document completion.
8. **Storage cascade:** for Works photo deletion, remove both database metadata and the underlying storage object.
9. **Outcome:** provide clear response and record completion date. If refusing, state reasons plus complaint/judicial-remedy information.
10. **Evidence:** keep a minimal DSAR case log; do not retain the full exported subject data as a new archive.

### DSAR test before F0-M

Use synthetic accounts only:
- create synthetic Gastro operator and Works customer/provider records in isolated/test environment;
- export all expected records;
- delete/anonymise according to policy;
- verify RLS/access after deletion;
- verify photo object deletion;
- verify processor-cascade checklist;
- record elapsed time and missed stores.

## C. Consent withdrawal / analytics deletion

On analytics withdrawal:

1. set preference to denied/withdrawn using the final consent component;
2. immediately stop event generation/transport;
3. remove `hoy-anonymous-id-v1`, `hoy-session-id-v1`, proof-pilot analytics storage and any legacy production analytics history;
4. do not recreate identifiers until a new valid opt-in;
5. provide a route for deletion of server-side pseudonymous events where the user can supply the relevant identifier and identity/ownership can be established appropriately;
6. aggregated data may be retained only if it is genuinely anonymous and no longer personal data.

## D. Personal data breach workflow

### 0–1 hour from internal awareness
- preserve evidence; do not destroy useful incident logs;
- contain compromised credentials/session/access path where safe;
- assign incident owner and timestamp “awareness” decision;
- classify systems/data/subjects/regions/processors affected;
- activate RT-001/RT-005 security contacts.

### First assessment
Document:
- what happened and when;
- categories/approximate number of data subjects and records;
- sensitivity, identifiability, encryption/pseudonymisation;
- likely consequences;
- containment/remediation;
- whether processor notifications were received and when;
- risk to rights/freedoms and rationale.

### Supervisory-authority decision
If the breach is likely to result in risk to individuals’ rights/freedoms, prepare notification without undue delay and, where feasible, within 72 hours after controller awareness. If later than 72 hours, document reasons for delay.

### Data-subject communication
If likely high risk, assess whether affected people must also be informed without undue delay, taking account of legal exceptions/mitigation.

### Processor SLA
Record contractual processor notification timing separately. A processor’s SLA does not replace HOY’s own GDPR decision clock.

### Post-incident
- complete root-cause analysis;
- rotate/revoke access;
- repair system/process;
- update risk assessment/DPIA/ROPA/retention if scope changed;
- document whether notification was made or why not;
- test the remediation.

## E. Tabletop before F0-M

Run three synthetic scenarios:
1. leaked Supabase privileged credential;
2. Works private photo exposed to wrong provider/customer;
3. exported sales-pipeline contact file sent to wrong recipient.

Pass criteria: ownership assigned, awareness timestamp captured, containment works, affected data can be enumerated, 72-hour decision workflow works, processor/vendor escalation is known, and remediation evidence is retained.

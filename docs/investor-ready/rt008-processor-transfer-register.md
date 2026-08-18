# HOY RT-008 — Processor / Recipient / International Transfer Register

Status: working register. “TO VERIFY” blocks activation if the service will process personal data.

| Vendor / recipient | HOY use | Working role | Data | Primary location / transfer | DPA / safeguard | Retention / key point | F0-M action | Status |
|---|---|---|---|---|---|---|---|---|
| Supabase | Database, Auth, Storage, Edge Functions | Processor for HOY controller data | accounts, contacts, requests, analytics, photos as used | Both active HOY projects `eu-central-1` Frankfurt; subprocessors may create onward transfers | Supabase DPA v1 2026-08-01; SCCs incorporated where applicable | DPA says region-directed data is stored/primarily processed there subject to instructions/law/service; security incident notice without undue delay and where feasible within 48h; data return period 30 days after agreement end then deletion | company account/control, DPA archive, subprocessor-change subscription, transfer assessment, backup/deletion tests | PARTIAL |
| OpenAI API | Menu extraction/evaluation | Processor for customer data under business/API DPA, subject to exact account/use | menu URLs/files/images/text and generated structured output; incidental personal data must be minimised | OpenAI Ireland for EEA customer under current DPA; subprocessors/transfer terms apply | OpenAI DPA effective 2026-01-01 | API/business data not used for model training by default; standard retention/data controls must be verified for the exact project. `store:false` is not the same as approved Zero Data Retention | company API project/billing, DPA, data controls, minimise PII, confirm retention/ZDR eligibility | PARTIAL |
| GitHub Pages / GitHub | Core hosting + repository/CI | TO VERIFY by service/data flow | visitor network metadata for Pages; repository/admin/CI metadata | TO VERIFY | TO VERIFY | production currently hosted under `hapo3005.github.io` | archive applicable DPA/privacy terms; company account/control; determine Pages log/transfer behavior | OPEN |
| jsDelivr | Browser CDN for Leaflet/Supabase JS | independent/vendor role TO VERIFY | visitor IP/request metadata, user-agent/network request | external CDN | TO VERIFY | request occurs when page loads current external scripts/styles | Prefer self-host dependencies before F0-M; otherwise document role/notice/transfer | OPEN |
| OpenStreetMap tile servers | Map tiles | role/terms TO VERIFY; not assumed HOY processor | visitor IP/request metadata + requested tile coordinates when map renders | external tile infrastructure | OSMF tile/privacy terms review required | requests are action/view dependent, not needed for non-map use | keep lazy; assess privacy/terms/capacity; consider privacy-controlled tile provider/proxy if appropriate | OPEN |
| Business/provider recipient in Works | Receives work request after matching/assignment | likely separate controller/recipient for its service; final terms required | customer request, relevant contact/location/photo data | recipient-specific | RT-010 provider/business terms | disclose only minimum data necessary for assigned request | define recipient role, terms, disclosure point and transparency | OPEN |
| Email/transactional provider | Future auth/service/outreach email | TO VERIFY | email, message metadata/content | TO VERIFY | DPA required if processor | not selected | select privacy-suitable provider and complete register before activation | NOT SELECTED |
| Payment provider | Future billing | typically separate/processor mix depending flow; TO VERIFY | payer/business billing data | TO VERIFY | DPA/terms required | not selected | minimise HOY card-data scope; complete register before paid launch | NOT SELECTED |

## Vendor acceptance gate

Before a vendor can process HOY personal data:

1. identify controller/processor/joint/separate-controller role;
2. archive applicable DPA/terms and effective date;
3. list categories/purposes/data subjects;
4. map subprocessors and transfer countries/mechanism;
5. document security and incident-notice route;
6. document retention/deletion/export behavior;
7. record account owner and privacy/security contact;
8. test deletion/export where technically material;
9. ensure privacy notice/ROPA match reality;
10. re-review on material terms/subprocessor/product change.

## Transfer rule

A Frankfurt project region reduces primary data-location risk but does not by itself prove that every processing operation stays inside the EEA. Subprocessors, support, Edge execution, CDN/browser vendors and other services must be assessed separately. Where a restricted transfer requires a safeguard, use the vendor’s valid mechanism (for example incorporated EU SCCs) plus any required transfer-risk/supplementary-measures assessment.

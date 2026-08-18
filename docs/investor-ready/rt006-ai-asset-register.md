# HOY Investor Ready — RT-006 AI Asset Register

**Candidate date:** 2026-08-18  
**Status:** IMPLEMENTED FOR IDENTIFIED MATERIAL USE CASES — company-account, privacy and legal execution gates remain separate.

## Governing rule
AI assistance is recorded separately from copyright, source-rights and company-ownership conclusions. HOY does not treat raw model output as automatically exclusive or independently protectable IP. Material AI-assisted outputs must remain linked to source rights, human/automated review, version history and the HOY Chain-of-Title / Data Rights registers.

For business/API use, current OpenAI materials reviewed on 2026-08-18 state that business/API inputs and outputs are not used for model training by default unless the customer explicitly opts in, and the business agreement/privacy materials describe customer ownership/control of business data subject to applicable law. These contractual/provider statements do **not** prove copyrightability, originality, third-party clearance or founder-to-company transfer.

Current provider references retained for DD:
- https://openai.com/policies/service-terms/ — updated 2026-06-12
- https://openai.com/de-DE/policies/services-agreement/ — effective 2026-01-01
- https://openai.com/business-data/
- https://openai.com/enterprise-privacy/

## Classification
- **AI-A** — founder/user input + AI assistance + substantive human review/modification/versioning.
- **AI-B** — AI first draft + material human/automated development before operational use.
- **AI-C** — raw/minimally reviewed AI output; never relied on as exclusive core IP or factual source of truth.
- **AI-D** — output materially dependent on third-party source material; separate source-rights/provenance review required.

## Material use-case register

| ID | Use case | Provider / interface | Evidenced input | Output / use | Review / fail-closed controls | Rights classification | Vendor/account gate | Status |
|---|---|---|---|---|---|---|---|---|
| AI-001 | Menu extraction / translation | OpenAI API — Responses API + Models API | Restaurant menu text, PDFs, images, official URLs or private signed uploads | Structured menu-item candidates and German translations | strict JSON schema, conservative extraction prompt, confidence fields, protected human edits, source provenance, no direct factual publication solely because AI produced it | AI-D | Production API account/billing/recovery not yet company-evidenced | CONTROLLED / ACCOUNT GATE OPEN |
| AI-002 | Menu quality evaluation | OpenAI API via curated HOY evaluation workflow | Curated/gold menu cases | Coverage, price-exactness and hallucination evaluation | explicit thresholds; workflow can fail closed; secret presence checked before run | AI-A/B analytical evidence | Same company-account gate | CONTROLLED / ACCOUNT GATE OPEN |
| AI-003 | Software engineering assistance | ChatGPT/Codex/OpenAI-class development assistance | HOY code/context + engineering instructions | code suggestions, tests, refactors, technical docs | Git review, commit history, PR scope, automated QA, security/DD gates | AI-A/B depending asset | Founder/user account evidence; future company account/control decision open | CONTROLLED / TITLE TRANSFER OPEN |
| AI-004 | Investor/DD/security documentation drafting | ChatGPT/Codex/OpenAI-class assistance | repo evidence, technical facts, DD requirements | registers, controls, evidence narratives | source-backed verification, Git versioning, explicit fact/legal boundaries | AI-B | Same account/control gate | CONTROLLED |
| AI-005 | Legal/privacy/contract draft assistance | AI drafting assistance | HOY facts + legal framework prompts | draft checklists/terms/privacy/DPA support | no legal activation without qualified DE/ES review | AI-B/C | provider account gate independent of counsel | BLOCKED FOR LEGAL ACTIVATION |

## AI-001 code evidence
The reviewed Core menu intake implementation evidences:

- OpenAI Responses endpoint: `https://api.openai.com/v1/responses`;
- model availability check through `https://api.openai.com/v1/models`;
- explicit candidate-model/fallback logic rather than a silent uncontrolled model switch;
- `background:true` and `store:false` in the reviewed Responses request;
- structured JSON schema output;
- a prompt that treats source material as untrusted data and instructs the model not to invent menu facts;
- environment/secret-based API credential use;
- redaction of strings matching an OpenAI-style secret prefix in surfaced error text;
- preservation of manually edited/confirmed menu rows instead of overwriting them with later AI output;
- source-type controls for private uploads and official HTTPS URLs.

Reviewed implementation: `supabase/functions/menu-intake-process/index.ts`.

## AI-002 code evidence
The reviewed evaluation workflow evidences:

- `OPENAI_API_KEY` supplied from GitHub Actions Secrets;
- fail-fast check when required OpenAI/Supabase secrets are missing;
- configurable case count;
- explicit minimum coverage threshold;
- explicit price-exactness threshold;
- explicit maximum hallucination threshold;
- ability to enforce the quality gate as a failing workflow.

Reviewed workflow: `.github/workflows/menu-eval.yml`.

## Provider/data treatment boundary
Provider statements are recorded as contractual evidence, not as a substitute for HOY privacy analysis. For every production AI flow, RT-007/RT-008 must determine:

1. whether HOY has the right to submit the input to the provider;
2. whether personal, confidential or contractual-restricted data is present;
3. purpose/legal basis and minimization;
4. applicable retention, abuse-monitoring, processing-location and subprocessor terms;
5. whether an eligible zero-data-retention configuration is required/available for the use case;
6. whether the output may be stored, displayed, commercialized and transferred in an exit.

The reviewed `store:false` request parameter is recorded as a HOY implementation control; it is not interpreted as a universal statement that the provider performs zero processing/retention in every contractual or safety context.

## Intellectual-property / exit boundary
Before F0-M / buyer DD close:

- company-controlled production provider account, billing and recovery evidence;
- current applicable business/API agreement archived/versioned;
- approved production AI-use-case list;
- explicit model/provider outage/fallback behavior;
- source/input rights linked to every production AI pipeline;
- no core asset valuation claim based on exclusive ownership of raw AI output alone;
- founder-created and AI-assisted assets covered by the legally approved founder-to-company rights package where appropriate;
- no third-party source material reclassified as proprietary merely because AI transformed it.

## Current gate state
- Material AI use cases identified: **YES**
- Production menu AI technical controls evidenced: **YES**
- Raw AI output treated as automatically proprietary: **NO**
- Source-rights separation: **REQUIRED / RT-007**
- Privacy/provider-flow clearance: **OPEN / RT-008**
- Company-controlled provider account: **NOT YET EVIDENCED / RT-005**
- AI Asset Register itself: **IMPLEMENTED**

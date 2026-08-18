# HOY Investor Ready — RT-006 AI Asset Register

**Baseline:** 2026-08-18  
**Status:** CONTROLLED REGISTER / legal-account gates remain open

## Rule
AI assistance is recorded separately from copyright/ownership conclusions. HOY does not claim that raw AI output is automatically exclusive protectable IP. Material outputs must be linked to source rights, human review, version history and the HOY Chain-of-Title register.

OpenAI's current European consumer terms (updated 2026-01-16) state that, as between the user and OpenAI and to the extent permitted by law, the user retains rights in input and owns output, while also warning that output may not be unique. OpenAI's service terms for API/business use are tracked separately. This provider allocation is **not** treated as proof of copyrightability, originality, third-party clearance or transfer to a future HOY entity.

Official term references reviewed:
- https://openai.com/de-DE/policies/eu-terms-of-use/
- https://openai.com/de-DE/policies/service-terms/
- https://openai.com/de-DE/policies/services-agreement/

## Classification
- **AI-A** — founder/user input + AI assistance + substantive human review/modification/versioning.
- **AI-B** — AI first draft + material human development before operational use.
- **AI-C** — raw/minimally reviewed AI output; never relied on as exclusive core IP or factual source of truth.
- **AI-D** — output containing or materially depending on third-party source material; requires separate rights/provenance review.

## Register

| ID | Use case | Provider/tool | Input class | Output/use | Human/quality gate | Rights/ownership status | Vendor/account status | Operational status |
|---|---|---|---|---|---|---|---|---|
| AI-001 | Menu extraction / structured menu intake | OpenAI API | Restaurant menu text/files/images and source metadata; rights/privacy status follows RT-007/008 | Structured menu candidates | Schema validation, source provenance, confidence/review gates; AI is not source of truth | AI-D; source rights remain independent; publish only after provenance/review | Account/billing/recovery owner not yet company-evidenced under RT-005 | REVIEW |
| AI-002 | Menu quality evaluation | OpenAI API | Curated/gold menu cases | Coverage, price-exactness, hallucination/evaluation output | Explicit quality thresholds; workflow evidence; `store:false` observed in reviewed code path | AI-A/B analytical output; not proprietary factual source by itself | Account/billing/recovery owner open under RT-005 | REVIEW |
| AI-003 | Software engineering assistance | OpenAI/ChatGPT/Codex-class assistance used in HOY development | HOY code/context and task instructions | Code suggestions, tests, refactors, technical docs | Human direction/review, Git diff, automated QA and merge gate | AI-A/B depending asset; ownership/copyrightability not inferred from provider terms; founder→company assignment still required | User/account evidence and company control open under RT-005 | REVIEW |
| AI-004 | Investor/DD/security documentation drafting | OpenAI/ChatGPT/Codex-class assistance | Technical facts, repo evidence, DD requirements | Draft registers, controls, evidence narratives | Source-backed verification; Git versioning; factual/legal claim boundaries | AI-B; document rights ultimately depend on human contribution, underlying sources and assignment | Same account/control gate as AI-003 | REVIEW |
| AI-005 | Legal/privacy/contract draft assistance | OpenAI/ChatGPT-class assistance | HOY facts + legal framework prompts | Draft Terms/Privacy/DPA/supporting checklists | **No activation without qualified DE/ES legal review**; technical gates remain fail-closed | AI-B/C; not legal clearance; no claim that AI output itself creates enforceable rights | Same account/control gate; legal counsel independent | BLOCKED_FOR_ACTIVATION |

## AI-001/002 controls already evidenced in code review
- API credentials supplied via secret/environment, not recorded as plaintext in the reviewed workflow source.
- Reviewed OpenAI Responses API calls use `store:false`.
- Source content is treated as untrusted input; prompt injection from restaurant/source material is not authoritative.
- Structured schema/quality gates are used.
- Menu-derived facts remain tied to provenance/trust rather than accepted because an AI produced them.

## Data / privacy boundaries
For every AI request containing business/user/source material, RT-007/RT-008 must determine:
1. whether HOY may send the input to the provider;
2. whether personal/confidential data is involved;
3. purpose/legal basis and minimization;
4. retention/provider settings and transfer/subprocessor implications;
5. whether output can be stored, displayed, commercialized and transferred in an exit.

`store:false` is a product/API setting, not a blanket statement that no provider processing or retention can occur under every product, abuse-monitoring or contractual regime.

## Exit / continuity controls
Before F0-M / buyer DD close:
- company-controlled provider account/billing/recovery evidence;
- current applicable provider agreement archived/versioned;
- approved list of production AI use cases;
- fallback when a model/provider is unavailable;
- source/input rights linked to each production AI pipeline;
- no sole-source factual publication from AI output;
- no core buyer claim based on exclusive ownership of raw AI output;
- founder-created/AI-assisted assets included in executed IP assignment where legally appropriate.

## Gate
**Material AI use cases identified:** YES  
**Raw AI output treated as automatically proprietary:** NO  
**Source-rights separation:** REQUIRED  
**Human/automated review controls:** PRESENT for reviewed menu workflows  
**Company-owned vendor account:** NOT YET EVIDENCED  
**Legal/privacy provider-flow clearance:** IN PROGRESS  
**AI Asset Register:** IMPLEMENTED / operational evidence still to close

# HOY Investor Ready v1.0 — IR-02C Business Terms & First-Party Data Clearance

**Audit date:** 2026-08-18  
**Status:** TECHNICAL INFRASTRUCTURE LIVE / TERMS NOT ACTIVE  
**Scope:** HOY Gastro/Core operator relationship and Business Confirmed data evidence  

IR-02C converts the IR-02B target state `AMBER research → Business Confirmed / contract-cleared first-party data` into a versioned contract/evidence architecture.

## Implemented package

- German Business Data & Media Terms v1.0 execution draft.
- Spanish legal-localization draft.
- Electronic acceptance/evidence specification.
- `private.business_terms_versions`.
- `private.business_terms_acceptances`.
- `private.business_data_confirmations`.
- Public authenticated `SECURITY INVOKER` wrappers for status, acceptance and exact-snapshot confirmation.
- Ten dormant operator-write gates.
- `npm run qa:terms` in Critical PR QA.

## Production migrations

1. `20260818201632_ir02c_business_terms_acceptance_infrastructure`
2. `20260818201740_ir02c_business_terms_rpc_security_hardening`
3. `20260818201831_ir02c_business_confirmation_ledger`
4. `20260818202531_ir02c_register_spanish_terms_draft`
5. `20260818203021_ir02c_reconcile_de_terms_draft_blob`

## Fail-closed activation

Terms v1.0 remains `draft`. A database constraint prevents activation until final DE/ES hashes, definitive HOY entity/address/contact, privacy-notice version, governing law/jurisdiction, counsel evidence and activation dates exist.

The Spanish draft path and current German Git blob are registered in Production, but final SHA-256 values remain intentionally unset.

A live negative test attempted to activate the incomplete v1.0. PostgreSQL rejected the transition and retained `draft` status.

## Live state

- active Terms gate: `false`
- acceptances: `0`
- Business Confirmed records: `0`
- verified restaurant memberships: `0`
- operator Terms triggers: `10`
- current operator behavior changed by Terms gate: **no**

## Business Confirmed evidence chain

`AMBER observation → verified operator → active exact-version Terms acceptance → exact payload SHA-256 confirmation → Business Confirmed + freshness/history`

Terms acceptance by itself never confirms existing research, and merely observing a business website never creates Business Confirmed data.

## Contract/data-rights boundary

The drafts preserve Business/third-party source rights while granting defined operational rights to HOY. They include change-of-control continuity, but do not treat raw Business photos, logos, marketing copy or menu artwork as a standalone HOY resale library by default. Personal data is not framed as owned content; privacy-law roles remain separate and an Article 28 DPA is required where HOY is genuinely acting as processor on behalf of a Business.

## Remaining P0 activation blockers

- definitive HOY contracting entity and legal details;
- governing law/jurisdiction;
- final German counsel review;
- final Spanish legal localization/counsel review;
- Privacy Notice and controller/processor mapping;
- DPA where required;
- final DE/ES SHA-256 hashes;
- Terms display/download/archive UX;
- error-correction and acceptance-receipt UX;
- canonical JSON payload hashing;
- end-to-end acceptance + Business Confirmation tests.

## Investor/buyer claim gate

**Defensible:** HOY has versioned, fail-closed Business Terms, acceptance and exact-snapshot confirmation infrastructure.

**Not defensible yet:** current AMBER data is automatically contract-cleared, Business Terms v1.0 is active, or all current business/content rights survive an exit.

## Gate

**DE execution draft:** PREPARED  
**ES localization draft:** PREPARED / NOT FINAL  
**Acceptance infrastructure:** LIVE  
**Business Confirmation Ledger:** LIVE  
**Public RPC hardening:** COMPLETE  
**Production ↔ Git migration reconciliation:** COMPLETE  
**Activation negative test:** PASS  
**CI governance:** IMPLEMENTED  
**Terms active:** NO  
**Privacy/DPA package:** NOT COMPLETE  
**Counsel sign-off:** NOT COMPLETE  
**IR-02C activation-ready:** NOT YET

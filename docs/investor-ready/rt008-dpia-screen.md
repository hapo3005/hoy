# HOY RT-008 — DPIA / DPO Screening Record

Status: pre-launch screen. This record decides whether a full Data Protection Impact Assessment is required before a processing feature goes live; it is not a substitute for a DPIA when the high-risk threshold is met.

## 1. HOY Gastro / Core

### Processing considered
- optional pseudonymous product analytics;
- operator/business accounts, claims and audit logs;
- indirect B2B contact research;
- menus/profile updates;
- derived aggregate product/business metrics.

### Risk indicators
- persistent pseudonymous tracking identifier if analytics enabled: **YES**;
- large-scale regular/systematic monitoring today: **NOT ESTABLISHED**;
- sensitive/special-category data intended: **NO**;
- automated decisions with legal/similar significant effects: **NO**;
- vulnerable-person profiling: **NO intended use**;
- public-area monitoring: **NO**;
- combination of unrelated personal datasets for individual profiling: **NO intended use**.

### Decision
**DPIA screen remains OPEN; full DPIA is not asserted mandatory at the current evidenced scale/scope.**

Required controls:
- analytics off by default before consent;
- 90-day raw-data target;
- no advertising/behavioral profile;
- no identifiable-person data commercialization;
- rerun screen if analytics becomes cross-device, location-history, ad-tech, large-scale profiling or if new sensitive categories appear.

## 2. HOY Works

### Processing considered
- user/provider accounts;
- provider applications/contact data;
- work-request free text and municipality/location context;
- matching/assignment;
- request event history;
- optional private request photos shared with request participants/assigned provider.

Current live personal-data rows are 0 as of 2026-08-18, so this is the correct point to screen the design before real users.

### Risk indicators
- free text can incidentally contain sensitive data: **YES**;
- photos can contain faces, home interiors, documents, location metadata or sensitive facts: **YES**;
- precise home/location data planned: **LIMIT / TO VERIFY**;
- automated matching: **YES**, but no legal/similarly significant decision is intended;
- large-scale sensitive data: **NO current evidence / must remain out of scope**;
- large-scale systematic monitoring: **NO current evidence**;
- disclosure to service provider as recipient: **YES, minimum necessary only**.

### Required mitigations before real users
1. private photo bucket remains non-public;
2. participant/assignment authorization test covers both metadata and binary object access;
3. strip EXIF/GPS metadata where technically feasible before durable storage, or document an equivalent safe handling design;
4. UI warning: do not upload ID documents, health data, intimate images, faces or unrelated personal information;
5. shorter photo retention (working target 30–90 days after request closure) with deletion cascade;
6. minimise precise address until needed for accepted/assigned work;
7. service provider sees only information necessary for the request;
8. DSAR/export/delete covers photos and event history;
9. matching must not infer protected/sensitive traits;
10. rerun full DPIA decision after exact launch workflow and before first real participant.

### Decision
**Mandatory pre-launch DPIA screen. Full DPIA = CONDITIONAL on the final risk assessment.** If final processing is likely to result in high risk, perform the DPIA before processing begins.

## 3. DPO screen

Current evidence does not establish that HOY’s core activities involve large-scale sensitive-data processing or large-scale regular/systematic monitoring. Therefore a DPO is **not assumed legally mandatory today**.

Triggers for immediate reassessment:
- tracking/profiling becomes large-scale and core to HOY;
- sensitive data becomes a large-scale core activity;
- organizational structure or national law creates an independent DPO obligation;
- supervisory-authority guidance/list applicable to the final processing requires a different conclusion.

Even if no formal DPO is mandatory, assign a named privacy owner and independent counsel/advisor route before F0-M.

create schema if not exists private;

create table if not exists private.privacy_notice_versions (
  notice_version text primary key,
  status text not null default 'draft' check (status in ('draft','active','superseded','retired')),
  master_locale text not null default 'de',
  document_path text not null,
  document_git_blob_sha text,
  document_sha256 text,
  spanish_document_path text,
  spanish_document_git_blob_sha text,
  spanish_document_sha256 text,
  legal_entity_name text,
  registered_address text,
  privacy_contact_email text,
  dpo_contact text,
  role_matrix_approved_at timestamptz,
  legal_bases_approved_at timestamptz,
  retention_approved_at timestamptz,
  cookie_analytics_approved_at timestamptz,
  vendor_transfer_reviewed_at timestamptz,
  counsel_reviewed_at timestamptz,
  counsel_reference text,
  effective_at timestamptz,
  activated_at timestamptz,
  supersedes_version text references private.privacy_notice_versions(notice_version),
  created_at timestamptz not null default now(),
  constraint privacy_notice_active_requires_clearance check (
    status <> 'active' or (
      document_sha256 ~ '^[0-9a-f]{64}$' and
      spanish_document_sha256 ~ '^[0-9a-f]{64}$' and
      nullif(btrim(legal_entity_name),'') is not null and
      nullif(btrim(registered_address),'') is not null and
      nullif(btrim(privacy_contact_email),'') is not null and
      role_matrix_approved_at is not null and
      legal_bases_approved_at is not null and
      retention_approved_at is not null and
      cookie_analytics_approved_at is not null and
      vendor_transfer_reviewed_at is not null and
      counsel_reviewed_at is not null and
      nullif(btrim(counsel_reference),'') is not null and
      effective_at is not null and activated_at is not null
    )
  )
);

insert into private.privacy_notice_versions(
  notice_version,status,master_locale,document_path,document_git_blob_sha,
  spanish_document_path,spanish_document_git_blob_sha
) values (
  '1.0','draft','de',
  'docs/legal/HOY_PRIVACY_NOTICE_v1.0_DE_DRAFT.md','8a687c172593f1b1118d98dfb5a6a9c9e1f8d81f',
  'docs/legal/HOY_PRIVACY_NOTICE_v1.0_ES_DRAFT.md','eb591d3aee937b4974214cf9449ad7d9fc6dd3d2'
)
on conflict (notice_version) do update set
  document_path=excluded.document_path,
  document_git_blob_sha=excluded.document_git_blob_sha,
  spanish_document_path=excluded.spanish_document_path,
  spanish_document_git_blob_sha=excluded.spanish_document_git_blob_sha;

create table if not exists private.dpa_versions (
  dpa_version text primary key,
  status text not null default 'draft' check (status in ('draft','active','superseded','retired')),
  document_path text not null,
  document_git_blob_sha text,
  document_sha256 text,
  legal_entity_name text,
  tom_version text,
  subprocessor_register_reviewed_at timestamptz,
  transfer_reviewed_at timestamptz,
  counsel_reviewed_at timestamptz,
  counsel_reference text,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint dpa_active_requires_clearance check (
    status <> 'active' or (
      document_sha256 ~ '^[0-9a-f]{64}$' and
      nullif(btrim(legal_entity_name),'') is not null and
      nullif(btrim(tom_version),'') is not null and
      subprocessor_register_reviewed_at is not null and
      transfer_reviewed_at is not null and
      counsel_reviewed_at is not null and
      nullif(btrim(counsel_reference),'') is not null and
      activated_at is not null
    )
  )
);

insert into private.dpa_versions(dpa_version,status,document_path,document_git_blob_sha)
values('1.0','draft','docs/legal/HOY_DPA_ART28_v1.0_DE_DRAFT.md','a1ae76d1419ef8fe5b511910c2f9492831743c46')
on conflict (dpa_version) do update set
  document_path=excluded.document_path,
  document_git_blob_sha=excluded.document_git_blob_sha;

create table if not exists private.privacy_retention_rules (
  rule_code text primary key,
  data_class text not null,
  trigger_event text,
  retention_rule text not null,
  status text not null default 'review_required' check (status in ('review_required','approved','blocked','retired')),
  legal_reviewed_at timestamptz,
  legal_reference text,
  notes text,
  updated_at timestamptz not null default now()
);

insert into private.privacy_retention_rules(rule_code,data_class,trigger_event,retention_rule,status,notes) values
('RET-ANALYTICS','pseudonymous analytics','event occurrence','No final duration approved; separate clean post-2.45 cohort from historical QA-mixed data and define minimum business-need period before launch.','review_required','Do not treat historical volume as traction.'),
('RET-PROSPECT','professional prospect contacts','collection / last relevance verification','Periodic relevance/freshness review; delete when no legitimate business-relationship purpose remains. No indefinite default.','review_required','Electronic marketing permission is a separate gate.'),
('RET-ACCOUNT','auth/account','account closure','Account lifecycle plus only documented security/legal exceptions. Final duration pending.','review_required','No current live users at baseline.'),
('RET-CLAIM','business authority evidence','relationship end / dispute closure','Retain only as long as justified for authority, fraud and dispute evidence; final schedule pending.','review_required','No current claims at baseline.'),
('RET-CONTRACT','terms/confirmation evidence','contract/relationship end','Evidentiary retention requires limitation/contract/tax review; no final duration yet.','review_required','Separate from active profile data.'),
('RET-AUDIT','security/audit logs','log creation / incident closure','Risk- and evidence-based retention; final duration pending.','review_required','Keep metadata minimized.'),
('RET-WORKS','work request/location/free text','service completion / dispute closure','BLOCKED before live until minimization, service lifecycle, disputes and legal obligations are mapped.','blocked','Precise location/free text raise privacy risk.')
on conflict (rule_code) do nothing;

create table if not exists private.privacy_processing_activities (
  activity_code text primary key,
  title text not null,
  product_scope text not null,
  role text not null check (role in ('controller','processor','joint_controller_candidate','role_review_required')),
  live_status text not null check (live_status in ('live','live_internal','pre_live','blocked')),
  purposes jsonb not null default '[]'::jsonb,
  data_subjects jsonb not null default '[]'::jsonb,
  data_categories jsonb not null default '[]'::jsonb,
  special_category_expected boolean not null default false,
  legal_basis_status text not null default 'review_required' check (legal_basis_status in ('review_required','candidate','approved','blocked','not_applicable')),
  legal_basis text,
  recipients jsonb not null default '[]'::jsonb,
  third_country_transfer_status text not null default 'review_required' check (third_country_transfer_status in ('none_verified','review_required','covered','blocked')),
  transfer_mechanism text,
  retention_rule_code text references private.privacy_retention_rules(rule_code),
  security_measures jsonb not null default '[]'::jsonb,
  dpia_status text not null default 'screening_required' check (dpia_status in ('not_required','screening_required','required','complete')),
  notes text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into private.privacy_processing_activities(
  activity_code,title,product_scope,role,live_status,purposes,data_subjects,data_categories,
  legal_basis_status,legal_basis,recipients,third_country_transfer_status,retention_rule_code,security_measures,dpia_status,notes
) values
('PA-01','Product analytics','HOY Gastro/Core','controller','live','["product quality","decision/funnel analysis","reliability"]'::jsonb,'["visitors/users"]'::jsonb,'["pseudonymous anonymous_id","session_id","event/time","product metadata"]'::jsonb,'review_required','Cookie/ePrivacy and GDPR basis must be approved before public launch.','["Supabase"]'::jsonb,'review_required','RET-ANALYTICS','["pseudonymous identifiers","metadata allowlist","RLS/RPC controls"]'::jsonb,'screening_required','28,897 historical rows at baseline; pre-2.45 data excluded from traction claims.'),
('PA-02','Professional prospect research','HOY Gastro/Core','controller','live_internal','["internal prospect research","business relationship preparation"]'::jsonb,'["professional contacts","individual entrepreneurs where applicable"]'::jsonb,'["name","professional email","phone","social/contact channel","role/source"]'::jsonb,'candidate','Professional-contact legitimate-interest basis may apply only where its conditions are met; electronic marketing remains separately blocked.','["internal HOY"]'::jsonb,'none_verified','RET-PROSPECT','["internal pipeline","send_lock"]'::jsonb,'screening_required','Baseline: 168 rows; 17 with email; 54 with phone. LSSI outreach gate remains closed.'),
('PA-03','Business account and authentication','HOY Core','controller','pre_live','["authentication","account security","operator permissions"]'::jsonb,'["business representatives"]'::jsonb,'["email","user id","auth/security metadata","role/membership"]'::jsonb,'review_required','Contract/pre-contract and/or legitimate interests to be assigned per final flow.','["Supabase"]'::jsonb,'review_required','RET-ACCOUNT','["Supabase Auth","RLS","verified memberships"]'::jsonb,'screening_required','0 auth users at baseline.'),
('PA-04','Business claim and authority verification','HOY Core','controller','pre_live','["prevent unauthorized profile control","authority verification","fraud prevention"]'::jsonb,'["business representatives","reviewers"]'::jsonb,'["name","role","professional email","verification evidence","review decision"]'::jsonb,'review_required','Final basis pending launch/legal review.','["internal HOY"]'::jsonb,'review_required','RET-CLAIM','["private review flow","RLS","audit logs"]'::jsonb,'screening_required','0 claims at baseline.'),
('PA-05','Business Terms acceptance and Business Confirmation','HOY Core','controller','pre_live','["contract evidence","rights provenance","trust/data-quality evidence"]'::jsonb,'["authorized business representatives"]'::jsonb,'["user/business ids","terms version/hash","authority role","acknowledgements","payload hashes","timestamps"]'::jsonb,'review_required','Contract/evidence basis to be finalized with active Terms/Privacy package.','["internal HOY"]'::jsonb,'review_required','RET-CONTRACT','["private evidence tables","exact version/hash binding","SECURITY INVOKER public wrappers"]'::jsonb,'screening_required','0 acceptances and 0 confirmations at baseline.'),
('PA-06','Security and audit logging','HOY Core','controller','live','["security","abuse prevention","integrity","incident investigation"]'::jsonb,'["authorized users/admins when present"]'::jsonb,'["actor id","action","object reference","limited before/after metadata","timestamp"]'::jsonb,'candidate','Legitimate interests and/or legal-accountability obligations may apply; final review pending.','["internal HOY"]'::jsonb,'review_required','RET-AUDIT','["least privilege","audit logging","private admin controls"]'::jsonb,'screening_required','Keep payloads minimized; avoid unnecessary personal data in before/after JSON.'),
('PA-07','HOY Works customer request and matching','HOY Works','controller','blocked','["receive service request","match provider","operate marketplace workflow"]'::jsonb,'["customers","providers"]'::jsonb,'["customer id","location text","latitude/longitude","language","service need","free text","provider assignment"]'::jsonb,'blocked','Must be approved before live customer processing.','["matched providers","Supabase"]'::jsonb,'review_required','RET-WORKS','["RLS/schema separation"]'::jsonb,'screening_required','0 auth users/profiles/provider members/applications/work requests at baseline; location and free text require P0 review.'),
('PA-08','Business-instructed processor use case','HOY platform','processor','blocked','["process personal data solely on documented Business instructions"]'::jsonb,'["defined per DPA annex"]'::jsonb,'["defined per DPA annex"]'::jsonb,'blocked','Requires PROCESSOR_CONFIRMED role decision and active use-case-specific Art. 28 DPA.','["approved subprocessors only"]'::jsonb,'review_required',null,'["use-case TOM annex required"]'::jsonb,'screening_required','Never use as blanket label for HOYs own purposes.')
on conflict (activity_code) do nothing;

create table if not exists private.vendor_transferability_registry (
  vendor_code text primary key,
  system_name text not null,
  asset_scope text not null,
  current_control text,
  target_control text,
  privacy_role_status text not null default 'review_required',
  dpa_status text not null default 'review_required',
  primary_data_region text,
  third_country_status text not null default 'review_required',
  technical_transferability text not null default 'review_required' check (technical_transferability in ('verified_yes','verified_no','review_required')),
  contract_transferability text not null default 'review_required' check (contract_transferability in ('verified_yes','verified_no','consent_required','review_required')),
  transfer_route text,
  evidence_reference text,
  dd_status text not null default 'review_required' check (dd_status in ('green','amber','red','review_required')),
  action_required text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into private.vendor_transferability_registry(vendor_code,system_name,asset_scope,current_control,target_control,privacy_role_status,dpa_status,primary_data_region,third_country_status,technical_transferability,contract_transferability,transfer_route,evidence_reference,dd_status,action_required) values
('TR-GITHUB','GitHub','HOY repositories and development history','personal account hapo3005','company-controlled HOY organization','controller/processor terms review','review_required',null,'review_required','verified_yes','review_required','repository transfer to company organization','GitHub Docs: transferring a repository','amber','Create company organization; >=2 owners/admin continuity; transfer repos; verify Actions/secrets/pages/integrations; archive DPA/terms evidence.'),
('TR-SUPABASE-GASTRO','Supabase','HOY La Manga project zlscptisdxzxuvllogza','current Supabase organization','company-controlled HOY organization','processor/vendor review','review_required','eu-central-1','review_required','verified_yes','review_required','Supabase project transfer between organizations','Supabase Docs: Project Transfers','amber','Evidence org ownership/billing/admin/recovery, DPA/subprocessors/transfers, transfer eligibility, backups/export and target org.'),
('TR-SUPABASE-WORKS','Supabase','HOY Works project dqfouwyclvmpkunmxkun','current Supabase organization','company-controlled HOY organization','processor/vendor review','review_required','eu-central-1','review_required','verified_yes','review_required','Supabase project transfer between organizations','Supabase Docs: Project Transfers','amber','Same company ownership/privacy/backup/transfer evidence as Gastro.'),
('TR-DOMAINS','Domain/DNS providers','HOY domains and DNS','unknown','HOY legal entity','review_required','not_applicable',null,'review_required','review_required','review_required','registrar transfer / account ownership','not yet evidenced','review_required','Inventory registrar, registrant, billing, renewal, 2FA/recovery, DNS, transfer lock/auth code.'),
('TR-BRAND','Trademark/brand registers','HOY word/logo/claims','unknown','HOY legal entity','not_applicable','not_applicable',null,'none','review_required','review_required','formal IP assignment/registration transfer where applicable','not yet evidenced','review_required','Complete trademark/domain ownership and assignment evidence.'),
('TR-OTHER-VENDORS','Other APIs/vendors','APIs, integrations, service providers','mixed/unknown','HOY legal entity','review_required','review_required',null,'review_required','review_required','review_required','per-vendor change-of-control/assignment or new contract','vendor register pending','review_required','Capture contract assignability, DPA, subprocessors, data export/deletion, credentials and billing owner.')
on conflict (vendor_code) do nothing;

create table if not exists private.privacy_incident_register (
  id uuid primary key default gen_random_uuid(),
  detected_at timestamptz not null,
  occurred_at timestamptz,
  closed_at timestamptz,
  status text not null default 'investigating' check (status in ('investigating','contained','closed','false_positive')),
  scope text not null,
  personal_data_involved boolean,
  categories jsonb not null default '[]'::jsonb,
  approximate_data_subjects bigint,
  approximate_records bigint,
  risk_level text check (risk_level in ('unknown','low','medium','high','very_high')),
  authority_notification_required boolean,
  authority_notified_at timestamptz,
  data_subject_notification_required boolean,
  data_subjects_notified_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  decision_rationale text,
  created_at timestamptz not null default now()
);

create table if not exists private.data_subject_request_log (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  request_type text not null check (request_type in ('access','rectification','erasure','restriction','portability','objection','consent_withdrawal','other')),
  channel text,
  requester_reference text,
  identity_verification_status text not null default 'pending' check (identity_verification_status in ('pending','verified','not_required','failed')),
  status text not null default 'open' check (status in ('open','in_progress','completed','rejected','withdrawn')),
  due_at timestamptz,
  completed_at timestamptz,
  decision_rationale text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['privacy_notice_versions','dpa_versions','privacy_retention_rules','privacy_processing_activities','vendor_transferability_registry','privacy_incident_register','data_subject_request_log'] loop
    execute format('alter table private.%I enable row level security', t);
    execute format('revoke all on table private.%I from public, anon, authenticated', t);
    execute format('drop policy if exists %I on private.%I', 'deny_client_' || t, t);
    execute format('create policy %I on private.%I for all to anon, authenticated using (false) with check (false)', 'deny_client_' || t, t);
  end loop;
end $$;

comment on table private.privacy_processing_activities is 'HOY GDPR Article 30 / privacy role baseline. Internal DD/governance only; legal bases remain draft until approved.';
comment on table private.vendor_transferability_registry is 'HOY Buyer DD register for technical/account/contract/privacy transferability of critical platform dependencies.';
comment on table private.privacy_incident_register is 'Internal privacy/security incident evidence register; supports accountability and breach documentation.';
comment on table private.data_subject_request_log is 'Internal evidence register for data-subject requests. Do not expose directly to client roles.';
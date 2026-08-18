-- IR-02B remaining source type classification
-- Production migration version: 20260818200500

update private.source_rights_registry set
  source_class='FIRST_PARTY_BUSINESS_REFERENCE', rights_status='AMBER', use_as_lead=true,
  factual_verification_allowed=true, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=false, transferability='UNKNOWN', legal_review_status='BUSINESS_TERMS_REQUIRED',
  notes=coalesce(notes,'') || case when coalesce(notes,'')='' then '' else ' ' end || 'HOY menu-discovery evidence marks this domain as the official operator website; factual reference only until business terms clear broader use.'
where host in ('chiringuitoelbaron.com','rincondelcheflamanga.es') and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set
  source_class='OPERATOR_AUTHORIZED_VENDOR_REFERENCE', rights_status='AMBER', use_as_lead=true,
  factual_verification_allowed=true, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=false, transferability='UNKNOWN', legal_review_status='AUTHORITY_CHAIN_REQUIRED',
  notes=coalesce(notes,'') || case when coalesce(notes,'')='' then '' else ' ' end || 'HOY discovery evidence identifies this MyRestoo page as the operator reservation page; no broader vendor-content rights assumed.'
where host='mangata.myrestoo.net' and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set
  source_class='FIRST_PARTY_BUSINESS_REFERENCE', rights_status='AMBER', use_as_lead=true,
  factual_verification_allowed=true, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=false, transferability='UNKNOWN', legal_review_status='BUSINESS_TERMS_REQUIRED',
  terms_checked_at=date '2026-08-18',
  notes=coalesce(notes,'') || case when coalesce(notes,'')='' then '' else ' ' end || 'Current first-party site verified 2026-08-18; limited factual verification only, no blanket content licence.'
where host in ('radiotaxicartagena.es','taxilamangasanjavier.es') and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set
  source_class='OFFICIAL_GOV_REFERENCE', rights_status='AMBER', use_as_lead=true,
  factual_verification_allowed=true, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  attribution_required=true, replacement_required=false, transferability='UNKNOWN', legal_review_status='SPECIFIC_DATASET_LICENSE_REQUIRED',
  terms_checked_at=date '2026-08-18',
  notes=coalesce(notes,'') || case when coalesce(notes,'')='' then '' else ' ' end || 'Official municipal source verified. Keep AMBER unless the exact referenced material is shown to fall under an applicable open-data/reuse licence.'
where host in ('www.cartagena.es','www.sanjavier.es') and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set
  source_class='FIRST_PARTY_OTHER_ENTITY_REFERENCE', replacement_required=true,
  legal_review_status='ENTITY_PROVENANCE_MISMATCH',
  notes=coalesce(notes,'') || case when coalesce(notes,'')='' then '' else ' ' end || 'HOY discovery evidence records an identity conflict: source belongs to the prior/different Bongo Beach identity and must not evidence current Umai Beach facts.'
where host='grupojojara.es' and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set source_class='EDITORIAL_THIRD_PARTY', replacement_required=true, legal_review_status='RE_SOURCE_REQUIRED'
where host in ('lasgastrocronicas.com','murciaplaza.com') and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set source_class='PLATFORM_VENDOR_UNCLEARED', replacement_required=true, legal_review_status='DIRECT_TERMS_OR_OPERATOR_AUTHORITY_REQUIRED'
where host in ('cafeteria-delpuerto.menustic.com','estacio-playa.res-menu.net','www.fourvenues.com') and rights_status='REVIEW_REQUIRED';

update private.source_rights_registry set source_class='DIRECTORY_OR_EDITORIAL_UNCLEARED', replacement_required=true, legal_review_status='DIRECT_TERMS_REVIEW_REQUIRED'
where host='todalainformacion.com' and rights_status='REVIEW_REQUIRED';

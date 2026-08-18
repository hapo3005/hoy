-- Register Spanish legal-localization draft without activating Terms v1.0.
-- Production version: 20260818202531

update private.business_terms_versions
set spanish_document_path='docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md',
    activation_notes='DRAFT ONLY. DE master and ES legal-localization draft are registered. Activation remains blocked until final SHA-256 hashes, definitive HOY entity, privacy version, governing law/jurisdiction, counsel review and activation evidence are recorded.',
    updated_at=now()
where terms_version='1.0' and status='draft';

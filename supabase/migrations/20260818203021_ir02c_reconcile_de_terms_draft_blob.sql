-- Reconcile registered DE draft Git blob after draft clarification.
-- Production version: 20260818203021

update private.business_terms_versions
set document_git_blob_sha='a3d6ce5bb442667e1ec3ff9fc42939397e675a0a',
    updated_at=now()
where terms_version='1.0' and status='draft';

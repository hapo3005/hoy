update private.vendor_transferability_registry
set current_control='personal GitHub owner hapo3005; admin control evidenced; hoy, hoy-lifestyle and hoy-works were all PUBLIC at 2026-08-18 audit',
    evidence_reference='GitHub connector visibility audit 2026-08-18; no root LICENSE file found in the three audited repositories; GitHub Docs on repository visibility/licensing',
    dd_status='amber',
    action_required='P0: decide proprietary repository visibility before investor DD. Assess GitHub Pages/deployment impact before changing visibility; create company-controlled organization; transfer repositories; preserve copyright/chain-of-title evidence; verify forks/local copies cannot be recalled; verify Actions/secrets/pages/integrations after transfer.',
    reviewed_at=now(),
    updated_at=now()
where vendor_code='TR-GITHUB';

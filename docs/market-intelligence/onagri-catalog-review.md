# ONAGRI agricultural product catalog review

## Official source discovery

The review tool discovers XLSX resources through the CKAN package_show API and reads the currently published resources for:

- pesticides — ONAGRI's pesticide workbook set (herbicides, insecticides, fungicides and metadata);
- engrais — ONAGRI fertilizer workbooks;
- prix-des-principaux-intrants-des-produits-agricoles — ONAGRI agricultural input price/catalog workbook.

The Ministry's separate pesticide homologation register is published as PDF and must remain a distinct source. The latest resource identified during this implementation is the 2025 register (16 July 2025). A product appearing in an ONAGRI price/catalog workbook is not sufficient evidence that its pesticide authorization is current.

## Review workflow

- Script: scripts/market-data/prepare_onagri_catalog_review.py
- Workflow: .github/workflows/onagri-catalog-review.yml
- Artifact: onagri-catalog-review.json
- The workflow runs monthly or manually and does not need application credentials.
- Candidates are extracted only when a recognizable product-name column exists. Unknown workbook layouts are reported with sample rows for manual mapping rather than guessed.
- Every candidate has approved=false and registration_status=unverified.
- A reviewer should verify the trade name, active ingredient, manufacturer, composition and current registration status against the Ministry's homologation register.
- Set approved=true only after review. For pesticides, leave registration_status=unverified unless the exact product/registration number is confirmed in the official register. If setting registered_tunisia, expired or prohibited, also fill registration_number and registration_evidence_url with the exact Ministry evidence document. The API rejects those statuses without both fields.
- The catalog stores registration_evidence_url and registration_verified_at separately from the workbook's source_url; the mobile catalog displays the registration number and opens the evidence document.

## Controlled upload

After reviewing the JSON artifact, upload only approved rows from a trusted local copy:

AGROGROWTH_API_URL=https://your-api.example AGROGROWTH_ADMIN_TOKEN=... python scripts/market-data/prepare_onagri_catalog_review.py --upload-reviewed reviewed-catalog.json

The uploader sends only rows explicitly marked approved=true to the admin-only /api/agro-market/ingest/products endpoint. It refuses an empty approval set and validates registration-status values. Do not place the admin token in the review artifact or a mobile app.

## Important limits

- Workbook formats may change; inspect diagnostics and sample rows after each source update.
- This review process does not automatically extract the Ministry PDF. PDF tables must be inspected and mapped separately before any registration status is changed.
- ONAGRI prices in workbooks are not assumed to be current seller offers or market quotations. Do not repurpose them as retail prices without checking their date, unit, geography and pricing basis.

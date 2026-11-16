-- Register the independently published ONAGRI catalog workbooks and the
-- exact Ministry pesticide-register resource used for human verification.
-- All catalog sources remain disabled until a reviewed import is performed.

INSERT INTO public.market_data_sources
  (source_key,source_name,source_url,source_type,license_note,refresh_interval_minutes,enabled,last_status)
VALUES
  ('tn-onagri-pesticide-workbooks','ONAGRI - Pesticide product and price workbooks',
   'https://catalog.data.gov.tn/fr/dataset/pesticides','official_open_data',
   'ONAGRI CKAN dataset; workbook resources include herbicide, insecticide and fungicide prices and metadata. Candidate extraction is review-only; not proof of homologation.',
   43200,false,'review_workflow_ready'),
  ('tn-onagri-fertilizer-workbooks','ONAGRI - Fertilizer metadata and prices',
   'https://catalog.data.gov.tn/fr/dataset/engrais','official_open_data',
   'ONAGRI CKAN dataset; XLSX resources for fertilizer metadata and prices. Candidate extraction is review-only.',
   43200,false,'review_workflow_ready'),
  ('tn-ministry-approved-pesticides-2025','Ministry of Agriculture - pesticide register dated 16 July 2025',
   'https://catalog.data.gov.tn/fr/dataset/liste-des-pesticides-homologues-en-tunisie/resource/64f0c140-47fa-4816-8395-88416fcb6e57','official_open_data',
   'Official Ministry PDF resource labelled 16 July 2025. The dataset metadata was refreshed later, but the PDF itself is dated 2025; do not describe it as a 2026 register. Requires reviewed extraction and current status verification.',
   43200,false,'manual_pdf_review_required')
ON CONFLICT (source_key) DO UPDATE SET
  source_name=EXCLUDED.source_name,source_url=EXCLUDED.source_url,source_type=EXCLUDED.source_type,
  license_note=EXCLUDED.license_note,refresh_interval_minutes=EXCLUDED.refresh_interval_minutes;

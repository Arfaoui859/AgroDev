-- Verify the additive marketplace, price intelligence and satellite migration.
DO $$
DECLARE
  required_table text;
  required_tables text[] := ARRAY[
    'marketplace_listings',
    'marketplace_inquiries',
    'agricultural_product_catalog',
    'market_data_sources',
    'market_price_observations',
    'satellite_observations'
  ];
BEGIN
  FOREACH required_table IN ARRAY required_tables LOOP
    IF to_regclass('public.' || required_table) IS NULL THEN
      RAISE EXCEPTION 'Required table public.% is missing', required_table;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      WHERE c.oid = to_regclass('public.' || required_table)
        AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', required_table;
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agricultural_product_catalog' AND column_name='registration_evidence_url')
    OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agricultural_product_catalog' AND column_name='registration_verified_at') THEN
    RAISE EXCEPTION 'Agricultural catalog registration evidence columns are missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_listings' AND policyname='Public can read published marketplace listings') THEN
    RAISE EXCEPTION 'Public marketplace listing read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agricultural_product_catalog' AND policyname='Public can read active agricultural catalog') THEN
    RAISE EXCEPTION 'Public agricultural catalog read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_inquiries' AND policyname='Buyers and sellers can read their inquiries') THEN
    RAISE EXCEPTION 'Marketplace inquiry participant read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_inquiries' AND policyname='Buyers can create inquiries for published listings') THEN
    RAISE EXCEPTION 'Marketplace inquiry buyer insert policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='market_price_observations' AND policyname='Public can read market price observations') THEN
    RAISE EXCEPTION 'Public market observation read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='satellite_observations' AND policyname='Farm owners can read satellite observations') THEN
    RAISE EXCEPTION 'Farm-owner satellite observation policy is missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-crda-sidi-bouzid-vegetables' AND enabled=false) THEN
    RAISE EXCEPTION 'CRDA vegetable source must be registered but disabled pending adapter review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-onagri-bir-el-kassaa' AND enabled=false AND last_status='adapter_ready_requires_secrets') THEN
    RAISE EXCEPTION 'Bir El Kassaa source must be registered but disabled until credentials and reuse review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-onagri-agricultural-input-prices' AND enabled=false) THEN
    RAISE EXCEPTION 'ONAGRI source must be registered but disabled pending adapter review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-onagri-pesticide-workbooks' AND enabled=false AND last_status='review_workflow_ready') THEN
    RAISE EXCEPTION 'ONAGRI pesticide workbook source must remain disabled pending human review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-onagri-fertilizer-workbooks' AND enabled=false AND last_status='review_workflow_ready') THEN
    RAISE EXCEPTION 'ONAGRI fertilizer workbook source must remain disabled pending human review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-ministry-approved-pesticides-2025' AND enabled=false AND last_status='manual_pdf_review_required') THEN
    RAISE EXCEPTION 'Ministry 2025 pesticide PDF must remain disabled pending manual review';
  END IF;
END $$;

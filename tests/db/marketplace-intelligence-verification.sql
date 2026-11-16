-- Verify the additive marketplace, price intelligence and satellite migration.
DO $$
DECLARE
  required_table text;
  required_tables text[] := ARRAY[
    'marketplace_listings',
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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_listings' AND policyname='Public can read published marketplace listings') THEN
    RAISE EXCEPTION 'Public marketplace listing read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agricultural_product_catalog' AND policyname='Public can read active agricultural catalog') THEN
    RAISE EXCEPTION 'Public agricultural catalog read policy is missing';
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
  IF NOT EXISTS (SELECT 1 FROM public.market_data_sources WHERE source_key='tn-onagri-agricultural-input-prices' AND enabled=false) THEN
    RAISE EXCEPTION 'ONAGRI source must be registered but disabled pending adapter review';
  END IF;
END $$;

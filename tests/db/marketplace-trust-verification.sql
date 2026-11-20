-- Verify marketplace trust, buy/sell, and moderation schema and RLS.
DO $$
DECLARE
  required_table text;
  required_tables text[] := ARRAY[
    'marketplace_favorites',
    'marketplace_seller_reviews',
    'marketplace_listing_reports',
    'marketplace_seller_verifications',
    'marketplace_listing_promotions',
    'marketplace_orders'
  ];
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_listings'
      AND column_name='trade_type'
  ) THEN
    RAISE EXCEPTION 'marketplace_listings.trade_type is missing';
  END IF;

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

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_favorites' AND policyname='Users manage own marketplace favorites') THEN
    RAISE EXCEPTION 'Marketplace favorites owner policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_seller_reviews' AND policyname='Reviewers can create own seller reviews') THEN
    RAISE EXCEPTION 'Seller review ownership policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_listing_reports' AND policyname='Users can submit own listing reports') THEN
    RAISE EXCEPTION 'Listing report ownership policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_seller_verifications' AND policyname='Sellers can submit verification requests') THEN
    RAISE EXCEPTION 'Seller verification ownership policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='marketplace_listing_promotions' AND policyname='Sellers can request listing promotions') THEN
    RAISE EXCEPTION 'Seller promotion ownership policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_seller_verifications'
      AND column_name='evidence_urls' AND data_type='ARRAY'
  ) THEN
    RAISE EXCEPTION 'Seller verification evidence_urls column is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='marketplace_listing_promotions'
      AND column_name='payment_status'
  ) THEN
    RAISE EXCEPTION 'Promotion payment_status is missing';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.marketplace_inquiry_messages') IS NULL THEN
    RAISE EXCEPTION 'marketplace_inquiry_messages table is missing';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.marketplace_inquiry_messages'::regclass) THEN
    RAISE EXCEPTION 'marketplace_inquiry_messages must have RLS enabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='marketplace_inquiry_messages' AND policyname='Inquiry participants can read messages') THEN
    RAISE EXCEPTION 'message participant read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='marketplace_inquiry_messages' AND policyname='Participants can send inquiry messages') THEN
    RAISE EXCEPTION 'message participant insert policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='marketplace_inquiry_messages'
      AND grantee='authenticated' AND column_name='read_at' AND privilege_type='UPDATE') THEN
    RAISE EXCEPTION 'authenticated users must only receive read_at update permission';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='marketplace_orders' AND policyname='Order participants can read their orders') THEN
    RAISE EXCEPTION 'marketplace order participant read policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='marketplace_orders' AND policyname='Sellers can create orders from accepted inquiries') THEN
    RAISE EXCEPTION 'marketplace order creation policy is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
    WHERE tgname='marketplace_order_transition_guard' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'marketplace order transition guard is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='marketplace_orders'
      AND grantee='authenticated' AND column_name='status' AND privilege_type='UPDATE') THEN
    RAISE EXCEPTION 'authenticated order participants need status update privilege';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema='public' AND table_name='marketplace_orders'
      AND grantee='authenticated' AND column_name='unit_price' AND privilege_type='UPDATE') THEN
    RAISE EXCEPTION 'authenticated users must not be able to rewrite order pricing';
  END IF;
END $$;

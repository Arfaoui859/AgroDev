-- AgroGrowth marketplace + agricultural market intelligence
-- Apply once in Supabase SQL Editor or with the project's migration runner.
-- Existing marketplace, market_prices, farm and satellite tables are not replaced.

ALTER TABLE public.market_prices
  ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS price_min numeric(12,3),
  ADD COLUMN IF NOT EXISTS price_max numeric(12,3),
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_key text,
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS raw_payload jsonb;

DO $$ BEGIN
  ALTER TABLE public.market_prices
    ADD CONSTRAINT market_prices_verification_status_check
    CHECK (verification_status IN ('unverified','source-checked','official-source','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS market_prices_crop_date_idx
  ON public.market_prices (crop_name, price_date DESC);
CREATE INDEX IF NOT EXISTS market_prices_location_date_idx
  ON public.market_prices (market_location, price_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS market_prices_source_observation_uidx
  ON public.market_prices (source_key, external_id, price_date, market_location, crop_name);

CREATE TABLE IF NOT EXISTS public.market_price_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_name text NOT NULL,
  variety text,
  market_location text NOT NULL,
  price_kind text NOT NULL DEFAULT 'wholesale' CHECK (price_kind IN ('wholesale','retail','seller','other')),
  price_min numeric(12,3),
  price_max numeric(12,3),
  price_average numeric(12,3),
  unit text NOT NULL DEFAULT 'kg',
  currency text NOT NULL DEFAULT 'TND',
  observed_on date NOT NULL,
  quality_grade text,
  source_name text NOT NULL,
  source_url text NOT NULL,
  source_key text NOT NULL,
  external_id text NOT NULL,
  source_type text NOT NULL DEFAULT 'official_open_data',
  collected_at timestamptz NOT NULL DEFAULT now(),
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','source-checked','official-source','rejected')),
  raw_payload jsonb,
  CHECK (price_min IS NOT NULL OR price_max IS NOT NULL OR price_average IS NOT NULL),
  CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max),
  UNIQUE(source_key, external_id, observed_on, market_location, commodity_name, price_kind)
);
CREATE INDEX IF NOT EXISTS market_price_observations_search_idx
  ON public.market_price_observations (commodity_name, market_location, observed_on DESC);
ALTER TABLE public.market_price_observations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read market price observations" ON public.market_price_observations;
CREATE POLICY "Public can read market price observations"
  ON public.market_price_observations FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('agricultural_input','equipment','agricultural_product','harvest','livestock','other')),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 160),
  description text,
  category text NOT NULL,
  price numeric(12,3),
  currency text NOT NULL DEFAULT 'TND',
  unit text,
  quantity numeric(14,3),
  location text,
  governorate text,
  image_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','reserved','sold','archived')),
  harvest_crop text,
  expected_harvest_date date,
  harvest_window_end date,
  quality_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (price IS NULL OR price >= 0),
  CHECK (quantity IS NULL OR quantity >= 0),
  CHECK (listing_type <> 'harvest' OR (harvest_crop IS NOT NULL AND expected_harvest_date IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS marketplace_listings_public_idx
  ON public.marketplace_listings (status, listing_type, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_listings_seller_idx
  ON public.marketplace_listings (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_listings_harvest_idx
  ON public.marketplace_listings (expected_harvest_date)
  WHERE listing_type = 'harvest' AND status = 'published';

CREATE TABLE IF NOT EXISTS public.agricultural_product_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL CHECK (product_type IN ('pesticide','fertilizer','seed','seedling','soil_amendment','animal_input','other')),
  trade_name text NOT NULL,
  active_ingredient text,
  composition text,
  manufacturer text,
  registration_number text,
  registration_status text NOT NULL DEFAULT 'unverified'
    CHECK (registration_status IN ('unverified','registered_tunisia','expired','prohibited','not_applicable')),
  target_crops text[] NOT NULL DEFAULT '{}',
  target_pests_diseases text[] NOT NULL DEFAULT '{}',
  approved_uses jsonb NOT NULL DEFAULT '[]'::jsonb,
  label_url text,
  source_name text NOT NULL,
  source_url text,
  source_key text NOT NULL,
  external_id text NOT NULL,
  source_updated_at timestamptz,
  collected_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_key, external_id)
);
CREATE INDEX IF NOT EXISTS agricultural_catalog_type_idx
  ON public.agricultural_product_catalog (product_type, active, trade_name);
CREATE INDEX IF NOT EXISTS agricultural_catalog_registration_idx
  ON public.agricultural_product_catalog (registration_status);

CREATE TABLE IF NOT EXISTS public.market_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('official_open_data','api','csv','rss','permitted_scrape','seller_feed','manual')),
  license_note text,
  refresh_interval_minutes integer NOT NULL DEFAULT 1440 CHECK (refresh_interval_minutes >= 15),
  enabled boolean NOT NULL DEFAULT false,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_status text NOT NULL DEFAULT 'never_run',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Public can read published marketplace listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'published' OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can create own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Sellers can create own marketplace listings"
  ON public.marketplace_listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can update own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Sellers can update own marketplace listings"
  ON public.marketplace_listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers can delete own marketplace listings" ON public.marketplace_listings;
CREATE POLICY "Sellers can delete own marketplace listings"
  ON public.marketplace_listings FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Public can read active agricultural catalog" ON public.agricultural_product_catalog;
CREATE POLICY "Public can read active agricultural catalog"
  ON public.agricultural_product_catalog FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Only admins can read source registry" ON public.market_data_sources;
CREATE POLICY "Only admins can read source registry"
  ON public.market_data_sources FOR SELECT TO authenticated
  USING (public.is_admin());

-- Market observations are public reference data. Writes are performed only by
-- the backend service-role ingestion endpoint, never by mobile clients.
DROP POLICY IF EXISTS "Public can read market prices" ON public.market_prices;
CREATE POLICY "Public can read market prices"
  ON public.market_prices FOR SELECT USING (true);


-- Public marketplace images; uploads are isolated under the authenticated seller UUID.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('marketplace-images','marketplace-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view marketplace images" ON storage.objects;
CREATE POLICY "Public can view marketplace images" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace-images');

DROP POLICY IF EXISTS "Sellers upload own marketplace images" ON storage.objects;
CREATE POLICY "Sellers upload own marketplace images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Sellers update own marketplace images" ON storage.objects;
CREATE POLICY "Sellers update own marketplace images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Sellers delete own marketplace images" ON storage.objects;
CREATE POLICY "Sellers delete own marketplace images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Official Tunisian open-data sources are registered but disabled until their
-- CSV/XLSX/PDF column mapping is configured and reviewed in n8n.
INSERT INTO public.market_data_sources
  (source_key,source_name,source_url,source_type,license_note,refresh_interval_minutes,enabled,last_status)
VALUES
  ('tn-crda-sidi-bouzid-prices','CRDA Sidi Bouzid - wholesale and retail produce prices',
   'https://catalog.data.gov.tn/dataset/suivi-des-prix','official_open_data',
   'Licence Nationale de Données Publiques Ouvertes; dataset describes wholesale/retail minimum and maximum prices for vegetables, fruits and other products.',
   1440,false,'adapter_pending'),
  ('tn-crda-sidi-bouzid-vegetables','CRDA Sidi Bouzid - vegetables CSV',
   'https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/1a522c14-4d20-430f-adb4-9820cb057d29','official_open_data',
   'Vegetable price CSV resource; map pgmin/pgmax to wholesale and pdmin/pdmax to retail observations.',
   1440,false,'adapter_pending'),
  ('tn-crda-sidi-bouzid-fruits','CRDA Sidi Bouzid - fruits CSV',
   'https://catalog.data.gov.tn/dataset/suivi-des-prix/resource/75f90f09-a748-4c16-b867-9b646503ca3f','official_open_data',
   'Fruit price CSV resource; map pgmin/pgmax to wholesale and pdmin/pdmax to retail observations.',
   1440,false,'adapter_pending'),
  ('tn-onagri-agricultural-input-prices','ONAGRI - agricultural input and service prices',
   'https://catalog.data.gov.tn/fr/dataset/prix-des-principaux-intrants-des-produits-agricoles','official_open_data',
   'Licence Nationale de Données Publiques Ouvertes; XLSX resources include seeds, plants, fertilizers, pesticides, mechanization and tools.',
   1440,false,'adapter_pending'),
  ('tn-ministry-approved-pesticides','Ministry of Agriculture - approved pesticides in Tunisia',
   'https://catalog.data.gov.tn/dataset/liste-des-pesticides-homologues-en-tunisie','official_open_data',
   'Licence Nationale de Données Publiques Ouvertes; PDF register requires reviewed extraction and current registration verification.',
   10080,false,'adapter_pending')
ON CONFLICT (source_key) DO UPDATE SET
  source_name=EXCLUDED.source_name,source_url=EXCLUDED.source_url,source_type=EXCLUDED.source_type,
  license_note=EXCLUDED.license_note,refresh_interval_minutes=EXCLUDED.refresh_interval_minutes;

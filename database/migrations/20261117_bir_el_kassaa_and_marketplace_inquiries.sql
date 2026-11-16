-- Bir El Kassaa monthly ONAGRI observations and buyer/seller inquiries.
-- Additive migration; retains existing price observations and marketplace listings.

ALTER TABLE public.market_price_observations
  ADD COLUMN IF NOT EXISTS aggregation_period text NOT NULL DEFAULT 'daily'
    CHECK (aggregation_period IN ('daily','monthly','annual')),
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS previous_year_price numeric(12,3),
  ADD COLUMN IF NOT EXISTS supply_quantity_tons numeric(14,3),
  ADD COLUMN IF NOT EXISTS supply_change_percent numeric(9,3),
  ADD COLUMN IF NOT EXISTS price_change_percent numeric(9,3),
  ADD COLUMN IF NOT EXISTS observation_days integer;

CREATE INDEX IF NOT EXISTS market_price_observations_period_idx
  ON public.market_price_observations (market_location, aggregation_period, period_start DESC);

INSERT INTO public.market_data_sources
  (source_key,source_name,source_url,source_type,license_note,refresh_interval_minutes,enabled,last_status)
VALUES
  ('tn-onagri-bir-el-kassaa','ONAGRI - Mercuriale du marché de gros de Bir El Kassaa',
   'https://www.onagri.nat.tn/Marche-de-gros-bir-el-kasaa/fr/62','permitted_scrape',
   'Official ONAGRI public monthly mercuriale archive. Collector imports published monthly aggregate prices and supply quantities; it checks once daily for new monthly publications.',
   1440,false,'adapter_ready_requires_secrets')
ON CONFLICT (source_key) DO UPDATE SET
  source_name=EXCLUDED.source_name,source_url=EXCLUDED.source_url,
  license_note=EXCLUDED.license_note,refresh_interval_minutes=EXCLUDED.refresh_interval_minutes;

CREATE TABLE IF NOT EXISTS public.marketplace_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 5 AND 2000),
  quantity numeric(14,3),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','replied','accepted','rejected','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS marketplace_inquiries_seller_idx
  ON public.marketplace_inquiries (seller_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_inquiries_buyer_idx
  ON public.marketplace_inquiries (buyer_id,created_at DESC);

ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Buyers and sellers can read their inquiries" ON public.marketplace_inquiries;
CREATE POLICY "Buyers and sellers can read their inquiries"
  ON public.marketplace_inquiries FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
DROP POLICY IF EXISTS "Buyers can create inquiries for published listings" ON public.marketplace_inquiries;
CREATE POLICY "Buyers can create inquiries for published listings"
  ON public.marketplace_inquiries FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      WHERE l.id = listing_id AND l.seller_id = seller_id
        AND l.status = 'published' AND l.seller_id <> auth.uid()
    )
  );
DROP POLICY IF EXISTS "Sellers can update inquiry status" ON public.marketplace_inquiries;
CREATE POLICY "Sellers can update inquiry status"
  ON public.marketplace_inquiries FOR UPDATE TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

-- Restrict authenticated sellers to changing inquiry status only.
REVOKE UPDATE ON public.marketplace_inquiries FROM authenticated;
GRANT UPDATE (status, updated_at) ON public.marketplace_inquiries TO authenticated;

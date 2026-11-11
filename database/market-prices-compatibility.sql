-- Idempotent compatibility migration for the market-price API.
-- The app uses stable crop slugs (e.g. wheat/olive) and the base schema stores
-- the display name. No FK is added because crop reference data is bundled.
ALTER TABLE public.market_prices
  ADD COLUMN IF NOT EXISTS crop_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_market_prices_crop_id_price_date
  ON public.market_prices (crop_id, price_date DESC);

COMMENT ON COLUMN public.market_prices.crop_id IS
  'Stable application crop key/slug. Backfill only from a verified crop-name mapping; do not guess or fabricate mappings.';

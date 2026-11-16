-- Preserve the evidence behind any non-default pesticide registration status.
ALTER TABLE public.agricultural_product_catalog
  ADD COLUMN IF NOT EXISTS registration_evidence_url text,
  ADD COLUMN IF NOT EXISTS registration_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS agricultural_catalog_registration_evidence_idx
  ON public.agricultural_product_catalog (registration_status, registration_verified_at DESC);

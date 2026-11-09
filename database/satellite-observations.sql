-- Persist Copernicus Sentinel-2 vegetation-index observations per owned farm.
-- Apply in Supabase SQL Editor before deploying the satellite endpoint.

CREATE TABLE IF NOT EXISTS public.satellite_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  collection TEXT NOT NULL,
  index_name TEXT NOT NULL CHECK (index_name IN ('NDVI')),
  observed_from TIMESTAMPTZ NOT NULL,
  observed_to TIMESTAMPTZ NOT NULL,
  mean_value DOUBLE PRECISION NOT NULL CHECK (mean_value >= -1 AND mean_value <= 1),
  min_value DOUBLE PRECISION NOT NULL CHECK (min_value >= -1 AND min_value <= 1),
  max_value DOUBLE PRECISION NOT NULL CHECK (max_value >= -1 AND max_value <= 1),
  standard_deviation DOUBLE PRECISION NOT NULL DEFAULT 0,
  sample_count BIGINT NOT NULL DEFAULT 0 CHECK (sample_count >= 0),
  no_data_count BIGINT NOT NULL DEFAULT 0 CHECK (no_data_count >= 0),
  resolution_meters INTEGER NOT NULL DEFAULT 10,
  quality_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT satellite_observations_unique_window
    UNIQUE (farm_id, provider, index_name, observed_from, observed_to)
);

CREATE INDEX IF NOT EXISTS idx_satellite_observations_farm_date
  ON public.satellite_observations (farm_id, observed_to DESC);

ALTER TABLE public.satellite_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "satellite_observations_owner_select" ON public.satellite_observations;
CREATE POLICY "satellite_observations_owner_select"
ON public.satellite_observations
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = satellite_observations.farm_id
      AND f.owner_id = auth.uid()
  )
);

-- Writes are performed by the server only after checking farm ownership.
-- No client INSERT/UPDATE/DELETE policy is intentionally granted.
GRANT SELECT ON public.satellite_observations TO authenticated;

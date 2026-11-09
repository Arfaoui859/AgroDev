-- Soil analysis schema correction.
-- pH is measured on a 0–14 scale. DECIMAL(3,2) only supports up to 9.99,
-- so existing databases must widen the column before persisting alkaline soils.
ALTER TABLE public.soil_analyses
  ALTER COLUMN ph_level TYPE DECIMAL(4,2)
  USING ph_level::DECIMAL(4,2);

-- ============================================================================
-- AgroGrowth — Livestock production persistence
--
-- Required by the production CRUD in server/routes/livestock.ts (mounted at
-- /api/livestock-management/production-records).
--
-- Before this migration the "Livestock Production Analytics" screen generated
-- its records at runtime with Math.random() (milk litres, egg counts, weight
-- gain, fat/protein, quality grades, revenue) and rendered them as real
-- production history, and it POSTed new records into that same in-memory array
-- so nothing survived a reload. This file gives the feature a real,
-- tenant-scoped store: a farmer records their own production events and the
-- screen reads them back.
--
-- Every row is owned by the authenticated user (`user_id = auth.uid()`) and the
-- referenced animal must also belong to the caller, so a record can never be
-- attached to, or read from, another user's herd.
--
-- Safe to re-run (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.livestock_animals(id) ON DELETE CASCADE,
  production_type TEXT NOT NULL
    CHECK (production_type IN ('milk', 'eggs', 'wool', 'meat', 'weight_gain', 'other')),
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL
    CHECK (unit IN ('liters', 'kg', 'pieces', 'grams')),
  quality TEXT NOT NULL DEFAULT 'A'
    CHECK (quality IN ('A', 'B', 'C', 'Premium', 'rejected')),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  -- The farmer's own recorded unit price; never inferred. Revenue is only ever
  -- quantity * price when the farmer actually entered a price.
  price_per_unit NUMERIC(12,4) CHECK (price_per_unit IS NULL OR price_per_unit >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  -- Optional measured composition (e.g. milk fat/protein), user-entered only.
  fat_content NUMERIC(6,3) CHECK (fat_content IS NULL OR (fat_content >= 0 AND fat_content <= 100)),
  protein_content NUMERIC(6,3) CHECK (protein_content IS NULL OR (protein_content >= 0 AND protein_content <= 100)),
  temperature_c NUMERIC(5,2),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS livestock_production_records_user_date_idx
  ON public.livestock_production_records (user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS livestock_production_records_animal_idx
  ON public.livestock_production_records (animal_id);
CREATE INDEX IF NOT EXISTS livestock_production_records_user_type_idx
  ON public.livestock_production_records (user_id, production_type);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.livestock_production_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.livestock_production_records FROM PUBLIC, anon;

-- Owner-scoped, and the parent animal must belong to the caller.
DROP POLICY IF EXISTS "Users manage their own production records" ON public.livestock_production_records;
CREATE POLICY "Users manage their own production records"
  ON public.livestock_production_records FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a
    WHERE a.id = livestock_production_records.animal_id AND a.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a
    WHERE a.id = livestock_production_records.animal_id AND a.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_production_records TO authenticated;

-- ============================================================================
-- AgroGrowth — Livestock intelligence persistence
--
-- Required by server/routes/livestock.ts. Before this migration the livestock
-- endpoints deliberately failed closed (503) because the previous router
-- fabricated herds, animals, vaccinations, weights, feed and health alerts at
-- runtime. This file gives those features a real, tenant-scoped data store so
-- the API can return the caller's own records instead of demo data.
--
-- Every table is owned by the authenticated user (`user_id = auth.uid()`).
-- A record may optionally reference a farm the caller owns; the RLS policy
-- enforces that ownership too, so a user can never attach an animal to a farm
-- they do not own, and can never read another user's herd.
--
-- Safe to re-run (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Herds / groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_herds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('cattle','dairy_cattle','beef_cattle','sheep','goat','poultry','camel','other')),
  purpose TEXT NOT NULL DEFAULT 'other' CHECK (purpose IN ('dairy','beef','wool','meat','eggs','breeding','mixed','other')),
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Individual animals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  herd_id UUID NULL REFERENCES public.livestock_herds(id) ON DELETE SET NULL,
  ear_tag TEXT NOT NULL,
  rfid TEXT,
  species TEXT NOT NULL CHECK (species IN ('cattle','dairy_cattle','beef_cattle','sheep','goat','poultry','camel','other')),
  breed TEXT NOT NULL DEFAULT '',
  sex TEXT NOT NULL CHECK (sex IN ('male','female')),
  birth_date DATE,
  origin TEXT NOT NULL DEFAULT '',
  purchase_date DATE,
  purchase_price NUMERIC(14,3) CHECK (purchase_price IS NULL OR purchase_price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  initial_weight_kg NUMERIC(8,2) CHECK (initial_weight_kg IS NULL OR initial_weight_kg > 0),
  current_weight_kg NUMERIC(8,2) CHECK (current_weight_kg IS NULL OR current_weight_kg > 0),
  purpose TEXT NOT NULL DEFAULT 'other' CHECK (purpose IN ('dairy','beef','wool','meat','eggs','breeding','mixed','other')),
  health_status TEXT NOT NULL DEFAULT 'good' CHECK (health_status IN ('excellent','good','fair','poor','sick')),
  reproductive_status TEXT NOT NULL DEFAULT 'inactive' CHECK (reproductive_status IN ('active','pregnant','nursing','inactive','unknown')),
  sire_id UUID NULL REFERENCES public.livestock_animals(id) ON DELETE SET NULL,
  dam_id UUID NULL REFERENCES public.livestock_animals(id) ON DELETE SET NULL,
  photo_url TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('active','sold','deceased','transferred','quarantine')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT livestock_animals_tag_unique_per_user UNIQUE (user_id, ear_tag)
);

-- ---------------------------------------------------------------------------
-- Weight history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.livestock_animals(id) ON DELETE CASCADE,
  weight_kg NUMERIC(8,2) NOT NULL CHECK (weight_kg > 0),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT NOT NULL DEFAULT 'scale' CHECK (method IN ('scale','tape','estimate','other')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Health events (veterinary history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.livestock_animals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('checkup','vaccination','treatment','illness','injury','deworming','other')),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  diagnosis TEXT NOT NULL DEFAULT '',
  treatment TEXT NOT NULL DEFAULT '',
  veterinarian TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Reproduction events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_reproduction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.livestock_animals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('heat','insemination','pregnancy_check','birth','abortion','weaning','other')),
  method TEXT CHECK (method IS NULL OR method IN ('natural','artificial_insemination','embryo_transfer','unknown')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sire_tag TEXT,
  outcome TEXT,
  expected_due_date DATE,
  actual_birth_date DATE,
  offspring_count INTEGER CHECK (offspring_count IS NULL OR offspring_count >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Feed inventory
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestock_feed_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  feed_name TEXT NOT NULL,
  feed_type TEXT NOT NULL DEFAULT 'other' CHECK (feed_type IN ('hay','silage','concentrate','grain','mineral','supplement','pasture','other')),
  quantity_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity_kg >= 0),
  reorder_level_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reorder_level_kg >= 0),
  unit_cost NUMERIC(14,4) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  supplier TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.livestock_herds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_reproduction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestock_feed_inventory ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.livestock_herds FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.livestock_animals FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.livestock_weight_records FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.livestock_health_events FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.livestock_reproduction_events FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.livestock_feed_inventory FROM PUBLIC, anon;

-- Herds: owner-scoped, and a referenced farm must be owned by the caller.
DROP POLICY IF EXISTS "Users manage their own herds" ON public.livestock_herds;
CREATE POLICY "Users manage their own herds"
  ON public.livestock_herds FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_herds.farm_id AND f.owner_id = auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_herds.farm_id AND f.owner_id = auth.uid()))
  );

-- Animals: owner-scoped; herd (if any) must belong to the caller.
DROP POLICY IF EXISTS "Users manage their own animals" ON public.livestock_animals;
CREATE POLICY "Users manage their own animals"
  ON public.livestock_animals FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_animals.farm_id AND f.owner_id = auth.uid()))
    AND (herd_id IS NULL OR EXISTS (
      SELECT 1 FROM public.livestock_herds h WHERE h.id = livestock_animals.herd_id AND h.user_id = auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_animals.farm_id AND f.owner_id = auth.uid()))
    AND (herd_id IS NULL OR EXISTS (
      SELECT 1 FROM public.livestock_herds h WHERE h.id = livestock_animals.herd_id AND h.user_id = auth.uid()))
  );

-- Child tables: owner-scoped, and the parent animal must belong to the caller.
DROP POLICY IF EXISTS "Users manage their own weight records" ON public.livestock_weight_records;
CREATE POLICY "Users manage their own weight records"
  ON public.livestock_weight_records FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_weight_records.animal_id AND a.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_weight_records.animal_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage their own health events" ON public.livestock_health_events;
CREATE POLICY "Users manage their own health events"
  ON public.livestock_health_events FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_health_events.animal_id AND a.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_health_events.animal_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage their own reproduction events" ON public.livestock_reproduction_events;
CREATE POLICY "Users manage their own reproduction events"
  ON public.livestock_reproduction_events FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_reproduction_events.animal_id AND a.user_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.livestock_animals a WHERE a.id = livestock_reproduction_events.animal_id AND a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage their own feed inventory" ON public.livestock_feed_inventory;
CREATE POLICY "Users manage their own feed inventory"
  ON public.livestock_feed_inventory FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_feed_inventory.farm_id AND f.owner_id = auth.uid()))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f WHERE f.id = livestock_feed_inventory.farm_id AND f.owner_id = auth.uid()))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_herds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_animals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_weight_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_health_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_reproduction_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_feed_inventory TO authenticated;
GRANT ALL ON public.livestock_herds TO service_role;
GRANT ALL ON public.livestock_animals TO service_role;
GRANT ALL ON public.livestock_weight_records TO service_role;
GRANT ALL ON public.livestock_health_events TO service_role;
GRANT ALL ON public.livestock_reproduction_events TO service_role;
GRANT ALL ON public.livestock_feed_inventory TO service_role;

CREATE INDEX IF NOT EXISTS livestock_herds_user_idx ON public.livestock_herds (user_id);
CREATE INDEX IF NOT EXISTS livestock_animals_user_idx ON public.livestock_animals (user_id);
CREATE INDEX IF NOT EXISTS livestock_animals_herd_idx ON public.livestock_animals (herd_id);
CREATE INDEX IF NOT EXISTS livestock_animals_farm_idx ON public.livestock_animals (farm_id);
CREATE INDEX IF NOT EXISTS livestock_weight_animal_idx ON public.livestock_weight_records (animal_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS livestock_health_animal_idx ON public.livestock_health_events (animal_id, event_date DESC);
CREATE INDEX IF NOT EXISTS livestock_health_user_resolved_idx ON public.livestock_health_events (user_id, resolved);
CREATE INDEX IF NOT EXISTS livestock_repro_animal_idx ON public.livestock_reproduction_events (animal_id, event_date DESC);
CREATE INDEX IF NOT EXISTS livestock_feed_user_idx ON public.livestock_feed_inventory (user_id);

COMMENT ON TABLE public.livestock_animals IS
  'User-owned individual livestock records. Weights and prices are recorded measurements the owner supplied; the platform does not invent them.';
COMMENT ON TABLE public.livestock_health_events IS
  'Owner-recorded veterinary history. Diagnoses and treatments are recorded observations, not platform-generated veterinary advice.';

NOTIFY pgrst, 'reload schema';

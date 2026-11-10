-- AgroGrowth real farmer operations: crop cultivation and finance persistence.
-- Apply this migration to the Supabase project before enabling these write APIs.

-- Crop cultivation ownership: farms are the tenant boundary.
DROP POLICY IF EXISTS "Farm owners can manage crop cultivations" ON public.crop_cultivations;
CREATE POLICY "Farm owners can manage crop cultivations"
  ON public.crop_cultivations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = crop_cultivations.farm_id
        AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = crop_cultivations.farm_id
        AND f.owner_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.farm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('seeds','fertilizers','pesticides','labor','equipment','fuel','maintenance','utilities','insurance','other')),
  subcategory text NOT NULL DEFAULT '',
  amount numeric(14,3) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TND',
  expense_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  crop_related text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_period text,
  payment_method text NOT NULL DEFAULT 'cash',
  supplier text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farm_expenses_user_date_idx
  ON public.farm_expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS farm_expenses_farm_date_idx
  ON public.farm_expenses(farm_id, expense_date DESC);

ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own farm expenses" ON public.farm_expenses;
CREATE POLICY "Users manage their own farm expenses"
  ON public.farm_expenses
  FOR ALL
  USING (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_expenses.farm_id AND f.owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_expenses.farm_id AND f.owner_id = auth.uid()
    ))
  );

CREATE TABLE IF NOT EXISTS public.farm_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id uuid NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  crop_related text,
  amount numeric(14,3) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TND',
  revenue_date date NOT NULL,
  description text NOT NULL DEFAULT '',
  quantity numeric(14,3),
  unit text,
  buyer text,
  market_location text,
  payment_status text NOT NULL DEFAULT 'received',
  variety_name text NOT NULL DEFAULT '',
  unit_price numeric(14,4),
  quality_grade text,
  harvest_date date,
  storage_days integer NOT NULL DEFAULT 0 CHECK (storage_days >= 0),
  transportation_cost numeric(14,3) NOT NULL DEFAULT 0 CHECK (transportation_cost >= 0),
  marketing_cost numeric(14,3) NOT NULL DEFAULT 0 CHECK (marketing_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farm_revenues_user_date_idx
  ON public.farm_revenues(user_id, revenue_date DESC);
ALTER TABLE public.farm_revenues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their own farm revenues" ON public.farm_revenues;
CREATE POLICY "Users manage their own farm revenues"
  ON public.farm_revenues
  FOR ALL
  USING (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_revenues.farm_id AND f.owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (farm_id IS NULL OR EXISTS (
      SELECT 1 FROM public.farms f
      WHERE f.id = farm_revenues.farm_id AND f.owner_id = auth.uid()
    ))
  );

-- Idempotent extension for deployments that already created farm_revenues.
ALTER TABLE public.farm_revenues
  ADD COLUMN IF NOT EXISTS variety_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_price numeric(14,4),
  ADD COLUMN IF NOT EXISTS quality_grade text,
  ADD COLUMN IF NOT EXISTS harvest_date date,
  ADD COLUMN IF NOT EXISTS storage_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transportation_cost numeric(14,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketing_cost numeric(14,3) NOT NULL DEFAULT 0;

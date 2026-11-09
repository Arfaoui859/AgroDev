-- AgroGrowth financial persistence migration
-- Required by server/routes/farm-finance.ts.
-- Safe to re-run; all financial records are owned by the authenticated user.

CREATE TABLE IF NOT EXISTS public.farm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'seeds','fertilizers','pesticides','labor','equipment','fuel',
    'maintenance','utilities','insurance','other'
  )),
  subcategory TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,3) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  expense_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  crop_related TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_period TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  supplier TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT farm_expenses_recurring_period_check
    CHECK (recurring_period IS NULL OR recurring_period IN ('daily','weekly','monthly','quarterly','yearly'))
);

CREATE TABLE IF NOT EXISTS public.farm_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  crop_related TEXT,
  amount NUMERIC(14,3) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  revenue_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(14,3) CHECK (quantity IS NULL OR quantity > 0),
  unit TEXT,
  buyer TEXT,
  market_location TEXT,
  payment_status TEXT NOT NULL DEFAULT 'received',
  variety_name TEXT NOT NULL DEFAULT '',
  unit_price NUMERIC(14,4) CHECK (unit_price IS NULL OR unit_price > 0),
  quality_grade TEXT,
  harvest_date DATE,
  storage_days INTEGER NOT NULL DEFAULT 0 CHECK (storage_days >= 0),
  transportation_cost NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (transportation_cost >= 0),
  marketing_cost NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (marketing_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_revenues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own farm expenses" ON public.farm_expenses;
CREATE POLICY "Users manage own farm expenses"
  ON public.farm_expenses FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      farm_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = farm_id AND f.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users manage own farm revenues" ON public.farm_revenues;
CREATE POLICY "Users manage own farm revenues"
  ON public.farm_revenues FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      farm_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = farm_id AND f.owner_id = auth.uid()
      )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_revenues TO authenticated;
GRANT ALL ON public.farm_expenses TO service_role;
GRANT ALL ON public.farm_revenues TO service_role;

CREATE INDEX IF NOT EXISTS farm_expenses_user_date_idx
  ON public.farm_expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS farm_expenses_farm_date_idx
  ON public.farm_expenses (farm_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS farm_revenues_user_date_idx
  ON public.farm_revenues (user_id, revenue_date DESC);
CREATE INDEX IF NOT EXISTS farm_revenues_farm_date_idx
  ON public.farm_revenues (farm_id, revenue_date DESC);

COMMENT ON TABLE public.farm_expenses IS
  'User-owned AgroGrowth farm expense ledger; all amounts retain their stated currency.';
COMMENT ON TABLE public.farm_revenues IS
  'User-owned AgroGrowth farm revenue ledger; amount is gross sale value before recorded selling costs.';

NOTIFY pgrst, 'reload schema';

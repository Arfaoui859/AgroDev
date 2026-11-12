-- AgroGrowth budget-planning persistence migration
-- Required by the budget-planning CRUD in server/routes/farm-finance.ts.
--
-- A budget plan is a *plan*: it stores the farmer's own planned expense lines
-- and, optionally, their own projected revenue. Nothing here is model output;
-- the endpoint layer derives projections from the caller's persisted ledger and
-- labels their provenance. Safe to re-run; every plan is owned by one user.

CREATE TABLE IF NOT EXISTS public.farm_budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NULL REFERENCES public.farms(id) ON DELETE SET NULL,
  crop_type TEXT NOT NULL CHECK (length(btrim(crop_type)) > 0),
  season_year INTEGER NOT NULL CHECK (season_year BETWEEN 2000 AND 2100),
  planned_area_hectares NUMERIC(12,3) NOT NULL CHECK (planned_area_hectares > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'active', 'completed')),
  -- Farmer's own planned expense lines: [{ "category": text, "plannedAmount": number }]
  planned_expenses JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Farmer's own projected revenue; NULL means "not provided" (never invented).
  projected_revenue NUMERIC(14,3) CHECK (projected_revenue IS NULL OR projected_revenue >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.farm_budget_plans ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.farm_budget_plans FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Users manage their own farm budget plans" ON public.farm_budget_plans;
CREATE POLICY "Users manage their own farm budget plans"
  ON public.farm_budget_plans FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      farm_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = farm_budget_plans.farm_id AND f.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      farm_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.farms f
        WHERE f.id = farm_budget_plans.farm_id AND f.owner_id = auth.uid()
      )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_budget_plans TO authenticated;
GRANT ALL ON public.farm_budget_plans TO service_role;

CREATE INDEX IF NOT EXISTS farm_budget_plans_user_season_idx
  ON public.farm_budget_plans (user_id, season_year DESC, created_at DESC);

COMMENT ON TABLE public.farm_budget_plans IS
  'User-owned AgroGrowth budget plans. Planned expense lines and any projected revenue are user-entered; derived projections live in the API response, not here.';

NOTIFY pgrst, 'reload schema';

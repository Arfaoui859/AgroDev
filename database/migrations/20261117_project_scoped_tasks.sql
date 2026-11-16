-- Scope farm tasks to a specific cultivation project when one is selected.
-- Existing farm-level tasks remain valid with cultivation_id = NULL.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS crop_cultivations_id_farm_uidx
  ON public.crop_cultivations(id, farm_id);

ALTER TABLE public.farm_tasks
  ADD COLUMN IF NOT EXISTS cultivation_id uuid;

ALTER TABLE public.farm_expenses
  ADD COLUMN IF NOT EXISTS cultivation_id uuid;

ALTER TABLE public.farm_revenues
  ADD COLUMN IF NOT EXISTS cultivation_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farm_tasks_cultivation_farm_fk'
      AND conrelid = 'public.farm_tasks'::regclass
  ) THEN
    ALTER TABLE public.farm_tasks
      ADD CONSTRAINT farm_tasks_cultivation_farm_fk
      FOREIGN KEY (cultivation_id, farm_id)
      REFERENCES public.crop_cultivations(id, farm_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farm_expenses_cultivation_farm_fk' AND conrelid = 'public.farm_expenses'::regclass) THEN
    ALTER TABLE public.farm_expenses ADD CONSTRAINT farm_expenses_cultivation_farm_fk
      FOREIGN KEY (cultivation_id, farm_id) REFERENCES public.crop_cultivations(id, farm_id) ON DELETE SET NULL (cultivation_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'farm_revenues_cultivation_farm_fk' AND conrelid = 'public.farm_revenues'::regclass) THEN
    ALTER TABLE public.farm_revenues ADD CONSTRAINT farm_revenues_cultivation_farm_fk
      FOREIGN KEY (cultivation_id, farm_id) REFERENCES public.crop_cultivations(id, farm_id) ON DELETE SET NULL (cultivation_id);
  END IF;
END $;

CREATE INDEX IF NOT EXISTS farm_tasks_cultivation_due_idx
  ON public.farm_tasks(farm_id, cultivation_id, due_date NULLS LAST, created_at DESC);
CREATE INDEX IF NOT EXISTS farm_expenses_cultivation_idx
  ON public.farm_expenses(farm_id, cultivation_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS farm_revenues_cultivation_idx
  ON public.farm_revenues(farm_id, cultivation_id, revenue_date DESC);

NOTIFY pgrst, 'reload schema';
COMMIT;

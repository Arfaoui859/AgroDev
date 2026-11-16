-- Scope farm tasks to a specific cultivation project when one is selected.
-- Existing farm-level tasks remain valid with cultivation_id = NULL.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS crop_cultivations_id_farm_uidx
  ON public.crop_cultivations(id, farm_id);

ALTER TABLE public.farm_tasks
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

CREATE INDEX IF NOT EXISTS farm_tasks_cultivation_due_idx
  ON public.farm_tasks(farm_id, cultivation_id, due_date NULLS LAST, created_at DESC);

NOTIFY pgrst, 'reload schema';
COMMIT;

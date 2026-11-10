-- AgroGrowth equipment and farm-task persistence.
-- Apply after the base farms schema and before enabling the farm-operations API.
BEGIN;

CREATE TABLE IF NOT EXISTS public.farm_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 180),
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('tractor','irrigation','vehicle','harvester','sprayer','sensor','tool','other')),
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  serial_number text,
  purchase_date date,
  purchase_cost numeric(14,3) CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
  currency text NOT NULL DEFAULT 'TND' CHECK (currency = 'TND'),
  condition text NOT NULL DEFAULT 'unknown' CHECK (condition IN ('new','good','fair','poor','out_of_service','unknown')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','maintenance','inactive','retired')),
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farm_equipment_farm_created_idx
  ON public.farm_equipment(farm_id, created_at DESC);

ALTER TABLE public.farm_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Farm owners manage own equipment" ON public.farm_equipment;
CREATE POLICY "Farm owners manage own equipment" ON public.farm_equipment
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = farm_equipment.farm_id AND f.owner_id = auth.uid()
  ) AND created_by = auth.uid())
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = farm_equipment.farm_id AND f.owner_id = auth.uid()
  ) AND created_by = auth.uid()
  );
REVOKE ALL ON TABLE public.farm_equipment FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.farm_equipment TO authenticated;
GRANT ALL ON TABLE public.farm_equipment TO service_role;

CREATE TABLE IF NOT EXISTS public.farm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  description text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT 'general' CHECK (task_type IN ('planting','irrigation','fertilization','pest_control','harvesting','maintenance','inspection','general')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  due_date date,
  completed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL) OR status <> 'completed'),
  CHECK (assigned_to IS NULL OR assigned_to = created_by)
);
CREATE INDEX IF NOT EXISTS farm_tasks_farm_due_idx
  ON public.farm_tasks(farm_id, due_date NULLS LAST, created_at DESC);

ALTER TABLE public.farm_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Farm owners manage own tasks" ON public.farm_tasks;
CREATE POLICY "Farm owners manage own tasks" ON public.farm_tasks
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = farm_tasks.farm_id AND f.owner_id = auth.uid()
  ) AND created_by = auth.uid())
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.farms f
    WHERE f.id = farm_tasks.farm_id AND f.owner_id = auth.uid()
  ) AND created_by = auth.uid()
  ));
REVOKE ALL ON TABLE public.farm_tasks FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.farm_tasks TO authenticated;
GRANT ALL ON TABLE public.farm_tasks TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

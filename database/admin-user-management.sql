-- Admin user-management fields. Safe to re-run.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

UPDATE public.users
SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
WHERE status IS NULL OR status = '' OR (status = 'active' AND is_active = false);

UPDATE public.users
SET status = 'inactive'
WHERE status NOT IN ('active', 'inactive', 'suspended', 'pending');

UPDATE public.users
SET is_active = (status = 'active');

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Only the admin API (service role or JWT passing the public.is_admin() RLS
-- policy) should manage other users. No public/anonymous table access is added.

-- A signed-in admin JWT may list/update users through the RLS-scoped API client.
-- The security-definer role function avoids recursive policies on public.users.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND lower(role) IN ('admin', 'administrator')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Auditable record of administrator CRUD operations.
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_id uuid,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at
  ON public.admin_activity_logs(created_at DESC);
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read admin activity" ON public.admin_activity_logs;
CREATE POLICY "Admins read admin activity" ON public.admin_activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins write admin activity" ON public.admin_activity_logs;
CREATE POLICY "Admins write admin activity" ON public.admin_activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;

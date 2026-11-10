-- Admin user-management fields. Safe to re-run.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

UPDATE public.users
SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END
WHERE status IS NULL OR status = '';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Only the admin API (service role or JWT passing the public.is_admin() RLS
-- policy) should manage other users. No public/anonymous table access is added.

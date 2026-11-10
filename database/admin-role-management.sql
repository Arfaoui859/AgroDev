-- Atomic administrator role changes with last-admin protection and audit trail.
-- Apply in Supabase SQL Editor or with psql before enabling the API endpoint.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid NOT NULL,
  before_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx
  ON public.admin_audit_logs (actor_user_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_new_role text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_role text;
  v_admin_count bigint;
  v_new_role text := lower(trim(p_new_role));
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor and target are required' USING ERRCODE = '22023';
  END IF;

  IF v_new_role NOT IN (
    'admin', 'farmer', 'agronomist', 'trader',
    'veterinarian', 'inspector', 'government', 'investor'
  ) THEN
    RAISE EXCEPTION 'Unsupported role' USING ERRCODE = '22023';
  END IF;

  -- Serialize role changes so two concurrent requests cannot demote the last admins.
  PERFORM pg_advisory_xact_lock(hashtext('agrogrowth-admin-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_actor_user_id AND lower(role) IN ('admin', 'administrator')
      AND COALESCE(is_active, true) = true
  ) THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_old_role
  FROM public.users WHERE id = p_target_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002';
  END IF;

  IF lower(v_old_role) IN ('admin', 'administrator')
     AND v_new_role NOT IN ('admin', 'administrator') THEN
    SELECT count(*) INTO v_admin_count
    FROM public.users
    WHERE lower(role) IN ('admin', 'administrator')
      AND COALESCE(is_active, true) = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last active administrator'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.users SET role = v_new_role, updated_at = now()
  WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_user_id, before_data, after_data
  ) VALUES (
    p_actor_user_id,
    'user.role.changed',
    p_target_user_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', v_new_role)
  );

  RETURN jsonb_build_object(
    'target_user_id', p_target_user_id,
    'old_role', v_old_role,
    'new_role', v_new_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_role(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(uuid, uuid, text) TO service_role;

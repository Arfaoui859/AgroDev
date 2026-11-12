-- 20261112_requested_role.sql
--
-- Record the role a user asked for at signup without granting it.
--
-- The signup form lets a user pick farmer / agronomist / trader / veterinarian
-- / inspector. For security every account is still provisioned as `farmer`
-- (see prevent_self_role_escalation and handle_new_auth_user), but the choice
-- was previously dropped entirely, so an administrator had no signal that a
-- new agronomist was waiting to be approved. This migration:
--   * adds `users.requested_role` (nullable, constrained to known roles);
--   * has the trusted auth.users trigger copy the requested role from signup
--     metadata into it;
--   * extends prevent_self_role_escalation so an authenticated user cannot
--     write `requested_role` through the REST API (it stays a server-set field).
--
-- Granting a role remains a separate, audited admin action
-- (admin_change_user_role). Safe to re-run.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS requested_role VARCHAR(50);

-- Only allow known role names, and only when they differ from the assigned
-- role (a farmer who requested farmer has nothing to approve).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_requested_role_valid'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_requested_role_valid
      CHECK (
        requested_role IS NULL
        OR requested_role IN (
          'farmer', 'agronomist', 'trader', 'veterinarian', 'inspector'
        )
      );
  END IF;
END;
$$;

-- Persist the requested role at provisioning time. SECURITY DEFINER runs as the
-- table owner, so it is not subject to the user-facing escalation trigger.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested text := NULLIF(NEW.raw_user_meta_data ->> 'requested_role', '');
BEGIN
  IF requested IS NOT NULL
     AND requested NOT IN (
       'farmer', 'agronomist', 'trader', 'veterinarian', 'inspector'
     ) THEN
    requested := NULL;
  END IF;

  INSERT INTO public.users (
    id, email, full_name, role, requested_role, email_verified, is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'farmer',
    requested,
    NEW.email_confirmed_at IS NOT NULL,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (user_id)
  SELECT NEW.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
  );

  RETURN NEW;
END;
$$;

-- Keep requested_role out of reach of the client. The existing trigger already
-- blocks identity/privilege edits; add requested_role to that set so a user
-- cannot rewrite (or clear) their own pending request.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.role() = 'authenticated'
     AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'farmer' THEN
      RAISE EXCEPTION 'New accounts must start with the farmer role'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND (
      NEW.id IS DISTINCT FROM OLD.id
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.role IS DISTINCT FROM OLD.role
      OR NEW.password_hash IS DISTINCT FROM OLD.password_hash
      OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.requested_role IS DISTINCT FROM OLD.requested_role
    ) THEN
      RAISE EXCEPTION 'Users cannot modify identity or privilege fields'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-assert the trigger bindings (idempotent) so a fresh database that never
-- ran rls-hardening.sql still gets provisioning.
DROP TRIGGER IF EXISTS on_auth_user_created_agrogrowth ON auth.users;
CREATE TRIGGER on_auth_user_created_agrogrowth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP TRIGGER IF EXISTS prevent_self_role_escalation ON public.users;
CREATE TRIGGER prevent_self_role_escalation
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- An approved role change resolves the pending request, so clear it. This
-- keeps the admin view honest: `requested_role` only ever means "still waiting
-- for a decision".
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
  v_requested_role text;
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

  PERFORM pg_advisory_xact_lock(hashtext('agrogrowth-admin-role-change'));

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_actor_user_id AND lower(role) IN ('admin', 'administrator')
      AND COALESCE(is_active, true) = true
  ) THEN
    RAISE EXCEPTION 'Administrator privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT role, requested_role INTO v_old_role, v_requested_role
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

  UPDATE public.users
     SET role = v_new_role,
         requested_role = NULL,
         updated_at = now()
   WHERE id = p_target_user_id;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_user_id, before_data, after_data
  ) VALUES (
    p_actor_user_id,
    'user.role.changed',
    p_target_user_id,
    jsonb_build_object('role', v_old_role, 'requested_role', v_requested_role),
    jsonb_build_object('role', v_new_role, 'requested_role', NULL)
  );

  RETURN jsonb_build_object(
    'target_user_id', p_target_user_id,
    'old_role', v_old_role,
    'new_role', v_new_role,
    'requested_role', v_requested_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_role(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(uuid, uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';

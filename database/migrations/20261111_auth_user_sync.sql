-- 20261111_auth_user_sync.sql
--
-- Keep public.users in sync with auth.users after the initial insert.
--
-- The existing on_auth_user_created_agrogrowth trigger only fires on INSERT, so
-- `email_verified` was frozen at its signup value (false when email
-- confirmation is required) and `last_login` was never maintained. This
-- migration adds an idempotent AFTER UPDATE trigger that:
--   * flips email_verified to true once Supabase marks the email confirmed;
--   * records last_login when Supabase records a sign-in.
--
-- It only ever *sets true* on email_verified and only fills last_login, so it
-- cannot be used to downgrade or fabricate trust. It is safe to re-run.

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users
     SET email_verified = CASE
           WHEN NEW.email_confirmed_at IS NOT NULL THEN true
           ELSE email_verified
         END,
         last_login = COALESCE(NEW.last_sign_in_at, last_login),
         updated_at = now()
   WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated_agrogrowth ON auth.users;
CREATE TRIGGER on_auth_user_updated_agrogrowth
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_profile();

NOTIFY pgrst, 'reload schema';

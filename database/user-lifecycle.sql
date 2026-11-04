-- ============================================================================
-- AgroGrowth — user lifecycle integrity
--
-- `public.users` has no foreign key to `auth.users`, so deleting an account
-- from Supabase Auth leaves an orphaned `public.users` row behind. Because every
-- other user-owned table cascades from `public.users` (farms -> farm_sections,
-- soil_analyses, crop_recommendations, notifications, user_analytics,
-- push_subscriptions, user_profiles), those rows survive the deletion too,
-- holding the deleted user's data and re-occupying their email.
--
-- Verified on the live project: deleting the auth user for a test account left
-- its `public.users` row and its farm in place.
--
-- This migration adds an AFTER DELETE trigger on auth.users that removes the
-- matching profile row, letting the existing ON DELETE CASCADE rules clean up
-- the rest. It is idempotent and never touches rows other than the one being
-- deleted. It does not add a foreign key because a legacy `public.users` row
-- (agroadmin@growth.com) has no `auth.users` counterpart, which would make the
-- constraint impossible to create without first deleting that row.
--
-- Apply with: psql "$DATABASE_URL" -f database/user-lifecycle.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  DELETE FROM public.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();

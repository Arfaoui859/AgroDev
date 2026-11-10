-- AgroGrowth post-migration security verification.
-- Run AFTER database/rls-hardening.sql using a privileged SQL Editor session.
-- Every failed assertion raises an exception; no application data is modified.

DO $$
DECLARE
  fn text;
  rel record;
BEGIN
  -- Private scheduler table must be RLS-enabled and unavailable to browser roles.
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'scheduled_tasks'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS verification failed: public.scheduled_tasks is not RLS-enabled';
  END IF;

  IF has_table_privilege('anon', 'public.scheduled_tasks', 'SELECT')
     OR has_table_privilege('authenticated', 'public.scheduled_tasks', 'SELECT') THEN
    RAISE EXCEPTION 'Privilege verification failed: browser role can read scheduled_tasks';
  END IF;

  -- Identity-bound RPCs must not be callable by anonymous users.
  FOREACH fn IN ARRAY ARRAY[
    'public.get_user_farms(uuid)',
    'public.user_owns_farm(uuid,uuid)',
    'public.get_farm_dashboard(uuid)',
    'public.add_soil_analysis(uuid,jsonb,jsonb)'
  ] LOOP
    IF has_function_privilege('anon', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'Privilege verification failed: anon can execute %', fn;
    END IF;
    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'Privilege verification failed: authenticated cannot execute %', fn;
    END IF;
  END LOOP;

  -- The webhook mutates records and must be service-role only.
  fn := 'public.handle_ai_service_response(character varying,uuid,jsonb,integer,integer)';
  IF has_function_privilege('anon', fn, 'EXECUTE')
     OR has_function_privilege('authenticated', fn, 'EXECUTE') THEN
    RAISE EXCEPTION 'Privilege verification failed: browser role can execute AI webhook RPC';
  END IF;
  IF NOT has_function_privilege('service_role', fn, 'EXECUTE') THEN
    RAISE EXCEPTION 'Privilege verification failed: service_role cannot execute AI webhook RPC';
  END IF;

  -- Both helper functions must bind supplied user ids to auth.uid().
  IF pg_get_functiondef('public.get_user_farms(uuid)'::regprocedure)
       NOT ILIKE '%user_uuid IS DISTINCT FROM auth.uid()%' THEN
    RAISE EXCEPTION 'RPC verification failed: get_user_farms is not caller-bound';
  END IF;
  IF pg_get_functiondef('public.user_owns_farm(uuid,uuid)'::regprocedure)
       NOT ILIKE '%user_uuid IS NOT DISTINCT FROM auth.uid()%' THEN
    RAISE EXCEPTION 'RPC verification failed: user_owns_farm is not caller-bound';
  END IF;

  RAISE NOTICE 'AgroGrowth security verification passed: scheduler ACL/RLS, RPC grants, and caller-bound ownership checks.';
END;
$$;

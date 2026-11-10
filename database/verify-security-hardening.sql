-- AgroGrowth post-migration security verification.
-- Run AFTER database/rls-hardening.sql using a privileged SQL Editor session.
-- Every failed assertion raises an exception; no application data is modified.

DO $$
DECLARE
  fn text;
  rel regclass;
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

  -- Financial ledgers must be RLS-enabled, inaccessible to anon, and
  -- available only through owner-scoped policies for authenticated users.
  FOREACH rel IN ARRAY ARRAY[
    'public.farm_expenses'::regclass,
    'public.farm_revenues'::regclass
  ] LOOP
    IF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = rel) THEN
      RAISE EXCEPTION 'RLS verification failed: % is not RLS-enabled', rel;
    END IF;
    IF has_table_privilege('anon', rel, 'SELECT')
       OR has_table_privilege('anon', rel, 'INSERT')
       OR has_table_privilege('anon', rel, 'UPDATE')
       OR has_table_privilege('anon', rel, 'DELETE') THEN
      RAISE EXCEPTION 'Privilege verification failed: anon can access %', rel;
    END IF;
    IF NOT has_table_privilege('authenticated', rel, 'SELECT')
       OR NOT has_table_privilege('authenticated', rel, 'INSERT')
       OR NOT has_table_privilege('authenticated', rel, 'UPDATE')
       OR NOT has_table_privilege('authenticated', rel, 'DELETE') THEN
      RAISE EXCEPTION 'Privilege verification failed: authenticated CRUD grants missing on %', rel;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_expenses'
      AND policyname = 'Users manage their own farm expenses'
      AND with_check ILIKE '%user_id = auth.uid()%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_revenues'
      AND policyname = 'Users manage their own farm revenues'
      AND with_check ILIKE '%user_id = auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'RLS verification failed: financial ledger ownership policies are missing or incomplete';
  END IF;

  -- Equipment and task rows are children of a farm; ownership is inherited
  -- through farms.owner_id and every browser CRUD privilege is explicitly scoped.
  FOREACH rel IN ARRAY ARRAY[
    'public.farm_equipment'::regclass,
    'public.farm_tasks'::regclass
  ] LOOP
    IF NOT (SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = rel) THEN
      RAISE EXCEPTION 'RLS verification failed: % is not RLS-enabled', rel;
    END IF;
    IF has_table_privilege('anon', rel, 'SELECT')
       OR has_table_privilege('anon', rel, 'INSERT')
       OR has_table_privilege('anon', rel, 'UPDATE')
       OR has_table_privilege('anon', rel, 'DELETE') THEN
      RAISE EXCEPTION 'Privilege verification failed: anon can access %', rel;
    END IF;
    IF NOT has_table_privilege('authenticated', rel, 'SELECT')
       OR NOT has_table_privilege('authenticated', rel, 'INSERT')
       OR NOT has_table_privilege('authenticated', rel, 'UPDATE')
       OR NOT has_table_privilege('authenticated', rel, 'DELETE') THEN
      RAISE EXCEPTION 'Privilege verification failed: authenticated CRUD grants missing on %', rel;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'farm_equipment'
      AND policyname = 'Farm owners manage own equipment'
      AND qual ILIKE '%farms%' AND qual ILIKE '%owner_id = auth.uid()%'
      AND qual ILIKE '%created_by = auth.uid()%'
      AND with_check ILIKE '%farms%' AND with_check ILIKE '%owner_id = auth.uid()%'
      AND with_check ILIKE '%created_by = auth.uid()%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'farm_tasks'
      AND policyname = 'Farm owners manage own tasks'
      AND qual ILIKE '%farms%' AND qual ILIKE '%owner_id = auth.uid()%'
      AND with_check ILIKE '%farms%' AND with_check ILIKE '%owner_id = auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'RLS verification failed: equipment/task farm ownership policies are missing or incomplete';
  END IF;

  -- Browser clients may submit user-authored chat input, never forged AI output.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_agent_messages'
      AND policyname = 'Users insert own farm agent messages'
      AND qual IS NULL
      AND with_check ILIKE '%role%user%'
  ) THEN
    RAISE EXCEPTION 'RLS verification failed: client message insert policy does not restrict role=user';
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

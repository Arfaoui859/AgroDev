-- AgroGrowth assistant persistence verification (read-only).
-- Run AFTER database/autonomous-farm-agent.sql in the Supabase SQL Editor.
-- Every required table/column should report present = true.

SELECT
  to_regclass('public.farm_agent_settings') IS NOT NULL AS farm_agent_settings_present,
  to_regclass('public.farm_agent_conversations') IS NOT NULL AS farm_agent_conversations_present,
  to_regclass('public.farm_agent_messages') IS NOT NULL AS farm_agent_messages_present;

SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_starred'
  ) AS notifications_is_starred_present,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'archived_at'
  ) AS notifications_archived_at_present;

SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('farm_agent_settings', 'farm_agent_conversations', 'farm_agent_messages')
ORDER BY tablename;

SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('farm_agent_settings', 'farm_agent_conversations', 'farm_agent_messages')
ORDER BY tablename, policyname;

-- Refresh the PostgREST schema cache after confirming the migration.
NOTIFY pgrst, 'reload schema';

-- AgroGrowth Autonomous Farm Agent
-- Apply in Supabase SQL Editor before enabling the scheduled GitHub workflow.
-- This migration stores per-user scan preferences and makes in-app agent alerts
-- idempotent. It does not enable push/email delivery or invent sensor data.
--
-- Safe to re-run: tables, columns, indexes and policies are created idempotently.

CREATE TABLE IF NOT EXISTS public.farm_agent_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cadence_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (cadence_minutes IN (15, 30, 60, 180, 360, 1440)),
  last_scan_at TIMESTAMPTZ,
  last_events_count INTEGER NOT NULL DEFAULT 0 CHECK (last_events_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.farm_agent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own farm agent settings" ON public.farm_agent_settings;
CREATE POLICY "Users manage own farm agent settings"
  ON public.farm_agent_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_agent_settings TO authenticated;
GRANT ALL ON public.farm_agent_settings TO service_role;

INSERT INTO public.farm_agent_settings (user_id)
SELECT DISTINCT f.owner_id
FROM public.farms AS f
WHERE f.owner_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.farm_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'fr', 'en')),
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farm_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.farm_agent_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (length(content) <= 20000),
  language VARCHAR(5) NOT NULL DEFAULT 'ar' CHECK (language IN ('ar', 'fr', 'en')),
  data_source VARCHAR(30),
  model_source VARCHAR(200),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.farm_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own farm agent conversations" ON public.farm_agent_conversations;
CREATE POLICY "Users manage own farm agent conversations"
  ON public.farm_agent_conversations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own farm agent messages" ON public.farm_agent_messages;
CREATE POLICY "Users read own farm agent messages" ON public.farm_agent_messages
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own farm agent messages" ON public.farm_agent_messages;
CREATE POLICY "Users insert own farm agent messages" ON public.farm_agent_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role = 'user'
    AND EXISTS (
      SELECT 1 FROM public.farm_agent_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users delete own farm agent messages" ON public.farm_agent_messages;
CREATE POLICY "Users delete own farm agent messages" ON public.farm_agent_messages
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_agent_conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.farm_agent_messages TO authenticated;
GRANT ALL ON public.farm_agent_conversations TO service_role;
GRANT ALL ON public.farm_agent_messages TO service_role;

CREATE INDEX IF NOT EXISTS farm_agent_conversations_user_updated_idx
  ON public.farm_agent_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS farm_agent_messages_conversation_created_idx
  ON public.farm_agent_messages (conversation_id, created_at ASC);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_agent_event_dedupe_idx
  ON public.notifications (user_id, ((metadata ->> 'agent_event_key')))
  WHERE metadata ? 'agent_event_key';

CREATE INDEX IF NOT EXISTS farm_agent_settings_due_idx
  ON public.farm_agent_settings (enabled, last_scan_at);

COMMENT ON TABLE public.farm_agent_settings IS
  'Per-user preferences and last-run state for the AgroGrowth evidence-based farm monitoring agent.';
COMMENT ON INDEX public.notifications_agent_event_dedupe_idx IS
  'Prevents duplicate in-app notifications for the same autonomous farm-agent event.';

-- Force PostgREST to refresh its schema cache after the migration commits.
NOTIFY pgrst, 'reload schema';

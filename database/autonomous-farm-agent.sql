-- AgroGrowth Autonomous Farm Agent
-- Apply in Supabase SQL Editor before enabling the scheduled GitHub workflow.
-- This migration stores per-user scan preferences and makes in-app agent alerts
-- idempotent. It does not enable push/email delivery or invent sensor data.

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

-- Existing accounts with farms are monitored by default. Users can disable the
-- agent from the assistant panel at any time.
INSERT INTO public.farm_agent_settings (user_id)
SELECT DISTINCT f.owner_id
FROM public.farms AS f
WHERE f.owner_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- A stable event key prevents every scheduled run from duplicating the same
-- reminder. The event key is stored in metadata to preserve the existing
-- notifications schema and its user-scoped RLS policies.
-- The notification center supports starring and archiving persisted records.
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

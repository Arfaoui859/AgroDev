-- Samih Tokabri: persistent personal memory and per-user learning feedback.
-- Apply once in the Supabase SQL Editor. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.assistant_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memory_key VARCHAR(100) NOT NULL CHECK (memory_key ~ '^[a-z0-9_.-]{2,100}$'),
  category VARCHAR(40) NOT NULL CHECK (category IN ('profile','preference','farm_context','work_context','communication','ongoing_task')),
  memory_value TEXT NOT NULL CHECK (length(memory_value) BETWEEN 1 AND 1200),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.85 CHECK (confidence >= 0.5 AND confidence <= 1),
  source VARCHAR(40) NOT NULL DEFAULT 'explicit_user_statement'
    CHECK (source IN ('explicit_user_statement','user_correction','user_confirmed')),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, memory_key)
);

CREATE INDEX IF NOT EXISTS assistant_user_memory_user_updated_idx
  ON public.assistant_user_memory (user_id, updated_at DESC);

ALTER TABLE public.assistant_user_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own assistant memory" ON public.assistant_user_memory;
CREATE POLICY "Users manage own assistant memory"
  ON public.assistant_user_memory FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_user_memory TO authenticated;
GRANT ALL ON public.assistant_user_memory TO service_role;

COMMENT ON TABLE public.assistant_user_memory IS
  'Per-user facts and preferences explicitly supplied or confirmed by the user. Not model training data.';

CREATE TABLE IF NOT EXISTS public.assistant_learning_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  correction_text TEXT NOT NULL CHECK (length(correction_text) BETWEEN 1 AND 700),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assistant_learning_corrections_user_created_idx
  ON public.assistant_learning_corrections (user_id, created_at DESC);

ALTER TABLE public.assistant_learning_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own assistant learning corrections" ON public.assistant_learning_corrections;
CREATE POLICY "Users read own assistant learning corrections"
  ON public.assistant_learning_corrections FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own assistant learning corrections" ON public.assistant_learning_corrections;
CREATE POLICY "Users insert own assistant learning corrections"
  ON public.assistant_learning_corrections FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own assistant learning corrections" ON public.assistant_learning_corrections;
CREATE POLICY "Users delete own assistant learning corrections"
  ON public.assistant_learning_corrections FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.assistant_learning_corrections TO authenticated;
GRANT ALL ON public.assistant_learning_corrections TO service_role;

COMMENT ON TABLE public.assistant_learning_corrections IS
  'Per-user, explicit agriculture-related corrections for contextual retrieval by Samih Tokabri. Not a model-training dataset.';

NOTIFY pgrst, 'reload schema';

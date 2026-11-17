-- Per-user adaptive memory for AgroVibe. Safe to re-run.
CREATE TABLE IF NOT EXISTS public.assistant_user_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  memory_key VARCHAR(100) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'preference'
    CHECK (category IN ('profile','preference','farm_context','work_context','communication','ongoing_task')),
  memory_value TEXT NOT NULL CHECK (length(memory_value) BETWEEN 1 AND 1200),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.80 CHECK (confidence >= 0 AND confidence <= 1),
  source VARCHAR(30) NOT NULL DEFAULT 'explicit_user_statement'
    CHECK (source IN ('explicit_user_statement','user_correction','user_confirmed')),
  last_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, memory_key)
);
ALTER TABLE public.assistant_user_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own assistant memory" ON public.assistant_user_memory;
CREATE POLICY "Users manage own assistant memory" ON public.assistant_user_memory
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_user_memory TO authenticated;
GRANT ALL ON public.assistant_user_memory TO service_role;
CREATE INDEX IF NOT EXISTS assistant_user_memory_user_category_idx
  ON public.assistant_user_memory(user_id, category, updated_at DESC);
COMMENT ON TABLE public.assistant_user_memory IS
  'Small user-controlled facts and preferences for personalizing AgroVibe. Not a transcript store.';
NOTIFY pgrst, 'reload schema';

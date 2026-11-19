-- Samih Tokabri: per-user learning feedback ledger.
-- Stores only explicit agriculture-related user corrections; this is not model training.
-- Safe to re-run.
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

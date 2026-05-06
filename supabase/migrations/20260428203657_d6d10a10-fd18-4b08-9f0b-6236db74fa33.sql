
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS case_id uuid,
  ADD COLUMN IF NOT EXISTS designer_id uuid,
  ADD COLUMN IF NOT EXISTS feedback_source text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS recommends text;

-- Unique: one feedback per (user, case) when case_id is set
CREATE UNIQUE INDEX IF NOT EXISTS feedback_user_case_unique
  ON public.feedback (user_id, case_id)
  WHERE case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS feedback_case_id_idx ON public.feedback(case_id);
CREATE INDEX IF NOT EXISTS feedback_designer_id_idx ON public.feedback(designer_id);

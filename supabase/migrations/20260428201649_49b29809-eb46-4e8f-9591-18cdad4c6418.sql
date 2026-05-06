-- Feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  user_email text,
  user_role text,
  feedback_type text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  rating integer,
  related_case_id uuid,
  screenshot_url text,
  allow_use boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT feedback_status_valid CHECK (status IN ('new','reviewed','resolved'))
);

CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users insert own feedback
CREATE POLICY "Users insert own feedback"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users select own feedback
CREATE POLICY "Users select own feedback"
ON public.feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins / super admins / account managers can read all feedback
CREATE POLICY "Admins read all feedback"
ON public.feedback FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'account_manager'::app_role)
);

-- Admins / super admins can update status + admin_notes
CREATE POLICY "Admins update feedback"
ON public.feedback FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Updated_at trigger
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
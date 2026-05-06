
-- Create case_status_history table
CREATE TABLE public.case_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by UUID,
  changed_by_role text,
  notes text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can do anything with status history"
  ON public.case_status_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Designers can read assigned case history"
  ON public.case_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_status_history.case_id
    AND cases.assigned_designer_id = auth.uid()
  ));

CREATE POLICY "Clients can read own case history"
  ON public.case_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM cases WHERE cases.id = case_status_history.case_id
    AND cases.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can insert history for their cases"
  ON public.case_status_history FOR INSERT
  WITH CHECK (auth.uid() = changed_by);

-- Add is_archived to cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create trigger function for auto-logging status changes
CREATE OR REPLACE FUNCTION public.log_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.case_status_history (case_id, old_status, new_status)
    VALUES (NEW.id, OLD.status::text, NEW.status::text);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_case_status_change
  AFTER UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.log_case_status_change();

-- Enable realtime for case_status_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_status_history;


-- Add new status to case_status enum
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'additional_data_review' AFTER 'awaiting_client_info';

-- Create additional_data_requests table
CREATE TABLE public.additional_data_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  request_message text NOT NULL,
  response_type text NOT NULL DEFAULT 'pending' CHECK (response_type IN ('pending', 'approved', 'more_needed', 'rejected')),
  response_message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.additional_data_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all additional data requests"
  ON public.additional_data_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Designers can read requests for assigned cases"
  ON public.additional_data_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = additional_data_requests.case_id
      AND cases.assigned_designer_id = auth.uid()
  ));

CREATE POLICY "Designers can create requests for assigned cases"
  ON public.additional_data_requests FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = additional_data_requests.case_id
      AND cases.assigned_designer_id = auth.uid()
  ));

CREATE POLICY "Designers can update requests for assigned cases"
  ON public.additional_data_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = additional_data_requests.case_id
      AND cases.assigned_designer_id = auth.uid()
  ));

CREATE POLICY "Clients can read requests for own cases"
  ON public.additional_data_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = additional_data_requests.case_id
      AND cases.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_additional_data_requests_updated_at
  BEFORE UPDATE ON public.additional_data_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.additional_data_requests;

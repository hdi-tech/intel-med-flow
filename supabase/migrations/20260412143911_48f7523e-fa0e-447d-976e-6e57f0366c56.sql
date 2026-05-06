
-- Create consultation status enum
CREATE TYPE public.consultation_status AS ENUM (
  'pending_review',
  'assigned',
  'time_proposed',
  'confirmed',
  'completed',
  'cancelled',
  'reschedule_requested'
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  specialty TEXT NULL,
  service_interest TEXT NULL,
  description TEXT NULL,
  timezone TEXT NULL,
  referral_source TEXT NULL,
  status public.consultation_status NOT NULL DEFAULT 'pending_review',
  assigned_designer_id UUID NULL,
  proposed_slots JSONB NULL DEFAULT '[]'::jsonb,
  confirmed_slot JSONB NULL,
  admin_notes TEXT NULL,
  designer_notes TEXT NULL,
  reschedule_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Anyone can create a consultation (public booking form)
CREATE POLICY "Anyone can create consultations"
  ON public.consultations FOR INSERT
  TO public
  WITH CHECK (true);

-- Clients can read their own consultations
CREATE POLICY "Clients can read own consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Clients can update own consultations (reschedule)
CREATE POLICY "Clients can update own consultations"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Designers can read assigned consultations
CREATE POLICY "Designers can read assigned consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'designer'::app_role)
    AND assigned_designer_id = auth.uid()
  );

-- Designers can update assigned consultations
CREATE POLICY "Designers can update assigned consultations"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'designer'::app_role)
    AND assigned_designer_id = auth.uid()
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all consultations"
  ON public.consultations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;

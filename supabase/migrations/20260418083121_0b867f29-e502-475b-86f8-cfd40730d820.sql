-- Create hdi_align_applications table
CREATE TABLE public.hdi_align_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  clinic_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  monthly_cases TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hdi_align_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can submit applications
CREATE POLICY "Anyone can submit hdi_align_applications"
ON public.hdi_align_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view hdi_align_applications"
ON public.hdi_align_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Super admins full access
CREATE POLICY "Super admins full access hdi_align_applications"
ON public.hdi_align_applications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
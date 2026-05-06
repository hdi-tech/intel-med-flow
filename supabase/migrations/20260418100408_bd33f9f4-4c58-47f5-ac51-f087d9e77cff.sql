CREATE TABLE public.hdi_os_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  organisation_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  facility_type text NOT NULL,
  country text NOT NULL,
  workflow_challenge text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hdi_os_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit hdi_os_enquiries"
ON public.hdi_os_enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view hdi_os_enquiries"
ON public.hdi_os_enquiries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update hdi_os_enquiries"
ON public.hdi_os_enquiries
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins full access hdi_os_enquiries"
ON public.hdi_os_enquiries
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
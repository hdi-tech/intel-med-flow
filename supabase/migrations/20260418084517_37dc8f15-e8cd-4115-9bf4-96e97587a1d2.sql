-- Add status column to hdi_align_applications
ALTER TABLE public.hdi_align_applications
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Add UPDATE policy for authenticated admins (SELECT already exists for admins)
DROP POLICY IF EXISTS "Admins can update hdi_align_applications" ON public.hdi_align_applications;
CREATE POLICY "Admins can update hdi_align_applications"
ON public.hdi_align_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
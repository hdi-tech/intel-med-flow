-- Allow admins to read all user roles (needed to list designers)
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow clients to create payment records (for bank transfer claims)
CREATE POLICY "Users can create payments for own cases"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM cases WHERE cases.id = case_id AND cases.user_id = auth.uid())
);

-- Fix case_status_history: allow the trigger (which runs as SECURITY DEFINER) 
-- and also allow admins/designers to insert history with any changed_by
DROP POLICY IF EXISTS "Authenticated users can insert history for their cases" ON public.case_status_history;

CREATE POLICY "Users can insert history for own cases"
ON public.case_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM cases WHERE cases.id = case_id AND (cases.user_id = auth.uid() OR cases.assigned_designer_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
);
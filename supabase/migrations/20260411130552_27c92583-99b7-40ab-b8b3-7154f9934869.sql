
-- 1. Explicit admin-only INSERT/UPDATE/DELETE on user_roles
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Trigger to prevent clients from tampering with payment verification fields on cases
CREATE OR REPLACE FUNCTION public.protect_payment_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to change anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Allow designers to change anything (they don't touch payment fields in normal flow)
  IF public.has_role(auth.uid(), 'designer'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For clients: block changes to admin/payment-verification fields
  IF NEW.payment_verified_at IS DISTINCT FROM OLD.payment_verified_at
     OR NEW.payment_verified_by IS DISTINCT FROM OLD.payment_verified_by
     OR NEW.payment_rejection_note IS DISTINCT FROM OLD.payment_rejection_note
     OR NEW.quoted_price_usd IS DISTINCT FROM OLD.quoted_price_usd
     OR NEW.assigned_designer_id IS DISTINCT FROM OLD.assigned_designer_id
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
  THEN
    RAISE EXCEPTION 'You do not have permission to modify these fields';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_case_payment_fields
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_payment_fields();

-- 3. Fix storage policy: drop overly permissive designer read and replace with scoped one
DROP POLICY IF EXISTS "Designers can read assigned case files" ON storage.objects;

CREATE POLICY "Designers can read assigned case files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-files'
    AND has_role(auth.uid(), 'designer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.case_files cf
      JOIN public.cases c ON c.id = cf.case_id
      WHERE cf.file_url LIKE '%' || storage.objects.name
        AND c.assigned_designer_id = auth.uid()
    )
  );

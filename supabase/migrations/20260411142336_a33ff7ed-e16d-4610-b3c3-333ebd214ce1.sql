
-- 1. Fix education_waitlist: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.education_waitlist;
CREATE POLICY "Authenticated users can join waitlist"
  ON public.education_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Fix storage: restrict designer uploads to assigned cases only
DROP POLICY IF EXISTS "Designers can upload case files" ON storage.objects;
CREATE POLICY "Designers can upload to assigned case files"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'case-files'
    AND has_role(auth.uid(), 'designer'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.assigned_designer_id = auth.uid()
        AND (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- 3. Fix role forgery: enforce correct sender_role on case_messages
CREATE OR REPLACE FUNCTION public.set_sender_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(NEW.sender_id, 'admin'::app_role) THEN
    NEW.sender_role := 'admin';
  ELSIF public.has_role(NEW.sender_id, 'designer'::app_role) THEN
    NEW.sender_role := 'designer';
  ELSE
    NEW.sender_role := 'client';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_sender_role
  BEFORE INSERT ON public.case_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sender_role();

-- 4. Fix role forgery: enforce correct uploader_role on case_files
CREATE OR REPLACE FUNCTION public.set_uploader_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(NEW.uploaded_by, 'admin'::app_role) THEN
    NEW.uploader_role := 'admin';
  ELSIF public.has_role(NEW.uploaded_by, 'designer'::app_role) THEN
    NEW.uploader_role := 'designer';
  ELSE
    NEW.uploader_role := 'client';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_uploader_role
  BEFORE INSERT ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION public.set_uploader_role();

-- 5. Fix admin_notes exposure: create a secure view for client access
CREATE OR REPLACE VIEW public.client_cases AS
SELECT
  id, user_id, service_id, service_code, patient_ref, clinical_notes,
  delivery_type, consultation_requested, status, created_at, updated_at,
  delivered_at, quoted_price_usd, quote_sent_at, quote_accepted_at,
  is_free_trial, is_archived, payment_proof_url, payment_reference,
  payment_submitted_at
FROM public.cases
WHERE user_id = auth.uid();


-- 1. Fix waitlist: tie inserted email to the authenticated user's own email
DROP POLICY IF EXISTS "Authenticated users can join waitlist" ON public.education_waitlist;
CREATE POLICY "Authenticated users can join waitlist with own email"
  ON public.education_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (email = (auth.jwt()->>'email'));

-- 2. Fix storage delete: restrict to files the user actually uploaded
DROP POLICY IF EXISTS "Users can delete own case files" ON storage.objects;
CREATE POLICY "Users can delete own uploaded case files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'case-files'
    AND EXISTS (
      SELECT 1 FROM public.case_files cf
      WHERE cf.file_url LIKE '%' || objects.name
        AND cf.uploaded_by = auth.uid()
    )
  );

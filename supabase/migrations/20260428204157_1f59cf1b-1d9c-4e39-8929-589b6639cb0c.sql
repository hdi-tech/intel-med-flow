-- Drop old fragile/incorrect SELECT policies on storage.objects for case-files
DROP POLICY IF EXISTS "Users can read own case files" ON storage.objects;
DROP POLICY IF EXISTS "Designers can read assigned case files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all case files" ON storage.objects;

-- Unified, robust SELECT policy for case-files bucket.
-- Path convention: {uploaderUserId}/{caseId}/{filename}
-- Access is granted based on the caseId in folder[2], not the uploader folder.
CREATE POLICY "case_files_download_access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-files'
  AND (
    -- Admins / super_admins: full access
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR
    -- Account managers: access to managed clients' case files
    (
      has_role(auth.uid(), 'account_manager'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.cases c
        WHERE c.id::text = (storage.foldername(name))[2]
          AND c.user_id IN (SELECT public.get_managed_client_ids(auth.uid()))
      )
    )
    OR
    -- Case owner (client): access to all files attached to their case
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.user_id = auth.uid()
    )
    OR
    -- Assigned designer: access to all files attached to assigned case
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id::text = (storage.foldername(name))[2]
        AND c.assigned_designer_id = auth.uid()
    )
    OR
    -- Fallback: the uploader can always read their own files (folder[1])
    (storage.foldername(name))[1] = auth.uid()::text
  )
);
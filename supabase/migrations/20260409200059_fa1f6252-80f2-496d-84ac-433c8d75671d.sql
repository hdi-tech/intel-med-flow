-- Allow designers to upload to case-files bucket
CREATE POLICY "Designers can upload case files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'case-files'
  AND has_role(auth.uid(), 'designer'::app_role)
);

-- Allow admins to upload to case-files bucket
CREATE POLICY "Admins can upload case files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'case-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete case files
CREATE POLICY "Admins can delete case files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'case-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);
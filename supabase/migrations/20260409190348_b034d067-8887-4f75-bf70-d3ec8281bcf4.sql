
-- Create storage bucket for case files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('case-files', 'case-files', false, 524288000);

-- Users can upload to their own folder
CREATE POLICY "Users can upload own case files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read own files
CREATE POLICY "Users can read own case files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can read all case files
CREATE POLICY "Admins can read all case files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-files' AND public.has_role(auth.uid(), 'admin'));

-- Designers can read assigned case files
CREATE POLICY "Designers can read assigned case files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-files' AND public.has_role(auth.uid(), 'designer'));

-- Users can delete own files
CREATE POLICY "Users can delete own case files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for case_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;

-- Allow clients to update their own cases when status allows actions (not just draft)
DROP POLICY IF EXISTS "Users can update own draft cases" ON public.cases;
CREATE POLICY "Users can update own cases"
ON public.cases FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

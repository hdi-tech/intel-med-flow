-- Add uploader_role column to case_files
ALTER TABLE public.case_files 
ADD COLUMN uploader_role text DEFAULT 'client';

-- Enable realtime for case_files
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_files;

-- Enable realtime for case_messages (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'case_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.case_messages;
  END IF;
END $$;
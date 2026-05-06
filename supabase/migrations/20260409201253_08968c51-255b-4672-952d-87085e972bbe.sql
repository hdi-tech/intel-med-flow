
CREATE TABLE public.education_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT education_waitlist_email_unique UNIQUE (email)
);

ALTER TABLE public.education_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
ON public.education_waitlist
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
ON public.education_waitlist
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

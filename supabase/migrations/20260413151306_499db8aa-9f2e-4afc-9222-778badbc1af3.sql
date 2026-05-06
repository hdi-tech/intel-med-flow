-- Drop the restrictive authenticated-only insert policy
DROP POLICY IF EXISTS "Authenticated users can join waitlist with own email" ON public.education_waitlist;

-- Allow anyone (anon + authenticated) to insert
CREATE POLICY "Anyone can join waitlist"
ON public.education_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
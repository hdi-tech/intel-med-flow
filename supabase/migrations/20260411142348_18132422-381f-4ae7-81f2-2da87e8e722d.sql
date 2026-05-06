
-- Fix: recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.client_cases;
CREATE VIEW public.client_cases
WITH (security_invoker = true)
AS
SELECT
  id, user_id, service_id, service_code, patient_ref, clinical_notes,
  delivery_type, consultation_requested, status, created_at, updated_at,
  delivered_at, quoted_price_usd, quote_sent_at, quote_accepted_at,
  is_free_trial, is_archived, payment_proof_url, payment_reference,
  payment_submitted_at
FROM public.cases
WHERE user_id = auth.uid();

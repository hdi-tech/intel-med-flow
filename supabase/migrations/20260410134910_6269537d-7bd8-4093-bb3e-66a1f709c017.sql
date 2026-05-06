-- Add new enum values to case_status
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'pending_client_approval' AFTER 'design_review';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'payment_under_verification' AFTER 'awaiting_payment';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'payment_verified' AFTER 'payment_under_verification';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'final_delivery_submitted' AFTER 'payment_verified';

-- Add payment tracking columns to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_verified_by uuid;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS payment_rejection_note text;
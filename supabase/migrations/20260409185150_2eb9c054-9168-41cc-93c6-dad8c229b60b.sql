-- Add is_custom_quote column to services
ALTER TABLE public.services ADD COLUMN is_custom_quote boolean NOT NULL DEFAULT false;

-- Add new case status values
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'awaiting_quote' AFTER 'under_review';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'quote_accepted' AFTER 'awaiting_quote';

-- Add quote-related columns to cases
ALTER TABLE public.cases ADD COLUMN quoted_price_usd numeric;
ALTER TABLE public.cases ADD COLUMN quote_sent_at timestamp with time zone;
ALTER TABLE public.cases ADD COLUMN quote_accepted_at timestamp with time zone;
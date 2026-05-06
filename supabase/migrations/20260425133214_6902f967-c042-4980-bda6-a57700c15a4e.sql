-- Add visibility column to categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Add visibility + pricing model + turnaround to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS price_min_usd numeric,
  ADD COLUMN IF NOT EXISTS price_max_usd numeric,
  ADD COLUMN IF NOT EXISTS quote_note text,
  ADD COLUMN IF NOT EXISTS turnaround_time text;

-- Constrain price_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_price_type_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_price_type_check
      CHECK (price_type IN ('fixed','range','custom_quote','free'));
  END IF;
END$$;

-- Backfill existing custom-quote services
UPDATE public.services
SET price_type = 'custom_quote'
WHERE is_custom_quote = true AND price_type = 'fixed';

-- Hide HDI Align category from the public website
UPDATE public.categories
SET is_visible = false
WHERE lower(name) LIKE '%align%';

-- Create bank_settings table
CREATE TABLE public.bank_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_title TEXT NOT NULL,
  account_number TEXT NOT NULL,
  iban TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  branch TEXT,
  swift_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.bank_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active bank settings
CREATE POLICY "Authenticated users can read active bank settings"
  ON public.bank_settings FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins can do anything
CREATE POLICY "Admins can manage bank settings"
  ON public.bank_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial bank details
INSERT INTO public.bank_settings (bank_name, account_title, account_number, iban, currency, branch, swift_code)
VALUES (
  'Abu Dhabi Commercial Bank PJSC',
  'ABDELMAGUID A A M ELMAKHBZY',
  '12812082920001',
  'AE140030012812082920001',
  'AED',
  'AL KARAMAH',
  'ADCBAEAA'
);

-- Add transfer_claimed_at to payments for tracking when client claims bank transfer
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transfer_claimed_at TIMESTAMP WITH TIME ZONE;

-- Add admin_notes to payments for rejection reasons
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add RLS policy for designers to insert case_files on assigned cases
CREATE POLICY "Designers can upload to assigned cases"
  ON public.case_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM cases
    WHERE cases.id = case_files.case_id
    AND cases.assigned_designer_id = auth.uid()
  ));

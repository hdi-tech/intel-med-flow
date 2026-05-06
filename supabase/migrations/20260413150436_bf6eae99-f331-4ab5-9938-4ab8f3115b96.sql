ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS patient_gender text;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS patient_dob date;
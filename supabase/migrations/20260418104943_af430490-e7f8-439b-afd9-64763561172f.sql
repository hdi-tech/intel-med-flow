-- Add default_role column to profiles for "remember my choice" preference
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_role text;

COMMENT ON COLUMN public.profiles.default_role IS
  'Optional preferred role to land on after login when the user has multiple roles. Must match a row in user_roles for this user.';
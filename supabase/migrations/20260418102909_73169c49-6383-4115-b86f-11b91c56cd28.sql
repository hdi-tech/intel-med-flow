INSERT INTO public.user_roles (user_id, role)
SELECT '4b721fa9-0004-4479-b510-330338c76e10'::uuid, 'super_admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = '4b721fa9-0004-4479-b510-330338c76e10'::uuid AND role = 'super_admin'::app_role
);
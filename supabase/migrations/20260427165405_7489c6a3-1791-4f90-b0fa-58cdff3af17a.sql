INSERT INTO public.user_roles (user_id, role)
SELECT p.id, r.role
FROM public.profiles p
CROSS JOIN (VALUES ('client'::app_role), ('account_manager'::app_role)) AS r(role)
WHERE p.email = 'info@hdi-tech.com'
ON CONFLICT (user_id, role) DO NOTHING;
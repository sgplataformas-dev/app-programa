UPDATE auth.users
SET
  encrypted_password = crypt('ActiveSG10@', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  banned_until = NULL,
  updated_at = now()
WHERE lower(email) = 'sarasuporteoficial@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'sarasuporteoficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
DELETE FROM public.user_roles
WHERE role = 'admin'::app_role
  AND user_id = (SELECT id FROM auth.users WHERE lower(email) = 'sarasuporteoficial@gmail.com');

CREATE OR REPLACE FUNCTION public.grant_admin_for_whitelisted_emails()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL
     AND lower(NEW.email) IN (
       'sgequipeacessos@gmail.com',
       'sarasuporte@gmail.com',
       'fernandojardim.r7@gmail.com',
       'axagentes@gmail.com',
       'sawara_alvim@hotmail.com'
     ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

UPDATE public.profiles
SET ativo = false
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = 'sarasuporteoficial@gmail.com');
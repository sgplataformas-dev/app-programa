
-- 1. Move has_role to a private schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Recreate policies referencing has_role to use the private one
-- lesson_comments
DROP POLICY IF EXISTS "delete own or admin" ON public.lesson_comments;
CREATE POLICY "delete own or admin" ON public.lesson_comments
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "update own or admin" ON public.lesson_comments;
CREATE POLICY "update own or admin" ON public.lesson_comments
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- purchases
DROP POLICY IF EXISTS "Admin vê todas as compras" ON public.purchases;
CREATE POLICY "Admin vê todas as compras" ON public.purchases
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- webhook_events
DROP POLICY IF EXISTS "Admin vê eventos de webhook" ON public.webhook_events;
CREATE POLICY "Admin vê eventos de webhook" ON public.webhook_events
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- module_thumbnails
DROP POLICY IF EXISTS "Admins can insert module thumbnails" ON public.module_thumbnails;
CREATE POLICY "Admins can insert module thumbnails" ON public.module_thumbnails
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update module thumbnails" ON public.module_thumbnails;
CREATE POLICY "Admins can update module thumbnails" ON public.module_thumbnails
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete module thumbnails" ON public.module_thumbnails;
CREATE POLICY "Admins can delete module thumbnails" ON public.module_thumbnails
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- storage policies for module-thumbnails
DROP POLICY IF EXISTS "admins insert module thumbs" ON storage.objects;
CREATE POLICY "admins insert module thumbs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((bucket_id = 'module-thumbnails') AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins update module thumbs" ON storage.objects;
CREATE POLICY "admins update module thumbs" ON storage.objects
  FOR UPDATE TO authenticated
  USING ((bucket_id = 'module-thumbnails') AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((bucket_id = 'module-thumbnails') AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins delete module thumbs" ON storage.objects;
CREATE POLICY "admins delete module thumbs" ON storage.objects
  FOR DELETE TO authenticated
  USING ((bucket_id = 'module-thumbnails') AND private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop public.has_role now that nothing references it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2. Lesson comments storage: restrict SELECT to folder owner only.
-- Signed URLs for cross-user viewing are minted server-side by an admin client.
DROP POLICY IF EXISTS "lesson-comments read" ON storage.objects;
CREATE POLICY "lesson-comments read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lesson-comments'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 3. Purchases: explicit restrictive deny of writes from authenticated.
-- Writes happen only via the webhook with service_role.
CREATE POLICY "no insert authenticated" ON public.purchases
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "no update authenticated" ON public.purchases
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "no delete authenticated" ON public.purchases
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

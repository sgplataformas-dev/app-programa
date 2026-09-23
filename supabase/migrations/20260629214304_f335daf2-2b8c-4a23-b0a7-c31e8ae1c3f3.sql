DROP POLICY IF EXISTS "read thumbnails" ON public.module_thumbnails;
CREATE POLICY "read thumbnails" ON public.module_thumbnails
  FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.module_thumbnails FROM anon;
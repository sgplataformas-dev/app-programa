
-- 1) module_thumbnails table: remove broad auth-users write policies (admin policies remain)
DROP POLICY IF EXISTS "auth users can delete thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "auth users can update thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "auth users can upsert thumbnails" ON public.module_thumbnails;

-- 2) storage.objects: remove broad module-thumbnails write policies, replace with admin-only
DROP POLICY IF EXISTS "auth users upload module thumbs" ON storage.objects;
DROP POLICY IF EXISTS "auth users update module thumbs" ON storage.objects;
DROP POLICY IF EXISTS "auth users delete module thumbs" ON storage.objects;
DROP POLICY IF EXISTS "module_thumbnails_insert" ON storage.objects;
DROP POLICY IF EXISTS "module_thumbnails_update" ON storage.objects;
DROP POLICY IF EXISTS "module_thumbnails_delete" ON storage.objects;

CREATE POLICY "admins insert module thumbs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'module-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update module thumbs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'module-thumbnails' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'module-thumbnails' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete module thumbs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'module-thumbnails' AND public.has_role(auth.uid(), 'admin'));

-- 3) points: drop ALL policy, keep SELECT-only for users (writes go via service_role which bypasses RLS)
DROP POLICY IF EXISTS "own points" ON public.points;
-- "Users can view their own points" already exists for SELECT; ensure it covers reads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own points' AND polrelid = 'public.points'::regclass) THEN
    CREATE POLICY "Users can view their own points" ON public.points
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4) realtime.messages: scope subscriptions to known lesson-comments topic prefix
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to lesson-comments topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (realtime.topic() LIKE 'lesson-comments-%');

-- 5) Revoke EXECUTE on email-queue SECURITY DEFINER functions from authenticated/anon (service_role only)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

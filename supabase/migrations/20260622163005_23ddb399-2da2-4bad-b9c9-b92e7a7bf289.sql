
-- 1. module_thumbnails: restringir mutações a admin
DROP POLICY IF EXISTS "Authenticated users can insert module thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "Authenticated users can update module thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "Authenticated users can delete module thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "Admins can insert module thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "Admins can update module thumbnails" ON public.module_thumbnails;
DROP POLICY IF EXISTS "Admins can delete module thumbnails" ON public.module_thumbnails;

CREATE POLICY "Admins can insert module thumbnails"
ON public.module_thumbnails FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update module thumbnails"
ON public.module_thumbnails FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete module thumbnails"
ON public.module_thumbnails FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. points: usuário só lê; gravações via service_role (server functions)
DROP POLICY IF EXISTS "Users can manage their own points" ON public.points;
DROP POLICY IF EXISTS "Users can view their own points" ON public.points;
DROP POLICY IF EXISTS "Users can insert their own points" ON public.points;
DROP POLICY IF EXISTS "Users can update their own points" ON public.points;
DROP POLICY IF EXISTS "Users can delete their own points" ON public.points;

CREATE POLICY "Users can view their own points"
ON public.points FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 3. realtime.messages: exigir autenticação para subscrever
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe to realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (true);

-- 4 + 5. Funções de e-mail: revogar execução pública + fixar search_path
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;

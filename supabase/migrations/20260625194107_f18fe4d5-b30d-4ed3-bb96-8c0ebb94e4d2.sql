
-- 1) module_thumbnails: stop exposing internal admin UUIDs via the public read policy.
--    The app only selects (module_id, url, position_x, position_y); drop column-level
--    SELECT on updated_by for anon and authenticated. service_role keeps full access.
REVOKE SELECT (updated_by) ON public.module_thumbnails FROM anon;
REVOKE SELECT (updated_by) ON public.module_thumbnails FROM authenticated;

-- 2) realtime.messages: drop the broad lesson-comments topic subscription policy.
--    Live comment updates use postgres_changes (replication-based) and don't need
--    realtime.messages access. With no policy, broadcast/presence subscriptions on
--    lesson-comments-* topics are denied for non-service roles.
DROP POLICY IF EXISTS "Authenticated users can subscribe to lesson-comments topics" ON realtime.messages;

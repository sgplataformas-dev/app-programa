ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER TABLE public.webhook_events REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='purchases') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='webhook_events') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_events';
  END IF;
END $$;
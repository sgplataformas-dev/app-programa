CREATE TABLE public.module_thumbnails (
  module_id text PRIMARY KEY,
  url text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_thumbnails TO authenticated;
GRANT SELECT ON public.module_thumbnails TO anon;
GRANT ALL ON public.module_thumbnails TO service_role;

ALTER TABLE public.module_thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read thumbnails" ON public.module_thumbnails
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "auth users can upsert thumbnails" ON public.module_thumbnails
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can update thumbnails" ON public.module_thumbnails
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth users can delete thumbnails" ON public.module_thumbnails
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth users upload module thumbs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'module-thumbnails');

CREATE POLICY "auth users update module thumbs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'module-thumbnails')
  WITH CHECK (bucket_id = 'module-thumbnails');

CREATE POLICY "auth users delete module thumbs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'module-thumbnails');

CREATE POLICY "public read module thumbs" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'module-thumbnails');
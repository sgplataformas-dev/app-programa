
CREATE POLICY "module_thumbnails_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'module-thumbnails');
CREATE POLICY "module_thumbnails_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'module-thumbnails');
CREATE POLICY "module_thumbnails_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'module-thumbnails') WITH CHECK (bucket_id = 'module-thumbnails');
CREATE POLICY "module_thumbnails_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'module-thumbnails');


CREATE POLICY "lesson-comments read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-comments');

CREATE POLICY "lesson-comments insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson-comments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "lesson-comments update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lesson-comments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "lesson-comments delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lesson-comments' AND (storage.foldername(name))[1] = auth.uid()::text);

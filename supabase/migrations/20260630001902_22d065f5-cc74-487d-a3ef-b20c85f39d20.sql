ALTER TABLE public.admin_issue_reports
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE POLICY "admins read issue attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'issue-attachments' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins upload issue attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'issue-attachments' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete issue attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'issue-attachments' AND private.has_role(auth.uid(), 'admin'::app_role));
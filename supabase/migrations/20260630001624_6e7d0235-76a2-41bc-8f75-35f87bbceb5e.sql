CREATE TABLE public.admin_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_email text,
  title text NOT NULL,
  description text NOT NULL,
  area text,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  approved_for_fix boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_issue_reports TO authenticated;
GRANT ALL ON public.admin_issue_reports TO service_role;

ALTER TABLE public.admin_issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read issue reports"
  ON public.admin_issue_reports FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins insert issue reports"
  ON public.admin_issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) AND reporter_id = auth.uid());

CREATE POLICY "admins update issue reports"
  ON public.admin_issue_reports FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete issue reports"
  ON public.admin_issue_reports FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_admin_issue_reports_updated_at
  BEFORE UPDATE ON public.admin_issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_issue_reports;
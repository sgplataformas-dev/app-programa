CREATE TABLE public.flacidez_denylist (
  email text PRIMARY KEY,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flacidez_denylist TO authenticated;
GRANT ALL ON public.flacidez_denylist TO service_role;
ALTER TABLE public.flacidez_denylist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage flacidez denylist" ON public.flacidez_denylist FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
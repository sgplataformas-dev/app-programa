CREATE TABLE public.audio_acks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  declaration text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, DELETE ON public.audio_acks TO authenticated;
GRANT ALL ON public.audio_acks TO service_role;

ALTER TABLE public.audio_acks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own audio acks select" ON public.audio_acks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own audio acks insert" ON public.audio_acks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own audio acks delete" ON public.audio_acks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins view audio acks" ON public.audio_acks FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
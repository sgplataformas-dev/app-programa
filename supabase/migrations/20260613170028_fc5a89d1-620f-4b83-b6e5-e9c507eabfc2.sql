ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS preferencias_alimentares jsonb NOT NULL DEFAULT '{"evitar_atnn":[],"evitar_ari":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz_fase1_completo boolean NOT NULL DEFAULT false;
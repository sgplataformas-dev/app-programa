
ALTER TABLE public.module_thumbnails
  ADD COLUMN IF NOT EXISTS position_x integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS position_y integer NOT NULL DEFAULT 50;

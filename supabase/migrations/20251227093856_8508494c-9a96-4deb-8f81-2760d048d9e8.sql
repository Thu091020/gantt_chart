-- Create per-user view settings table
CREATE TABLE IF NOT EXISTS public.view_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT view_settings_user_key_unique UNIQUE (user_id, key)
);

-- Enable Row Level Security
ALTER TABLE public.view_settings ENABLE ROW LEVEL SECURITY;

-- Policies: users manage their own settings
CREATE POLICY "Users can read their own view settings"
ON public.view_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own view settings"
ON public.view_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own view settings"
ON public.view_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own view settings"
ON public.view_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_view_settings_updated_at ON public.view_settings;
CREATE TRIGGER update_view_settings_updated_at
BEFORE UPDATE ON public.view_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_view_settings_user_key ON public.view_settings(user_id, key);

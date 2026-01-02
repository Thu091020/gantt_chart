-- Add columns to track last resource sync time and user
ALTER TABLE public.projects 
ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN last_sync_by UUID DEFAULT NULL;
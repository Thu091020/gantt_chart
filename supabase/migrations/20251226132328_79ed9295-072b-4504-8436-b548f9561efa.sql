-- Add source field to track where the allocation came from
ALTER TABLE public.allocations 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'gantt' CHECK (source IN ('gantt', 'manual'));
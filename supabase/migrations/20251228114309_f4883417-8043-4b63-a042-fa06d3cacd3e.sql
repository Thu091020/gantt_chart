-- Remove the effort check constraint that limits effort to 0-1
-- Since we now sum efforts from multiple tasks, total effort can exceed 1
ALTER TABLE public.allocations DROP CONSTRAINT IF EXISTS allocations_effort_check;

-- Add a new constraint that only ensures effort is non-negative
ALTER TABLE public.allocations ADD CONSTRAINT allocations_effort_check CHECK (effort >= 0);
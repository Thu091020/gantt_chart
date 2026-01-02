
-- Create project_milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view project milestones"
ON public.project_milestones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create project milestones"
ON public.project_milestones FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update project milestones"
ON public.project_milestones FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete project milestones"
ON public.project_milestones FOR DELETE
TO authenticated
USING (true);

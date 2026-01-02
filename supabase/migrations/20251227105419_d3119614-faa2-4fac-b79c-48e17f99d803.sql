-- Create project_members table to replace projects.members array
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can read project_members" 
ON public.project_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert project_members" 
ON public.project_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_members" 
ON public.project_members FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete project_members" 
ON public.project_members FOR DELETE USING (true);

-- Migrate existing data from projects.members array
INSERT INTO public.project_members (project_id, employee_id)
SELECT p.id, unnest(p.members)
FROM public.projects p
WHERE p.members IS NOT NULL AND array_length(p.members, 1) > 0
ON CONFLICT (project_id, employee_id) DO NOTHING;
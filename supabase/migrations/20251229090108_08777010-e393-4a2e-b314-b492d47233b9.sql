
-- Create task_labels table (similar to task_statuses)
CREATE TABLE public.task_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Task labels are viewable by authenticated users"
ON public.task_labels FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Task labels can be created by authenticated users"
ON public.task_labels FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Task labels can be updated by authenticated users"
ON public.task_labels FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Task labels can be deleted by authenticated users"
ON public.task_labels FOR DELETE
TO authenticated
USING (true);

-- Add label_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN label_id UUID REFERENCES public.task_labels(id) ON DELETE SET NULL;

-- Insert default label (global, no project_id)
INSERT INTO public.task_labels (name, color, sort_order, is_default, project_id)
VALUES ('Default', '#3b82f6', 0, true, NULL);

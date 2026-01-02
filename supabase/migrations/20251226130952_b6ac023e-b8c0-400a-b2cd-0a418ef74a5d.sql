-- Insert default task statuses (global, not project-specific)
INSERT INTO public.task_statuses (name, color, sort_order, is_default, project_id)
VALUES 
  ('ToDo', '#3B82F6', 1, true, NULL),
  ('InProgress', '#F59E0B', 2, true, NULL),
  ('Review', '#FB923C', 3, true, NULL),
  ('Done', '#8B5CF6', 4, true, NULL)
ON CONFLICT DO NOTHING;
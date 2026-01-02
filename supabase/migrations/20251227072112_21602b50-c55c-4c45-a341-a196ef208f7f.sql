-- Drop all public policies on employees
DROP POLICY IF EXISTS "Allow public delete employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public update employees" ON public.employees;

-- Create authenticated-only policies for employees
CREATE POLICY "Authenticated users can read employees" 
  ON public.employees FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert employees" 
  ON public.employees FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees" 
  ON public.employees FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete employees" 
  ON public.employees FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on projects
DROP POLICY IF EXISTS "Allow public delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update projects" ON public.projects;

-- Create authenticated-only policies for projects
CREATE POLICY "Authenticated users can read projects" 
  ON public.projects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert projects" 
  ON public.projects FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" 
  ON public.projects FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete projects" 
  ON public.projects FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on tasks
DROP POLICY IF EXISTS "Allow public delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update tasks" ON public.tasks;

-- Create authenticated-only policies for tasks
CREATE POLICY "Authenticated users can read tasks" 
  ON public.tasks FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert tasks" 
  ON public.tasks FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks" 
  ON public.tasks FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete tasks" 
  ON public.tasks FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on allocations
DROP POLICY IF EXISTS "Allow public delete allocations" ON public.allocations;
DROP POLICY IF EXISTS "Allow public insert allocations" ON public.allocations;
DROP POLICY IF EXISTS "Allow public read allocations" ON public.allocations;
DROP POLICY IF EXISTS "Allow public update allocations" ON public.allocations;

-- Create authenticated-only policies for allocations
CREATE POLICY "Authenticated users can read allocations" 
  ON public.allocations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert allocations" 
  ON public.allocations FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update allocations" 
  ON public.allocations FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete allocations" 
  ON public.allocations FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on task_statuses
DROP POLICY IF EXISTS "Allow public delete task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Allow public insert task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Allow public read task_statuses" ON public.task_statuses;
DROP POLICY IF EXISTS "Allow public update task_statuses" ON public.task_statuses;

-- Create authenticated-only policies for task_statuses
CREATE POLICY "Authenticated users can read task_statuses" 
  ON public.task_statuses FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert task_statuses" 
  ON public.task_statuses FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update task_statuses" 
  ON public.task_statuses FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete task_statuses" 
  ON public.task_statuses FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on holidays
DROP POLICY IF EXISTS "Allow public delete holidays" ON public.holidays;
DROP POLICY IF EXISTS "Allow public insert holidays" ON public.holidays;
DROP POLICY IF EXISTS "Allow public read holidays" ON public.holidays;
DROP POLICY IF EXISTS "Allow public update holidays" ON public.holidays;

-- Create authenticated-only policies for holidays
CREATE POLICY "Authenticated users can read holidays" 
  ON public.holidays FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert holidays" 
  ON public.holidays FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update holidays" 
  ON public.holidays FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete holidays" 
  ON public.holidays FOR DELETE 
  TO authenticated 
  USING (true);

-- Drop all public policies on settings
DROP POLICY IF EXISTS "Allow public insert settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public update settings" ON public.settings;

-- Create authenticated read, admin-only write for settings
CREATE POLICY "Authenticated users can read settings" 
  ON public.settings FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can insert settings" 
  ON public.settings FOR INSERT 
  TO authenticated 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings" 
  ON public.settings FOR UPDATE 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings" 
  ON public.settings FOR DELETE 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add database constraints for input validation
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT profiles_full_name_length CHECK (length(full_name) <= 100);

ALTER TABLE public.employees
  ADD CONSTRAINT employees_name_length CHECK (length(name) <= 100),
  ADD CONSTRAINT employees_code_length CHECK (length(code) <= 50);

ALTER TABLE public.projects
  ADD CONSTRAINT projects_name_length CHECK (length(name) <= 200),
  ADD CONSTRAINT projects_code_length CHECK (length(code) <= 50);

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_name_length CHECK (length(name) <= 500),
  ADD CONSTRAINT tasks_notes_length CHECK (length(notes) <= 10000);
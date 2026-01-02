CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    false
  );
  
  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: is_user_approved(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_approved(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_approved = true
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    project_id uuid NOT NULL,
    date date NOT NULL,
    effort numeric(3,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT allocations_effort_check CHECK (((effort >= (0)::numeric) AND (effort <= (1)::numeric)))
);


--
-- Name: baselines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baselines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    snapshot jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "position" text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    department text,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.holidays (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    name text NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    end_date date
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    members uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pm_id uuid
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    name text NOT NULL,
    color text DEFAULT '#6B7280'::text NOT NULL,
    sort_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    start_date date,
    end_date date,
    duration integer DEFAULT 1,
    progress integer DEFAULT 0,
    predecessors uuid[] DEFAULT '{}'::uuid[],
    assignees uuid[] DEFAULT '{}'::uuid[],
    effort_per_assignee numeric DEFAULT 0,
    sort_order integer DEFAULT 0,
    is_milestone boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'todo'::text,
    CONSTRAINT tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL
);


--
-- Name: allocations allocations_employee_id_project_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_employee_id_project_id_date_key UNIQUE (employee_id, project_id, date);


--
-- Name: allocations allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_pkey PRIMARY KEY (id);


--
-- Name: baselines baselines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baselines
    ADD CONSTRAINT baselines_pkey PRIMARY KEY (id);


--
-- Name: employees employees_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_code_key UNIQUE (code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: projects projects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_code_key UNIQUE (code);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: task_statuses task_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_statuses
    ADD CONSTRAINT task_statuses_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_allocations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_date ON public.allocations USING btree (date);


--
-- Name: idx_allocations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_employee ON public.allocations USING btree (employee_id);


--
-- Name: idx_allocations_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_project ON public.allocations USING btree (project_id);


--
-- Name: idx_baselines_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baselines_created_at ON public.baselines USING btree (created_at DESC);


--
-- Name: idx_baselines_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_baselines_project_id ON public.baselines USING btree (project_id);


--
-- Name: idx_employees_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_is_active ON public.employees USING btree (is_active);


--
-- Name: idx_projects_pm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_pm_id ON public.projects USING btree (pm_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_tasks_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_parent_id ON public.tasks USING btree (parent_id);


--
-- Name: idx_tasks_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: settings update_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: allocations allocations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: allocations allocations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: baselines baselines_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baselines
    ADD CONSTRAINT baselines_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: baselines baselines_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baselines
    ADD CONSTRAINT baselines_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_pm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pm_id_fkey FOREIGN KEY (pm_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: task_statuses task_statuses_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_statuses
    ADD CONSTRAINT task_statuses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admins can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR (user_id = auth.uid())));


--
-- Name: allocations Allow public delete allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete allocations" ON public.allocations FOR DELETE USING (true);


--
-- Name: employees Allow public delete employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete employees" ON public.employees FOR DELETE USING (true);


--
-- Name: holidays Allow public delete holidays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete holidays" ON public.holidays FOR DELETE USING (true);


--
-- Name: projects Allow public delete projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete projects" ON public.projects FOR DELETE USING (true);


--
-- Name: task_statuses Allow public delete task_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete task_statuses" ON public.task_statuses FOR DELETE USING (true);


--
-- Name: tasks Allow public delete tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete tasks" ON public.tasks FOR DELETE USING (true);


--
-- Name: allocations Allow public insert allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert allocations" ON public.allocations FOR INSERT WITH CHECK (true);


--
-- Name: employees Allow public insert employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert employees" ON public.employees FOR INSERT WITH CHECK (true);


--
-- Name: holidays Allow public insert holidays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert holidays" ON public.holidays FOR INSERT WITH CHECK (true);


--
-- Name: projects Allow public insert projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT WITH CHECK (true);


--
-- Name: settings Allow public insert settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert settings" ON public.settings FOR INSERT WITH CHECK (true);


--
-- Name: task_statuses Allow public insert task_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert task_statuses" ON public.task_statuses FOR INSERT WITH CHECK (true);


--
-- Name: tasks Allow public insert tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);


--
-- Name: allocations Allow public read allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read allocations" ON public.allocations FOR SELECT USING (true);


--
-- Name: employees Allow public read employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read employees" ON public.employees FOR SELECT USING (true);


--
-- Name: holidays Allow public read holidays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read holidays" ON public.holidays FOR SELECT USING (true);


--
-- Name: projects Allow public read projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT USING (true);


--
-- Name: settings Allow public read settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);


--
-- Name: task_statuses Allow public read task_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read task_statuses" ON public.task_statuses FOR SELECT USING (true);


--
-- Name: tasks Allow public read tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read tasks" ON public.tasks FOR SELECT USING (true);


--
-- Name: allocations Allow public update allocations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update allocations" ON public.allocations FOR UPDATE USING (true);


--
-- Name: employees Allow public update employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update employees" ON public.employees FOR UPDATE USING (true);


--
-- Name: holidays Allow public update holidays; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update holidays" ON public.holidays FOR UPDATE USING (true);


--
-- Name: projects Allow public update projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE USING (true);


--
-- Name: settings Allow public update settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update settings" ON public.settings FOR UPDATE USING (true);


--
-- Name: task_statuses Allow public update task_statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update task_statuses" ON public.task_statuses FOR UPDATE USING (true);


--
-- Name: tasks Allow public update tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update tasks" ON public.tasks FOR UPDATE USING (true);


--
-- Name: baselines Authenticated users can create baselines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create baselines" ON public.baselines FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: baselines Authenticated users can delete baselines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete baselines" ON public.baselines FOR DELETE USING ((auth.uid() IS NOT NULL));


--
-- Name: baselines Authenticated users can update baselines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update baselines" ON public.baselines FOR UPDATE USING ((auth.uid() IS NOT NULL));


--
-- Name: baselines Authenticated users can view baselines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view baselines" ON public.baselines FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: allocations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

--
-- Name: baselines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.baselines ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: holidays; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: task_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;
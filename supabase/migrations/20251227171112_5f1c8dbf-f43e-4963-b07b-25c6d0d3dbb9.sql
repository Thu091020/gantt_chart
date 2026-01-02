-- Ensure project "last updated" is refreshed when related data changes

-- Backfill updated_by from last_sync_by when possible (last_sync_by currently stores profiles.id)
UPDATE public.projects p
SET updated_by = pr.user_id
FROM public.profiles pr
WHERE p.updated_by IS NULL
  AND p.last_sync_by IS NOT NULL
  AND pr.id = p.last_sync_by;

-- Helper function to touch a project on any related change
CREATE OR REPLACE FUNCTION public.touch_project(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET updated_at = now(),
      updated_by = auth.uid()
  WHERE id = _project_id;
END;
$$;

-- Trigger function for tasks table
CREATE OR REPLACE FUNCTION public.touch_project_from_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.project_id, OLD.project_id);
  IF pid IS NOT NULL THEN
    PERFORM public.touch_project(pid);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_project_tasks ON public.tasks;
CREATE TRIGGER trg_touch_project_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.touch_project_from_tasks();

-- Trigger function for allocations table
CREATE OR REPLACE FUNCTION public.touch_project_from_allocations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.project_id, OLD.project_id);
  IF pid IS NOT NULL THEN
    PERFORM public.touch_project(pid);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_project_allocations ON public.allocations;
CREATE TRIGGER trg_touch_project_allocations
AFTER INSERT OR UPDATE OR DELETE ON public.allocations
FOR EACH ROW
EXECUTE FUNCTION public.touch_project_from_allocations();

-- Optional: touch on project_members changes (membership edits are also "updates")
CREATE OR REPLACE FUNCTION public.touch_project_from_project_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.project_id, OLD.project_id);
  IF pid IS NOT NULL THEN
    PERFORM public.touch_project(pid);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_project_project_members ON public.project_members;
CREATE TRIGGER trg_touch_project_project_members
AFTER INSERT OR UPDATE OR DELETE ON public.project_members
FOR EACH ROW
EXECUTE FUNCTION public.touch_project_from_project_members();
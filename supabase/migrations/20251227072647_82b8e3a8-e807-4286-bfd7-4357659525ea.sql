-- Create function to delete allocations when holiday is added/updated
CREATE OR REPLACE FUNCTION public.handle_holiday_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  holiday_start DATE;
  holiday_end DATE;
  current_date_iter DATE;
BEGIN
  -- Get the date range
  holiday_start := NEW.date;
  holiday_end := COALESCE(NEW.end_date, NEW.date);
  
  -- Delete all allocations within the holiday date range
  DELETE FROM public.allocations 
  WHERE date >= holiday_start AND date <= holiday_end;
  
  RETURN NEW;
END;
$$;

-- Create trigger on holidays table for INSERT and UPDATE
DROP TRIGGER IF EXISTS on_holiday_created ON public.holidays;
CREATE TRIGGER on_holiday_created
  AFTER INSERT ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.handle_holiday_change();

DROP TRIGGER IF EXISTS on_holiday_updated ON public.holidays;
CREATE TRIGGER on_holiday_updated
  AFTER UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.handle_holiday_change();
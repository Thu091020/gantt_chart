import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  employees: number;
  projects: number;
  allocations: number;
  holidays: number;
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      const [employees, projects, allocations, holidays] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('allocations').select('*', { count: 'exact', head: true }),
        supabase.from('holidays').select('*', { count: 'exact', head: true }),
      ]);

      return {
        employees: employees.count || 0,
        projects: projects.count || 0,
        allocations: allocations.count || 0,
        holidays: holidays.count || 0,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });
}

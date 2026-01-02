import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AllocationDateBounds {
  minDate?: string; // yyyy-MM-dd
  maxDate?: string; // yyyy-MM-dd
}

export function useAllocationDateBounds(projectId?: string) {
  return useQuery({
    queryKey: ['allocation_date_bounds', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<AllocationDateBounds> => {
      if (!projectId) return {};

      const [minRes, maxRes] = await Promise.all([
        supabase
          .from('allocations')
          .select('date')
          .eq('project_id', projectId)
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('allocations')
          .select('date')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (minRes.error) throw minRes.error;
      if (maxRes.error) throw maxRes.error;

      return {
        minDate: minRes.data?.date,
        maxDate: maxRes.data?.date,
      };
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

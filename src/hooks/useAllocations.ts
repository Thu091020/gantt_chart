import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Allocation {
  id: string;
  employee_id: string;
  project_id: string;
  date: string;
  effort: number;
  source: 'gantt' | 'manual';
  created_at: string;
}

export interface AllocationQueryParams {
  projectId?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string;   // yyyy-MM-dd
}

export function useAllocations(params?: AllocationQueryParams | string) {
  // Support both old signature (projectId string) and new signature (params object)
  const normalizedParams: AllocationQueryParams = typeof params === 'string' 
    ? { projectId: params } 
    : params || {};
  
  const { projectId, startDate, endDate } = normalizedParams;
  
  return useQuery({
    queryKey: ['allocations', { projectId, startDate, endDate }],
    queryFn: async () => {
      const PAGE_SIZE = 1000; // Supabase default limit
      let allData: Allocation[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('allocations')
          .select('*');
        
        // Filter by project if specified
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        
        // Filter by date range if specified
        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }
        
        // Order by date for consistent results and paginate
        query = query.order('date', { ascending: true }).range(from, from + PAGE_SIZE - 1);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...(data as Allocation[])];
          from += PAGE_SIZE;
          // If we got less than PAGE_SIZE, we've reached the end
          hasMore = data.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      return allData;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useSetAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      projectId, 
      date, 
      effort,
      source = 'manual'
    }: { 
      employeeId: string; 
      projectId: string; 
      date: string; 
      effort: number;
      source?: 'gantt' | 'manual';
    }) => {
      if (effort === 0) {
        // Delete allocation if effort is 0
        const { error } = await supabase
          .from('allocations')
          .delete()
          .eq('employee_id', employeeId)
          .eq('project_id', projectId)
          .eq('date', date);
        
        if (error) throw error;
      } else {
        // Upsert allocation
        const { error } = await supabase
          .from('allocations')
          .upsert(
            { 
              employee_id: employeeId, 
              project_id: projectId, 
              date, 
              effort,
              source
            },
            { 
              onConflict: 'employee_id,project_id,date' 
            }
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all allocations queries (any params)
      queryClient.invalidateQueries({ queryKey: ['allocations'], exact: false });
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật effort');
    }
  });
}

export function useBulkSetAllocations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (allocations: { 
      employeeId: string; 
      projectId: string; 
      date: string; 
      effort: number;
      source?: 'gantt' | 'manual';
    }[]) => {
      if (allocations.length === 0) return;
      
      // Aggregate efforts by (employeeId, projectId, date) - SUM efforts from multiple tasks
      const allocationMap = new Map<string, { employeeId: string; projectId: string; date: string; effort: number; source: 'gantt' | 'manual' }>();
      for (const a of allocations) {
        const key = `${a.employeeId}:${a.projectId}:${a.date}`;
        const existing = allocationMap.get(key);
        if (existing) {
          // Sum the efforts from multiple tasks for the same employee/project/date
          existing.effort += a.effort;
        } else {
          allocationMap.set(key, {
            employeeId: a.employeeId,
            projectId: a.projectId,
            date: a.date,
            effort: a.effort,
            source: a.source || 'gantt'
          });
        }
      }
      const uniqueAllocations = Array.from(allocationMap.values());
      
      const toUpsert = uniqueAllocations.filter(a => a.effort > 0).map(a => ({
        employee_id: a.employeeId,
        project_id: a.projectId,
        date: a.date,
        effort: a.effort,
        source: a.source || 'gantt'
      }));
      
      const toDelete = uniqueAllocations.filter(a => a.effort === 0);
      
      // Bulk upsert
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from('allocations')
          .upsert(toUpsert, { onConflict: 'employee_id,project_id,date' });
        
        if (error) throw error;
      }
      
      // Delete zeros (if any)
      for (const a of toDelete) {
        await supabase
          .from('allocations')
          .delete()
          .eq('employee_id', a.employeeId)
          .eq('project_id', a.projectId)
          .eq('date', a.date);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'], exact: false });
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật effort');
    }
  });
}

export function useDeleteAllocationsForEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employeeId, projectId }: { employeeId: string; projectId: string }) => {
      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('employee_id', employeeId)
        .eq('project_id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'], exact: false });
    }
  });
}

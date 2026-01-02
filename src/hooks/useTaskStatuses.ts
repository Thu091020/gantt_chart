import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskStatus {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export function useTaskStatuses(projectId?: string) {
  return useQuery({
    queryKey: ['task-statuses', projectId],
    queryFn: async () => {
      // Get global statuses (project_id is null) and project-specific statuses
      const { data, error } = await supabase
        .from('task_statuses')
        .select('*')
        .or(`project_id.is.null,project_id.eq.${projectId || '00000000-0000-0000-0000-000000000000'}`)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TaskStatus[];
    },
  });
}

export function useAddTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (status: Omit<TaskStatus, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('task_statuses')
        .insert(status)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskStatus> }) => {
      const { error } = await supabase
        .from('task_statuses')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
  });
}

export function useDeleteTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_statuses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
  });
}

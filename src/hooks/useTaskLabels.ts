import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TaskLabel {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export function useTaskLabels(projectId?: string) {
  return useQuery({
    queryKey: ['task-labels', projectId],
    queryFn: async () => {
      // Get global labels (project_id is null) and project-specific labels
      const { data, error } = await supabase
        .from('task_labels')
        .select('*')
        .or(`project_id.is.null,project_id.eq.${projectId || '00000000-0000-0000-0000-000000000000'}`)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TaskLabel[];
    },
  });
}

export function useAddTaskLabel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (label: Omit<TaskLabel, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('task_labels')
        .insert(label)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
    },
  });
}

export function useUpdateTaskLabel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskLabel> }) => {
      const { error } = await supabase
        .from('task_labels')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
    },
  });
}

export function useDeleteTaskLabel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-labels'] });
    },
  });
}

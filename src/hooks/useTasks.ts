import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  progress: number;
  predecessors: string[];
  assignees: string[];
  effort_per_assignee: number;
  sort_order: number;
  is_milestone: boolean;
  notes: string | null;
  text_style: string | null; // 'bold', 'italic', 'bold-italic' or null
  label_id: string | null; // Reference to task_labels table
  created_at: string;
  updated_at: string;
  // Computed fields for UI
  children?: Task[];
  level?: number;
  isExpanded?: boolean;
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
    staleTime: 1000 * 30, // 30s stale time to reduce refetches
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: {
      project_id: string;
      parent_id?: string | null;
      name: string;
      start_date?: string | null;
      end_date?: string | null;
      duration?: number;
      progress?: number;
      predecessors?: string[];
      assignees?: string[];
      effort_per_assignee?: number;
      sort_order?: number;
      is_milestone?: boolean;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', newTask.project_id] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', newTask.project_id]);
      
      // Optimistically add the new task
      if (previousTasks) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          project_id: newTask.project_id,
          parent_id: newTask.parent_id || null,
          name: newTask.name,
          start_date: newTask.start_date || null,
          end_date: newTask.end_date || null,
          duration: newTask.duration || 1,
          progress: newTask.progress || 0,
          predecessors: newTask.predecessors || [],
          assignees: newTask.assignees || [],
          effort_per_assignee: newTask.effort_per_assignee || 1,
          sort_order: newTask.sort_order || 0,
          is_milestone: newTask.is_milestone || false,
          notes: newTask.notes || null,
          text_style: null,
          label_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        queryClient.setQueryData<Task[]>(
          ['tasks', newTask.project_id],
          [...previousTasks, optimisticTask].sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      
      return { previousTasks };
    },
    onSuccess: (data, variables) => {
      // Replace optimistic task with real one
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
      toast.success('Đã thêm task');
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', variables.project_id], context.previousTasks);
      }
      toast.error('Lỗi khi thêm task');
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: Partial<Task> }) => {
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async ({ id, projectId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks', projectId],
          previousTasks.map(t => t.id === id ? { ...t, ...data } : t)
        );
      }
      
      return { previousTasks };
    },
    onSuccess: (_, variables) => {
      // Don't invalidate immediately - let optimistic update stay
      // Only refetch after a delay to sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      }, 500);
    },
    onError: (_, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', variables.projectId], context.previousTasks);
      }
      toast.error('Lỗi khi cập nhật task');
    }
  });
}

// Silent update - no toast, used for batch operations
export function useUpdateTaskSilent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: Partial<Task> }) => {
      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async ({ id, projectId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks', projectId],
          previousTasks.map(t => t.id === id ? { ...t, ...data } : t)
        );
      }
      
      return { previousTasks };
    },
    onError: (_, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', variables.projectId], context.previousTasks);
      }
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ['tasks', projectId],
          previousTasks.filter(t => t.id !== id)
        );
      }
      
      return { previousTasks };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      toast.success('Đã xóa task');
    },
    onError: (_, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', variables.projectId], context.previousTasks);
      }
      toast.error('Lỗi khi xóa task');
    }
  });
}

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: { id: string; data: Partial<Task> }[] }) => {
      // Use Promise.all for parallel updates
      await Promise.all(
        updates.map(update => 
          supabase
            .from('tasks')
            .update(update.data)
            .eq('id', update.id)
        )
      );
    },
    onMutate: async ({ projectId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);
      
      if (previousTasks) {
        const updatedTasks = previousTasks.map(task => {
          const update = updates.find(u => u.id === task.id);
          return update ? { ...task, ...update.data } : task;
        });
        queryClient.setQueryData<Task[]>(['tasks', projectId], updatedTasks);
      }
      
      return { previousTasks };
    },
    onSuccess: (_, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      }, 300);
    },
    onError: (_, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', variables.projectId], context.previousTasks);
      }
      toast.error('Lỗi khi cập nhật tasks');
    }
  });
}

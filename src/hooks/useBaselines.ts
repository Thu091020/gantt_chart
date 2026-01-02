import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Baseline {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  snapshot: {
    tasks: any[];
    allocations: any[];
  };
  created_by: string | null;
  created_at: string;
}

export function useBaselines(projectId: string) {
  return useQuery({
    queryKey: ['baselines', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baselines')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Baseline[];
    },
    enabled: !!projectId
  });
}

export function useAddBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      name, 
      description, 
      tasks, 
      allocations 
    }: { 
      projectId: string; 
      name: string; 
      description?: string;
      tasks: any[];
      allocations: any[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('baselines')
        .insert({
          project_id: projectId,
          name,
          description: description || null,
          snapshot: { tasks, allocations },
          created_by: user?.id || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['baselines', variables.projectId] });
      toast.success('Đã lưu baseline thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi lưu baseline: ' + error.message);
    }
  });
}

export function useDeleteBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('baselines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['baselines', variables.projectId] });
      toast.success('Đã xóa baseline');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa baseline: ' + error.message);
    }
  });
}

export function useRestoreBaseline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      baselineId, 
      projectId 
    }: { 
      baselineId: string; 
      projectId: string;
    }) => {
      // Get the baseline data
      const { data: baseline, error: fetchError } = await supabase
        .from('baselines')
        .select('*')
        .eq('id', baselineId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const snapshot = baseline.snapshot as { tasks: any[]; allocations: any[] };
      
      // Delete all current tasks for this project
      const { error: deleteTasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteTasksError) throw deleteTasksError;
      
      // Delete all current allocations for this project
      const { error: deleteAllocError } = await supabase
        .from('allocations')
        .delete()
        .eq('project_id', projectId);
      
      if (deleteAllocError) throw deleteAllocError;
      
      // Create ID mapping for tasks (old ID -> new ID)
      const oldToNewIdMap: Record<string, string> = {};
      
      // Restore tasks from snapshot - insert in correct order to handle parent_id references
      if (snapshot.tasks && snapshot.tasks.length > 0) {
        // Build a map of task id -> task for quick lookup
        const taskMap = new Map<string, any>();
        snapshot.tasks.forEach((t: any) => taskMap.set(t.id, t));
        
        // Calculate depth level for each task to ensure proper insertion order
        const getDepth = (task: any, visited = new Set<string>()): number => {
          if (!task.parent_id) return 0;
          if (visited.has(task.id)) return 0; // Prevent infinite loop
          visited.add(task.id);
          const parent = taskMap.get(task.parent_id);
          if (!parent) return 0;
          return 1 + getDepth(parent, visited);
        };
        
        // Sort tasks by depth (parents first), then by sort_order
        const sortedTasks = [...snapshot.tasks].sort((a, b) => {
          const depthA = getDepth(a);
          const depthB = getDepth(b);
          if (depthA !== depthB) return depthA - depthB;
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
        
        // Insert tasks one by one to get new IDs and handle parent references
        for (const task of sortedTasks) {
          const oldId = task.id;
          
          // Map parent_id and predecessors to new IDs
          const newParentId = task.parent_id ? oldToNewIdMap[task.parent_id] || null : null;
          const newPredecessors = (task.predecessors || [])
            .map((predId: string) => oldToNewIdMap[predId])
            .filter(Boolean);
          
          const taskToInsert = {
            project_id: projectId,
            parent_id: newParentId,
            name: task.name,
            start_date: task.start_date,
            end_date: task.end_date,
            duration: task.duration,
            progress: task.progress,
            predecessors: newPredecessors,
            assignees: task.assignees || [],
            effort_per_assignee: task.effort_per_assignee,
            sort_order: task.sort_order,
            is_milestone: task.is_milestone,
            notes: task.notes,
            status: task.status,
            text_style: task.text_style
          };
          
          const { data: insertedTask, error: insertError } = await supabase
            .from('tasks')
            .insert(taskToInsert)
            .select('id')
            .single();
          
          if (insertError) throw insertError;
          
          // Store mapping of old ID to new ID
          if (insertedTask && oldId) {
            oldToNewIdMap[oldId] = insertedTask.id;
          }
        }
      }
      
      // Restore allocations from snapshot
      if (snapshot.allocations && snapshot.allocations.length > 0) {
        const allocsToInsert = snapshot.allocations.map(alloc => ({
          project_id: projectId,
          employee_id: alloc.employee_id,
          date: alloc.date,
          effort: alloc.effort,
          source: alloc.source || 'gantt'
        }));
        
        const { error: insertAllocError } = await supabase
          .from('allocations')
          .insert(allocsToInsert);
        
        if (insertAllocError) throw insertAllocError;
      }
      
      return baseline;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success('Đã khôi phục từ baseline');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi khôi phục: ' + error.message);
    }
  });
}

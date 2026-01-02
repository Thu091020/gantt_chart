import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  date: string;
  color: string;
  description: string | null;
  created_at: string;
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as ProjectMilestone[];
    },
    enabled: !!projectId,
  });
}

export function useAddProjectMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (milestone: Omit<ProjectMilestone, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert(milestone)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', variables.project_id] });
      toast.success('Đã thêm milestone');
    },
    onError: () => {
      toast.error('Lỗi khi thêm milestone');
    }
  });
}

export function useUpdateProjectMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: Partial<ProjectMilestone> }) => {
      const { error } = await supabase
        .from('project_milestones')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', variables.projectId] });
      toast.success('Đã cập nhật milestone');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật milestone');
    }
  });
}

export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', variables.projectId] });
      toast.success('Đã xóa milestone');
    },
    onError: () => {
      toast.error('Lỗi khi xóa milestone');
    }
  });
}

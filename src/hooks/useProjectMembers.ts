import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectMember {
  id: string;
  project_id: string;
  employee_id: string;
  is_active: boolean;
  created_at: string;
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project_members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ProjectMember[];
    },
    enabled: !!projectId
  });
}

// Fetch all project members (for filtering across multiple projects)
export function useAllProjectMembers() {
  return useQuery({
    queryKey: ['project_members', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ProjectMember[];
    }
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, employeeId }: { projectId: string; employeeId: string }) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, employee_id: employeeId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Thành viên đã có trong dự án');
      } else {
        toast.error('Lỗi khi thêm thành viên');
      }
    }
  });
}

export function useAddProjectMembers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, employeeIds }: { projectId: string; employeeIds: string[] }) => {
      const records = employeeIds.map(employeeId => ({
        project_id: projectId,
        employee_id: employeeId
      }));
      
      const { data, error } = await supabase
        .from('project_members')
        .insert(records)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
      toast.success(`Đã thêm ${variables.employeeIds.length} thành viên`);
    },
    onError: () => {
      toast.error('Lỗi khi thêm thành viên');
    }
  });
}

export function useToggleProjectMemberStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, projectId, isActive }: { memberId: string; projectId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('project_members')
        .update({ is_active: isActive })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
      toast.success(variables.isActive ? 'Đã kích hoạt thành viên' : 'Đã tạm dừng thành viên');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  });
}

export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, projectId, employeeId }: { memberId: string; projectId: string; employeeId: string }) => {
      // Delete project member
      const { error: memberError } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);
      
      if (memberError) throw memberError;
      
      // Also delete allocations for this employee in this project
      const { error: allocationError } = await supabase
        .from('allocations')
        .delete()
        .eq('project_id', projectId)
        .eq('employee_id', employeeId);
      
      if (allocationError) throw allocationError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project_members', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success('Đã xóa thành viên khỏi dự án');
    },
    onError: () => {
      toast.error('Lỗi khi xóa thành viên');
    }
  });
}

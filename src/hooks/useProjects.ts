import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  members: string[] | null;
  pm_id: string | null;
  created_at: string;
  last_sync_at: string | null;
  last_sync_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    }
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!id
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: { 
      code: string; 
      name: string; 
      start_date: string; 
      end_date: string; 
      status: string; 
      color: string;
      pm_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Thêm dự án thành công');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Mã dự án đã tồn tại');
      } else {
        toast.error('Lỗi khi thêm dự án');
      }
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Cập nhật dự án thành công');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật dự án');
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success('Đã xóa dự án');
    },
    onError: () => {
      toast.error('Lỗi khi xóa dự án');
    }
  });
}

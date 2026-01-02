import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function getEdgeFunctionErrorMessage(err: any): Promise<string> {
  try {
    // FunctionsHttpError contains the Response in `context`
    const maybeResponse = err?.context;
    if (err?.name === 'FunctionsHttpError' && maybeResponse instanceof Response) {
      const contentType = maybeResponse.headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        const json = await maybeResponse.json().catch(() => null);
        if (json?.error) return String(json.error);
        if (json?.message) return String(json.message);
        return JSON.stringify(json);
      }
      const text = await maybeResponse.text().catch(() => '');
      if (text) return text;
    }
  } catch {
    // ignore parsing errors
  }

  return err?.message ? String(err.message) : 'Đã xảy ra lỗi';
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  roles: string[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      return (profiles || []).map(p => ({
        ...p,
        roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role)
      })) as UserProfile[];
    }
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approved })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(approved ? 'Đã duyệt tài khoản' : 'Đã hủy duyệt tài khoản');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật tài khoản');
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role, add }: { userId: string; role: 'admin' | 'user'; add: boolean }) => {
      if (add) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã cập nhật quyền');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật quyền');
    }
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password, fullName, role }: { email: string; password: string; fullName?: string; role?: 'user' | 'admin' }) => {
      const response = await supabase.functions.invoke('admin-users', {
        body: { action: 'create', email, password, fullName, role }
      });
      
      if (response.error) throw new Error(await getEdgeFunctionErrorMessage(response.error));
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã tạo tài khoản thành công');
    },
    onError: (error: any) => {
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        toast.error('Email đã được đăng ký');
      } else {
        toast.error('Lỗi khi tạo tài khoản: ' + error.message);
      }
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, email, fullName }: { userId: string; email?: string; fullName?: string }) => {
      const response = await supabase.functions.invoke('admin-users', {
        body: { action: 'update', userId, email, fullName }
      });
      
      if (response.error) throw new Error(await getEdgeFunctionErrorMessage(response.error));
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã cập nhật thông tin tài khoản');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi cập nhật: ' + error.message);
    }
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const response = await supabase.functions.invoke('admin-users', {
        body: { action: 'resetPassword', userId, newPassword }
      });
      
      if (response.error) throw new Error(await getEdgeFunctionErrorMessage(response.error));
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đã đặt lại mật khẩu thành công');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi đặt lại mật khẩu: ' + error.message);
    }
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId }
      });
      
      if (response.error) throw new Error(await getEdgeFunctionErrorMessage(response.error));
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã xóa tài khoản');
    },
    onError: (error: any) => {
      toast.error('Lỗi khi xóa tài khoản: ' + error.message);
    }
  });
}
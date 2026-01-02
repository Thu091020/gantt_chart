import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkEmployee {
  code: string;
  name: string;
  position?: string;
  department?: string;
}

export function useBulkAddEmployees() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employees: BulkEmployee[]) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employees.map(e => ({
          code: e.code,
          name: e.name,
          position: e.position || null,
          department: e.department || null
        })))
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`Đã thêm ${data.length} nhân viên từ file CSV`);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Có mã nhân viên bị trùng trong file');
      } else {
        toast.error('Lỗi khi import nhân viên: ' + error.message);
      }
    }
  });
}

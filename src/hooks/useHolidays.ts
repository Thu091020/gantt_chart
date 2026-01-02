import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
  created_at: string;
}

export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as Holiday[];
    }
  });
}

export function useAddHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (holiday: { date: string; end_date?: string; name: string; is_recurring: boolean }) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          date: holiday.date,
          end_date: holiday.end_date || holiday.date,
          name: holiday.name,
          is_recurring: holiday.is_recurring
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Thêm ngày nghỉ thành công');
    },
    onError: () => {
      toast.error('Lỗi khi thêm ngày nghỉ');
    }
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Holiday> }) => {
      const { error } = await supabase
        .from('holidays')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Cập nhật ngày nghỉ thành công');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật ngày nghỉ');
    }
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Đã xóa ngày nghỉ');
    },
    onError: () => {
      toast.error('Lỗi khi xóa ngày nghỉ');
    }
  });
}

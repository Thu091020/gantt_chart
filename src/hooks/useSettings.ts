import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaturdaySchedule {
  enabled: boolean;
  alternating: boolean;
  startWeekWithSaturday: boolean;
  referenceStartDate?: string; // ISO date string for the first working Saturday
}

export interface Settings {
  working_hours_per_day: number;
  working_days_per_week: number;
  saturday_schedule: SaturdaySchedule;
  collaboration_enabled?: boolean;
}

interface SettingRow {
  id: string;
  key: string;
  value: unknown;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settings: Settings = {
        working_hours_per_day: 8,
        working_days_per_week: 5,
        saturday_schedule: {
          enabled: false,
          alternating: false,
          startWeekWithSaturday: true,
          referenceStartDate: undefined
        },
        collaboration_enabled: true // Default to enabled
      };

      (data as SettingRow[])?.forEach((row) => {
        if (row.key === 'working_hours_per_day') {
          settings.working_hours_per_day = Number(row.value);
        } else if (row.key === 'working_days_per_week') {
          settings.working_days_per_week = Number(row.value);
        } else if (row.key === 'saturday_schedule') {
          settings.saturday_schedule = row.value as SaturdaySchedule;
        } else if (row.key === 'collaboration_enabled') {
          settings.collaboration_enabled = row.value as boolean;
        }
      });

      return settings;
    }
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | number | boolean | object }) => {
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value: value as never }, { onConflict: 'key' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Đã lưu cài đặt');
    },
    onError: (error) => {
      console.error('Settings update error:', error);
      toast.error('Lỗi khi lưu cài đặt');
    }
  });
}

// Helper function to check if a Saturday is a working day
export function isSaturdayWorkingDay(date: Date, settings: Settings): boolean {
  if (!settings.saturday_schedule.enabled) {
    return false;
  }

  if (!settings.saturday_schedule.alternating) {
    return true; // All Saturdays are working days
  }

  // Use reference date if set, otherwise use default calculation
  let referenceDate: Date;
  if (settings.saturday_schedule.referenceStartDate) {
    referenceDate = new Date(settings.saturday_schedule.referenceStartDate);
  } else {
    // Fallback to old calculation method
    referenceDate = new Date(2024, 0, 1);
  }
  
  const diffTime = date.getTime() - referenceDate.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));

  // If diffWeeks is even (0, 2, 4...), it's a working Saturday
  // If odd, it's not a working Saturday
  const isEvenWeek = diffWeeks % 2 === 0;
  
  // If using referenceStartDate, the reference date itself should be a working Saturday
  if (settings.saturday_schedule.referenceStartDate) {
    return isEvenWeek;
  }
  
  // Legacy logic for startWeekWithSaturday
  return settings.saturday_schedule.startWeekWithSaturday ? isEvenWeek : !isEvenWeek;
}

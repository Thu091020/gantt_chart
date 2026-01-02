import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface TaskBarLabels {
  showName: boolean;
  showAssignees: boolean;
  showDuration: boolean;
  showDates: boolean;
}

export interface ColumnSettings {
  id: string;
  width: number;
  visible: boolean;
}

export interface ViewSettings {
  effortSummary?: {
    startDate: string;
    endDate: string;
    viewMode?: string;
  };
  projectDetail?: {
    startDate: string;
    viewMode?: string;
    customStartDate?: string;
    customEndDate?: string;
  };
  taskBarLabels?: TaskBarLabels;
  expandedTaskIds?: { [projectId: string]: string[] };
  columnSettings?: ColumnSettings[];
}

const SETTINGS_KEY = 'gantt_view';

export function useViewSettings() {
  return useQuery({
    queryKey: ['user_view_settings'],
    queryFn: async (): Promise<ViewSettings> => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('view_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (error) throw error;
      
      return (data?.value as ViewSettings) || {};
    }
  });
}

export function useSaveViewSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewSettings: ViewSettings) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('view_settings')
        .upsert(
          { 
            user_id: user.id,
            key: SETTINGS_KEY, 
            value: viewSettings as never,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,key' }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_view_settings'] });
    }
  });
}

// Helper hook to auto-save view settings with debounce
export function useAutoSaveViewSettings(
  page: 'effortSummary' | 'projectDetail',
  settings: ViewSettings['effortSummary'] | ViewSettings['projectDetail']
) {
  const { data: currentSettings } = useViewSettings();
  const saveSettings = useSaveViewSettings();

  useEffect(() => {
    if (!settings) return;
    
    const timer = setTimeout(() => {
      const newSettings: ViewSettings = {
        ...currentSettings,
        [page]: settings
      };
      saveSettings.mutate(newSettings);
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timer);
  }, [settings, page]);
}

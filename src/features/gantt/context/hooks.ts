/**
 * Hook adapters for database operations
 * These hooks provide access to database functionality through the adapter pattern
 * 
 * OPTIMIZED: Now using React Query instead of manual state management
 * - No more useState/useEffect/refetchListeners
 * - All data fetching is handled by React Query
 * - Mutations automatically invalidate queries
 */

import {
  useGetTasks,
  useGetTaskLabels,
  useGetTaskStatuses,
} from '../hooks/queries/useTaskQueries';
import { useGetAllocations } from '../hooks/queries/useAllocationQueries';
import {
  useGetViewSettings,
  useGetBaselines,
  useGetProjectMilestones,
} from '../hooks/queries/useSettingQueries';
import { useGetEmployees } from '../hooks/queries/useEmployeeQueries';
import { useGetHolidays } from '../hooks/queries/useHolidayQueries';
import { useGanttDatabase, useGanttServices } from './GanttContext';

/**
 * Get tasks for a project
 * This replaces: useTasks(projectId)
 * Now uses React Query for automatic caching and refetching
 */
export function useTasksAdapter(projectId: string) {
  const { data, isLoading, error } = useGetTasks(projectId);
  return { data: data || [], isLoading, error };
}

/**
 * Get allocations for a project
 * This replaces: useAllocations(projectId)
 */
export function useAllocationsAdapter(projectId: string) {
  const { data, isLoading } = useGetAllocations(projectId);
  return { data: data || [], isLoading };
}

/**
 * Get employees
 * This replaces: useEmployees()
 */
export function useEmployeesAdapter() {
  const { data, isLoading } = useGetEmployees();
  return { data: data || [], isLoading };
}

/**
 * Get task statuses
 * This replaces: useTaskStatuses(projectId)
 */
export function useTaskStatusesAdapter(projectId: string) {
  const { data, isLoading } = useGetTaskStatuses(projectId);
  return { data: data || [], isLoading };
}

/**
 * Get task labels
 * This replaces: useTaskLabels(projectId)
 */
export function useTaskLabelsAdapter(projectId: string) {
  const { data, isLoading } = useGetTaskLabels(projectId);
  return { data: data || [], isLoading };
}

/**
 * Get project milestones
 * This replaces: useProjectMilestones(projectId)
 */
export function useProjectMilestonesAdapter(projectId: string) {
  const { data, isLoading } = useGetProjectMilestones(projectId);
  return { data: data || [], isLoading };
}

/**
 * Get holidays
 * This replaces: useHolidays()
 */
export function useHolidaysAdapter() {
  const { data, isLoading } = useGetHolidays();
  return { data: data || [], isLoading };
}

/**
 * Get baselines for a project
 * This replaces: useBaselines(projectId)
 */
export function useBaselinesAdapter(projectId: string) {
  const { data, isLoading } = useGetBaselines(projectId);
  return { data: data || [], isLoading };
}

/**
 * Get view settings
 * This replaces: useViewSettings()
 */
export function useViewSettingsAdapter() {
  const { data, isLoading } = useGetViewSettings();
  return { data: data || {}, isLoading };
}

/**
 * Get auth info
 * This replaces: useAuth()
 */
export function useAuthAdapter() {
  const db = useGanttDatabase();
  const auth = db.auth || {};
  return {
    user: auth.user || null,
    profile: auth.profile || null,
  };
}

// ==================== Mutation Hooks ====================
// These hooks now use React Query mutations from hooks/mutations/
// They automatically invalidate queries, no need for refetchGanttData

import { useState } from 'react';
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useCreateTaskLabel,
  useUpdateTaskLabel as useUpdateTaskLabelMutation,
  useDeleteTaskLabel as useDeleteTaskLabelMutation,
  useCreateTaskStatus,
  useUpdateTaskStatus as useUpdateTaskStatusMutation,
  useDeleteTaskStatus as useDeleteTaskStatusMutation,
} from '../hooks/mutations/useTaskMutations';
import { useBulkSetAllocations } from '../hooks/mutations/useAllocationMutations';

/**
 * Mutation hooks - Backward compatibility aliases
 * These now use React Query mutations which automatically invalidate queries
 */
export const useAddTask = useCreateTask;
export { useUpdateTask, useDeleteTask, useBulkUpdateTasks };
export { useBulkSetAllocations };
export const useAddTaskStatus = useCreateTaskStatus;
export const useUpdateTaskStatus = useUpdateTaskStatusMutation;
export const useDeleteTaskStatus = useDeleteTaskStatusMutation;
export const useAddTaskLabel = useCreateTaskLabel;
export const useUpdateTaskLabel = useUpdateTaskLabelMutation;
export const useDeleteTaskLabel = useDeleteTaskLabelMutation;

/**
 * Project milestone mutations
 * Note: These still use database adapter directly as they're not yet migrated to React Query mutations
 */
export function useAddProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.addProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      return await fn(data);
    },
    mutate: (data: any, options?: any) =>
      fn(data)
        .then((result) => {
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useUpdateProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.updateProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (idOrData: any, updates?: any) => {
      let id: string;
      let updateData: any;
      
      if (updates !== undefined) {
        id = idOrData;
        updateData = updates;
      } else if (idOrData && typeof idOrData === 'object' && 'id' in idOrData) {
        id = idOrData.id;
        updateData = idOrData.updates || idOrData.data;
      } else {
        id = idOrData;
        updateData = {};
      }
      
      return await fn(id, updateData);
    },
    mutate: (idOrData: any, updatesOrOptions?: any, options?: any) => {
      let id: string;
      let updateData: any;
      let mutationOptions: any;
      
      if (updatesOrOptions && typeof updatesOrOptions === 'object' && !('onSuccess' in updatesOrOptions || 'onError' in updatesOrOptions)) {
        id = idOrData;
        updateData = updatesOrOptions;
        mutationOptions = options;
      } else if (idOrData && typeof idOrData === 'object' && 'id' in idOrData) {
        id = idOrData.id;
        updateData = idOrData.updates || idOrData.data;
        mutationOptions = updatesOrOptions;
      } else {
        id = idOrData;
        updateData = {};
        mutationOptions = updatesOrOptions;
      }
      
      return fn(id, updateData)
        .then((result) => {
          mutationOptions?.onSuccess?.(result);
          return result;
        })
        .catch(mutationOptions?.onError || (() => {}));
    },
  };
}

export function useDeleteProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.deleteProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (idOrData: string | { id: string; projectId?: string }) => {
      // Support both formats: (id) or ({ id, projectId })
      const id = typeof idOrData === 'string' ? idOrData : idOrData.id;
      return await fn(id);
    },
    mutate: (idOrData: string | { id: string; projectId?: string }, options?: any) => {
      const id = typeof idOrData === 'string' ? idOrData : idOrData.id;
      return fn(id)
        .then((result) => {
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {}));
    },
  };
}

/**
 * Baseline mutations
 */
export function useAddBaseline() {
  const db = useGanttDatabase();
  const fn = db.addBaseline || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      return await fn(data);
    },
    mutate: (data: any, options?: any) =>
      fn(data)
        .then((result) => {
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useDeleteBaseline() {
  const db = useGanttDatabase();
  const fn = db.deleteBaseline || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      return await fn(data);
    },
    mutate: (data: any, options?: any) =>
      fn(data)
        .then((result) => {
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useRestoreBaseline() {
  const db = useGanttDatabase();
  const fn = db.restoreBaseline || (() => Promise.reject('Not implemented'));
  const [isPending, setIsPending] = useState(false);
  
  return {
    mutateAsync: async (idOrData: string | { baselineId: string; projectId?: string }) => {
      setIsPending(true);
      try {
        const id = typeof idOrData === 'string' ? idOrData : idOrData.baselineId;
        return await fn(id);
      } finally {
        setIsPending(false);
      }
    },
    mutate: (idOrData: string | { baselineId: string; projectId?: string }, options?: any) => {
      setIsPending(true);
      const id = typeof idOrData === 'string' ? idOrData : idOrData.baselineId;
      return fn(id)
        .then((result) => {
          setIsPending(false);
          options?.onSuccess?.(result);
          return result;
        })
        .catch((error) => {
          setIsPending(false);
          options?.onError?.(error);
          throw error;
        });
    },
    isPending,
  };
}

/**
 * View settings mutation
 */
export function useSaveViewSettings() {
  const services = useGanttServices();
  return {
    mutateAsync: async (settings: any) => {
      await services.settings.saveViewSettings(settings);
    },
    mutate: async (settings: any, options?: any) => {
      try {
        await services.settings.saveViewSettings(settings);
        options?.onSuccess?.();
      } catch (error) {
        options?.onError?.(error);
        throw error;
      }
    },
  };
}

/**
 * Update project
 */
export function useUpdateProject() {
  const db = useGanttDatabase();
  const fn = db.updateProject || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (projectIdOrData: any, updates?: any) => {
      let projectId: string;
      let updateData: any;
      
      if (updates !== undefined) {
        projectId = projectIdOrData;
        updateData = updates;
      } else if (projectIdOrData && typeof projectIdOrData === 'object' && 'projectId' in projectIdOrData) {
        projectId = projectIdOrData.projectId;
        updateData = projectIdOrData.updates || projectIdOrData.data;
      } else {
        projectId = projectIdOrData;
        updateData = {};
      }
      
      return fn(projectId, updateData);
    },
    mutate: (projectIdOrData: any, updatesOrOptions?: any, options?: any) => {
      let projectId: string;
      let updateData: any;
      let mutationOptions: any;
      
      if (updatesOrOptions && typeof updatesOrOptions === 'object' && !('onSuccess' in updatesOrOptions || 'onError' in updatesOrOptions)) {
        projectId = projectIdOrData;
        updateData = updatesOrOptions;
        mutationOptions = options;
      } else if (projectIdOrData && typeof projectIdOrData === 'object' && 'projectId' in projectIdOrData) {
        projectId = projectIdOrData.projectId;
        updateData = projectIdOrData.updates || projectIdOrData.data;
        mutationOptions = updatesOrOptions;
      } else {
        projectId = projectIdOrData;
        updateData = {};
        mutationOptions = updatesOrOptions;
      }
      
      return fn(projectId, updateData).catch(mutationOptions?.onError || (() => {}));
    },
  };
}

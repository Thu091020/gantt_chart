/**
 * Hook adapters for database operations
 * These hooks provide access to database functionality through the adapter pattern
 * Instead of calling @/hooks directly, components should use these hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useGanttDatabase } from './GanttContext';

// Event emitter for refetch triggers
type RefetchListener = () => void;
const refetchListeners: Record<string, RefetchListener[]> = {
  tasks: [],
  allocations: [],
  employees: [],
  statuses: [],
  labels: [],
  milestones: [],
  holidays: [],
  baselines: [],
};

// Function to trigger refetch
export function refetchGanttData(type: keyof typeof refetchListeners) {
  console.log(`[Gantt] Triggering refetch for: ${type}`);
  refetchListeners[type]?.forEach(listener => listener());
}

// Hook to subscribe to refetch events
function useRefetchListener(type: keyof typeof refetchListeners, callback: () => void) {
  useEffect(() => {
    refetchListeners[type].push(callback);
    return () => {
      const index = refetchListeners[type].indexOf(callback);
      if (index > -1) {
        refetchListeners[type].splice(index, 1);
      }
    };
  }, [type, callback]);
}

/**
 * Get tasks for a project
 * This replaces: useTasks(projectId)
 */
export function useTasksAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getTasks) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getTasks(projectId);
      setData(result || []);
      setError(null);
      setIsLoading(false);
      console.log(`[Gantt] Fetched ${result?.length || 0} tasks for project ${projectId}`);
    } catch (err) {
      console.error('[Gantt] Error fetching tasks:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [projectId, db]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to refetch events
  useRefetchListener('tasks', fetchData);

  return { data, isLoading, error };
}

/**
 * Get allocations for a project
 * This replaces: useAllocations(projectId)
 */
export function useAllocationsAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getAllocations) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getAllocations(projectId);
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [projectId, db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('allocations', fetchData);

  return { data, isLoading };
}

/**
 * Get employees
 * This replaces: useEmployees()
 */
export function useEmployeesAdapter() {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getEmployees) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getEmployees();
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('employees', fetchData);

  return { data, isLoading };
}

/**
 * Get task statuses
 * This replaces: useTaskStatuses(projectId)
 */
export function useTaskStatusesAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getTaskStatuses) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getTaskStatuses(projectId);
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [projectId, db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('statuses', fetchData);

  return { data, isLoading };
}

/**
 * Get task labels
 * This replaces: useTaskLabels(projectId)
 */
export function useTaskLabelsAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getTaskLabels) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getTaskLabels(projectId);
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [projectId, db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('labels', fetchData);

  return { data, isLoading };
}

/**
 * Get project milestones
 * This replaces: useProjectMilestones(projectId)
 */
export function useProjectMilestonesAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getProjectMilestones) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getProjectMilestones(projectId);
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [projectId, db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('milestones', fetchData);

  return { data, isLoading };
}

/**
 * Get holidays
 * This replaces: useHolidays()
 */
export function useHolidaysAdapter() {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getHolidays) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getHolidays();
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('holidays', fetchData);

  return { data, isLoading };
}

/**
 * Get baselines for a project
 * This replaces: useBaselines(projectId)
 */
export function useBaselinesAdapter(projectId: string) {
  const db = useGanttDatabase();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!db.getBaselines) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      const result = await db.getBaselines(projectId);
      setData(result || []);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  }, [projectId, db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefetchListener('baselines', fetchData);

  return { data, isLoading };
}

/**
 * Get view settings
 * This replaces: useViewSettings()
 */
export function useViewSettingsAdapter() {
  const db = useGanttDatabase();
  return db.getViewSettings?.() || { data: {}, isLoading: false };
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

// Mutation hooks (these might need actual implementations)

export function useAddTask() {
  const db = useGanttDatabase();
  const fn = db.addTask || (() => Promise.reject('Not implemented'));
  // Return mutation-like object with mutateAsync method
  return {
    mutateAsync: async (data: any) => {
      const result = await fn(data);
      refetchGanttData('tasks'); // Trigger refetch after successful add
      return result;
    },
    mutate: (data: any, options?: any) => 
      fn(data)
        .then((result) => {
          refetchGanttData('tasks');
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useUpdateTask() {
  const db = useGanttDatabase();
  const fn = db.updateTask || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      const result = await fn(data);
      refetchGanttData('tasks'); // Trigger refetch after successful update
      return result;
    },
    mutate: (data: any, options?: any) => 
      fn(data)
        .then((result) => {
          refetchGanttData('tasks');
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useDeleteTask() {
  const db = useGanttDatabase();
  const fn = db.deleteTask || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      const result = await fn(data);
      refetchGanttData('tasks'); // Trigger refetch after successful delete
      return result;
    },
    mutate: (data: any, options?: any) => 
      fn(data)
        .then((result) => {
          refetchGanttData('tasks');
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useBulkUpdateTasks() {
  const db = useGanttDatabase();
  const fn = db.bulkUpdateTasks || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      const result = await fn(data);
      refetchGanttData('tasks'); // Trigger refetch after successful bulk update
      return result;
    },
    mutate: (data: any, options?: any) => 
      fn(data)
        .then((result) => {
          refetchGanttData('tasks');
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useBulkSetAllocations() {
  const db = useGanttDatabase();
  const fn = db.bulkSetAllocations || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: async (data: any) => {
      const result = await fn(data);
      refetchGanttData('allocations'); // Trigger refetch after successful allocation set
      return result;
    },
    mutate: (data: any, options?: any) => 
      fn(data)
        .then((result) => {
          refetchGanttData('allocations');
          options?.onSuccess?.(result);
          return result;
        })
        .catch(options?.onError || (() => {})),
  };
}

export function useAddTaskStatus() {
  const db = useGanttDatabase();
  const fn = db.addTaskStatus || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useUpdateTaskStatus() {
  const db = useGanttDatabase();
  const fn = db.updateTaskStatus || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useDeleteTaskStatus() {
  const db = useGanttDatabase();
  const fn = db.deleteTaskStatus || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useAddTaskLabel() {
  const db = useGanttDatabase();
  const fn = db.addTaskLabel || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useUpdateTaskLabel() {
  const db = useGanttDatabase();
  const fn = db.updateTaskLabel || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useDeleteTaskLabel() {
  const db = useGanttDatabase();
  const fn = db.deleteTaskLabel || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useAddProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.addProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useUpdateProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.updateProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useDeleteProjectMilestone() {
  const db = useGanttDatabase();
  const fn = db.deleteProjectMilestone || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useAddBaseline() {
  const db = useGanttDatabase();
  const fn = db.addBaseline || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useDeleteBaseline() {
  const db = useGanttDatabase();
  const fn = db.deleteBaseline || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useRestoreBaseline() {
  const db = useGanttDatabase();
  const fn = db.restoreBaseline || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useSaveViewSettings() {
  const db = useGanttDatabase();
  const fn = db.saveViewSettings || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

export function useUpdateProject() {
  const db = useGanttDatabase();
  const fn = db.updateProject || (() => Promise.reject('Not implemented'));
  return {
    mutateAsync: fn,
    mutate: (data: any, options?: any) => fn(data).catch(options?.onError || (() => {})),
  };
}

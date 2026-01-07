/**
 * Task Query Hooks
 * React Query hooks for task data fetching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useGanttServices } from '../../context/GanttContext';
import type { Task, TaskLabel, TaskStatus } from '../../types/task.types';

/**
 * Query Keys
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: string) => [...taskKeys.lists(), projectId] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  labels: (projectId?: string) => ['task-labels', projectId] as const,
  statuses: (projectId?: string) => ['task-statuses', projectId] as const,
};

/**
 * Get all tasks for a project
 */
export function useGetTasks(
  projectId: string,
  options?: Omit<UseQueryOptions<Task[], Error>, 'queryKey' | 'queryFn'>
) {
  const services = useGanttServices();
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: () => services.task.getTasks(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
}

/**
 * Get single task by ID
 */
export function useGetTask(
  taskId: string,
  options?: Omit<UseQueryOptions<Task, Error>, 'queryKey' | 'queryFn'>
) {
  const services = useGanttServices();
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => services.task.getTaskById(taskId),
    enabled: !!taskId,
    ...options,
  });
}

/**
 * Get task labels (global + project-specific)
 */
export function useGetTaskLabels(
  projectId?: string,
  options?: Omit<UseQueryOptions<TaskLabel[], Error>, 'queryKey' | 'queryFn'>
) {
  const services = useGanttServices();
  return useQuery({
    queryKey: taskKeys.labels(projectId),
    queryFn: () => services.task.getTaskLabels(projectId),
    staleTime: 1000 * 60 * 5, // 5 minutes (labels don't change often)
    ...options,
  });
}

/**
 * Get task statuses (global + project-specific)
 */
export function useGetTaskStatuses(
  projectId?: string,
  options?: Omit<UseQueryOptions<TaskStatus[], Error>, 'queryKey' | 'queryFn'>
) {
  const services = useGanttServices();
  return useQuery({
    queryKey: taskKeys.statuses(projectId),
    queryFn: () => services.task.getTaskStatuses(projectId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Alias for backward compatibility
 */
export const useTasks = useGetTasks;
export const useTaskLabels = useGetTaskLabels;
export const useTaskStatuses = useGetTaskStatuses;

/**
 * Settings Query Hooks
 * React Query hooks for view settings, baselines, and milestones
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ganttService } from '../../services/factory';
import type { ViewSettings, Baseline, ProjectMilestone } from '../../types/gantt.types';

/**
 * Query Keys
 */
export const settingsKeys = {
  viewSettings: ['view-settings'] as const,
  baselines: (projectId: string) => ['baselines', projectId] as const,
  baseline: (id: string) => ['baseline', id] as const,
  milestones: (projectId: string) => ['project-milestones', projectId] as const,
};

/**
 * Get user view settings
 */
export function useGetViewSettings(
  options?: Omit<UseQueryOptions<ViewSettings, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.viewSettings,
    queryFn: () => ganttService.settings.getViewSettings(),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Get all baselines for a project
 */
export function useGetBaselines(
  projectId: string,
  options?: Omit<UseQueryOptions<Baseline[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.baselines(projectId),
    queryFn: () => ganttService.settings.getBaselines(projectId),
    enabled: !!projectId,
    ...options,
  });
}

/**
 * Get single baseline by ID
 */
export function useGetBaseline(
  baselineId: string,
  options?: Omit<UseQueryOptions<Baseline, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.baseline(baselineId),
    queryFn: () => ganttService.settings.getBaselineById(baselineId),
    enabled: !!baselineId,
    ...options,
  });
}

/**
 * Get project milestones
 */
export function useGetProjectMilestones(
  projectId: string,
  options?: Omit<UseQueryOptions<ProjectMilestone[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: settingsKeys.milestones(projectId),
    queryFn: () => ganttService.settings.getProjectMilestones(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Aliases for backward compatibility
 */
export const useViewSettings = useGetViewSettings;
export const useBaselines = useGetBaselines;
export const useProjectMilestones = useGetProjectMilestones;

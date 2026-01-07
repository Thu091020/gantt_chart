/**
 * Allocation Mutation Hooks
 * React Query hooks for allocation mutations
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGanttServices } from '../../context/GanttContext';
import { allocationKeys } from '../queries/useAllocationQueries';
import type { 
  Allocation,
  CreateAllocationInput,
  UpdateAllocationInput,
  BulkAllocationInput 
} from '../../types/allocation.types';

/**
 * Create allocation
 */
export function useCreateAllocation(
  options?: UseMutationOptions<Allocation, Error, CreateAllocationInput>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (input) => services.allocation.createAllocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
    ...options,
  });
}

/**
 * Update allocation
 */
export function useUpdateAllocation(
  options?: UseMutationOptions<Allocation, Error, { allocationId: string; updates: UpdateAllocationInput }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ allocationId, updates }) => 
      services.allocation.updateAllocation(allocationId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
    ...options,
  });
}

/**
 * Delete allocation
 */
export function useDeleteAllocation(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (allocationId) => services.allocation.deleteAllocation(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
    ...options,
  });
}

/**
 * Set single allocation (upsert)
 * Legacy interface for backward compatibility
 */
export function useSetAllocation(
  options?: UseMutationOptions<Allocation, Error, {
    employeeId: string;
    projectId: string;
    date: string;
    effort: number;
    source?: 'gantt' | 'manual';
  }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ employeeId, projectId, date, effort, source = 'manual' }) => 
      services.allocation.upsertAllocation({
        employee_id: employeeId,
        project_id: projectId,
        date,
        effort,
        source
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật allocation');
    },
    ...options,
  });
}

/**
 * Bulk set allocations
 */
export function useBulkSetAllocations(
  options?: UseMutationOptions<Allocation[], Error, BulkAllocationInput[]>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (allocations) => services.allocation.bulkSetAllocations(allocations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
      toast.success('Đã cập nhật allocations');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật allocations');
    },
    ...options,
  });
}

/**
 * Upsert allocation (create or update)
 */
export function useUpsertAllocation(
  options?: UseMutationOptions<Allocation, Error, CreateAllocationInput>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (input) => services.allocation.upsertAllocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.all });
    },
    ...options,
  });
}

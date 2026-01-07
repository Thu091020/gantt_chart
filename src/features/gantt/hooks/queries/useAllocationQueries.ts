/**
 * Allocation Query Hooks
 * React Query hooks for allocation data fetching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useGanttServices } from '../../context/GanttContext';
import type { Allocation, AllocationQueryParams } from '../../types/allocation.types';

/**
 * Query Keys
 */
export const allocationKeys = {
  all: ['allocations'] as const,
  lists: () => [...allocationKeys.all, 'list'] as const,
  list: (params?: AllocationQueryParams) => [...allocationKeys.lists(), params] as const,
  details: () => [...allocationKeys.all, 'detail'] as const,
  detail: (id: string) => [...allocationKeys.details(), id] as const,
};

/**
 * Get allocations with optional filters
 */
export function useGetAllocations(
  params?: AllocationQueryParams | string, // Support legacy string projectId
  options?: Omit<UseQueryOptions<Allocation[], Error>, 'queryKey' | 'queryFn'>
) {
  // Normalize params (backward compatibility)
  const normalizedParams: AllocationQueryParams = 
    typeof params === 'string' ? { projectId: params } : params || {};
  const services = useGanttServices();

  return useQuery({
    queryKey: allocationKeys.list(normalizedParams),
    queryFn: () => services.allocation.getAllocations(normalizedParams),
    staleTime: 0, // Always fresh
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options,
  });
}

/**
 * Get single allocation by ID
 */
export function useGetAllocation(
  allocationId: string,
  options?: Omit<UseQueryOptions<Allocation, Error>, 'queryKey' | 'queryFn'>
) {
  const services = useGanttServices();
  return useQuery({
    queryKey: allocationKeys.detail(allocationId),
    queryFn: () => services.allocation.getAllocationById(allocationId),
    enabled: !!allocationId,
    ...options,
  });
}

/**
 * Alias for backward compatibility
 */
export const useAllocations = useGetAllocations;

/**
 * Employee Query Hooks
 * React Query hooks for employee data fetching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useGanttDatabase } from '../../context/GanttContext';

/**
 * Query Keys
 */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: () => [...employeeKeys.lists()] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

/**
 * Get all employees
 */
export function useGetEmployees(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  const db = useGanttDatabase();
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: async () => {
      if (!db.getEmployees) return [];
      return await db.getEmployees();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (employees don't change often)
    ...options,
  });
}

/**
 * Alias for backward compatibility
 */
export const useEmployees = useGetEmployees;


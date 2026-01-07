/**
 * Holiday Query Hooks
 * React Query hooks for holiday data fetching
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useGanttDatabase } from '../../context/GanttContext';
import type { Holiday } from '../../utils/dateUtils';

/**
 * Query Keys
 */
export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: () => [...holidayKeys.lists()] as const,
};

/**
 * Get all holidays
 */
export function useGetHolidays(
  options?: Omit<UseQueryOptions<Holiday[], Error>, 'queryKey' | 'queryFn'>
) {
  const db = useGanttDatabase();
  return useQuery({
    queryKey: holidayKeys.list(),
    queryFn: async () => {
      if (!db.getHolidays) return [];
      return await db.getHolidays();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (holidays don't change often)
    ...options,
  });
}

/**
 * Alias for backward compatibility
 */
export const useHolidays = useGetHolidays;


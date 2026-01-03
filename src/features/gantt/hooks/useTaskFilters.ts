import { useMemo, useCallback } from 'react';
import type { Task } from '../types/task.types';

/**
 * Hook quản lý filter tasks
 * Tách từ useGanttCalculations để dễ quản lý
 */
export function useTaskFilters(
  flatTasks: Array<Task & { level: number }>,
  filterAssigneeIds: string[]
) {
  
  /**
   * Filter tasks by assignee
   */
  const filteredFlatTasks = useMemo(() => {
    if (filterAssigneeIds.length === 0) {
      return flatTasks;
    }
    
    return flatTasks.filter(task => {
      if (!task.assignees || task.assignees.length === 0) {
        return false;
      }
      return task.assignees.some(assigneeId => 
        filterAssigneeIds.includes(assigneeId)
      );
    });
  }, [flatTasks, filterAssigneeIds]);

  /**
   * Get all descendant task IDs
   */
  const getDescendantIds = useCallback((parentId: string, tasks: Task[]): string[] => {
    const descendants: string[] = [];
    
    const collect = (pid: string) => {
      tasks.forEach(task => {
        if (task.parent_id === pid) {
          descendants.push(task.id);
          collect(task.id);
        }
      });
    };
    
    collect(parentId);
    return descendants;
  }, []);

  return {
    filteredFlatTasks,
    getDescendantIds,
  };
}

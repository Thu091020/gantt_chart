import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import type { Task } from '../types/task.types';

/**
 * Hook chứa tất cả logic tính toán cho Gantt Chart
 * Extracted từ GanttView.tsx theo nguyên tắc: Components = UI only, Logic = Hooks
 */

interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

interface Settings {
  saturday_schedule?: {
    enabled: boolean;
    alternating?: boolean;
    referenceStartDate?: string;
  };
}

interface UseGanttCalculationsProps {
  tasks: Task[];
  holidays: Holiday[];
  settings: Settings;
  expandedTasks: Set<string>;
  filterAssigneeIds: string[];
}

export function useGanttCalculations({
  tasks,
  holidays,
  settings,
  expandedTasks,
  filterAssigneeIds,
}: UseGanttCalculationsProps) {
  
  // ================== Task ID & WBS Mapping ==================
  
  /**
   * Map task ID to sequential number (1-based)
   */
  const taskIdMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task, idx) => {
      map.set(task.id, idx + 1);
    });
    return map;
  }, [tasks]);

  /**
   * Reverse map: number to task
   */
  const taskByIdNumber = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach((task, idx) => {
      map.set(idx + 1, task);
    });
    return map;
  }, [tasks]);

  /**
   * Calculate WBS (Work Breakdown Structure) numbering
   * Example: 1, 1.1, 1.1.1, 1.2, 2, 2.1
   */
  const wbsMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Build task tree
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];
    
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });
    
    tasks.forEach(task => {
      const currentTask = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(currentTask);
      } else {
        rootTasks.push(currentTask);
      }
    });
    
    // Sort by sort_order
    const sortTasks = (taskList: Task[]) => {
      taskList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      taskList.forEach(task => {
        if (task.children?.length) sortTasks(task.children);
      });
    };
    sortTasks(rootTasks);
    
    // Assign WBS numbers recursively
    const assignWbs = (taskList: Task[], prefix: string) => {
      taskList.forEach((task, index) => {
        const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        map.set(task.id, wbs);
        if (task.children?.length) {
          assignWbs(task.children, wbs);
        }
      });
    };
    assignWbs(rootTasks, '');
    
    return map;
  }, [tasks]);

  // ================== Working Days Calculations ==================
  
  /**
   * Check if a date is a holiday
   */
  const isHoliday = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const monthDay = format(date, 'MM-dd');
    
    return holidays.some(h => {
      if (h.is_recurring) {
        const startMonthDay = h.date.slice(5);
        const endMonthDay = h.end_date ? h.end_date.slice(5) : startMonthDay;
        return monthDay >= startMonthDay && monthDay <= endMonthDay;
      }
      const endDate = h.end_date || h.date;
      return dateStr >= h.date && dateStr <= endDate;
    });
  }, [holidays]);

  /**
   * Check if Saturday is a working day based on company settings
   */
  const checkSaturdayWorkingDay = useCallback((date: Date) => {
    if (!settings?.saturday_schedule?.enabled) return false;
    
    const schedule = settings.saturday_schedule;
    if (!schedule.alternating) return true; // All Saturdays are working days
    
    // Alternating schedule logic
    let referenceDate: Date;
    if (schedule.referenceStartDate) {
      referenceDate = new Date(schedule.referenceStartDate);
    } else {
      referenceDate = new Date('2025-01-04'); // Default reference
    }
    
    const diffInDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7);
    
    return weekNumber % 2 === 0; // Even weeks = working Saturday
  }, [settings]);

  /**
   * Check if date is a non-working day (weekend or holiday)
   */
  const isNonWorkingDay = useCallback((date: Date) => {
    const isSat = date.getDay() === 6;
    const isSun = date.getDay() === 0;
    
    if (isSun) return true;
    if (isSat && !checkSaturdayWorkingDay(date)) return true;
    if (isHoliday(date)) return true;
    
    return false;
  }, [checkSaturdayWorkingDay, isHoliday]);

  /**
   * Count working days between two dates
   */
  const countWorkingDays = useCallback((start: Date, end: Date) => {
    let count = 0;
    let current = new Date(start);
    
    while (current <= end) {
      if (!isNonWorkingDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }, [isNonWorkingDay]);

  /**
   * Add working days to a date
   */
  const addWorkingDays = useCallback((date: Date, days: number) => {
    let current = new Date(date);
    let remaining = days;
    
    while (remaining > 0) {
      current.setDate(current.getDate() + 1);
      if (!isNonWorkingDay(current)) {
        remaining--;
      }
    }
    
    return current;
  }, [isNonWorkingDay]);

  /**
   * Get next working day
   */
  const getNextWorkingDay = useCallback((date: Date) => {
    let next = new Date(date);
    next.setDate(next.getDate() + 1);
    
    while (isNonWorkingDay(next)) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }, [isNonWorkingDay]);

  // ================== Task Tree & Hierarchy ==================
  
  /**
   * Build hierarchical task tree
   */
  const taskTree = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];
    
    // Initialize all tasks with empty children
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });
    
    // Build parent-child relationships
    tasks.forEach(task => {
      const currentTask = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(currentTask);
      } else {
        rootTasks.push(currentTask);
      }
    });
    
    // Sort by sort_order
    const sortTasks = (taskList: Task[]) => {
      taskList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      taskList.forEach(task => {
        if (task.children?.length) sortTasks(task.children);
      });
    };
    sortTasks(rootTasks);
    
    return rootTasks;
  }, [tasks]);

  /**
   * Flatten task tree with level information
   */
  const allFlatTasksWithLevel = useMemo(() => {
    const result: Array<Task & { level: number }> = [];
    
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach(task => {
        result.push({ ...task, level });
        if (task.children?.length) {
          flatten(task.children, level + 1);
        }
      });
    };
    
    flatten(taskTree, 0);
    return result;
  }, [taskTree]);

  /**
   * Flatten only expanded tasks (for display)
   */
  const flatTasks = useMemo(() => {
    const result: Array<Task & { level: number }> = [];
    
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach(task => {
        result.push({ ...task, level });
        
        // Only include children if parent is expanded
        if (task.children?.length && expandedTasks.has(task.id)) {
          flatten(task.children, level + 1);
        }
      });
    };
    
    flatten(taskTree, 0);
    return result;
  }, [taskTree, expandedTasks]);

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

  // ================== Helper Functions ==================
  
  /**
   * Get all descendant task IDs
   */
  const getDescendantIds = useCallback((parentId: string): string[] => {
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
  }, [tasks]);

  return {
    // Mappings
    taskIdMap,
    taskByIdNumber,
    wbsMap,
    
    // Working days
    isHoliday,
    checkSaturdayWorkingDay,
    isNonWorkingDay,
    countWorkingDays,
    addWorkingDays,
    getNextWorkingDay,
    
    // Task hierarchy
    taskTree,
    allFlatTasksWithLevel,
    flatTasks,
    filteredFlatTasks,
    
    // Helpers
    getDescendantIds,
  };
}

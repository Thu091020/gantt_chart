import { useMemo } from 'react';
import type { Task } from '../types/task.types';

/**
 * Hook tính toán task hierarchy và WBS numbering
 * Tách từ useGanttCalculations để dễ quản lý
 */
export function useTaskHierarchy(tasks: Task[], expandedTasks: Set<string>) {
  
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

  return {
    taskIdMap,
    taskByIdNumber,
    wbsMap,
    taskTree,
    allFlatTasksWithLevel,
    flatTasks,
  };
}

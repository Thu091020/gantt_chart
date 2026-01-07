/**
 * Task utility functions for Gantt chart
 * Handles task tree building, WBS mapping, and task processing
 */

import type { Task } from '../types/task.types';

/**
 * Build hierarchical task tree from flat task list
 */
export function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];

  // First pass: create task map
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [], level: 0 });
  });

  // Second pass: build hierarchy
  tasks.forEach((task) => {
    const currentTask = taskMap.get(task.id)!;
    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(currentTask);
      currentTask.level = (parent.level || 0) + 1;
    } else {
      rootTasks.push(currentTask);
    }
  });

  // Sort children by sort_order
  const sortChildren = (taskList: Task[]) => {
    taskList.sort((a, b) => a.sort_order - b.sort_order);
    taskList.forEach((task) => {
      if (task.children && task.children.length > 0) {
        sortChildren(task.children);
      }
    });
  };
  sortChildren(rootTasks);

  return rootTasks;
}

/**
 * Generate WBS (Work Breakdown Structure) mapping
 */
export function generateWBSMap(tasks: Task[]): Map<string, string> {
  const map = new Map<string, string>();

  // Build task tree for WBS calculation
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];

  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  // Build parent-child structure
  tasks.forEach((task) => {
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
    taskList.forEach((task) => {
      if (task.children?.length) sortTasks(task.children);
    });
  };
  sortTasks(rootTasks);

  // Assign WBS numbers
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
}

/**
 * Flatten task tree for display (respects expansion state)
 */
export function flattenTasks(
  taskTree: Task[],
  expandedTasks: Set<string>
): Task[] {
  const result: Task[] = [];
  const flatten = (taskList: Task[], level: number) => {
    taskList.forEach((task) => {
      result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
      if (
        task.children &&
        task.children.length > 0 &&
        expandedTasks.has(task.id)
      ) {
        flatten(task.children, level + 1);
      }
    });
  };
  flatten(taskTree, 0);
  return result;
}

/**
 * Get all tasks with level info (for filtering purposes - ignores expansion state)
 */
export function getAllFlatTasksWithLevel(
  taskTree: Task[],
  expandedTasks: Set<string>
): Task[] {
  const result: Task[] = [];
  const flatten = (taskList: Task[], level: number) => {
    taskList.forEach((task) => {
      result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
      if (task.children && task.children.length > 0) {
        flatten(task.children, level + 1);
      }
    });
  };
  flatten(taskTree, 0);
  return result;
}

/**
 * Filter tasks by assignees
 */
export function filterTasksByAssignees(
  allFlatTasksWithLevel: Task[],
  filterAssigneeIds: string[]
): Task[] {
  if (filterAssigneeIds.length === 0) {
    return allFlatTasksWithLevel;
  }

  const matchingTaskIds = new Set<string>();
  const parentTaskIds = new Set<string>();

  // First pass: find all tasks that have any of the selected assignees
  allFlatTasksWithLevel.forEach((task) => {
    const taskAssignees = task.assignees || [];
    const hasMatchingAssignee = filterAssigneeIds.some((id) =>
      taskAssignees.includes(id)
    );
    if (hasMatchingAssignee) {
      matchingTaskIds.add(task.id);
      // Also include all parent tasks
      let parentId = task.parent_id;
      while (parentId) {
        parentTaskIds.add(parentId);
        const parent = allFlatTasksWithLevel.find((t) => t.id === parentId);
        parentId = parent?.parent_id || null;
      }
    }
  });

  // Return tasks that either match the filter or are parents of matching tasks
  return allFlatTasksWithLevel.filter(
    (task) => matchingTaskIds.has(task.id) || parentTaskIds.has(task.id)
  );
}

/**
 * Get all descendant task IDs recursively
 */
export function getDescendantIds(
  parentId: string,
  tasks: Task[]
): string[] {
  const children = tasks.filter((t) => t.parent_id === parentId);
  const descendants: string[] = [];
  children.forEach((child) => {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, tasks));
  });
  return descendants;
}

/**
 * Create task ID mapping (1-based index)
 */
export function createTaskIdMap(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  tasks.forEach((task, idx) => {
    map.set(task.id, idx + 1);
  });
  return map;
}

/**
 * Create reverse map for looking up task by ID number
 */
export function createTaskByIdNumberMap(tasks: Task[]): Map<number, Task> {
  const map = new Map<number, Task>();
  tasks.forEach((task, idx) => {
    map.set(idx + 1, task);
  });
  return map;
}


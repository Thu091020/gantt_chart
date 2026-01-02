import { Task } from '../types/task.types';

/**
 * Build hierarchical task tree from flat array
 */
export function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];

  // First pass: create task map with children array
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [], level: 0 });
  });

  // Second pass: build hierarchy
  tasks.forEach(task => {
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
    taskList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    taskList.forEach(task => {
      if (task.children && task.children.length > 0) {
        sortChildren(task.children);
      }
    });
  };
  sortChildren(rootTasks);

  return rootTasks;
}

/**
 * Flatten task tree to array (respects expansion state)
 */
export function flattenTaskTree(
  taskTree: Task[],
  expandedTasks: Set<string>
): Task[] {
  const result: Task[] = [];
  
  const flatten = (taskList: Task[], level: number) => {
    taskList.forEach(task => {
      result.push({ 
        ...task, 
        level, 
        isExpanded: expandedTasks.has(task.id) 
      });
      if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
        flatten(task.children, level + 1);
      }
    });
  };
  
  flatten(taskTree, 0);
  return result;
}

/**
 * Get all flat tasks with level (ignores expansion state)
 */
export function getAllFlatTasksWithLevel(taskTree: Task[]): Task[] {
  const result: Task[] = [];
  
  const flatten = (taskList: Task[], level: number) => {
    taskList.forEach(task => {
      result.push({ ...task, level });
      if (task.children && task.children.length > 0) {
        flatten(task.children, level + 1);
      }
    });
  };
  
  flatten(taskTree, 0);
  return result;
}

/**
 * Build WBS (Work Breakdown Structure) mapping
 * Returns map of task ID to WBS string (1, 1.1, 1.1.1, etc.)
 */
export function buildWbsMap(tasks: Task[]): Map<string, string> {
  const map = new Map<string, string>();
  const taskTree = buildTaskTree(tasks);
  
  const assignWbs = (taskList: Task[], prefix: string) => {
    taskList.forEach((task, index) => {
      const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      map.set(task.id, wbs);
      if (task.children?.length) {
        assignWbs(task.children, wbs);
      }
    });
  };
  
  assignWbs(taskTree, '');
  return map;
}

/**
 * Get all descendant IDs of a task
 */
export function getDescendantIds(taskId: string, allTasks: Task[]): string[] {
  const children = allTasks.filter(t => t.parent_id === taskId);
  const descendants: string[] = [];
  
  children.forEach(child => {
    descendants.push(child.id);
    descendants.push(...getDescendantIds(child.id, allTasks));
  });
  
  return descendants;
}

/**
 * Check if task has children
 */
export function hasChildren(taskId: string, allTasks: Task[]): boolean {
  return allTasks.some(t => t.parent_id === taskId);
}

/**
 * Get task siblings (tasks with same parent)
 */
export function getTaskSiblings(task: Task, allTasks: Task[]): Task[] {
  return allTasks
    .filter(t => t.parent_id === task.parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Get task ancestors (parent, grandparent, etc.)
 */
export function getTaskAncestors(task: Task, allTasks: Task[]): Task[] {
  const ancestors: Task[] = [];
  let currentParentId = task.parent_id;
  
  while (currentParentId) {
    const parent = allTasks.find(t => t.id === currentParentId);
    if (parent) {
      ancestors.push(parent);
      currentParentId = parent.parent_id;
    } else {
      break;
    }
  }
  
  return ancestors;
}

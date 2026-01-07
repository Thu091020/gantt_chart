import { useMemo } from 'react';
import { Task } from '../../types/task.types';
import { parseISO } from 'date-fns';

export function useTaskProcessor(
  tasks: Task[],
  expandedTasks: Set<string>,
  filterAssigneeIds: string[]
) {
  // Map Task ID -> Index (cho Gantt Panel)
  const taskIdMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task, idx) => map.set(task.id, idx + 1));
    return map;
  }, [tasks]);

  const taskByIdNumber = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach((task, idx) => map.set(idx + 1, task));
    return map;
  }, [tasks]);

  // Tính Min/Max Date để scale timeline
  const taskDateRange = useMemo(() => {
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    tasks.forEach((task) => {
      if (task.start_date) {
        const start = parseISO(task.start_date);
        if (!minDate || start < minDate) minDate = start;
      }
      if (task.end_date) {
        const end = parseISO(task.end_date);
        if (!maxDate || end > maxDate) maxDate = end;
      }
    });
    return { minDate, maxDate };
  }, [tasks]);

  // Tạo cấu trúc cây và WBS
  const { taskTree, wbsMap } = useMemo(() => {
    const map = new Map<string, string>();
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    tasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [], level: 0 });
    });

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

    const sortChildren = (taskList: Task[]) => {
      taskList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      taskList.forEach((t) => {
        if (t.children?.length) sortChildren(t.children);
      });
    };
    sortChildren(rootTasks);

    const assignWbs = (taskList: Task[], prefix: string) => {
      taskList.forEach((task, index) => {
        const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        map.set(task.id, wbs);
        if (task.children?.length) assignWbs(task.children, wbs);
      });
    };
    assignWbs(rootTasks, '');

    return { taskTree: rootTasks, wbsMap: map };
  }, [tasks]);

  // Flatten cây task để hiển thị (tôn trọng expand/collapse)
  const flatTasks = useMemo(() => {
    const result: Task[] = [];
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach((task) => {
        result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
        if (task.children?.length && expandedTasks.has(task.id)) {
          flatten(task.children, level + 1);
        }
      });
    };
    flatten(taskTree, 0);
    return result;
  }, [taskTree, expandedTasks]);

  // Flatten tất cả để filter (bỏ qua expand/collapse)
  const allFlatTasksWithLevel = useMemo(() => {
    const result: Task[] = [];
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach((task) => {
        result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
        if (task.children?.length) flatten(task.children, level + 1);
      });
    };
    flatten(taskTree, 0);
    return result;
  }, [taskTree, expandedTasks]);

  // Filter logic
  const filteredFlatTasks = useMemo(() => {
    if (filterAssigneeIds.length === 0) return flatTasks;
    
    const matchingTaskIds = new Set<string>();
    const parentTaskIds = new Set<string>();

    allFlatTasksWithLevel.forEach((task) => {
      const hasMatchingAssignee = filterAssigneeIds.some((id) => task.assignees?.includes(id));
      if (hasMatchingAssignee) {
        matchingTaskIds.add(task.id);
        let parentId = task.parent_id;
        while (parentId) {
          parentTaskIds.add(parentId);
          const parent = allFlatTasksWithLevel.find((t) => t.id === parentId);
          parentId = parent?.parent_id || null;
        }
      }
    });

    return allFlatTasksWithLevel.filter(
      (task) => matchingTaskIds.has(task.id) || parentTaskIds.has(task.id)
    );
  }, [flatTasks, allFlatTasksWithLevel, filterAssigneeIds]);

  return { taskIdMap, taskByIdNumber, taskDateRange, wbsMap, taskTree, flatTasks, filteredFlatTasks };
}
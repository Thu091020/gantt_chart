/**
 * useTaskStructure Hook
 * Chứa logic cấu trúc cây (Indent/Outdent) và di chuyển task
 * - handleIndent: Tăng cấp độ task (làm con của task phía trên)
 * - handleOutdent: Giảm cấp độ task (lên cấp cha)
 * - handleMoveUp: Di chuyển task lên trên
 * - handleMoveDown: Di chuyển task xuống dưới
 * - handleInsertAbove: Chèn task mới phía trên
 * - handleInsertBelow: Chèn task mới phía dưới
 * - handleCopyTask: Copy task và tất cả task con
 */

import { useCallback } from 'react';
import { toast } from '../../../components/internal/utils';
import { Task } from '../../../types/task.types';
import { useAddTask, useBulkUpdateTasks } from '../../../context/hooks';

interface UseTaskStructureParams {
  projectId: string;
  tasks: Task[];
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: (ids: Set<string>) => void;
  handleExpandedTasksChange: (ids: Set<string>) => void;
  expandedTasks: Set<string>;
}

export function useTaskStructure({
  projectId,
  tasks,
  selectedTaskIds,
  setSelectedTaskIds,
  handleExpandedTasksChange,
  expandedTasks,
}: UseTaskStructureParams) {
  const addTask = useAddTask();
  const bulkUpdateTasks = useBulkUpdateTasks();

  /**
   * Indent task(s) - Tăng cấp độ task (làm con của task phía trên)
   */
  const handleIndent = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    const selectedTasks = tasks
      .filter((t) => selectedTaskIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    if (selectedTasks.length === 0) return;

    const firstParentId = selectedTasks[0].parent_id;
    if (!selectedTasks.every((t) => t.parent_id === firstParentId)) {
      toast.error('Chỉ có thể indent các task cùng cấp');
      return;
    }

    const siblings = tasks
      .filter((t) => t.parent_id === firstParentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    const firstSelectedIndex = siblings.findIndex(
      (t) => t.id === selectedTasks[0].id
    );
    if (firstSelectedIndex <= 0) {
      toast.error('Không thể indent task đầu tiên');
      return;
    }

    const newParent = siblings[firstSelectedIndex - 1];
    if (selectedTaskIds.has(newParent.id)) {
      toast.error('Không thể indent - task phía trên cũng đang được chọn');
      return;
    }

    const existingChildren = tasks.filter((t) => t.parent_id === newParent.id);
    let newSortOrder =
      existingChildren.length > 0
        ? Math.max(...existingChildren.map((t) => t.sort_order)) + 1
        : 0;

    const updates: { id: string; updates: Partial<Task> }[] = [];
    selectedTasks.forEach((task) => {
      updates.push({
        id: task.id,
        updates: {
          parent_id: newParent.id,
          sort_order: newSortOrder++,
        },
      });
    });

    await bulkUpdateTasks.mutateAsync({ projectId, updates });
    handleExpandedTasksChange(new Set([...expandedTasks, newParent.id]));
    toast.success(`Đã indent ${selectedTasks.length} task`);
  }, [
    selectedTaskIds,
    tasks,
    bulkUpdateTasks,
    projectId,
    expandedTasks,
    handleExpandedTasksChange,
  ]);

  /**
   * Outdent task(s) - Giảm cấp độ task (lên cấp cha)
   */
  const handleOutdent = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    const selectedTasks = tasks
      .filter((t) => selectedTaskIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order);
    if (selectedTasks.length === 0) return;

    const firstParentId = selectedTasks[0].parent_id;
    if (!firstParentId) {
      toast.error('Task đã ở mức cao nhất');
      return;
    }

    if (!selectedTasks.every((t) => t.parent_id === firstParentId)) {
      toast.error('Chỉ có thể outdent các task cùng cấp');
      return;
    }

    const parent = tasks.find((t) => t.id === firstParentId);
    if (!parent) return;

    const newSiblings = tasks.filter((t) => t.parent_id === parent.parent_id);
    const parentSortOrder = parent.sort_order;

    const updates: { id: string; updates: Partial<Task> }[] = [];
    const tasksToShift = newSiblings.filter(
      (t) => t.sort_order > parentSortOrder
    );
    tasksToShift.forEach((t) => {
      updates.push({
        id: t.id,
        updates: { sort_order: t.sort_order + selectedTasks.length },
      });
    });

    selectedTasks.forEach((task, idx) => {
      updates.push({
        id: task.id,
        updates: {
          parent_id: parent.parent_id || null,
          sort_order: parentSortOrder + 1 + idx,
        },
      });
    });

    await bulkUpdateTasks.mutateAsync({ projectId, updates });
    toast.success(`Đã outdent ${selectedTasks.length} task`);
  }, [selectedTaskIds, tasks, bulkUpdateTasks, projectId]);

  /**
   * Move task up - Di chuyển task lên trên
   */
  const handleMoveUp = useCallback(
    async (taskId?: string) => {
      const targetTaskId = taskId || Array.from(selectedTaskIds)[0];
      if (!targetTaskId) return;

      const selectedTask = tasks.find((t) => t.id === targetTaskId);
      if (!selectedTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === selectedTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const currentIndex = siblings.findIndex((t) => t.id === targetTaskId);
      if (currentIndex <= 0) {
        toast.error('Task đã ở vị trí đầu tiên');
        return;
      }

      const prevTask = siblings[currentIndex - 1];
      await bulkUpdateTasks.mutateAsync({
        projectId,
        updates: [
          { id: targetTaskId, updates: { sort_order: prevTask.sort_order } },
          { id: prevTask.id, updates: { sort_order: selectedTask.sort_order } },
        ],
      });

      toast.success('Đã di chuyển task lên');
    },
    [selectedTaskIds, tasks, bulkUpdateTasks, projectId]
  );

  /**
   * Move task down - Di chuyển task xuống dưới
   */
  const handleMoveDown = useCallback(
    async (taskId?: string) => {
      const targetTaskId = taskId || Array.from(selectedTaskIds)[0];
      if (!targetTaskId) return;

      const selectedTask = tasks.find((t) => t.id === targetTaskId);
      if (!selectedTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === selectedTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const currentIndex = siblings.findIndex((t) => t.id === targetTaskId);
      if (currentIndex >= siblings.length - 1) {
        toast.error('Task đã ở vị trí cuối cùng');
        return;
      }

      const nextTask = siblings[currentIndex + 1];
      await bulkUpdateTasks.mutateAsync({
        projectId,
        updates: [
          { id: targetTaskId, updates: { sort_order: nextTask.sort_order } },
          { id: nextTask.id, updates: { sort_order: selectedTask.sort_order } },
        ],
      });

      toast.success('Đã di chuyển task xuống');
    },
    [selectedTaskIds, tasks, bulkUpdateTasks, projectId]
  );

  /**
   * Insert above - Chèn task mới phía trên task được chọn
   */
  const handleInsertAbove = useCallback(
    async (taskId?: string) => {
      const targetTaskId = taskId || Array.from(selectedTaskIds)[0];
      if (!targetTaskId) return;

      const targetTask = tasks.find((t) => t.id === targetTaskId);
      if (!targetTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const targetIndex = siblings.findIndex((t) => t.id === targetTaskId);
      let newSortOrder: number;

      if (targetIndex === 0) {
        newSortOrder = targetTask.sort_order;
      } else {
        const prevTask = siblings[targetIndex - 1];
        newSortOrder = prevTask.sort_order + 1;
      }

      const batchUpdates: { id: string; updates: Partial<Task> }[] = [];
      siblings.forEach((t, idx) => {
        if (idx >= targetIndex) {
          batchUpdates.push({
            id: t.id,
            updates: { sort_order: t.sort_order + 1 },
          });
        }
      });

      if (batchUpdates.length > 0) {
        await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
      }

      const result = await addTask.mutateAsync({
        project_id: projectId,
        name: 'New Task',
        parent_id: targetTask.parent_id,
        sort_order: newSortOrder,
        duration: 1,
        progress: 0,
      } as any);

      setSelectedTaskIds(new Set([result.id]));
    },
    [selectedTaskIds, tasks, addTask, bulkUpdateTasks, projectId, setSelectedTaskIds]
  );

  /**
   * Insert below - Chèn task mới phía dưới task được chọn
   */
  const handleInsertBelow = useCallback(
    async (taskId?: string) => {
      const targetTaskId = taskId || Array.from(selectedTaskIds)[0];
      if (!targetTaskId) return;

      const selectedTask = tasks.find((t) => t.id === targetTaskId);
      if (!selectedTask) return;

      const newSortOrder = selectedTask.sort_order + 1;
      const siblings = tasks
        .filter((t) => t.parent_id === selectedTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const selectedIndex = siblings.findIndex((t) => t.id === targetTaskId);
      const batchUpdates: { id: string; updates: Partial<Task> }[] = [];
      siblings.forEach((t, idx) => {
        if (idx > selectedIndex) {
          batchUpdates.push({
            id: t.id,
            updates: { sort_order: t.sort_order + 1 },
          });
        }
      });

      if (batchUpdates.length > 0) {
        await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
      }

      const result = await addTask.mutateAsync({
        project_id: projectId,
        name: 'New Task',
        parent_id: selectedTask.parent_id,
        sort_order: newSortOrder,
        duration: 1,
        progress: 0,
      } as any);

      setSelectedTaskIds(new Set([result.id]));
    },
    [selectedTaskIds, tasks, addTask, bulkUpdateTasks, projectId, setSelectedTaskIds]
  );

  /**
   * Copy task - Copy task và tất cả task con
   */
  const handleCopyTask = useCallback(
    async (taskId?: string) => {
      const targetTaskId = taskId || Array.from(selectedTaskIds)[0];
      if (!targetTaskId) return;

      const targetTask = tasks.find((t) => t.id === targetTaskId);
      if (!targetTask) return;

      const getAllDescendants = (parentId: string): Task[] => {
        const children = tasks.filter((t) => t.parent_id === parentId);
        const descendants: Task[] = [...children];
        children.forEach((child) => {
          descendants.push(...getAllDescendants(child.id));
        });
        return descendants;
      };

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const targetIndex = siblings.findIndex((t) => t.id === targetTaskId);
      const descendants = getAllDescendants(targetTaskId);
      const totalTasksToCopy = 1 + descendants.length;

      const tasksToShift = siblings.slice(targetIndex + 1);
      if (tasksToShift.length > 0) {
        const batchUpdates = tasksToShift.map((t) => ({
          id: t.id,
          updates: { sort_order: t.sort_order + totalTasksToCopy * 10 },
        }));
        await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
      }

      const idMap = new Map<string, string>();
      const newSortOrder = targetTask.sort_order + 1;

      const copiedTask = await addTask.mutateAsync({
        project_id: projectId,
        parent_id: targetTask.parent_id,
        name: targetTask.name,
        start_date: targetTask.start_date,
        end_date: targetTask.end_date,
        duration: targetTask.duration,
        progress: targetTask.progress,
        predecessors: [],
        assignees: targetTask.assignees,
        effort_per_assignee: targetTask.effort_per_assignee,
        sort_order: newSortOrder,
        is_milestone: targetTask.is_milestone,
        notes: targetTask.notes,
      });

      idMap.set(targetTaskId, copiedTask.id);

      descendants.sort((a, b) => a.sort_order - b.sort_order);
      for (const descendant of descendants) {
        const newParentId = idMap.get(descendant.parent_id!) || copiedTask.id;

        const copiedDescendant = await addTask.mutateAsync({
          project_id: projectId,
          parent_id: newParentId,
          name: descendant.name,
          start_date: descendant.start_date,
          end_date: descendant.end_date,
          duration: descendant.duration,
          progress: descendant.progress,
          predecessors: [],
          assignees: descendant.assignees,
          effort_per_assignee: descendant.effort_per_assignee,
          sort_order: descendant.sort_order,
          is_milestone: descendant.is_milestone,
          notes: descendant.notes,
        });

        idMap.set(descendant.id, copiedDescendant.id);
      }

      setSelectedTaskIds(new Set([copiedTask.id]));

      if (targetTask.parent_id && !expandedTasks.has(targetTask.parent_id)) {
        const next = new Set(expandedTasks);
        next.add(targetTask.parent_id);
        handleExpandedTasksChange(next);
      }

      toast.success('Đã copy task');
    },
    [
      selectedTaskIds,
      tasks,
      addTask,
      bulkUpdateTasks,
      projectId,
      expandedTasks,
      handleExpandedTasksChange,
      setSelectedTaskIds,
    ]
  );

  return {
    handleIndent,
    handleOutdent,
    handleMoveUp,
    handleMoveDown,
    handleInsertAbove,
    handleInsertBelow,
    handleCopyTask,
  };
}


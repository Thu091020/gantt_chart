/**
 * useTaskActions Hook
 * Hook chính để quản lý các hành động với task
 * Sử dụng composition pattern để kết hợp các hook chuyên biệt:
 * - useTaskScheduling: Logic tính toán ngày tháng dây chuyền
 * - useTaskStructure: Logic cấu trúc cây (Indent/Outdent/Move)
 * - useDataIO: Logic Import/Export CSV và Fake Data
 */

import { useCallback, useMemo } from 'react';
import { toast } from '../../components/internal/utils';
import { Task } from '../../types/task.types';
import { 
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useUpdateProject,
  useBulkSetAllocations,
} from '../../context/hooks';
import { parseISO, differenceInDays, format, eachDayOfInterval } from 'date-fns';
import { useTaskScheduling } from './task/useTaskScheduling';
import { useTaskStructure } from './task/useTaskStructure';
import { useDataIO } from './task/useDataIO';
import { useWorkCalendar } from '../useWorkCalendar';

export function useTaskActions(
  projectId: string,
  tasks: Task[],
  selectedTaskIds: Set<string>,
  setSelectedTaskIds: (ids: Set<string>) => void,
  handleExpandedTasksChange: (ids: Set<string>) => void,
  expandedTasks: Set<string>,
  allEmployees: any[] = [],
  user: any = null
) {
  // Mutation hooks
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const bulkUpdateTasks = useBulkUpdateTasks();
  const updateProject = useUpdateProject();
  const bulkSetAllocations = useBulkSetAllocations();

  // Work calendar hook - đóng gói holidays và settings
  const workCalendar = useWorkCalendar();

  // Composition hooks - Chia để trị
  const taskScheduling = useTaskScheduling({
    projectId,
    tasks,
  });

  const taskStructure = useTaskStructure({
    projectId,
    tasks,
    selectedTaskIds,
    setSelectedTaskIds,
    handleExpandedTasksChange,
    expandedTasks,
  });

  const dataIO = useDataIO({
    projectId,
    tasks,
    allEmployees,
  });

  // --- Main Actions ---
  const handleAddTask = useCallback(
    async (parentId?: string | null, afterTaskId?: string | null) => {
    const newTaskName = 'New Task';
    let sortOrder = 0;
    
    if (afterTaskId) {
        const afterTask = tasks.find((t) => t.id === afterTaskId);
        if (afterTask) {
          const siblings = tasks
            .filter((t) => t.parent_id === afterTask.parent_id)
                                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          const afterIndex = siblings.findIndex((t) => t.id === afterTaskId);
            const afterOrder = afterTask.sort_order || 0;
            const nextSibling = siblings[afterIndex + 1];
            const nextOrder = nextSibling ? nextSibling.sort_order || 0 : afterOrder + 1000;
            const newSortOrder = Math.floor((afterOrder + nextOrder) / 2);

             if (newSortOrder === afterOrder || newSortOrder === nextOrder) {
            const updates = siblings.map((t, idx) => ({
              id: t.id,
              updates: { sort_order: (idx + 1) * 1000 },
            }));
                await bulkUpdateTasks.mutateAsync({ projectId, updates });
                sortOrder = (afterIndex + 1) * 1000 + 500;
             } else {
                 sortOrder = newSortOrder;
             }
             parentId = afterTask.parent_id || null;
        }
    } else if (parentId) {
        const childTasks = tasks.filter((t) => t.parent_id === parentId);
        const maxOrder = childTasks.reduce(
          (max, t) => Math.max(max, t.sort_order || 0),
          0
        );
        sortOrder = maxOrder + 1000;
    } else {
        const rootTasks = tasks.filter((t) => !t.parent_id);
        const maxOrder = rootTasks.reduce(
          (max, t) => Math.max(max, t.sort_order || 0),
          0
        );
        sortOrder = maxOrder + 1000;
    }

      const result = await addTask.mutateAsync({
        name: newTaskName,
        project_id: projectId,
        parent_id: parentId,
        sort_order: sortOrder,
      });
    if (result?.id) {
        if (parentId && !expandedTasks.has(parentId)) {
            handleExpandedTasksChange(new Set([...expandedTasks, parentId]));
        }
        setSelectedTaskIds(new Set([result.id]));
    }
    },
    [
      tasks,
      projectId,
      addTask,
      bulkUpdateTasks,
      expandedTasks,
      handleExpandedTasksChange,
      setSelectedTaskIds,
    ]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
    await deleteTask.mutateAsync({ taskId, projectId });
    setSelectedTaskIds(new Set());
    },
    [deleteTask, projectId, setSelectedTaskIds]
  );

  const handleSaveTask = useCallback(
    async (editingTask: Task, taskData: Partial<Task>) => {
      let dateDelta = 0;
      if (
        editingTask.start_date &&
        taskData.start_date &&
        editingTask.start_date !== taskData.start_date
      ) {
        dateDelta = differenceInDays(
          parseISO(taskData.start_date),
          parseISO(editingTask.start_date)
        );
      }

      await updateTask.mutateAsync({
        taskId: editingTask.id,
        updates: taskData,
      });
      
      if (dateDelta !== 0) {
          await taskScheduling.updateChildTasks(editingTask.id, dateDelta);
      }
      
      const updatedTask = { ...editingTask, ...taskData } as Task;
      if (updatedTask.parent_id && taskData.start_date && taskData.end_date) {
          await taskScheduling.updateParentTaskDates(updatedTask);
      }
    },
    [updateTask, projectId, taskScheduling]
  );

  const handleUpdateTaskField = useCallback(
    async (taskId: string, field: string, value: any) => {
      try {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const updateData: Partial<Task> = { [field]: value };
        let dateDelta = 0;
        const oldStartDate = task.start_date;
        const oldEndDate = task.end_date;
        let newEndDateForDependents: string | null = null;

        // Auto-calculate end_date if start_date or duration changes
        if (field === 'start_date' && value && task.duration) {
          const startDateObj = parseISO(value);
          const endDateObj = taskScheduling.addWorkingDaysHelper(startDateObj, task.duration);
          updateData.end_date = format(endDateObj, 'yyyy-MM-dd');
          newEndDateForDependents = updateData.end_date;

          if (oldStartDate) {
            dateDelta = differenceInDays(startDateObj, parseISO(oldStartDate));
          }
        } else if (field === 'duration' && task.start_date) {
          const startDateObj = parseISO(task.start_date);
          const endDateObj = taskScheduling.addWorkingDaysHelper(startDateObj, value);
          updateData.end_date = format(endDateObj, 'yyyy-MM-dd');
          newEndDateForDependents = updateData.end_date;
        } else if (field === 'end_date' && value && task.start_date) {
          const startDateObj = parseISO(task.start_date);
          const endDateObj = parseISO(value);
          updateData.duration = taskScheduling.countWorkingDaysHelper(startDateObj, endDateObj);
          newEndDateForDependents = value;
        }

        // Auto-update start_date based on predecessors
        if (
          field === 'predecessors' &&
          Array.isArray(value) &&
          value.length > 0
        ) {
          let latestEndDate: Date | null = null;
          value.forEach((predId) => {
            const predTask = tasks.find((t) => t.id === predId);
            if (predTask?.end_date) {
              const predEndDate = parseISO(predTask.end_date);
              if (!latestEndDate || predEndDate > latestEndDate) {
                latestEndDate = predEndDate;
              }
            }
          });

          if (latestEndDate) {
            const newStartDate = taskScheduling.getNextWorkingDayHelper(latestEndDate);
            updateData.start_date = format(newStartDate, 'yyyy-MM-dd');

            if (task.duration) {
              const newEndDate = taskScheduling.addWorkingDaysHelper(newStartDate, task.duration);
              updateData.end_date = format(newEndDate, 'yyyy-MM-dd');
              newEndDateForDependents = updateData.end_date;
            }

            if (oldStartDate) {
              dateDelta = differenceInDays(newStartDate, parseISO(oldStartDate));
            }
          }
        }

        await updateTask.mutateAsync({ taskId, updates: updateData });

        if (dateDelta !== 0) {
          await taskScheduling.updateChildTasks(taskId, dateDelta);
        }

        if (newEndDateForDependents && newEndDateForDependents !== oldEndDate) {
          await taskScheduling.updateDependentTasks(taskId, newEndDateForDependents);
        }

        const updatedTask = { ...task, ...updateData } as Task;
        if (
          updatedTask.parent_id &&
          (field === 'start_date' || field === 'end_date' || field === 'duration')
        ) {
          await taskScheduling.updateParentTaskDates(updatedTask);
        }
      } catch (error: any) {
        console.error('[Gantt] Error updating task field:', error);
        toast.error(`Lỗi cập nhật: ${error?.message || 'Vui lòng thử lại'}`);
      }
    },
    [
      tasks,
      updateTask,
      projectId,
      taskScheduling,
    ]
  );

  // Task structure handlers - Sử dụng từ useTaskStructure
  const {
    handleIndent,
    handleOutdent,
    handleMoveUp,
    handleMoveDown,
    handleInsertAbove,
    handleInsertBelow,
    handleCopyTask,
  } = taskStructure;

  // Toggle bold
  const handleToggleBold = useCallback(
    (tasksSource: Task[] = tasks) => {
      if (selectedTaskIds.size === 0) return;
      const selectedTasks = tasksSource.filter((t) => selectedTaskIds.has(t.id));

      const allHaveBold = selectedTasks.every(
        (t) => t.text_style === 'bold' || t.text_style === 'bold-italic'
      );

      const updates = selectedTasks.map((task) => {
        const currentStyle = task.text_style || '';
        const isBold = currentStyle === 'bold' || currentStyle === 'bold-italic';
        const isItalic = currentStyle === 'italic' || currentStyle === 'bold-italic';

        let newStyle: string | null;
        if (allHaveBold) {
          newStyle = isItalic ? 'italic' : null;
        } else {
          newStyle = isItalic ? 'bold-italic' : 'bold';
        }

        return { id: task.id, updates: { text_style: newStyle } };
      });

      bulkUpdateTasks.mutate({ projectId, updates });
    },
    [selectedTaskIds, tasks, bulkUpdateTasks, projectId]
  );

  // Toggle italic
  const handleToggleItalic = useCallback(
    (tasksSource: Task[] = tasks) => {
      if (selectedTaskIds.size === 0) return;
      const selectedTasks = tasksSource.filter((t) => selectedTaskIds.has(t.id));

      const allHaveItalic = selectedTasks.every(
        (t) => t.text_style === 'italic' || t.text_style === 'bold-italic'
      );

      const updates = selectedTasks.map((task) => {
        const currentStyle = task.text_style || '';
        const isBold = currentStyle === 'bold' || currentStyle === 'bold-italic';
        const isItalic = currentStyle === 'italic' || currentStyle === 'bold-italic';

        let newStyle: string | null;
        if (allHaveItalic) {
          newStyle = isBold ? 'bold' : null;
        } else {
          newStyle = isBold ? 'bold-italic' : 'italic';
        }

        return { id: task.id, updates: { text_style: newStyle } };
      });

      bulkUpdateTasks.mutate({ projectId, updates });
    },
    [selectedTaskIds, tasks, bulkUpdateTasks, projectId]
  );

  // Sync allocations
  const handleSyncAllocations = useCallback(
    async (syncStartDate?: Date, syncEndDate?: Date) => {
      const allocationsToSet: {
        employeeId: string;
        projectId: string;
        date: string;
        effort: number;
        source: 'gantt' | 'manual';
      }[] = [];

      const filterStart = syncStartDate ? format(syncStartDate, 'yyyy-MM-dd') : null;
      const filterEnd = syncEndDate ? format(syncEndDate, 'yyyy-MM-dd') : null;

      tasks.forEach((task) => {
        if (!task.start_date || !task.end_date || !task.assignees?.length) return;
        if (task.effort_per_assignee <= 0) return;

        if (filterStart && task.end_date < filterStart) return;
        if (filterEnd && task.start_date > filterEnd) return;

        const taskStartDate = parseISO(task.start_date);
        const taskEndDate = parseISO(task.end_date);

        const actualStart =
          filterStart && filterStart > task.start_date
            ? parseISO(filterStart)
            : taskStartDate;
        const actualEnd =
          filterEnd && filterEnd < task.end_date ? parseISO(filterEnd) : taskEndDate;

        const days = eachDayOfInterval({
          start: actualStart,
          end: actualEnd,
        });

        task.assignees.forEach((assigneeId) => {
          days.forEach((day) => {
            if (workCalendar.isNonWorkingDay(day)) return;

            allocationsToSet.push({
              employeeId: assigneeId,
              projectId,
              date: format(day, 'yyyy-MM-dd'),
              effort: task.effort_per_assignee,
              source: 'gantt' as const,
            });
          });
        });
      });

      try {
        // Note: Deletion of old allocations should be handled by bulkSetAllocations
        // or we need to pass supabase client as parameter
        // For now, we'll just set new allocations
        if (allocationsToSet.length > 0) {
          await bulkSetAllocations.mutateAsync(allocationsToSet);
        }

        await updateProject.mutateAsync({
          id: projectId,
          data: {
            last_sync_at: new Date().toISOString(),
            last_sync_by: user?.id || null,
          },
        });

        toast.success(`Đã đồng bộ ${allocationsToSet.length} allocation`);
      } catch (error) {
        console.error('Sync error:', error);
        toast.error('Lỗi khi đồng bộ nguồn lực');
      }
    },
    [tasks, projectId, bulkSetAllocations, workCalendar, updateProject, user]
  );

  // Data IO handlers - Sử dụng từ useDataIO
  const {
    handleExportCSV,
    handleImportCSV,
    processCSVImport,
    handleGenerateFakeData,
  } = dataIO;

  // Check if can copy tasks
  const canCopyTasks = useMemo(() => {
    if (selectedTaskIds.size === 0) return false;
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return false;
    const firstParentId = selectedTasks[0].parent_id;
    return selectedTasks.every((t) => t.parent_id === firstParentId);
  }, [selectedTaskIds, tasks]);

  // Check if all selected tasks are at the same level
  const areSelectedTasksSameLevel = useMemo(() => {
    if (selectedTaskIds.size <= 1) return true;
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return false;
    const firstParentId = selectedTasks[0].parent_id;
    return selectedTasks.every((t) => t.parent_id === firstParentId);
  }, [selectedTaskIds, tasks]);

  return {
    // Mutations
    addTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    updateProject,
    bulkSetAllocations,
    // Main handlers
    handleAddTask,
    handleDeleteTask,
    handleSaveTask,
    handleUpdateTaskField,
    // Task manipulation
    handleIndent,
    handleOutdent,
    handleMoveUp,
    handleMoveDown,
    handleInsertAbove,
    handleInsertBelow,
    handleCopyTask,
    // Style handlers
    handleToggleBold,
    handleToggleItalic,
    // Import/Export
    handleSyncAllocations,
    handleExportCSV,
    handleImportCSV,
    processCSVImport,
    handleGenerateFakeData,
    // Helpers - Từ useTaskScheduling
    updateChildTasks: taskScheduling.updateChildTasks,
    updateParentTaskDates: taskScheduling.updateParentTaskDates,
    updateDependentTasks: taskScheduling.updateDependentTasks,
    // Computed
    canCopyTasks,
    areSelectedTasksSameLevel,
  };
}

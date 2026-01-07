/**
 * useTaskScheduling Hook
 * Chứa logic tính toán ngày tháng dây chuyền (Cascade updates)
 * - updateChildTasks: Cập nhật ngày tháng cho tất cả task con
 * - updateParentTaskDates: Cập nhật ngày tháng cho task cha
 * - updateDependentTasks: Cập nhật ngày tháng cho các task phụ thuộc
 */

import { useCallback } from 'react';
import { parseISO, addDays, differenceInDays, format } from 'date-fns';
import { Task } from '../../../types/task.types';
import { useUpdateTask } from '../../../context/hooks';
import { useWorkCalendar } from '../../useWorkCalendar';

interface UseTaskSchedulingParams {
  projectId: string;
  tasks: Task[];
}

export function useTaskScheduling({
  projectId,
  tasks,
}: UseTaskSchedulingParams) {
  const updateTask = useUpdateTask();
  const workCalendar = useWorkCalendar();

  // Use work calendar functions (already curried with holidays and settings)
  const countWorkingDaysHelper = workCalendar.countWorkingDays;
  const addWorkingDaysHelper = workCalendar.addWorkingDays;
  const getNextWorkingDayHelper = workCalendar.getNextWorkingDay;

  // Helper: collect child updates recursively
  const collectChildUpdates = useCallback(
    (parentId: string, dateDelta: number, tasksList: Task[]) => {
      const childTasks = tasksList.filter((t) => t.parent_id === parentId);
      const updates: { id: string; updates: Partial<Task> }[] = [];
      for (const child of childTasks) {
        if (!child.start_date || !child.end_date) continue;
        const newChildStart = addDays(parseISO(child.start_date), dateDelta);
        const newChildEnd = addDays(parseISO(child.end_date), dateDelta);
        updates.push({
          id: child.id,
          updates: {
            start_date: format(newChildStart, 'yyyy-MM-dd'),
            end_date: format(newChildEnd, 'yyyy-MM-dd'),
          },
        });
        updates.push(...collectChildUpdates(child.id, dateDelta, tasksList));
      }
      return updates;
    },
    []
  );

  /**
   * Cập nhật ngày tháng cho tất cả task con khi task cha thay đổi
   */
  const updateChildTasks = useCallback(
    async (parentId: string, dateDelta: number) => {
      const allUpdates = collectChildUpdates(parentId, dateDelta, tasks);
      for (const update of allUpdates) {
        await updateTask.mutateAsync({
          taskId: update.id,
          updates: update.updates,
        });
      }
    },
    [tasks, updateTask, projectId, collectChildUpdates]
  );

  /**
   * Cập nhật ngày tháng cho task cha dựa trên task con
   * Tự động điều chỉnh start_date và end_date của parent để bao phủ tất cả children
   */
  const updateParentTaskDates = useCallback(
    async (childTask: Task) => {
      if (!childTask.parent_id || !childTask.start_date || !childTask.end_date)
        return;
      const parentTask = tasks.find((t) => t.id === childTask.parent_id);
      if (!parentTask) return;

      const updateData: Partial<Task> = {};
      let needsUpdate = false;

      if (
        childTask.start_date &&
        (!parentTask.start_date ||
          parseISO(childTask.start_date) < parseISO(parentTask.start_date))
      ) {
        updateData.start_date = childTask.start_date;
        needsUpdate = true;
      }
      if (
        childTask.end_date &&
        (!parentTask.end_date ||
          parseISO(childTask.end_date) > parseISO(parentTask.end_date))
      ) {
        updateData.end_date = childTask.end_date;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const newStart = updateData.start_date
          ? parseISO(updateData.start_date)
          : parseISO(parentTask.start_date!);
        const newEnd = updateData.end_date
          ? parseISO(updateData.end_date)
          : parseISO(parentTask.end_date!);
        updateData.duration = countWorkingDaysHelper(newStart, newEnd);
        await updateTask.mutateAsync({
          taskId: parentTask.id,
          updates: updateData,
        });
        await updateParentTaskDates({ ...parentTask, ...updateData } as Task);
      }
    },
    [tasks, updateTask, projectId, countWorkingDaysHelper]
  );

  /**
   * Cập nhật ngày tháng cho các task phụ thuộc (dependencies)
   * Khi một task thay đổi end_date, các task phụ thuộc vào nó cũng cần được cập nhật
   */
  const updateDependentTasks = useCallback(
    async (changedTaskId: string, newEndDate: string) => {
      const dependentTasks = tasks.filter((t) =>
        t.predecessors?.includes(changedTaskId)
      );
      if (dependentTasks.length === 0) return;

      const newEndDateObj = parseISO(newEndDate);

      for (const depTask of dependentTasks) {
        let latestPredEndDate = newEndDateObj;

        if (depTask.predecessors && depTask.predecessors.length > 0) {
          for (const predId of depTask.predecessors) {
            if (predId === changedTaskId) {
              if (newEndDateObj > latestPredEndDate) {
                latestPredEndDate = newEndDateObj;
              }
            } else {
              const predTask = tasks.find((t) => t.id === predId);
              if (predTask?.end_date) {
                const predEndDate = parseISO(predTask.end_date);
                if (predEndDate > latestPredEndDate) {
                  latestPredEndDate = predEndDate;
                }
              }
            }
          }
        }

        const newStartDate = getNextWorkingDayHelper(latestPredEndDate);
        const newStartDateStr = format(newStartDate, 'yyyy-MM-dd');
        const duration = depTask.duration || 1;
        const newDepEndDate = addWorkingDaysHelper(newStartDate, duration);
        const newDepEndDateStr = format(newDepEndDate, 'yyyy-MM-dd');

        if (
          depTask.start_date !== newStartDateStr ||
          depTask.end_date !== newDepEndDateStr
        ) {
          await updateTask.mutateAsync({
            taskId: depTask.id,
            updates: {
              start_date: newStartDateStr,
              end_date: newDepEndDateStr,
            },
          });

          if (depTask.start_date) {
            const dateDelta = differenceInDays(
              newStartDate,
              parseISO(depTask.start_date)
            );
            if (dateDelta !== 0) {
              await updateChildTasks(depTask.id, dateDelta);
            }
          }

          await updateDependentTasks(depTask.id, newDepEndDateStr);
        }
      }
    },
    [
      tasks,
      updateTask,
      projectId,
      updateChildTasks,
      getNextWorkingDayHelper,
      addWorkingDaysHelper,
    ]
  );

  return {
    updateChildTasks,
    updateParentTaskDates,
    updateDependentTasks,
    // Expose helpers for use in other hooks
    countWorkingDaysHelper,
    addWorkingDaysHelper,
    getNextWorkingDayHelper,
  };
}


/**
 * Task Mutation Hooks
 * React Query hooks for task mutations (create, update, delete)
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGanttServices } from '../../context/GanttContext';
import { taskKeys } from '../queries/useTaskQueries';
import type { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  BulkUpdateTaskInput,
  TaskLabel,
  TaskStatus 
} from '../../types/task.types';

/**
 * Create a new task
 */
export function useCreateTask(
  options?: UseMutationOptions<Task, Error, CreateTaskInput>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => services.task.createTask(input),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list(newTask.project_id) });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list(newTask.project_id));
      
      // Optimistically update
      if (previousTasks) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          ...newTask,
          parent_id: newTask.parent_id || null,
          start_date: newTask.start_date || null,
          end_date: newTask.end_date || null,
          duration: newTask.duration || 1,
          progress: newTask.progress || 0,
          predecessors: newTask.predecessors || [],
          assignees: newTask.assignees || [],
          effort_per_assignee: newTask.effort_per_assignee || 1,
          sort_order: newTask.sort_order || previousTasks.length,
          is_milestone: newTask.is_milestone || false,
          notes: newTask.notes || null,
          text_style: newTask.text_style || null,
          label_id: newTask.label_id || null,
          status_id: newTask.status_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        queryClient.setQueryData<Task[]>(
          taskKeys.list(newTask.project_id),
          [...previousTasks, optimisticTask]
        );
      }
      
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previousTasks' in context) {
        const typedContext = context as { previousTasks?: Task[] };
        if (typedContext.previousTasks) {
          queryClient.setQueryData(
            taskKeys.list(newTask.project_id),
            typedContext.previousTasks
          );
        }
      }
      toast.error('Lỗi khi tạo task');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(data.project_id) });
      toast.success('Đã tạo task thành công');
    },
    ...options,
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask(
  options?: UseMutationOptions<Task, Error, { taskId: string; updates: UpdateTaskInput }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ taskId, updates }) => services.task.updateTask(taskId, updates),
    onSuccess: (data) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: taskKeys.list(data.project_id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
    },
    ...options,
  });
}

/**
 * Delete a task
 */
export function useDeleteTask(
  options?: UseMutationOptions<void, Error, { taskId: string; projectId: string }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ taskId }) => services.task.deleteTask(taskId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(variables.projectId) });
      toast.success('Đã xóa task');
    },
    onError: () => {
      toast.error('Lỗi khi xóa task');
    },
    ...options,
  });
}

/**
 * Bulk update tasks
 */
export function useBulkUpdateTasks(
  options?: UseMutationOptions<Task[], Error, { projectId: string; updates: BulkUpdateTaskInput[] }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ updates }) => services.task.bulkUpdateTasks(updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(variables.projectId) });
      toast.success('Đã cập nhật tasks');
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật tasks');
    },
    ...options,
  });
}

/**
 * Create task label
 */
export function useCreateTaskLabel(
  options?: UseMutationOptions<TaskLabel, Error, Omit<TaskLabel, 'id' | 'created_at'>>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (label) => services.task.createTaskLabel(label),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels(variables.project_id || undefined) });
      toast.success('Đã thêm label');
    },
    onError: () => {
      toast.error('Lỗi khi thêm label');
    },
    ...options,
  });
}

/**
 * Update task label
 */
export function useUpdateTaskLabel(
  options?: UseMutationOptions<TaskLabel, Error, { labelId: string; updates: Partial<TaskLabel> }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ labelId, updates }) => services.task.updateTaskLabel(labelId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels(data.project_id || undefined) });
      toast.success('Đã cập nhật label');
    },
    ...options,
  });
}

/**
 * Delete task label
 */
export function useDeleteTaskLabel(
  options?: UseMutationOptions<void, Error, { labelId: string; projectId?: string }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ labelId }) => services.task.deleteTaskLabel(labelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.labels(variables.projectId) });
      toast.success('Đã xóa label');
    },
    ...options,
  });
}

/**
 * Create task status
 */
export function useCreateTaskStatus(
  options?: UseMutationOptions<TaskStatus, Error, Omit<TaskStatus, 'id' | 'created_at'>>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: (status) => services.task.createTaskStatus(status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.statuses(variables.project_id || undefined) });
      toast.success('Đã thêm trạng thái');
    },
    ...options,
  });
}

/**
 * Update task status
 */
export function useUpdateTaskStatus(
  options?: UseMutationOptions<TaskStatus, Error, { statusId: string; updates: Partial<TaskStatus> }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ statusId, updates }) => services.task.updateTaskStatus(statusId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.statuses(data.project_id || undefined) });
      toast.success('Đã cập nhật trạng thái');
    },
    ...options,
  });
}

/**
 * Delete task status
 */
export function useDeleteTaskStatus(
  options?: UseMutationOptions<void, Error, { statusId: string; projectId?: string }>
) {
  const queryClient = useQueryClient();
  const services = useGanttServices();

  return useMutation({
    mutationFn: ({ statusId }) => services.task.deleteTaskStatus(statusId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.statuses(variables.projectId) });
      toast.success('Đã xóa trạng thái');
    },
    ...options,
  });
}

/**
 * Backward compatibility aliases
 */
export const useAddTask = useCreateTask;

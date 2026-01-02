import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Task } from '../types/task.types';

/**
 * Hook chứa tất cả event handlers cho Gantt Chart
 * Extracted từ GanttView.tsx - handlers logic
 */

interface UseGanttHandlersProps {
  onAddTask?: (parentId?: string | null, afterTaskId?: string | null) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateField?: (taskId: string, field: string, value: any) => void;
  onSaveTask?: (taskData: Partial<Task>) => Promise<void>;
  onSaveSettings?: (settings: any) => Promise<void>;
}

export function useGanttHandlers({
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateField,
  onSaveTask,
  onSaveSettings,
}: UseGanttHandlersProps) {

  /**
   * Handle add task button
   */
  const handleAddTask = useCallback(async (parentId?: string | null, afterTaskId?: string | null) => {
    try {
      onAddTask?.(parentId, afterTaskId);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Lỗi khi thêm task');
    }
  }, [onAddTask]);

  /**
   * Handle edit task
   */
  const handleEditTask = useCallback((task: Task) => {
    try {
      onEditTask?.(task);
    } catch (error) {
      console.error('Error editing task:', error);
      toast.error('Lỗi khi sửa task');
    }
  }, [onEditTask]);

  /**
   * Handle delete task
   */
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      onDeleteTask?.(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Lỗi khi xóa task');
    }
  }, [onDeleteTask]);

  /**
   * Handle update single field
   */
  const handleUpdateField = useCallback(async (taskId: string, field: string, value: any) => {
    try {
      onUpdateField?.(taskId, field, value);
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error(`Lỗi khi cập nhật ${field}`);
    }
  }, [onUpdateField]);

  /**
   * Handle save task (from dialog)
   */
  const handleSaveTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      await onSaveTask?.(taskData);
      toast.success('Lưu task thành công');
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Lỗi khi lưu task');
    }
  }, [onSaveTask]);

  /**
   * Handle save settings
   */
  const handleSaveSettings = useCallback(async (settings: any) => {
    try {
      await onSaveSettings?.(settings);
      toast.success('Lưu cài đặt thành công');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Lỗi khi lưu cài đặt');
    }
  }, [onSaveSettings]);

  return {
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleUpdateField,
    handleSaveTask,
    handleSaveSettings,
  };
}

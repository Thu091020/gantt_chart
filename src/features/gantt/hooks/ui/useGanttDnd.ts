import { useState, useCallback } from 'react';
import { Task } from '../../types/task.types';

export interface DragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'child' | null;
}

/**
 * Hook to manage drag and drop for task reordering
 */
export function useGanttDnd() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTaskId: null,
    dropTargetId: null,
    dropPosition: null,
  });

  /**
   * Start dragging a task
   */
  const handleDragStart = useCallback((taskId: string) => {
    setDragState({
      isDragging: true,
      draggedTaskId: taskId,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  /**
   * Handle drag over a drop target
   */
  const handleDragOver = useCallback((
    targetTaskId: string,
    position: 'before' | 'after' | 'child'
  ) => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: targetTaskId,
      dropPosition: position,
    }));
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((
    onDrop: (draggedId: string, targetId: string, position: 'before' | 'after' | 'child') => void
  ) => {
    if (
      dragState.draggedTaskId &&
      dragState.dropTargetId &&
      dragState.dropPosition &&
      dragState.draggedTaskId !== dragState.dropTargetId
    ) {
      onDrop(dragState.draggedTaskId, dragState.dropTargetId, dragState.dropPosition);
    }
    
    setDragState({
      isDragging: false,
      draggedTaskId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, [dragState]);

  /**
   * Cancel drag
   */
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedTaskId: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}

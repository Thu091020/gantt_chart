import { useState, useCallback } from 'react';
import type { Task } from '../types/task.types';
import type { TaskBarLabels, CustomColumn } from '../types/gantt.types';
import type { GanttViewMode } from './useGanttTimeline';
import { subWeeks, addMonths } from 'date-fns';

const DEFAULT_COLUMNS: CustomColumn[] = [
  { id: 'task_id', name: 'ID', width: 40, visible: true, fixed: true },
  { id: 'wbs', name: 'WBS', width: 65, visible: true, fixed: true },
  { id: 'name', name: 'Tên task', width: 180, visible: true, fixed: true },
  { id: 'status', name: 'Trạng thái', width: 95, visible: true },
  { id: 'start_date', name: 'Bắt đầu', width: 85, visible: true },
  { id: 'end_date', name: 'Kết thúc', width: 85, visible: true },
  { id: 'duration', name: 'Duration', width: 65, visible: true },
  { id: 'predecessors', name: 'Predec', width: 60, visible: true },
  { id: 'assignees', name: 'Assign', width: 100, visible: true },
  { id: 'effort', name: 'Effort', width: 55, visible: true },
  { id: 'progress', name: 'Tiến độ', width: 70, visible: true },
  { id: 'label', name: 'Label', width: 85, visible: true },
];

const DEFAULT_TASK_BAR_LABELS: TaskBarLabels = {
  showName: true,
  showAssignees: false,
  showDuration: false,
  showDates: false,
};

/**
 * Hook quản lý tất cả state cho Gantt Chart
 * Extracted từ GanttView.tsx để components chỉ focus vào UI
 */
export function useGanttState(projectId: string) {
  
  // ========== View Mode & Timeline ==========
  const [viewMode, setViewMode] = useState<GanttViewMode>('day');
  const [startDate, setStartDate] = useState(() => subWeeks(new Date(), 1));
  const [endDate, setEndDate] = useState(() => addMonths(new Date(), 2));
  const [customViewMode, setCustomViewMode] = useState(false);

  // ========== Task Selection & Expansion ==========
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // ========== Dialogs State ==========
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBaselineDialog, setShowBaselineDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [insertAfterTaskId, setInsertAfterTaskId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreBaselineConfirm, setShowRestoreBaselineConfirm] = useState(false);

  // ========== Baseline Viewing ==========
  const [viewingBaseline, setViewingBaseline] = useState<{
    id: string;
    name: string;
    tasks: Task[];
  } | null>(null);

  // ========== Columns Configuration ==========
  const [columns, setColumns] = useState<CustomColumn[]>(DEFAULT_COLUMNS);

  // ========== Task Bar Labels ==========
  const [taskBarLabels, setTaskBarLabels] = useState<TaskBarLabels>(DEFAULT_TASK_BAR_LABELS);

  // ========== Filters ==========
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);

  // ========== Settings Initialization Flag ==========
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  // ========== Handlers ==========

  const handleSelectTask = useCallback((taskId: string | null, ctrlKey?: boolean) => {
    if (!taskId) {
      setSelectedTaskIds(new Set());
      return;
    }

    if (ctrlKey) {
      // Multi-select
      setSelectedTaskIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(taskId)) {
          newSet.delete(taskId);
        } else {
          newSet.add(taskId);
        }
        return newSet;
      });
    } else {
      // Single select
      setSelectedTaskIds(new Set([taskId]));
    }
  }, []);

  const handleToggleExpand = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback((tasks: Task[]) => {
    const allTasksWithChildren = tasks.filter(t => t.children && t.children.length > 0);
    setExpandedTasks(new Set(allTasksWithChildren.map(t => t.id)));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandedTasks(new Set());
  }, []);

  const handleColumnsChange = useCallback((newColumns: CustomColumn[]) => {
    setColumns(newColumns);
  }, []);

  const handleTaskBarLabelsChange = useCallback((newLabels: TaskBarLabels) => {
    setTaskBarLabels(newLabels);
  }, []);

  // Single selected task (for backwards compatibility)
  const selectedTaskId = selectedTaskIds.size === 1
    ? Array.from(selectedTaskIds)[0]
    : null;

  return {
    // View state
    viewMode,
    setViewMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    customViewMode,
    setCustomViewMode,

    // Selection state
    selectedTaskId,
    selectedTaskIds,
    setSelectedTaskIds,
    expandedTasks,
    setExpandedTasks,

    // Dialog state
    showAddDialog,
    setShowAddDialog,
    showBaselineDialog,
    setShowBaselineDialog,
    editingTask,
    setEditingTask,
    insertAfterTaskId,
    setInsertAfterTaskId,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showRestoreBaselineConfirm,
    setShowRestoreBaselineConfirm,

    // Baseline state
    viewingBaseline,
    setViewingBaseline,

    // Columns state
    columns,
    setColumns,

    // Labels state
    taskBarLabels,
    setTaskBarLabels,

    // Filter state
    filterAssigneeIds,
    setFilterAssigneeIds,

    // Settings flag
    settingsInitialized,
    setSettingsInitialized,

    // Handlers
    handleSelectTask,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
    handleColumnsChange,
    handleTaskBarLabelsChange,
  };
}

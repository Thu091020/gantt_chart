import { useState, useCallback, useEffect } from 'react';
import { startOfMonth, subWeeks, addMonths } from 'date-fns';
import { GanttViewMode } from '../../components/toolbar/GanttToolbar';
import { TaskBarLabels } from '../../types/gantt.types';
import { useViewSettingsAdapter, useSaveViewSettings } from '../../context/hooks';

const DEFAULT_TASK_BAR_LABELS: TaskBarLabels = {
  showName: true,
  showAssignees: false,
  showDuration: false,
  showDates: false,
};

export function useGanttState(projectId: string) {
  // --- UI States ---
  const [viewMode, setViewMode] = useState<GanttViewMode>('day');
  const [startDate, setStartDate] = useState(() => subWeeks(new Date(), 1));
  const [endDate, setEndDate] = useState(() => addMonths(new Date(), 2));
  const [customViewMode, setCustomViewMode] = useState(false);
  
  // --- Selection & Expansion ---
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [taskBarLabels, setTaskBarLabels] = useState<TaskBarLabels>(DEFAULT_TASK_BAR_LABELS);
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);
  const [columns, setColumns] = useState<any[]>([]); // Sẽ set default ở main hoặc lấy từ settings

  // --- Dialog States ---
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBaselineDialog, setShowBaselineDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreBaselineConfirm, setShowRestoreBaselineConfirm] = useState(false);

  // --- Sync with Server Settings ---
  const { data: viewSettings } = useViewSettingsAdapter();
  const saveViewSettings = useSaveViewSettings();
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  useEffect(() => {
    if (viewSettings && !settingsInitialized) {
      if (viewSettings.taskBarLabels) setTaskBarLabels(viewSettings.taskBarLabels);
      if (viewSettings.expandedTaskIds?.[projectId]) {
        setExpandedTasks(new Set(viewSettings.expandedTaskIds[projectId]));
      }
      setSettingsInitialized(true);
    }
  }, [viewSettings, settingsInitialized, projectId]);

  // --- Handlers ---
  const handleTaskBarLabelsChange = useCallback((newLabels: TaskBarLabels) => {
    setTaskBarLabels(newLabels);
    saveViewSettings.mutate({ ...viewSettings, taskBarLabels: newLabels });
  }, [viewSettings, saveViewSettings]);

  const handleExpandedTasksChange = useCallback((newExpandedTasks: Set<string>) => {
    setExpandedTasks(newExpandedTasks);
    saveViewSettings.mutate({
      ...viewSettings,
      expandedTaskIds: {
        ...viewSettings?.expandedTaskIds,
        [projectId]: Array.from(newExpandedTasks),
      },
    });
  }, [viewSettings, saveViewSettings, projectId]);

  const toggleTaskExpansion = useCallback((taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    handleExpandedTasksChange(next);
  }, [expandedTasks, handleExpandedTasksChange]);

  const handleSelectTask = useCallback((taskId: string | null, ctrlKey?: boolean) => {
    if (!taskId) {
      setSelectedTaskIds(new Set());
      return;
    }
    if (ctrlKey) {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        next.has(taskId) ? next.delete(taskId) : next.add(taskId);
        return next;
      });
    } else {
      setSelectedTaskIds(new Set([taskId]));
    }
  }, []);

  const selectedTaskId = Array.from(selectedTaskIds)[0] || null;

  return {
    viewMode, setViewMode,
    startDate, setStartDate,
    endDate, setEndDate,
    customViewMode, setCustomViewMode,
    selectedTaskIds, setSelectedTaskIds, selectedTaskId,
    expandedTasks, toggleTaskExpansion, setExpandedTasks, handleExpandedTasksChange,
    taskBarLabels, handleTaskBarLabelsChange,
    filterAssigneeIds, setFilterAssigneeIds,
    columns, setColumns,
    handleSelectTask,
    dialogs: {
      showAddDialog, setShowAddDialog,
      showBaselineDialog, setShowBaselineDialog,
      showDeleteConfirm, setShowDeleteConfirm,
      showRestoreBaselineConfirm, setShowRestoreBaselineConfirm,
    },
  };
}
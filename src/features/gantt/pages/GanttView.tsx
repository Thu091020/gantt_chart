import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GanttPanels, GanttPanelsHandle } from '../components/GanttPanels';
import { GanttToolbar } from '../components/toolbar/GanttToolbar';
import { GanttModals } from '../components/gantt-chart/GanttModals';
import { GanttBaselineBanner } from '../components/gantt-chart/GanttBaselineBanner';
import {
  useTasksAdapter,
  useEmployeesAdapter,
  useAllocationsAdapter,
  useTaskStatusesAdapter,
  useTaskLabelsAdapter,
  useProjectMilestonesAdapter,
  useRestoreBaseline,
  useAuthAdapter,
  useViewSettingsAdapter,
  useSaveViewSettings,
} from '../context/hooks';
import { startOfMonth, addMonths } from 'date-fns';
import type { Task } from '../types/task.types';
import { useGanttState } from '../hooks/gantt-view/useGanttState';
import { useTaskProcessor } from '../hooks/gantt-view/useTaskProcessor';
import { useTimeline } from '../hooks/gantt-view/useTimeline';
import { useTaskActions } from '../hooks/gantt-view/useTaskActions';
import { DEFAULT_COLUMNS, CustomColumn } from '../constants';


export type { GanttViewMode } from '../constants';

interface GanttViewProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: {
    id: string;
    date: string;
    end_date: string | null;
  name: string;
    is_recurring: boolean;
  }[];
  settings: any;
}

export function GanttView({
  projectId,
  projectMembers,
  holidays,
  settings,
}: GanttViewProps) {
  // 1. Data Fetching
  const { data: tasks = [] } = useTasksAdapter(projectId);
  const { data: allEmployees = [] } = useEmployeesAdapter();
  const { data: allocations = [] } = useAllocationsAdapter(projectId);
  const { data: taskStatuses = [] } = useTaskStatusesAdapter(projectId);
  const { data: taskLabels = [] } = useTaskLabelsAdapter(projectId);
  const { data: projectMilestones = [] } = useProjectMilestonesAdapter(projectId);
  const { user } = useAuthAdapter();
  const restoreBaseline = useRestoreBaseline();

  // 2. State Management
  const state = useGanttState(projectId);
  const [viewingBaseline, setViewingBaseline] = useState<{
    id: string;
    name: string;
    tasks: Task[];
  } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [columns, setColumns] = useState<CustomColumn[]>([...DEFAULT_COLUMNS]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ganttPanelsRef = useRef<GanttPanelsHandle>(null);

  // Initialize columns from settings
  const { data: viewSettings } = useViewSettingsAdapter();
  const saveViewSettings = useSaveViewSettings();
  
  useEffect(() => {
    if (viewSettings?.columnSettings && viewSettings.columnSettings.length > 0) {
      setColumns((prevCols) =>
        prevCols.map((col) => {
          const saved = viewSettings.columnSettings?.find((s: any) => s.id === col.id);
          if (saved) {
            return { ...col, width: saved.width, visible: saved.visible };
          }
          return col;
        })
      );
    }
  }, [viewSettings]);


  const displayTasks = viewingBaseline ? viewingBaseline.tasks : tasks;
  const isReadOnly = !!viewingBaseline;

  // 3. Logic Hooks
  const processor = useTaskProcessor(
    displayTasks,
    state.expandedTasks,
    state.filterAssigneeIds
  );
  const timeline = useTimeline(
    state.startDate,
    state.endDate,
    state.viewMode,
    state.customViewMode,
    processor.taskDateRange
  );

  const actions = useTaskActions(
    projectId,
    tasks,
    state.selectedTaskIds,
    state.setSelectedTaskIds,
    state.handleExpandedTasksChange,
    state.expandedTasks,
    allEmployees,
    user
  );

  // 4. Computed values
  const selectedTasksTextStyle = useMemo(() => {
    if (state.selectedTaskIds.size === 0) return null;
    const tasksSource = viewingBaseline ? viewingBaseline.tasks : tasks;
    const selectedTasks = tasksSource.filter((t) => state.selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return null;

    const styles = selectedTasks.map((t) => t.text_style || null);
    const firstStyle = styles[0];
    const allSame = styles.every((s) => s === firstStyle);

    return allSame ? firstStyle : 'mixed';
  }, [state.selectedTaskIds, tasks, viewingBaseline]);

  // 5. Effects
  useEffect(() => {
    state.setStartDate(startOfMonth(new Date()));
    const timer = setTimeout(() => {
      ganttPanelsRef.current?.scrollToToday();
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId, state.setStartDate]);

  // 6. Local Handlers
  const handleEditTask = useCallback(
    (task: Task) => {
    setEditingTask(task);
      state.dialogs.setShowAddDialog(true);
    },
    [state.dialogs]
  );

  const handleViewBaseline = useCallback((baseline: any) => {
    const baselineTasks = (baseline.snapshot as any)?.tasks || [];
    setViewingBaseline({
      id: baseline.id,
      name: baseline.name,
      tasks: baselineTasks,
    });
    state.setSelectedTaskIds(new Set());
  }, [state.setSelectedTaskIds]);

  const handleExitBaselineView = useCallback(() => {
    setViewingBaseline(null);
    state.setSelectedTaskIds(new Set());
  }, [state.setSelectedTaskIds]);

  const handleRestoreBaseline = useCallback(async () => {
    if (viewingBaseline) {
      await restoreBaseline.mutateAsync({
        baselineId: viewingBaseline.id,
        projectId,
      });
      setViewingBaseline(null);
      state.dialogs.setShowRestoreBaselineConfirm(false);
    }
  }, [viewingBaseline, restoreBaseline, projectId, state.dialogs]);

  const handleSaveTask = useCallback(
    async (taskData: Partial<Task>) => {
      if (editingTask?.id) {
        await actions.handleSaveTask(editingTask, taskData);
      } else {
        // Create new task - calculate sort_order
        let sortOrder = 0;
          const parentId = taskData.parent_id || null;
          const siblingTasks = tasks.filter((t) => t.parent_id === parentId);
        sortOrder =
          siblingTasks.length > 0
            ? Math.max(...siblingTasks.map((t) => t.sort_order)) + 1
            : 0;

        await actions.addTask.mutateAsync({
          ...taskData,
          project_id: projectId,
          sort_order: sortOrder,
        } as any);
      }
      state.dialogs.setShowAddDialog(false);
      setEditingTask(null);
    },
    [editingTask, actions, tasks, projectId, state.dialogs]
  );

  const handleConfirmDelete = useCallback(async () => {
    for (const taskId of state.selectedTaskIds) {
      await actions.handleDeleteTask(taskId);
    }
    state.setSelectedTaskIds(new Set());
    state.dialogs.setShowDeleteConfirm(false);
  }, [state.selectedTaskIds, state.setSelectedTaskIds, state.dialogs, actions]);

  const handleColumnsChange = useCallback(
    (newColumns: CustomColumn[]) => {
      setColumns(newColumns);
      const columnSettings = newColumns.map((col) => ({
        id: col.id,
        width: col.width,
        visible: col.visible,
      }));
      saveViewSettings.mutate({
        ...viewSettings,
        columnSettings,
      });
    },
    [viewSettings, saveViewSettings]
  );

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    state.setStartDate((prev) =>
      addMonths(prev, state.viewMode === 'day' ? -1 : state.viewMode === 'week' ? -2 : -6)
    );
  }, [state.setStartDate, state.viewMode]);

  const goToNext = useCallback(() => {
    state.setStartDate((prev) =>
      addMonths(prev, state.viewMode === 'day' ? 1 : state.viewMode === 'week' ? 2 : 6)
    );
  }, [state.setStartDate, state.viewMode]);

  const goToToday = useCallback(() => {
    state.setStartDate(startOfMonth(new Date()));
    setTimeout(() => {
      ganttPanelsRef.current?.scrollToToday();
    }, 100);
  }, [state.setStartDate]);

  // Toolbar handlers
  const handleToolbarAdd = useCallback(async () => {
    const rootTasks = tasks.filter((t) => !t.parent_id);
    const maxSortOrder =
      rootTasks.length > 0
        ? Math.max(...rootTasks.map((t) => t.sort_order))
        : -1;

    const result = await actions.addTask.mutateAsync({
      project_id: projectId,
      name: 'New Task',
      parent_id: null,
      sort_order: maxSortOrder + 1,
      duration: 1,
      progress: 0,
    } as any);

    state.setSelectedTaskIds(new Set([result.id]));
  }, [tasks, actions, projectId, state.setSelectedTaskIds]);

  const handleToolbarEdit = useCallback(() => {
    if (state.selectedTaskId) {
      const task = tasks.find((t) => t.id === state.selectedTaskId);
      if (task) handleEditTask(task);
    }
  }, [state.selectedTaskId, tasks, handleEditTask]);

  const handleToolbarDelete = useCallback(() => {
    if (state.selectedTaskIds.size === 0) return;
    state.dialogs.setShowDeleteConfirm(true);
  }, [state.selectedTaskIds.size, state.dialogs]);

  // Wrapper handlers for context menu actions
  const handleContextInsertAbove = useCallback(
    async (taskId: string) => {
      await actions.handleInsertAbove(taskId);
    },
    [actions]
  );

  const handleContextCopyTask = useCallback(
    async (taskId: string) => {
      await actions.handleCopyTask(taskId);
    },
    [actions]
  );

  const handleContextMoveUp = useCallback(
    async (taskId: string) => {
      await actions.handleMoveUp(taskId);
    },
    [actions]
  );

  const handleContextMoveDown = useCallback(
    async (taskId: string) => {
      await actions.handleMoveDown(taskId);
    },
    [actions]
  );

  // Style handlers with tasks source
  const handleToggleBold = useCallback(() => {
    actions.handleToggleBold(displayTasks);
  }, [actions, displayTasks]);

  const handleToggleItalic = useCallback(() => {
    actions.handleToggleItalic(displayTasks);
  }, [actions, displayTasks]);

  // CSV handlers
  const handleImportCSV = useCallback(() => {
    actions.handleImportCSV(fileInputRef);
  }, [actions]);

  const handleProcessCSVImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      actions.processCSVImport(event, fileInputRef);
    },
    [actions]
  );

  // 7. Render
  return (
      <div className="w-full h-full flex flex-col">
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
        onChange={handleProcessCSVImport}
        />

      {/* Baseline Banner */}
        {viewingBaseline && (
        <GanttBaselineBanner
          baselineName={viewingBaseline.name}
          taskCount={viewingBaseline.tasks.length}
          onRestore={() => state.dialogs.setShowRestoreBaselineConfirm(true)}
          onExit={handleExitBaselineView}
        />
      )}

      {/* Toolbar */}
        {!isReadOnly && (
          <GanttToolbar
          selectedTaskId={state.selectedTaskId}
          selectedCount={state.selectedTaskIds.size}
          canMultiIndent={actions.areSelectedTasksSameLevel}
          canCopy={actions.canCopyTasks}
          viewMode={state.viewMode}
          customViewMode={state.customViewMode}
          startDate={state.startDate}
          endDate={state.endDate}
          taskBarLabels={state.taskBarLabels}
          selectedTasksTextStyle={selectedTasksTextStyle}
          filterEmployees={projectMembers.map((m) => ({
              id: m.id,
              name: m.name,
              code: allEmployees.find((e) => e.id === m.id)?.code || '',
            }))}
          filterAssigneeIds={state.filterAssigneeIds}
          projectId={projectId}
          onAddTask={handleToolbarAdd}
          onInsertAbove={() => state.selectedTaskId && actions.handleInsertAbove(state.selectedTaskId)}
          onInsertBelow={() => state.selectedTaskId && actions.handleInsertBelow(state.selectedTaskId)}
          onEditTask={handleToolbarEdit}
          onDeleteTask={handleToolbarDelete}
          onCopyTask={actions.handleCopyTask}
          onIndent={actions.handleIndent}
          onOutdent={actions.handleOutdent}
          onMoveUp={actions.handleMoveUp}
          onMoveDown={actions.handleMoveDown}
          onToggleBold={handleToggleBold}
          onToggleItalic={handleToggleItalic}
          onSyncAllocations={actions.handleSyncAllocations}
          onImportCSV={handleImportCSV}
          onExportCSV={actions.handleExportCSV}
          onGenerateFakeData={actions.handleGenerateFakeData}
          onOpenBaselines={() => state.dialogs.setShowBaselineDialog(true)}
          onViewModeChange={(m) => {
            state.setViewMode(m);
            state.setCustomViewMode(false);
          }}
          onCustomRangeChange={(start, end) => {
            state.setStartDate(start);
            state.setEndDate(end);
            state.setCustomViewMode(true);
          }}
          onGoToPrevious={goToPrevious}
          onGoToNext={goToNext}
          onGoToToday={goToToday}
          onTaskBarLabelsChange={state.handleTaskBarLabelsChange}
          onFilterAssigneesChange={state.setFilterAssigneeIds}
        />
      )}

      {/* Main Panels */}
        <GanttPanels
        ref={ganttPanelsRef}
        flatTasks={processor.filteredFlatTasks}
        columns={columns}
        timelineColumns={timeline.timelineColumns}
        projectMembers={projectMembers}
        allEmployees={allEmployees}
        selectedTaskId={state.selectedTaskId}
        selectedTaskIds={state.selectedTaskIds}
        taskIdMap={processor.taskIdMap}
        wbsMap={processor.wbsMap}
        taskByIdNumber={processor.taskByIdNumber}
        tasks={displayTasks}
        startDate={state.startDate}
        viewMode={state.viewMode}
        taskStatuses={taskStatuses}
        taskLabels={taskLabels}
        projectId={projectId}
        taskBarLabels={state.taskBarLabels}
        projectMilestones={projectMilestones}
        isNonWorkingDay={timeline.isNonWorkingDay}
        isHoliday={timeline.isHoliday}
        onSelectTask={state.handleSelectTask}
        onToggleExpand={state.toggleTaskExpansion}
        onAddTask={actions.handleAddTask}
        onInsertAbove={handleContextInsertAbove}
        onEditTask={handleEditTask}
        onDeleteTask={actions.handleDeleteTask}
        onCopyTask={handleContextCopyTask}
        onMoveUp={handleContextMoveUp}
        onMoveDown={handleContextMoveDown}
        onUpdateField={actions.handleUpdateTaskField}
        onColumnsChange={handleColumnsChange}
      />

      {/* Modals */}
      <GanttModals
        dialogs={state.dialogs}
        editingTask={editingTask}
        tasks={tasks}
        projectMembers={projectMembers}
        projectId={projectId}
        allocations={allocations}
        onSaveTask={handleSaveTask}
        onViewBaseline={handleViewBaseline}
        onConfirmDelete={handleConfirmDelete}
        onConfirmRestoreBaseline={handleRestoreBaseline}
        restorePending={restoreBaseline.isPending}
        viewingBaselineName={viewingBaseline?.name}
        selectedCount={state.selectedTaskIds.size}
      />
    </div>
  );
}

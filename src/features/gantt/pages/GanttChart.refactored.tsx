import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGanttCalculations, useGanttTimeline, useGanttState } from '../../hooks';
import { useTaskQueries, useAllocationQueries, useSettingQueries } from '../../hooks';
import { ChartArea } from '../timeline/ChartArea';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TaskListTable } from '../columns/TaskListTable';
import { GanttToolbar } from '../toolbar/GanttToolbar';
import { CreateTaskDialog } from '../dialogs/CreateTaskDialog';
import { TaskDetailDialog } from '../dialogs/TaskDetailDialog';
import { BaselineManagerDialog } from '../dialogs/BaselineManagerDialog';
import { GanttPanels } from '../timeline/GanttPanels';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: { id: string; date: string; end_date: string | null; name: string; is_recurring: boolean }[];
  settings: any;
}

/**
 * Main Gantt Chart Component - Pure UI orchestration
 * All logic is delegated to custom hooks
 */
export function GanttChart({
  projectId,
  projectMembers,
  holidays,
  settings,
}: GanttChartProps) {
  
  // =============== Data Fetching ===============
  const { data: tasks = [], isLoading: tasksLoading } = useTaskQueries(projectId);
  const { data: allocations = [] } = useAllocationQueries(projectId);
  const { data: viewSettings } = useSettingQueries(projectId);

  // =============== State Management ===============
  const state = useGanttState(projectId);
  const {
    viewMode,
    setViewMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTaskIds,
    expandedTasks,
    showAddDialog,
    setShowAddDialog,
    editingTask,
    setEditingTask,
    columns,
    taskBarLabels,
    filterAssigneeIds,
  } = state;

  // =============== Calculations ===============
  const calculations = useGanttCalculations({
    tasks,
    holidays,
    settings,
    expandedTasks,
    filterAssigneeIds,
  });

  const {
    taskIdMap,
    taskByIdNumber,
    wbsMap,
    isNonWorkingDay,
    isHoliday,
    filteredFlatTasks,
  } = calculations;

  // =============== Timeline ===============
  const timeline = useGanttTimeline({
    startDate,
    endDate,
    viewMode,
    tasks: filteredFlatTasks,
  });

  const {
    timelineColumns,
    totalTimelineWidth,
    getDatePosition,
    getPositionDate,
  } = timeline;

  // =============== Refs ===============
  const ganttPanelsRef = useRef<any>(null);

  // =============== Effects ===============
  useEffect(() => {
    // Load settings from saved view settings
    if (viewSettings && !state.settingsInitialized) {
      if (viewSettings.taskBarLabels) {
        state.setTaskBarLabels(viewSettings.taskBarLabels);
      }
      if (viewSettings.expandedTaskIds?.[projectId]) {
        state.setExpandedTasks(new Set(viewSettings.expandedTaskIds[projectId]));
      }
      if (viewSettings.columnSettings && viewSettings.columnSettings.length > 0) {
        state.setColumns(prevCols =>
          prevCols.map(col => {
            const saved = viewSettings.columnSettings?.find(s => s.id === col.id);
            if (saved) {
              return { ...col, width: saved.width, visible: saved.visible };
            }
            return col;
          })
        );
      }
      state.setSettingsInitialized(true);
    }
  }, [viewSettings, projectId]);

  // =============== Handlers ===============
  const handleSelectTask = useCallback((taskId: string | null, ctrlKey?: boolean) => {
    state.handleSelectTask(taskId, ctrlKey);
  }, [state]);

  const handleToggleExpand = useCallback((taskId: string) => {
    state.handleToggleExpand(taskId);
  }, [state]);

  const selectedTaskId = selectedTaskIds.size === 1
    ? Array.from(selectedTaskIds)[0]
    : null;

  // =============== Render ===============
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <GanttToolbar
        projectId={projectId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoomChange={() => {}}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
        }}
        taskBarLabels={taskBarLabels}
        onTaskBarLabelsChange={state.handleTaskBarLabelsChange}
      />

      {/* Main Content */}
      <GanttPanels ref={ganttPanelsRef}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Task Grid */}
          <div className="flex-none w-[600px] border-r border-border overflow-auto">
            <TaskListTable
              tasks={filteredFlatTasks}
              columns={columns}
              taskIdMap={taskIdMap}
              wbsMap={wbsMap}
              selectedTaskId={selectedTaskId}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={handleSelectTask}
              onToggleExpand={handleToggleExpand}
              onAddTask={() => setShowAddDialog(true)}
              onEditTask={(task) => {
                setEditingTask(task);
              }}
              onDeleteTask={() => {}}
              onColumnsChange={state.handleColumnsChange}
            />
          </div>

          {/* Right Panel - Timeline Chart */}
          <div className="flex-1 overflow-auto">
            <TimelineHeader
              timelineColumns={timelineColumns}
              viewMode={viewMode}
            />
            <ChartArea
              ref={ganttPanelsRef}
              tasks={filteredFlatTasks}
              startDate={startDate}
              viewMode={viewMode}
              timelineColumns={timelineColumns}
              selectedTaskId={selectedTaskId}
              selectedTaskIds={selectedTaskIds}
              taskIdMap={taskIdMap}
              taskBarLabels={taskBarLabels}
              isNonWorkingDay={isNonWorkingDay}
              isHoliday={isHoliday}
              onSelectTask={handleSelectTask}
              contentRef={undefined}
              onVerticalScroll={undefined}
            />
          </div>
        </div>
      </GanttPanels>

      {/* Dialogs */}
      <CreateTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={() => {}}
        projectMembers={projectMembers}
      />

      {editingTask && (
        <TaskDetailDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          onSave={() => {}}
          projectMembers={projectMembers}
        />
      )}
    </div>
  );
}

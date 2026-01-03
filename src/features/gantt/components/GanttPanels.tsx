import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Task, TaskBarLabels, CustomColumn } from '../types/gantt.types';
import { GanttViewMode } from './toolbar/GanttToolbar';
import { TaskGrid } from './columns/TaskGrid';
import { GanttChart, GanttChartHandle } from './GanttChart';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../components/internal/ui';
import type { TaskStatus, TaskLabel, ProjectMilestone } from '../types/gantt.types';

export interface GanttPanelsHandle {
  scrollToToday: () => void;
}

interface GanttPanelsProps {
  flatTasks: Task[];
  columns: CustomColumn[];
  projectMembers: { id: string; name: string }[];
  allEmployees: { id: string; name: string }[];
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  taskIdMap: Map<string, number>;
  wbsMap: Map<string, string>;
  taskByIdNumber: Map<number, Task>;
  tasks: Task[];
  startDate: Date;
  viewMode: GanttViewMode;
  timelineColumns: {
    date: Date;
    label: string;
    subLabel: string;
    width: number;
    days: number;
  }[];
  taskStatuses: TaskStatus[];
  taskLabels: TaskLabel[];
  projectId: string;
  taskBarLabels: TaskBarLabels;
  projectMilestones: ProjectMilestone[];
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
  onSelectTask: (taskId: string | null, ctrlKey?: boolean) => void;
  onToggleExpand: (taskId: string) => void;
  onAddTask: (parentId?: string | null, afterTaskId?: string | null) => void;
  onInsertAbove: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCopyTask: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  onUpdateField: (taskId: string, field: string, value: any) => void;
  onColumnsChange: (columns: CustomColumn[]) => void;
}

export const GanttPanels = forwardRef<GanttPanelsHandle, GanttPanelsProps>(
  (
    {
      flatTasks,
      columns,
      projectMembers,
      allEmployees,
      selectedTaskId,
      selectedTaskIds,
      taskIdMap,
      wbsMap,
      taskByIdNumber,
      tasks,
      startDate,
      viewMode,
      timelineColumns,
      taskStatuses,
      taskLabels,
      projectId,
      taskBarLabels,
      projectMilestones,
      isNonWorkingDay,
      isHoliday,
      onSelectTask,
      onToggleExpand,
      onAddTask,
      onInsertAbove,
      onEditTask,
      onDeleteTask,
      onCopyTask,
      onMoveUp,
      onMoveDown,
      onUpdateField,
      onColumnsChange,
    },
    ref
  ) => {
    const tableScrollRef = useRef<HTMLDivElement>(null);
    const ganttScrollRef = useRef<HTMLDivElement>(null);
    const ganttChartRef = useRef<GanttChartHandle>(null);
    const isScrolling = useRef(false);

    // Expose scrollToToday method
    useImperativeHandle(
      ref,
      () => ({
        scrollToToday: () => {
          ganttChartRef.current?.scrollToToday();
        },
      }),
      []
    );

    // Sync vertical scroll from table to gantt
    const handleTableVerticalScroll = useCallback((scrollTop: number) => {
      if (isScrolling.current) return;
      isScrolling.current = true;

      if (ganttScrollRef.current) {
        ganttScrollRef.current.scrollTop = scrollTop;
      }

      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }, []);

    // Sync vertical scroll from gantt to table (called from GanttChart onVerticalScroll)
    const handleGanttVerticalScroll = useCallback((scrollTop: number) => {
      if (isScrolling.current) return;
      isScrolling.current = true;

      if (tableScrollRef.current) {
        tableScrollRef.current.scrollTop = scrollTop;
      }

      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }, []);

    return (
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel
          defaultSize={40}
          minSize={20}
          maxSize={60}
          className="min-h-0"
        >
          {/* Task Grid (Left panel) */}
          <TaskGrid
            tasks={flatTasks}
            columns={columns}
            projectMembers={projectMembers}
            allEmployees={allEmployees}
            selectedTaskId={selectedTaskId}
            selectedTaskIds={selectedTaskIds}
            taskIdMap={taskIdMap}
            wbsMap={wbsMap}
            taskByIdNumber={taskByIdNumber}
            taskStatuses={taskStatuses}
            taskLabels={taskLabels}
            projectId={projectId}
            onSelectTask={onSelectTask}
            onToggleExpand={onToggleExpand}
            onAddTask={onAddTask}
            onInsertAbove={onInsertAbove}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCopyTask={onCopyTask}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onUpdateField={onUpdateField}
            onColumnsChange={onColumnsChange}
            tasks_raw={tasks}
            onVerticalScroll={handleTableVerticalScroll}
            contentRef={tableScrollRef}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60} className="min-h-0">
          {/* Gantt Chart (Right panel) */}
          <GanttChart
            ref={ganttChartRef}
            tasks={flatTasks}
            startDate={startDate}
            viewMode={viewMode}
            timelineColumns={timelineColumns}
            selectedTaskId={selectedTaskId}
            selectedTaskIds={selectedTaskIds}
            taskIdMap={taskIdMap}
            taskBarLabels={taskBarLabels}
            taskLabels={taskLabels}
            projectMilestones={projectMilestones}
            allEmployees={allEmployees}
            isNonWorkingDay={isNonWorkingDay}
            isHoliday={isHoliday}
            onSelectTask={onSelectTask}
            contentRef={ganttScrollRef}
            onVerticalScroll={handleGanttVerticalScroll}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }
);

GanttPanels.displayName = 'GanttPanels';

/**
 * Gantt Feature - Main Export
 * 
 * This is the main entry point for the Gantt feature.
 * Import everything you need from this file.
 */

// ==================== Configuration ====================
export {
  configureGantt,
  getGanttConfig,
  isGanttConfigured,
  createDatabaseAdapter,
  setGanttAdapterMode,
  getGanttAdapterMode,
  uiAdapter,
  utilsAdapter,
} from './adapters';

export {
  setupGanttFeature,
  type GanttSetupOptions,
} from './config';

export type {
  IGanttConfig,
  IGanttDatabaseAdapter,
  IGanttUIComponents,
  IGanttUtilityFunctions,
  IGanttAuthAdapter,
  IEmployee,
  IEmployeesAdapter,
  ITaskStatus,
  ITaskStatusAdapter,
  ITaskLabel,
  ITaskLabelAdapter,
  IProjectMilestone,
  IMilestoneAdapter,
  IHoliday,
  IHolidayAdapter,
  IBaseline,
  IBaselineAdapter,
  ITaskBarLabels,
  IViewSettings,
  IViewSettingsAdapter,
  ICollaborationAdapter,
  GanttAdapterMode,
} from './adapters';

// ==================== Types ====================
export type {
  Task,
  TaskDependency,
  TaskPriority,
} from './types/task.types';

export type {
  TaskAllocation,
  AllocationWithEmployee,
} from './types/allocation.types';

export type {
  CustomColumn,
  TimelineColumn,
  TaskBarDimensions,
} from './types/gantt.types';

// ==================== Services ====================
// Only export the factory - users shouldn't access services directly
export {
  ganttService,
  isUsingMockData,
} from './services/factory';

// ==================== Store ====================
export {
  useGanttStore,
  ganttSelectors,
} from './store/gantt.store';

// ==================== Hooks ====================

// Query Hooks
export {
  useGetTasks,
  useGetTask,
} from './hooks/queries/useTaskQueries';

export {
  useGetAllocations,
} from './hooks/queries/useAllocationQueries';

export {
  useGetViewSettings,
  useGetBaselines,
  useGetBaseline,
  useGetProjectMilestones,
} from './hooks/queries/useSettingQueries';

// Mutation Hooks
export {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
} from './hooks/mutations/useTaskMutations';

export {
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useBulkSetAllocations,
} from './hooks/mutations/useAllocationMutations';

// UI Hooks
export {
  useGanttScroll,
} from './hooks/ui/useGanttScroll';

export {
  useGanttZoom,
} from './hooks/ui/useGanttZoom';

export {
  useGanttDnd,
} from './hooks/ui/useGanttDnd';

// Business Logic Hooks
export {
  useGanttCalculations,
} from './hooks/useGanttCalculations';

export {
  useGanttTimeline,
} from './hooks/useGanttTimeline';

export {
  useGanttState,
} from './hooks/useGanttState';

export {
  useGanttHandlers,
} from './hooks/useGanttHandlers';

export {
  useDatePosition,
} from './hooks/useDatePosition';

export {
  useTaskDateRange,
} from './hooks/useTaskDateRange';

export {
  useTaskFilters,
} from './hooks/useTaskFilters';

export {
  useTaskHierarchy,
} from './hooks/useTaskHierarchy';

export {
  useTimelineColumns,
} from './hooks/useTimelineColumns';

export {
  useWorkingDays,
} from './hooks/useWorkingDays';

// ==================== Constants ====================
export {
  GANTT_VIEW_MODES,
  GANTT_ZOOM_LEVELS,
  DEFAULT_TASK_BAR_LABELS,
  DEFAULT_COLUMNS,
  GANTT_TIMELINE_DEFAULTS,
  GANTT_COLORS,
  DEFAULT_STATUS_COLORS,
  DEFAULT_LABEL_COLORS,
  API_DELAYS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';

export type {
  GanttZoomLevel,
} from './constants';

// ==================== Utilities ====================

// Date utilities
export {
  isHoliday,
  checkSaturdayWorkingDay,
  isNonWorkingDay,
  countWorkingDays,
  addWorkingDays,
  getNextWorkingDay,
} from './lib/date-utils';

// Gantt utilities
export {
  isWeekend,
  isWorkingDay,
  getBusinessDaysBetween,
} from './utils';

// Tree utilities
export {
  buildTaskTree,
  flattenTaskTree,
  getAllFlatTasksWithLevel,
  buildWbsMap,
  getDescendantIds,
  hasChildren,
  getTaskSiblings,
  getTaskAncestors,
} from './lib/tree-utils';

// Gantt utilities
export {
  generateTimelineColumns,
  getDatePosition,
  calculateTimelineWidth,
  getDefaultTimelineEnd,
  calculateTaskBarDimensions,
} from './lib/gantt-utils';

// ==================== Components ====================

// Main Components
export {
  GanttChart,
} from './components/GanttChart';

export type {
  GanttChartHandle,
} from './components/GanttChart';

export {
  GanttPanels,
} from './components/GanttPanels';

export type {
  GanttPanelsHandle,
} from './components/GanttPanels';

// Toolbar
export {
  GanttToolbar,
  type GanttViewMode,
} from './components/toolbar/GanttToolbar';

// Dialogs
export {
  TaskFormDialog,
} from './components/dialogs/CreateTaskDialog';

export {
  BaselineDialog,
} from './components/dialogs/BaselineManagerDialog';

export {
  MilestoneDialog,
} from './components/dialogs/MilestoneDialog';

export {
  LabelSettingsDialog,
} from './components/dialogs/LabelSettingsDialog';

export {
  StatusSettingsDialog,
} from './components/dialogs/StatusSettingsDialog';

// Column Components
export {
  TaskGrid,
} from './components/columns/TaskGrid';

export {
  TaskGrid as TaskListTable,
} from './components/columns/TaskListTable';

// ==================== Pages ====================

// Main Page Component
export {
  GanttView,
  GanttViewWrapper,
} from './pages';

// ==================== Context ====================
export {
  GanttContext,
  GanttProvider,
  useGanttContext,
  useGanttUI,
  useGanttUtils,
  useGanttDatabase,
  useGanttAuth,
} from './context';

// ==================== Default Export ====================
// For convenience, also provide a default export
import { GanttView } from './pages/GanttView';

export default GanttView;

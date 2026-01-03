/**
 * Context Module
 * 
 * Provides React Context and custom hooks for accessing:
 * - Gantt configuration
 * - UI components
 * - Database operations
 * - Authentication
 * - Utility functions
 */

export { GanttContext, GanttProvider, useGanttContext, useGanttUI, useGanttUtils, useGanttDatabase, useGanttAuth } from './GanttContext';

// Hook adapters for database operations
export {
  useTasksAdapter,
  useAllocationsAdapter,
  useEmployeesAdapter,
  useTaskStatusesAdapter,
  useTaskLabelsAdapter,
  useProjectMilestonesAdapter,
  useHolidaysAdapter,
  useBaselinesAdapter,
  useViewSettingsAdapter,
  useAuthAdapter,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  useBulkSetAllocations,
  useAddTaskStatus,
  useUpdateTaskStatus,
  useDeleteTaskStatus,
  useAddTaskLabel,
  useUpdateTaskLabel,
  useDeleteTaskLabel,
  useAddBaseline,
  useDeleteBaseline,
  useRestoreBaseline,
  useSaveViewSettings,
  useUpdateProject,
} from './hooks';

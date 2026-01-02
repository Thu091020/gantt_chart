/**
 * Gantt Feature - Main Index
 * Central export point for the Gantt feature
 */

// Types
export * from './types/task.types';
export * from './types/allocation.types';
export * from './types/gantt.types';

// Services (for advanced usage)
export { ganttService, isUsingMockData } from './services/factory';

// Hooks - Queries
export * from './hooks/queries/useTaskQueries';
export * from './hooks/queries/useAllocationQueries';
export * from './hooks/queries/useSettingQueries';

// Hooks - Mutations
export * from './hooks/mutations/useTaskMutations';
export * from './hooks/mutations/useAllocationMutations';

// Store
export { useGanttStore, ganttSelectors } from './store/gantt.store';
export * from './store/gantt.selector';

// Utils
export * from './lib/date-utils';
export * from './lib/tree-utils';
export { 
  generateTimelineColumns,
  getDatePosition,
  calculateTimelineWidth,
  getDefaultTimelineEnd,
  calculateTaskBarDimensions,
} from './lib/gantt-utils';
export type { GanttViewMode as ViewModeType } from './lib/gantt-utils';

// UI Hooks
export * from './hooks/ui/useGanttScroll';
export * from './hooks/ui/useGanttZoom';
export * from './hooks/ui/useGanttDnd';

// Main Page Component (temporary wrapper - will be refactored)
export { GanttChart, type GanttViewMode } from './pages/GanttChart';

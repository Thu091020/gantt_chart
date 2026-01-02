/**
 * Gantt Selectors
 * Memoized selectors for the Gantt store
 */

import { useGanttStore, GanttStore } from './gantt.store';

/**
 * View selectors
 */
export const selectViewMode = (state: GanttStore) => state.viewMode;
export const selectZoomLevel = (state: GanttStore) => state.zoomLevel;
export const selectStartDate = (state: GanttStore) => state.startDate;
export const selectEndDate = (state: GanttStore) => state.endDate;
export const selectDateRange = (state: GanttStore) => ({
  startDate: state.startDate,
  endDate: state.endDate,
  customStartDate: state.customStartDate,
  customEndDate: state.customEndDate
});

/**
 * UI selectors
 */
export const selectSelectedTaskId = (state: GanttStore) => state.selectedTaskId;
export const selectSelectedTaskIds = (state: GanttStore) => state.selectedTaskIds;
export const selectHoveredTaskId = (state: GanttStore) => state.hoveredTaskId;
export const selectExpandedTaskIds = (state: GanttStore) => state.expandedTaskIds;
export const selectIsDragging = (state: GanttStore) => state.isDragging;
export const selectDraggedTaskId = (state: GanttStore) => state.draggedTaskId;
export const selectScrollPosition = (state: GanttStore) => state.scrollPosition;

/**
 * Dialog selectors
 */
export const selectDialogStates = (state: GanttStore) => ({
  isTaskDialogOpen: state.isTaskDialogOpen,
  isCreateTaskDialogOpen: state.isCreateTaskDialogOpen,
  isBaselineDialogOpen: state.isBaselineDialogOpen,
  isLabelSettingsOpen: state.isLabelSettingsOpen,
  isViewSettingsOpen: state.isViewSettingsOpen
});

/**
 * Filter selectors
 */
export const selectFilters = (state: GanttStore) => ({
  assigneeIds: state.filterAssigneeIds,
  labelIds: state.filterLabelIds,
  statusIds: state.filterStatusIds,
  searchQuery: state.searchQuery,
  showCompleted: state.showCompletedTasks,
  showMilestonesOnly: state.showMilestonesOnly
});

/**
 * Hooks using selectors
 */
export const useViewMode = () => useGanttStore(selectViewMode);
export const useZoomLevel = () => useGanttStore(selectZoomLevel);
export const useDateRange = () => useGanttStore(selectDateRange);
export const useSelectedTask = () => useGanttStore(selectSelectedTaskId);
export const useSelectedTasks = () => useGanttStore(selectSelectedTaskIds);
export const useExpandedTasks = () => useGanttStore(selectExpandedTaskIds);
export const useDialogStates = () => useGanttStore(selectDialogStates);
export const useFilters = () => useGanttStore(selectFilters);

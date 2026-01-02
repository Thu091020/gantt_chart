/**
 * Gantt Store - Main store combining all slices
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ViewSlice, createViewSlice } from './slices/view-slice';
import { UISlice, createUISlice } from './slices/ui-slice';
import { TaskSlice, createTaskSlice } from './slices/task-slice';

/**
 * Combined store type
 */
export type GanttStore = ViewSlice & UISlice & TaskSlice;

/**
 * Main Gantt Store
 * Combines view, UI, and task slices
 */
export const useGanttStore = create<GanttStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createViewSlice(...args),
        ...createUISlice(...args),
        ...createTaskSlice(...args),
      }),
      {
        name: 'gantt-storage',
        // Only persist certain fields
        partialize: (state) => ({
          viewMode: state.viewMode,
          zoomLevel: state.zoomLevel,
          expandedTaskIds: Array.from(state.expandedTaskIds), // Convert Set to Array
          showCompletedTasks: state.showCompletedTasks,
        }),
        // Deserialize sets from arrays
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray((state as any).expandedTaskIds)) {
            state.expandedTaskIds = new Set((state as any).expandedTaskIds);
          }
        }
      }
    ),
    {
      name: 'GanttStore',
      enabled: import.meta.env?.DEV || process.env?.NODE_ENV === 'development'
    }
  )
);

/**
 * Convenience selectors
 */
export const ganttSelectors = {
  // View selectors
  useViewMode: () => useGanttStore(state => state.viewMode),
  useZoomLevel: () => useGanttStore(state => state.zoomLevel),
  useDateRange: () => useGanttStore(state => ({
    startDate: state.startDate,
    endDate: state.endDate
  })),
  
  // UI selectors
  useSelectedTask: () => useGanttStore(state => state.selectedTaskId),
  useSelectedTasks: () => useGanttStore(state => state.selectedTaskIds),
  useExpandedTasks: () => useGanttStore(state => state.expandedTaskIds),
  useDialogStates: () => useGanttStore(state => ({
    isTaskDialogOpen: state.isTaskDialogOpen,
    isCreateTaskDialogOpen: state.isCreateTaskDialogOpen,
    isBaselineDialogOpen: state.isBaselineDialogOpen,
    isLabelSettingsOpen: state.isLabelSettingsOpen,
    isViewSettingsOpen: state.isViewSettingsOpen
  })),
  
  // Task filter selectors
  useFilters: () => useGanttStore(state => ({
    assigneeIds: state.filterAssigneeIds,
    labelIds: state.filterLabelIds,
    statusIds: state.filterStatusIds,
    searchQuery: state.searchQuery,
    showCompleted: state.showCompletedTasks,
    showMilestonesOnly: state.showMilestonesOnly
  }))
};

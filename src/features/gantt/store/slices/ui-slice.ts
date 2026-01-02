/**
 * UI Slice - Manages UI state (dialogs, selections, etc.)
 */

import { StateCreator } from 'zustand';

export interface UISlice {
  // Selection state
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  hoveredTaskId: string | null;
  
  // Expanded state
  expandedTaskIds: Set<string>;
  
  // Dialog state
  isTaskDialogOpen: boolean;
  isCreateTaskDialogOpen: boolean;
  isBaselineDialogOpen: boolean;
  isLabelSettingsOpen: boolean;
  isViewSettingsOpen: boolean;
  
  // Drag state
  isDragging: boolean;
  draggedTaskId: string | null;
  
  // Scroll position
  scrollPosition: number;
  
  // Actions
  selectTask: (taskId: string | null, multiSelect?: boolean) => void;
  clearSelection: () => void;
  setHoveredTask: (taskId: string | null) => void;
  
  toggleTaskExpanded: (taskId: string) => void;
  expandTask: (taskId: string) => void;
  collapseTask: (taskId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  openTaskDialog: () => void;
  closeTaskDialog: () => void;
  openCreateTaskDialog: () => void;
  closeCreateTaskDialog: () => void;
  openBaselineDialog: () => void;
  closeBaselineDialog: () => void;
  openLabelSettings: () => void;
  closeLabelSettings: () => void;
  openViewSettings: () => void;
  closeViewSettings: () => void;
  
  startDragging: (taskId: string) => void;
  stopDragging: () => void;
  
  setScrollPosition: (position: number) => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  // Initial state
  selectedTaskId: null,
  selectedTaskIds: new Set(),
  hoveredTaskId: null,
  expandedTaskIds: new Set(),
  isTaskDialogOpen: false,
  isCreateTaskDialogOpen: false,
  isBaselineDialogOpen: false,
  isLabelSettingsOpen: false,
  isViewSettingsOpen: false,
  isDragging: false,
  draggedTaskId: null,
  scrollPosition: 0,
  
  // Selection actions
  selectTask: (taskId, multiSelect = false) => {
    if (!taskId) {
      set({ selectedTaskId: null, selectedTaskIds: new Set() });
      return;
    }
    
    if (multiSelect) {
      const { selectedTaskIds } = get();
      const newSet = new Set(selectedTaskIds);
      
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      
      set({ 
        selectedTaskIds: newSet,
        selectedTaskId: taskId 
      });
    } else {
      set({ 
        selectedTaskId: taskId,
        selectedTaskIds: new Set([taskId])
      });
    }
  },
  
  clearSelection: () => set({ 
    selectedTaskId: null, 
    selectedTaskIds: new Set() 
  }),
  
  setHoveredTask: (taskId) => set({ hoveredTaskId: taskId }),
  
  // Expand/collapse actions
  toggleTaskExpanded: (taskId) => {
    const { expandedTaskIds } = get();
    const newSet = new Set(expandedTaskIds);
    
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    
    set({ expandedTaskIds: newSet });
  },
  
  expandTask: (taskId) => {
    const { expandedTaskIds } = get();
    const newSet = new Set(expandedTaskIds);
    newSet.add(taskId);
    set({ expandedTaskIds: newSet });
  },
  
  collapseTask: (taskId) => {
    const { expandedTaskIds } = get();
    const newSet = new Set(expandedTaskIds);
    newSet.delete(taskId);
    set({ expandedTaskIds: newSet });
  },
  
  expandAll: () => {
    // Note: This would need task data to expand all parent tasks
    // Implementation depends on having access to task tree
    console.warn('expandAll needs to be implemented with task context');
  },
  
  collapseAll: () => set({ expandedTaskIds: new Set() }),
  
  // Dialog actions
  openTaskDialog: () => set({ isTaskDialogOpen: true }),
  closeTaskDialog: () => set({ isTaskDialogOpen: false }),
  openCreateTaskDialog: () => set({ isCreateTaskDialogOpen: true }),
  closeCreateTaskDialog: () => set({ isCreateTaskDialogOpen: false }),
  openBaselineDialog: () => set({ isBaselineDialogOpen: true }),
  closeBaselineDialog: () => set({ isBaselineDialogOpen: false }),
  openLabelSettings: () => set({ isLabelSettingsOpen: true }),
  closeLabelSettings: () => set({ isLabelSettingsOpen: false }),
  openViewSettings: () => set({ isViewSettingsOpen: true }),
  closeViewSettings: () => set({ isViewSettingsOpen: false }),
  
  // Drag actions
  startDragging: (taskId) => set({ 
    isDragging: true, 
    draggedTaskId: taskId 
  }),
  
  stopDragging: () => set({ 
    isDragging: false, 
    draggedTaskId: null 
  }),
  
  // Scroll actions
  setScrollPosition: (position) => set({ scrollPosition: position })
});

/**
 * Task Slice - Manages task-related computed state and filters
 */

import { StateCreator } from 'zustand';
import type { Task } from '../../types/task.types';

export interface TaskSlice {
  // Filter state
  filterAssigneeIds: string[];
  filterLabelIds: string[];
  filterStatusIds: string[];
  searchQuery: string;
  showCompletedTasks: boolean;
  showMilestonesOnly: boolean;
  
  // Actions
  setFilterAssignees: (ids: string[]) => void;
  setFilterLabels: (ids: string[]) => void;
  setFilterStatuses: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  toggleShowCompleted: () => void;
  toggleShowMilestonesOnly: () => void;
  clearFilters: () => void;
  
  // Computed helpers (these would use task data passed from components)
  filterTasks: (tasks: Task[]) => Task[];
}

export const createTaskSlice: StateCreator<TaskSlice> = (set, get) => ({
  // Initial state
  filterAssigneeIds: [],
  filterLabelIds: [],
  filterStatusIds: [],
  searchQuery: '',
  showCompletedTasks: true,
  showMilestonesOnly: false,
  
  // Actions
  setFilterAssignees: (ids) => set({ filterAssigneeIds: ids }),
  
  setFilterLabels: (ids) => set({ filterLabelIds: ids }),
  
  setFilterStatuses: (ids) => set({ filterStatusIds: ids }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  toggleShowCompleted: () => set((state) => ({ 
    showCompletedTasks: !state.showCompletedTasks 
  })),
  
  toggleShowMilestonesOnly: () => set((state) => ({ 
    showMilestonesOnly: !state.showMilestonesOnly 
  })),
  
  clearFilters: () => set({
    filterAssigneeIds: [],
    filterLabelIds: [],
    filterStatusIds: [],
    searchQuery: '',
    showCompletedTasks: true,
    showMilestonesOnly: false
  }),
  
  // Filter function
  filterTasks: (tasks: Task[]) => {
    const {
      filterAssigneeIds,
      filterLabelIds,
      filterStatusIds,
      searchQuery,
      showCompletedTasks,
      showMilestonesOnly
    } = get();
    
    return tasks.filter(task => {
      // Filter by assignees
      if (filterAssigneeIds.length > 0) {
        const hasMatchingAssignee = task.assignees.some(id => 
          filterAssigneeIds.includes(id)
        );
        if (!hasMatchingAssignee) return false;
      }
      
      // Filter by labels
      if (filterLabelIds.length > 0) {
        if (!task.label_id || !filterLabelIds.includes(task.label_id)) {
          return false;
        }
      }
      
      // Filter by statuses
      if (filterStatusIds.length > 0) {
        if (!task.status_id || !filterStatusIds.includes(task.status_id)) {
          return false;
        }
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }
      
      // Filter by completion
      if (!showCompletedTasks && task.progress === 100) {
        return false;
      }
      
      // Filter milestones only
      if (showMilestonesOnly && !task.is_milestone) {
        return false;
      }
      
      return true;
    });
  }
});

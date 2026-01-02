/**
 * View Slice - Manages view-related state (zoom, dates, etc.)
 */

import { StateCreator } from 'zustand';
import type { ViewMode, ZoomLevel } from '../../types/gantt.types';

export interface ViewSlice {
  // View state
  viewMode: ViewMode;
  zoomLevel: ZoomLevel;
  startDate: Date;
  endDate: Date;
  customStartDate: Date | null;
  customEndDate: Date | null;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setCustomDateRange: (start: Date, end: Date) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToToday: () => void;
}

export const createViewSlice: StateCreator<ViewSlice> = (set, get) => ({
  // Initial state
  viewMode: 'day',
  zoomLevel: 'day',
  startDate: new Date(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days later
  customStartDate: null,
  customEndDate: null,
  
  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setZoomLevel: (level) => set({ zoomLevel: level, viewMode: level }),
  
  setStartDate: (date) => set({ startDate: date }),
  
  setEndDate: (date) => set({ endDate: date }),
  
  setCustomDateRange: (start, end) => 
    set({ 
      customStartDate: start, 
      customEndDate: end,
      viewMode: 'custom'
    }),
  
  goToPrevious: () => {
    const { viewMode, startDate } = get();
    const newDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() - 3);
        break;
    }
    
    set({ startDate: newDate });
  },
  
  goToNext: () => {
    const { viewMode, startDate } = get();
    const newDate = new Date(startDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
    }
    
    set({ startDate: newDate });
  },
  
  goToToday: () => set({ startDate: new Date() })
});

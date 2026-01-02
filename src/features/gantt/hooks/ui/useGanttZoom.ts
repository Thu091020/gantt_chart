import { useState, useCallback } from 'react';
import { GanttViewMode } from '../../lib/gantt-utils';
import { addMonths, startOfMonth } from 'date-fns';

export interface ZoomState {
  viewMode: GanttViewMode;
  startDate: Date;
  endDate: Date;
  customViewMode: boolean;
}

/**
 * Hook to manage Gantt timeline zoom and view mode
 */
export function useGanttZoom(initialViewMode: GanttViewMode = 'day') {
  const [viewMode, setViewMode] = useState<GanttViewMode>(initialViewMode);
  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => addMonths(new Date(), 2));
  const [customViewMode, setCustomViewMode] = useState(false);

  /**
   * Change view mode (day/week/month)
   */
  const handleViewModeChange = useCallback((mode: GanttViewMode) => {
    setViewMode(mode);
    setCustomViewMode(false);
  }, []);

  /**
   * Set custom date range
   */
  const handleCustomRangeChange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setCustomViewMode(true);
  }, []);

  /**
   * Navigate to previous period
   */
  const goToPrevious = useCallback(() => {
    setStartDate(prev => {
      const months = viewMode === 'day' ? -1 : viewMode === 'week' ? -2 : -6;
      return addMonths(prev, months);
    });
  }, [viewMode]);

  /**
   * Navigate to next period
   */
  const goToNext = useCallback(() => {
    setStartDate(prev => {
      const months = viewMode === 'day' ? 1 : viewMode === 'week' ? 2 : 6;
      return addMonths(prev, months);
    });
  }, [viewMode]);

  /**
   * Go to today
   */
  const goToToday = useCallback(() => {
    setStartDate(startOfMonth(new Date()));
  }, []);

  return {
    viewMode,
    startDate,
    endDate,
    customViewMode,
    handleViewModeChange,
    handleCustomRangeChange,
    goToPrevious,
    goToNext,
    goToToday,
  };
}

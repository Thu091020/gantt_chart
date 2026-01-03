import { useCallback, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { GanttViewMode } from './useGanttTimeline';

interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  width: number;
  days: number;
}

/**
 * Hook tính toán date position trên timeline
 * Tách từ useGanttTimeline để dễ quản lý
 */
export function useDatePosition(
  startDate: Date,
  viewMode: GanttViewMode,
  timelineColumns: TimelineColumn[]
) {
  
  /**
   * Calculate total timeline width
   */
  const totalTimelineWidth = useMemo(() => {
    return timelineColumns.reduce((sum, col) => sum + col.width, 0);
  }, [timelineColumns]);

  /**
   * Convert date to X position (pixels)
   */
  const getDatePosition = useCallback((date: Date): number => {
    const daysFromStart = differenceInDays(date, startDate);
    
    if (viewMode === 'day') {
      return daysFromStart * 40; // 40px per day
    } else if (viewMode === 'week') {
      return (daysFromStart / 7) * 100; // 100px per week
    } else if (viewMode === 'month') {
      return daysFromStart * 2; // ~2px per day
    } else if (viewMode === 'quarter') {
      return (daysFromStart / 90) * 120; // 120px per quarter
    }
    
    return 0;
  }, [startDate, viewMode]);

  /**
   * Convert X position (pixels) to date
   */
  const getPositionDate = useCallback((x: number): Date => {
    let days = 0;
    
    if (viewMode === 'day') {
      days = x / 40;
    } else if (viewMode === 'week') {
      days = (x / 100) * 7;
    } else if (viewMode === 'month') {
      days = x / 2;
    } else if (viewMode === 'quarter') {
      days = (x / 120) * 90;
    }
    
    const result = new Date(startDate);
    result.setDate(result.getDate() + Math.round(days));
    return result;
  }, [startDate, viewMode]);

  return {
    totalTimelineWidth,
    getDatePosition,
    getPositionDate,
  };
}

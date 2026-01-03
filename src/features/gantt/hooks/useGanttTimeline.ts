import type { Task } from '../types/task.types';
import { useTaskDateRange } from './useTaskDateRange';
import { useTimelineColumns } from './useTimelineColumns';
import { useDatePosition } from './useDatePosition';

export type GanttViewMode = 'day' | 'week' | 'month' | 'quarter';

interface UseGanttTimelineProps {
  startDate: Date;
  endDate: Date;
  viewMode: GanttViewMode;
  tasks: Task[];
}

interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  width: number;
  days: number;
}

/**
 * Hook tính toán timeline columns cho Gantt Chart
 * Extracted từ GanttView.tsx - pure calculation logic
 */
export function useGanttTimeline({
  startDate,
  endDate,
  viewMode,
  tasks,
}: UseGanttTimelineProps) {
  
  /**
   * Calculate date range from tasks
   */
  const taskDateRange = useMemo(() => {
    if (tasks.length === 0) {
      return { minDate: new Date(), maxDate: new Date() };
    }
    
    let minDate = new Date(tasks[0].start_date);
    let maxDate = new Date(tasks[0].end_date);
    
    tasks.forEach(task => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date);
      
      if (taskStart < minDate) minDate = taskStart;
      if (taskEnd > maxDate) maxDate = taskEnd;
    });
    
    return { minDate, maxDate };
  }, [tasks]);

  /**
   * Generate timeline columns based on view mode
   */
  const timelineColumns = useMemo((): TimelineColumn[] => {
    const columns: TimelineColumn[] = [];
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    switch (viewMode) {
      case 'day': {
        // Each column = 1 day, width = 40px
        while (current <= end) {
          columns.push({
            date: new Date(current),
            label: format(current, 'dd'),
            subLabel: format(current, 'EEE', { locale: vi }),
            width: 40,
            days: 1,
          });
          current = addDays(current, 1);
        }
        break;
      }
      
      case 'week': {
        // Each column = 1 week, width = 80px
        while (current <= end) {
          const weekStart = startOfWeek(current, { weekStartsOn: 1 }); // Monday
          const weekEnd = addDays(weekStart, 6);
          
          columns.push({
            date: weekStart,
            label: `W${format(weekStart, 'ww')}`,
            subLabel: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
            width: 80,
            days: 7,
          });
          
          current = addDays(current, 7);
        }
        break;
      }
      
      case 'month': {
        // Each column = 1 month
        while (current <= end) {
          const monthStart = startOfMonth(current);
          const monthEnd = endOfMonth(current);
          const daysInMonth = monthEnd.getDate();
          
          columns.push({
            date: monthStart,
            label: format(monthStart, 'MMM yyyy'),
            subLabel: `${daysInMonth} days`,
            width: daysInMonth * 3, // 3px per day
            days: daysInMonth,
          });
          
          current = addMonths(current, 1);
        }
        break;
      }
      
      case 'quarter': {
        // Each column = 1 quarter (3 months)
        while (current <= end) {
          const quarter = Math.floor(current.getMonth() / 3) + 1;
          const quarterStart = new Date(current.getFullYear(), (quarter - 1) * 3, 1);
          const quarterEnd = new Date(current.getFullYear(), quarter * 3, 0);
          const daysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          columns.push({
            date: quarterStart,
            label: `Q${quarter} ${current.getFullYear()}`,
            subLabel: `${daysInQuarter} days`,
            width: daysInQuarter * 2, // 2px per day
            days: daysInQuarter,
          });
          
          current = addMonths(current, 3);
        }
        break;
      }
    }
    
    return columns;
  }, [startDate, endDate, viewMode]);

  /**
   * Calculate total timeline width
   */
  const totalTimelineWidth = useMemo(() => {
    return timelineColumns.reduce((sum, col) => sum + col.width, 0);
  }, [timelineColumns]);

  /**
   * Get position (X coordinate) for a specific date
   */
  const getDatePosition = useMemo(() => {
    // Build lookup table
    const columnPositions: Array<{
      date: Date;
      startX: number;
      endX: number;
      width: number;
      days: number;
    }> = [];
    
    let currentX = 0;
    timelineColumns.forEach((col) => {
      columnPositions.push({
        date: col.date,
        startX: currentX,
        endX: currentX + col.width,
        width: col.width,
        days: Math.max(1, col.days),
      });
      currentX += col.width;
    });
    
    return (date: Date): number => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Find which column this date falls into
      for (let i = 0; i < columnPositions.length; i++) {
        const col = columnPositions[i];
        const nextCol = columnPositions[i + 1];
        const colDate = new Date(col.date);
        colDate.setHours(0, 0, 0, 0);
        
        const colEndDate = nextCol ? new Date(nextCol.date) : null;
        if (colEndDate) colEndDate.setHours(0, 0, 0, 0);
        
        // Check if date is within this column's range
        const isInColumn = colEndDate
          ? targetDate >= colDate && targetDate < colEndDate
          : targetDate >= colDate;
        
        if (isInColumn) {
          // Calculate position within the column
          const daysFromColStart = differenceInDays(targetDate, colDate);
          const pixelsPerDay = col.width / col.days;
          return col.startX + (daysFromColStart * pixelsPerDay);
        }
      }
      
      // Date outside timeline range - return boundary
      if (targetDate < columnPositions[0].date) {
        return 0;
      }
      return columnPositions[columnPositions.length - 1].endX;
    };
  }, [timelineColumns]);

  /**
   * Get date from X position (inverse of getDatePosition)
   */
  const getPositionDate = useMemo(() => {
    const columnPositions: Array<{
      date: Date;
      startX: number;
      endX: number;
      width: number;
      days: number;
    }> = [];
    
    let currentX = 0;
    timelineColumns.forEach((col) => {
      columnPositions.push({
        date: col.date,
        startX: currentX,
        endX: currentX + col.width,
        width: col.width,
        days: Math.max(1, col.days),
      });
      currentX += col.width;
    });
    
    return (x: number): Date => {
      // Find column containing this X position
      for (const col of columnPositions) {
        if (x >= col.startX && x < col.endX) {
          const pixelsFromColStart = x - col.startX;
          const pixelsPerDay = col.width / col.days;
          const daysFromColStart = Math.floor(pixelsFromColStart / pixelsPerDay);
          
          return addDays(col.date, daysFromColStart);
        }
      }
      
      // Outside range
      if (x < columnPositions[0].startX) {
        return columnPositions[0].date;
      }
      return columnPositions[columnPositions.length - 1].date;
    };
  }, [timelineColumns]);

  return {
    taskDateRange,
    timelineColumns,
    totalTimelineWidth,
    getDatePosition,
    getPositionDate,
  };
}

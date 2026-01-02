import { 
  format, 
  addDays, 
  addMonths, 
  startOfMonth, 
  eachDayOfInterval, 
  differenceInDays,
  parseISO 
} from 'date-fns';
import { vi } from 'date-fns/locale';
import type { TimelineColumn } from '../types/gantt.types';

export type GanttViewMode = 'day' | 'week' | 'month';

/**
 * Generate timeline columns based on view mode and date range
 */
export function generateTimelineColumns(
  startDate: Date,
  endDate: Date,
  viewMode: GanttViewMode
): TimelineColumn[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  if (viewMode === 'day') {
    return days.map((d) => ({
      date: d,
      label: format(d, 'dd/MM'),
      subLabel: format(d, 'EEE', { locale: vi }),
      width: 32,
      days: 1,
    }));
  }

  if (viewMode === 'week') {
    const WEEK_COL_WIDTH = 84;
    const weeks: TimelineColumn[] = [];
    let currentWeek = days[0];
    let weekDays = 0;

    days.forEach((day, idx) => {
      weekDays++;
      if (day.getDay() === 0 || idx === days.length - 1) {
        weeks.push({
          date: currentWeek,
          label: `T${format(currentWeek, 'w')}`,
          subLabel: format(currentWeek, 'dd/MM'),
          width: WEEK_COL_WIDTH,
          days: weekDays,
        });
        currentWeek = addDays(day, 1);
        weekDays = 0;
      }
    });
    return weeks;
  }

  // Month view
  const MONTH_COL_WIDTH = 100;
  const months: TimelineColumn[] = [];
  let currentMonth = startOfMonth(days[0]);
  let monthDays = 0;

  days.forEach((day, idx) => {
    monthDays++;
    if (idx === days.length - 1 || startOfMonth(addDays(day, 1)).getTime() !== currentMonth.getTime()) {
      months.push({
        date: currentMonth,
        label: format(currentMonth, 'MMM', { locale: vi }),
        subLabel: format(currentMonth, 'yyyy'),
        width: MONTH_COL_WIDTH,
        days: monthDays,
      });
      currentMonth = startOfMonth(addDays(day, 1));
      monthDays = 0;
    }
  });
  return months;
}

/**
 * Calculate position (in pixels) for a date on timeline
 */
export function getDatePosition(
  date: Date,
  timelineColumns: TimelineColumn[]
): number {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Build column positions
  const columnPositions: {
    date: Date;
    startX: number;
    endX: number;
    width: number;
    days: number;
  }[] = [];
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

  // Find which column this date falls into
  for (let i = 0; i < columnPositions.length; i++) {
    const col = columnPositions[i];
    const nextCol = columnPositions[i + 1];
    const colDate = new Date(col.date);
    colDate.setHours(0, 0, 0, 0);

    const colEndDate = nextCol ? new Date(nextCol.date) : null;
    if (colEndDate) colEndDate.setHours(0, 0, 0, 0);

    const isInColumn = colEndDate
      ? targetDate >= colDate && targetDate < colEndDate
      : targetDate >= colDate;

    if (isInColumn) {
      const daysFromColStart = differenceInDays(targetDate, colDate);
      const pixelsPerDay = col.width / col.days;
      return col.startX + daysFromColStart * pixelsPerDay;
    }
  }

  // If date is before all columns
  if (columnPositions.length > 0) {
    const firstCol = columnPositions[0];
    const firstDate = new Date(firstCol.date);
    firstDate.setHours(0, 0, 0, 0);

    if (targetDate < firstDate) {
      const daysBefore = differenceInDays(firstDate, targetDate);
      const pixelsPerDay = firstCol.width / firstCol.days;
      return -daysBefore * pixelsPerDay;
    }

    // If date is after all columns
    const lastCol = columnPositions[columnPositions.length - 1];
    const lastDate = new Date(lastCol.date);
    lastDate.setHours(0, 0, 0, 0);
    const daysAfterLastCol = differenceInDays(targetDate, lastDate);
    const pixelsPerDay = lastCol.width / lastCol.days;
    return lastCol.startX + daysAfterLastCol * pixelsPerDay;
  }

  return 0;
}

/**
 * Calculate total timeline width
 */
export function calculateTimelineWidth(timelineColumns: TimelineColumn[]): number {
  return timelineColumns.reduce((sum, col) => sum + col.width, 0);
}

/**
 * Get default timeline end date based on view mode
 */
export function getDefaultTimelineEnd(
  startDate: Date,
  viewMode: GanttViewMode
): Date {
  switch (viewMode) {
    case 'day':
      return addMonths(startDate, 2);
    case 'week':
      return addMonths(startDate, 4);
    case 'month':
      return addMonths(startDate, 12);
    default:
      return addMonths(startDate, 2);
  }
}

/**
 * Calculate task bar position and width
 */
export function calculateTaskBarDimensions(
  startDate: string,
  endDate: string,
  timelineColumns: TimelineColumn[]
): { left: number; width: number } {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  const leftPos = getDatePosition(start, timelineColumns);
  const rightPos = getDatePosition(addDays(end, 1), timelineColumns);
  
  return {
    left: leftPos,
    width: Math.max(4, rightPos - leftPos)
  };
}
